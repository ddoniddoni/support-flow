import assert from 'node:assert/strict';
export async function runAttachmentTests({db,check,asUser,customer,agent,admin,other}) {
 const ticket='83000000-0000-4000-8000-000000000001';
 const publicFile='83000000-0000-4000-8000-000000000010';const internalFile='83000000-0000-4000-8000-000000000011';const intakeFile='83000000-0000-4000-8000-000000000012';
 const token='83000000-0000-4000-8000-000000000099';
 await db.query("insert into tickets(id,title,content,category,customer_id,assignee_id) values($1,'Attachment test','A customer inquiry with attachments','account',$2,$3)",[ticket,customer,agent]);
 const stage=async(id,owner,internal,target)=>db.query("insert into ticket_attachments(id,owner_id,upload_ticket_id,is_internal,name,mime_type,size,object_path,sha256) values($1,$2,$3,$4,'test.png','image/png',100,$1::uuid::text,'hash')",[id,owner,target,internal]);
 await stage(publicFile,agent,false,ticket);await stage(internalFile,agent,true,ticket);await stage(intakeFile,customer,false,null);
 const command=async(ids,internal=false)=>(await db.query("select support_ticket_command($1,'reply',$2) result",[ticket,JSON.stringify({content:'Reply with attachment',isInternal:internal,requestId:token,attachmentIds:ids})])).rows[0].result;
 const read=async()=> (await db.query('select id from ticket_attachments order by id')).rows.map(r=>r.id);
 await check('staged attachments are visible only to uploader',()=>asUser(customer,async()=>{assert.deepEqual(await read(),[intakeFile]);}));
 await check('reply and attachments bind atomically and retry returns same reply',()=>asUser(agent,async()=>{
   const first=await command([publicFile]);const second=await command([publicFile]);assert.equal(first.id,second.id);
   assert.equal((await db.query('select reply_id from ticket_attachments where id=$1',[publicFile])).rows[0].reply_id,first.id);
 }));
 await check('customer sees public attachment but cannot see internal attachment',()=>asUser(agent,async()=>{
   await command([internalFile],true);
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[customer]);assert(! (await read()).includes(internalFile));
 }));
 await check('customer and admin can read a linked public attachment',()=>asUser(agent,async()=>{
   await command([publicFile]);
   for(const user of [customer,admin]){await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);assert((await read()).includes(publicFile));}
 }));
 await check('other customer cannot read linked attachments',()=>asUser(agent,async()=>{
   await command([publicFile]);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[other]);assert(!(await read()).includes(publicFile));
 }));
 await check('previous assignee loses file access after reassignment',()=>asUser(agent,async()=>{
   await command([publicFile]);await db.exec('reset role');await db.query('update tickets set assignee_id=null where id=$1',[ticket]);await db.exec('set local role authenticated');assert(!(await read()).includes(publicFile));
 }));
 await check('public reply cannot leak internal staged file',()=>asUser(agent,async()=>{await assert.rejects(command([internalFile]),/添付|첨부파일/);}));
 await check('cannot attach another uploader file',()=>asUser(customer,async()=>{await assert.rejects(command([publicFile]),/첨부파일/);}));
 await check('duplicate file IDs cannot bypass attachment count',()=>asUser(agent,async()=>{await assert.rejects(command([publicFile,publicFile]),/첨부파일/);}));
 await check('intake attaches staged customer files with original inquiry',()=>asUser(customer,async()=>{
   const args=[token,'New attachment inquiry','A sufficiently long original customer inquiry','account',[intakeFile]];
   const result=(await db.query('select submit_support_ticket($1,$2,$3,$4,$5) result',args)).rows[0].result;
   const row=(await db.query('select ticket_id,reply_id from ticket_attachments where id=$1',[intakeFile])).rows[0];assert.equal(row.ticket_id,result.id);assert.equal(row.reply_id,null);
   assert.equal((await db.query('select submit_support_ticket($1,$2,$3,$4,$5) result',args)).rows[0].result.id,result.id);
 }));
 await check('clients cannot forge attachment metadata or object locations',()=>asUser(customer,async()=>{await assert.rejects(stage('83000000-0000-4000-8000-000000000015',customer,false,null),/permission denied/);}));
 await check('failed attachment binding rolls back the message',()=>asUser(agent,async()=>{
   await db.exec('savepoint bind_attempt');await assert.rejects(command([intakeFile]),/첨부파일/);await db.exec('rollback to savepoint bind_attempt');assert.equal((await db.query('select count(*)::int n from ticket_replies where ticket_id=$1',[ticket])).rows[0].n,0);
 }));
 await check('administrator can attach their own file to a public reply',()=>asUser(admin,async()=>{
   const id='83000000-0000-4000-8000-000000000016';await db.exec('reset role');await stage(id,admin,false,ticket);await db.exec('set local role authenticated');
   const reply=await command([id]);assert(reply.id);
 }));
 await check('customer followup can attach its own staged file',()=>asUser(customer,async()=>{
   const id='83000000-0000-4000-8000-000000000017';await db.exec('reset role');await stage(id,customer,false,ticket);await db.exec('set local role authenticated');
   const reply=await command([id]);assert.equal(reply.author_role,'customer');
 }));
 await check('expired staging cannot be attached to a message',()=>asUser(agent,async()=>{
   await db.exec('reset role');await db.query("update ticket_attachments set created_at=now()-interval '2 days' where id=$1",[publicFile]);await db.exec('set local role authenticated');
   await assert.rejects(command([publicFile]),/만료/);
 }));
 await check('private bucket cannot be accessed as a public bucket',async()=>{assert.equal((await db.query("select public from storage.buckets where id='ticket-attachments'")).rows[0].public,false);});
}
