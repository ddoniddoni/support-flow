import assert from 'node:assert/strict';
export async function runConversationAITests({db,check,asUser,customer,agent}) {
 const id='81000000-0000-4000-8000-000000000001';
 await db.query("insert into tickets(id,title,content,category,customer_id,assignee_id) values($1,'Original','Original account request','account',$2,$3)",[id,customer,agent]);
 const command=async(action,payload)=> (await db.query('select support_ticket_command($1,$2,$3) result',[id,action,JSON.stringify(payload)])).rows[0].result;
 const analysis={provider:'mock',category:'account',sentiment:'neutral',urgency:'medium',intent:'account_help',summary:'Summary',reason:'Reason',reply_draft:'Draft',confidence:0.8,needs_review:false,validation_status:'valid'};
 await check('AI snapshot captures public conversation order and ignores internal notes',()=>asUser(agent,async()=>{
   const reply=await command('reply',{content:'Public answer',isInternal:false});
   await command('reply',{content:'Private note',isInternal:true});
   const saved=await command('save_analysis',{analysis,expectedReplyOrder:reply.reply_order});
   assert.equal(saved.source_reply_order,reply.reply_order);
 }));
 await check('message arriving during generation rejects stale analysis atomically',()=>asUser(agent,async()=>{
   await command('reply',{content:'New public answer',isInternal:false});
   await assert.rejects(command('save_analysis',{analysis,expectedReplyOrder:0}),/대화가 변경/);
 }));
 await check('old analysis cannot be approved after a new public message',()=>asUser(agent,async()=>{
   const saved=await command('save_analysis',{analysis,expectedReplyOrder:0});
   await command('reply',{content:'New public answer',isInternal:false});
   await assert.rejects(command('review',{analysisId:saved.id,decision:'approved'}),/대화가 변경/);
 }));
 await check('customer remains unable to save conversation analysis',()=>asUser(customer,async()=>{
   await assert.rejects(command('save_analysis',{analysis,expectedReplyOrder:0}),/접근 권한/);
 }));
}
