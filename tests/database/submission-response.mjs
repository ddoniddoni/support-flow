import assert from 'node:assert/strict';
export async function runSubmissionResponseTests({db,check,asUser,customer,agent,other}) {
 const id='82000000-0000-4000-8000-000000000001';
 const token='82000000-0000-4000-8000-000000000099';
 await db.query("insert into tickets(id,title,content,category,customer_id,assignee_id,created_at,response_started_at) values($1,'Old inquiry','Original account request','account',$2,$3,now()-interval '3 days',now()-interval '3 days')",[id,customer,agent]);
 const command=async(action,payload)=> (await db.query('select support_ticket_command($1,$2,$3) result',[id,action,JSON.stringify(payload)])).rows[0].result;
 const state=async()=> (await db.query('select response_started_at,status from tickets where id=$1',[id])).rows[0];
 const reply={content:'Public support answer',isInternal:false,requestId:token};
 await check('reply retry returns original result and creates one message, audit and notification',()=>asUser(agent,async()=>{
   const first=await command('reply',reply);const second=await command('reply',reply);assert.equal(first.id,second.id);
   assert.equal((await db.query('select count(*)::int n from ticket_replies where ticket_id=$1',[id])).rows[0].n,1);
   assert.equal((await db.query("select count(*)::int n from ticket_logs where ticket_id=$1 and action='reply_added'",[id])).rows[0].n,1);
   await db.exec('reset role');
   assert.equal((await db.query("select count(*)::int n from support_notifications where ticket_id=$1 and kind='staff_reply'",[id])).rows[0].n,1);
 }));
 await check('same request token with different reply content is rejected',()=>asUser(agent,async()=>{
   await command('reply',reply);await assert.rejects(command('reply',{...reply,content:'Changed answer'}),/다른 내용/);
 }));
 await check('response clock restarts after answered inquiry and additional messages do not extend it',()=>asUser(agent,async()=>{
   await command('reply',reply);assert.equal((await state()).response_started_at,null);
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[customer]);
   await command('reply',{content:'I have another question',isInternal:false});
   const started=(await state()).response_started_at;assert(started);assert(Date.now()-Date.parse(started)<10000);
   await command('reply',{content:'More context for this question',isInternal:false});
   assert.equal(String((await state()).response_started_at),String(started));
 }));
 await check('replaying an earlier staff reply does not close a newer customer question',()=>asUser(agent,async()=>{
   await command('reply',reply);
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[customer]);
   await command('reply',{content:'A newer unanswered question',isInternal:false});
   const pending=await state();
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[agent]);
   await command('reply',reply);
   assert.deepEqual(await state(),pending);
 }));
 await check('internal note and assignment-independent edits do not reset pending clock',()=>asUser(agent,async()=>{
   const before=(await state()).response_started_at;
   await command('reply',{content:'Internal context',isInternal:true,requestId:token});
   await command('update',{status:'in_progress'});
   assert.equal(String((await state()).response_started_at),String(before));
 }));
 await check('cached reply remains protected after assignment changes',()=>asUser(agent,async()=>{
   await command('reply',reply);await db.exec('reset role');await db.query('update tickets set assignee_id=null where id=$1',[id]);await db.exec('set local role authenticated');
   await assert.rejects(command('reply',reply),/접근 권한/);
 }));
 const create=async(title='Repeat inquiry')=>(await db.query('select submit_support_ticket($1,$2,$3,$4) result',[token,title,'Please help with this account question','account'])).rows[0].result;
 await check('customer create retry returns one ticket and marks replay',()=>asUser(customer,async()=>{
   const first=await create();const second=await create();assert.equal(first.id,second.id);assert.equal(first.replayed,false);assert.equal(second.replayed,true);
 }));
 await check('changed inquiry cannot reuse successful submission token',()=>asUser(customer,async()=>{
   await create();await assert.rejects(create('Changed inquiry'),/다른 내용/);
 }));
 await check('agent cannot use customer intake RPC',()=>asUser(agent,async()=>{await assert.rejects(create(),/고객 계정/);}));
 await check('request records cannot be read by authenticated clients',()=>asUser(customer,async()=>{await assert.rejects(db.query('select * from supportflow_private.submission_requests'),/permission denied/);}));
 await check('request token is isolated between customers',()=>asUser(customer,async()=>{
   const first=await create();await db.query("select set_config('request.jwt.claim.sub',$1,true)",[other]);const second=await create();assert.notEqual(first.id,second.id);
 }));
 await check('audit failure rolls back reply and retry token so retry can succeed',()=>asUser(agent,async()=>{
   await db.exec('reset role');await db.exec(`create function public.fail_retry_audit() returns trigger language plpgsql as $$ begin raise exception 'simulated audit failure'; end $$; create trigger fail_retry_audit before insert on ticket_logs for each row execute function public.fail_retry_audit(); set local role authenticated; savepoint attempt;`);
   await assert.rejects(command('reply',reply),/simulated audit failure/);await db.exec('rollback to savepoint attempt; reset role; drop trigger fail_retry_audit on ticket_logs; set local role authenticated;');
   const saved=await command('reply',reply);assert(saved.id);
 }));
}
