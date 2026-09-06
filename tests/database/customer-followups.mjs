import assert from 'node:assert/strict';
export async function runCustomerFollowupTests({db,check,asUser,customer,agent,other}) {
 const id='50000000-0000-4000-8000-000000000001';
 await db.query("insert into tickets(id,title,content,category,customer_id,assignee_id) values($1,'Follow up test','Please help resolve my account issue.','account',$2,$3)",[id,customer,agent]);
 const reply=(content,extra={})=>db.query("select support_ticket_command($1,'reply',$2) as result",[id,JSON.stringify({content,...extra})]);
 const switchTo=actor=>db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);
 await check('customer message reopens resolved inquiry, retains assignee and staff can answer again',()=>asUser(agent,async()=>{
  await reply('First staff answer');await switchTo(customer);await reply('It is still not working');
  let row=(await db.query('select status,assignee_id from tickets where id=$1',[id])).rows[0];
  assert.equal(row.status,'open');assert.equal(row.assignee_id,agent);
  const messages=(await db.query('select author_role from ticket_replies where ticket_id=$1 order by reply_order',[id])).rows;
  assert.deepEqual(messages.map(r=>r.author_role),['agent','customer']);
  await switchTo(agent);await reply('Updated resolution instructions');
  assert.equal((await db.query('select status from tickets where id=$1',[id])).rows[0].status,'resolved');
  assert.equal((await db.query("select id from ticket_logs where ticket_id=$1 and action='customer_message_added'",[id])).rows.length,1);
 }));
 await check('old staff response cannot resolve a newer customer message',()=>asUser(agent,async()=>{
  await reply('Old staff answer');await switchTo(customer);await reply('Another question for staff');await switchTo(agent);
  await assert.rejects(db.query("select support_ticket_command($1,'update','{\"status\":\"resolved\"}')",[id]),/최신 고객 메시지/);
 }));
 await check('customer can reopen closed inquiry',()=>asUser(agent,async()=>{
  await db.query("select support_ticket_command($1,'update','{\"status\":\"closed\"}')",[id]);await switchTo(customer);await reply('Please reopen this inquiry');
  assert.equal((await db.query('select status from tickets where id=$1',[id])).rows[0].status,'open');
 }));
 for(const [name,actor,extra] of [['another customer',other,{}],['customer internal note',customer,{isInternal:true}],['customer forged AI source',customer,{source:'ai_draft'}]]) {
  await check(`${name} cannot submit unauthorized followup`,()=>asUser(actor,()=>assert.rejects(reply('An unauthorized message',extra),/접근 권한|공개 메시지/)));
 }
 await check('customer followup and reopen roll back together on audit failure',async()=>{
  await db.exec(`create function public.fail_followup_log() returns trigger language plpgsql as $$begin if new.action='customer_message_added' then raise exception 'followup audit failure'; end if; return new; end;$$;
  create trigger fail_followup_log before insert on ticket_logs for each row execute function public.fail_followup_log();`);
  try { await asUser(agent,async()=>{
   await reply('Staff answer before failure');await switchTo(customer);await db.exec('savepoint before_followup');
   await assert.rejects(reply('Customer followup rolled back'),/followup audit failure/);await db.exec('rollback to savepoint before_followup');
   assert.equal((await db.query('select status from tickets where id=$1',[id])).rows[0].status,'resolved');
   assert.equal((await db.query('select id from ticket_replies where ticket_id=$1',[id])).rows.length,1);
  }); } finally {await db.exec('drop trigger fail_followup_log on ticket_logs;drop function public.fail_followup_log();');}
 });
}
