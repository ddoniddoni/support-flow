import assert from 'node:assert/strict';
export async function runResponsePolicyCollisionTests({db,check,asUser,customer,agent,admin}){
 const id='86000000-0000-4000-8000-000000000001';const policyId='86000000-0000-4000-8000-000000000002';const token='86000000-0000-4000-8000-000000000003';const session='86000000-0000-4000-8000-000000000004';
 const business={mode:'business',timeZone:'Asia/Seoul',days:[1,2,3,4,5].map(day=>({day,start:'09:00',end:'18:00'})),holidays:[]};
 const targets={urgent:60,high:120,medium:240,low:480};
 const switchTo=actor=>db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);
 const currentPolicy=async()=>(await db.query('select policy_id from response_settings')).rows[0].policy_id;
 const save=async(calendar=business,expected,settings={})=>(await db.query('select save_response_policy($1,$2,$3,$4,$5,$6) result',[settings.id??policyId,expected??await currentPolicy(),JSON.stringify(calendar),JSON.stringify(settings.targets??targets),settings.warning??15,settings.alerts??true])).rows[0].result;
 const seed=async(extraId=id,start='2026-09-07T00:00:00Z',assignee=agent)=>db.query("insert into tickets(id,title,content,category,customer_id,assignee_id,response_started_at) values($1,'Response policy test','Please help with this support question.','account',$2,$3,$4)",[extraId,customer,assignee,start]);
 const ticket=async()=>(await db.query('select * from tickets where id=$1',[id])).rows[0];
 const command=async(payload)=>(await db.query("select submit_ticket_reply($1,$2) result",[id,JSON.stringify(payload)])).rows[0].result;
 const deadline=async(start,minutes,calendar=business)=>(await db.query('select supportflow_private.response_deadline($1,$2,$3) value',[start,minutes,JSON.stringify(calendar)])).rows[0].value.toISOString();
 const presence=async(typing=false,sessionId=session)=>(await db.query('select reply_collaboration($1,$2,$3) result',[id,sessionId,typing])).rows[0].result;
 await check('business deadline skips weekend and closes precisely at business end',async()=>{
  assert.equal(await deadline('2026-09-04T08:00:00Z',120),'2026-09-07T01:00:00.000Z');
  assert.equal(await deadline('2026-09-04T08:00:00Z',60),'2026-09-04T09:00:00.000Z');
  assert.equal(await deadline('2026-09-04T09:00:00Z',60),'2026-09-07T01:00:00.000Z');
 });
 await check('holiday and out-of-hours intake wait until next opening',async()=>{
  assert.equal(await deadline('2026-09-04T08:00:00Z',120,{...business,holidays:['2026-09-07']}),'2026-09-08T01:00:00.000Z');
  assert.equal(await deadline('2026-09-05T12:00:00Z',60),'2026-09-07T01:00:00.000Z');
 });
 await check('time-zone DST transition uses local business times',async()=>{
  assert.equal(await deadline('2026-03-06T21:00:00Z',240,{...business,timeZone:'America/New_York'}),'2026-03-09T15:00:00.000Z');
 });
 await check('business remaining minutes pause during nights and weekends',async()=>{
  const value=(await db.query('select supportflow_private.response_minutes_between($1,$2,$3) value',['2026-09-04T09:00:00Z','2026-09-07T00:00:00Z',JSON.stringify(business)])).rows[0].value;
  assert.equal(Number(value),0);
 });
 for(const actor of [customer,agent])await check('non-admin cannot change response policy',()=>asUser(actor,()=>assert.rejects(save(business,policyId),/관리자만/)));
 await check('invalid business schedule cannot be saved',()=>asUser(admin,()=>assert.rejects(save({...business,days:[{day:1,start:'18:00',end:'09:00'}]}),/운영 구간/)));
 await check('invalid timezone and holiday date are rejected',()=>asUser(admin,async()=>{
  await db.exec('savepoint bad');await assert.rejects(save({...business,timeZone:'Not/AZone'}),/시간대/);await db.exec('rollback to savepoint bad');
  await assert.rejects(save({...business,holidays:['2026-02-30']}),/date|날짜/);
 }));
 await check('policy validation rejects reversed priorities and excessive warning',()=>asUser(admin,async()=>{
  await db.exec('savepoint bad');await assert.rejects(save(business,undefined,{targets:{...targets,urgent:300}}),/우선순위/);await db.exec('rollback to savepoint bad');
  await assert.rejects(save(business,undefined,{warning:60}),/사전 알림/);
 }));
 await check('policy saves are versioned, auditable and safe to retry',()=>asUser(admin,async()=>{
  const initial=await currentPolicy();assert.equal(await save(business,initial),policyId);assert.equal(await save(business,initial),policyId);
  assert.equal((await db.query('select created_by from response_policies where id=$1',[policyId])).rows[0].created_by,admin);
  await assert.rejects(save(business,initial,{id:token}),/다른 관리자가/);
 }));
 await check('existing waiting periods keep their policy; reopen adopts latest policy',()=>asUser(admin,async()=>{
  await db.exec('reset role');await seed();const before=await ticket();await db.exec('set local role authenticated');await save();
  await db.exec('reset role');assert.equal((await ticket()).response_due_at.toISOString(),before.response_due_at.toISOString());await db.exec('set local role authenticated');
  await db.query("select support_ticket_command($1,'update','{\"priority\":\"urgent\"}')",[id]);
  await db.exec('reset role');assert.equal((await ticket()).response_target_minutes,240);await db.exec('set local role authenticated');
  await command({content:'Staff reply before reopening',expectedReplyOrder:0});await switchTo(customer);await command({content:'A new customer question'});
  await db.exec('reset role');const reopened=await ticket();assert.equal(reopened.response_policy_id,policyId);assert.equal(reopened.response_target_minutes,60);assert.notEqual(reopened.response_cycle,before.response_cycle);
 }));
 await check('business projection and warning use the same stored deadline',()=>asUser(admin,async()=>{
  await save();await db.exec('reset role');await seed(id,'2026-09-04T08:00:00Z');const row=await ticket();
  assert.equal(row.response_due_at.toISOString(),'2026-09-07T03:00:00.000Z');assert.equal(row.response_warning_at.toISOString(),'2026-09-07T02:45:00.000Z');
  await db.exec('set local role authenticated');await switchTo(customer);const visible=(await db.query('select response_due_at,response_calendar,response_remaining_minutes from ticket_workspace where id=$1',[id])).rows[0];assert.equal(visible.response_calendar.mode,'business');assert(visible.response_remaining_minutes!==null);
 }));
 await check('warning goes to assignee once, breach goes to assignee and admins once',()=>asUser(admin,async()=>{
  await save();await db.exec('reset role');await seed();
  await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T03:50:00Z']);await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T03:55:00Z']);
  let rows=(await db.query('select recipient_id,kind from support_notifications where ticket_id=$1 and kind like $2',[id,'response_%'])).rows;assert.deepEqual(rows,[{recipient_id:agent,kind:'response_warning'}]);
  await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T04:01:00Z']);await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T04:02:00Z']);
  rows=(await db.query("select recipient_id from support_notifications where ticket_id=$1 and kind='response_breached' order by recipient_id",[id])).rows;
  assert.deepEqual(rows.map(r=>r.recipient_id),[agent,admin].sort());
 }));
 await check('unassigned warning goes to admin and disabled alerts do not dispatch',()=>asUser(admin,async()=>{
  await save();await db.exec('reset role');await seed(id,'2026-09-07T00:00:00Z',null);await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T03:50:00Z']);
  assert.equal((await db.query("select recipient_id from support_notifications where ticket_id=$1 and kind='response_warning'",[id])).rows[0].recipient_id,admin);
  await db.exec('set local role authenticated');await save(business,policyId,{id:token,alerts:false});await db.exec('reset role');
  await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T04:01:00Z']);assert.equal((await db.query("select id from support_notifications where ticket_id=$1 and kind='response_breached'",[id])).rows.length,0);
  assert((await db.query('select last_succeeded_at from supportflow_private.response_alert_health')).rows[0].last_succeeded_at);
 }));
 await check('resolved tickets cancel unread response alerts and stop further dispatch',()=>asUser(admin,async()=>{
  await save();await db.exec('reset role');await seed();await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T03:50:00Z']);await db.exec('set local role authenticated');await command({content:'Resolved by public reply',expectedReplyOrder:0});await db.exec('reset role');
  await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T04:01:00Z']);assert.equal((await db.query("select id from support_notifications where ticket_id=$1 and kind like 'response_%' and read_at is null",[id])).rows.length,0);assert.equal((await ticket()).response_due_at,null);
 }));
 await check('alert failure rolls back dedup ledger so retry can deliver',()=>asUser(admin,async()=>{
  await save();await db.exec('reset role');await seed();await db.exec(`create function public.fail_response_alert() returns trigger language plpgsql as $$begin if new.kind='response_warning' then raise exception 'alert failure';end if;return new;end$$; create trigger fail_response_alert before insert on support_notifications for each row execute function public.fail_response_alert();savepoint failure;`);
  await assert.rejects(db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T03:50:00Z']),/alert failure/);await db.exec('rollback to savepoint failure;drop trigger fail_response_alert on support_notifications');
  assert.equal((await db.query('select * from supportflow_private.response_alert_dispatches where ticket_id=$1',[id])).rows.length,0);
  await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T03:50:00Z']);assert.equal((await db.query('select * from supportflow_private.response_alert_dispatches where ticket_id=$1',[id])).rows.length,1);
 }));
 await check('authenticated clients cannot run the alert worker',()=>asUser(admin,()=>assert.rejects(db.query('select supportflow_private.dispatch_response_alerts()'),/permission denied/)));
 await check('missing or stale reply version cannot bypass collision protection',()=>asUser(admin,async()=>{
  await db.exec('reset role');await seed();await db.exec('set local role authenticated;savepoint missing');
  await assert.rejects(command({content:'Reply without a version'}),/최신 대화/);await db.exec('rollback to savepoint missing');
  await switchTo(agent);await command({content:'First concurrent answer',expectedReplyOrder:0});await switchTo(admin);
  await assert.rejects(command({content:'Second concurrent answer',expectedReplyOrder:0}),/새 메시지/);
 }));
 await check('after reviewing latest conversation staff may send; internal notes do not conflict',()=>asUser(admin,async()=>{
  await db.exec('reset role');await seed();await db.exec('set local role authenticated');
  await command({content:'Private note',isInternal:true});const first=await command({content:'First public answer',expectedReplyOrder:0});await switchTo(agent);
  const second=await command({content:'Reviewed supplementary answer',expectedReplyOrder:first.reply_order});assert(second.id);
 }));
 await check('lost reply response can be found and retried after newer customer message',()=>asUser(admin,async()=>{
  await db.exec('reset role');await seed();await db.exec('set local role authenticated');
  const payload={content:'Public answer with retry',expectedReplyOrder:0,requestId:token};const first=await command(payload);await switchTo(customer);await command({content:'Another question from customer'});await switchTo(admin);
  assert.equal((await command(payload)).id,first.id);
  assert.equal((await db.query('select find_reply_submission($1,$2) result',[id,token])).rows[0].result.id,first.id);
  await switchTo(agent);assert.equal((await db.query('select find_reply_submission($1,$2) result',[id,token])).rows[0].result,null);
 }));
 await check('presence excludes own session, shows another staff session and expires',()=>asUser(admin,async()=>{
  await db.exec('reset role');await seed();await db.exec('set local role authenticated');
  assert.equal((await presence(true)).participants.length,0);await switchTo(agent);
  assert.equal((await presence()).participants[0].actorId,admin);
  await db.exec('reset role');await db.query("update supportflow_private.reply_presence set expires_at=now()-interval '1 second' where ticket_id=$1",[id]);await db.exec('set local role authenticated');
  assert.equal((await presence()).participants.length,0);
 }));
 await check('presence supports another tab and removes typing on blur',()=>asUser(admin,async()=>{
  await db.exec('reset role');await seed();await db.exec('set local role authenticated');await presence(true);
  assert.equal((await presence(false,token)).participants.length,1);await presence(false);assert.equal((await presence(false,token)).participants.length,0);
 }));
 await check('customer cannot read or publish staff typing presence',()=>asUser(customer,async()=>{
  await db.exec('reset role');await seed();await db.exec('set local role authenticated');await assert.rejects(presence(true),/접근 권한/);
 }));
 await check('reassigned agent loses presence and reply access immediately',()=>asUser(agent,async()=>{
  await db.exec('reset role');await seed();await db.exec('set local role authenticated');await presence(true);await db.exec('reset role');await db.query('update tickets set assignee_id=null where id=$1',[id]);await db.exec('set local role authenticated');await switchTo(admin);
  assert.equal((await presence()).participants.length,0);await switchTo(agent);await assert.rejects(presence(),/접근 권한/);
 }));
 await check('large alert backlog drains across batches without starving later tickets',()=>asUser(admin,async()=>{
  await save();await db.exec('reset role');
  await db.query("insert into tickets(title,content,category,customer_id,assignee_id,response_started_at) select 'Backlog test '||n,'Support request for scheduler backlog.','account',$1,$2,'2026-09-07T00:00:00Z'::timestamptz from generate_series(1,205) n",[customer,agent]);
  for(let pass=0;pass<4;pass++)await db.query('select supportflow_private.dispatch_response_alerts($1)',['2026-09-07T04:01:00Z']);
  const {rows}=await db.query("select count(distinct n.ticket_id)::int count from support_notifications n join tickets t on t.id=n.ticket_id where t.title like 'Backlog test %' and n.kind='response_breached'");assert.equal(rows[0].count,205);
 }));
 await check('customer cannot forge a response deadline during intake',()=>asUser(customer,()=>assert.rejects(db.query("insert into tickets(title,content,category,customer_id,response_due_at) values('Forged deadline','Please help with the account issue','account',$1,now()+interval '1 year')",[customer]),/permission denied/)));
 await check('customer cannot read private operational policies',()=>asUser(customer,async()=>{assert.equal((await db.query('select id from response_policies')).rows.length,0);}));

}
