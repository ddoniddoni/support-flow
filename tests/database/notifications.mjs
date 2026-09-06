import assert from 'node:assert/strict';
export async function runNotificationTests({db,check,asUser,customer,agent,admin,other}) {
 const id='60000000-0000-4000-8000-000000000001';
 await db.query("insert into tickets(id,title,content,category,customer_id) values($1,'Notification test','Please help with notifications on this ticket.','other',$2)",[id,customer]);
 const command=(action,payload)=>db.query('select support_ticket_command($1,$2,$3) as result',[id,action,JSON.stringify(payload)]);
 const switchTo=actor=>db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);
 const rows=()=>db.query('select * from support_notifications where ticket_id=$1',[id]);
 await check('assignment alerts are recipient-only and repeat assignment adds no duplicate',()=>asUser(admin,async()=>{
  await command('update',{assigneeId:agent});await command('update',{assigneeId:agent});assert.equal((await rows()).rows.length,0);
  await switchTo(agent);const all=(await rows()).rows;assert.equal(all.length,1);assert.equal(all[0].kind,'assigned');
  await switchTo(customer);assert.equal((await rows()).rows.length,0);
 }));
 await check('public staff replies notify customer, internal notes never do',()=>asUser(admin,async()=>{
  await command('reply',{content:'Staff private note',isInternal:true});await command('reply',{content:'Here is our public answer'});
  await switchTo(customer);const all=(await rows()).rows;assert.equal(all.length,1);assert.equal(all[0].kind,'staff_reply');
 }));
 await check('customer followup notifies assignee and snapshot read preserves newer unseen message',()=>asUser(admin,async()=>{
  await command('update',{assigneeId:agent});await switchTo(customer);
  const first=(await command('reply',{content:'Customer first message'})).rows[0].result;
  await command('reply',{content:'Customer second message'});await switchTo(agent);
  await db.query('select read_ticket_notifications($1,$2)',[id,first.reply_order]);
  const all=(await rows()).rows;assert.equal(all.filter(n=>n.read_at===null).length,1);
  const counts=await db.query('select * from unread_ticket_notifications(array[$1::uuid])',[id]);assert.equal(Number(counts.rows[0].unread_count),1);
 }));
 await check('unassigned followup alerts administrators',()=>asUser(customer,async()=>{
  await command('reply',{content:'Unassigned customer message'});await switchTo(admin);
  assert.equal((await rows()).rows.filter(n=>n.kind==='customer_message').length,1);
 }));
 await check('unassignment hides old alerts and reassignment does not revive unread history',()=>asUser(admin,async()=>{
  await command('update',{assigneeId:agent});await command('update',{assigneeId:null});await switchTo(agent);assert.equal((await rows()).rows.length,0);
  await switchTo(admin);await command('update',{assigneeId:agent});await switchTo(agent);assert.equal((await rows()).rows.filter(n=>n.read_at===null).length,1);
 }));
 await check('another customer cannot read or mark notifications',()=>asUser(admin,async()=>{
  await command('reply',{content:'A public support response'});await switchTo(other);
  assert.equal((await rows()).rows.length,0);assert.equal((await db.query('select read_ticket_notifications($1,999999) as changed',[id])).rows[0].changed,0);
 }));
 await check('clients cannot forge notification recipients or events',()=>asUser(customer,async()=>{
  await assert.rejects(db.query("insert into support_notifications(recipient_id,ticket_id,kind) values($1,$2,'assigned')",[customer,id]),/permission denied/);
 }));
 await check('notification failure rolls back assignment and audit trail',async()=>{
  await db.exec("create function public.fail_notification() returns trigger language plpgsql as $$begin raise exception 'notification failure';end;$$;create trigger fail_notification before insert on support_notifications for each row execute function public.fail_notification();");
  try{await asUser(admin,async()=>{
   await db.exec('savepoint before_assignment');await assert.rejects(command('update',{assigneeId:agent}),/notification failure/);await db.exec('rollback to savepoint before_assignment');
   assert.equal((await db.query('select assignee_id from tickets where id=$1',[id])).rows[0].assignee_id,null);
   assert.equal((await db.query('select id from ticket_logs where ticket_id=$1',[id])).rows.length,0);
  });}finally{await db.exec('drop trigger fail_notification on support_notifications;drop function public.fail_notification();');}
 });
}
