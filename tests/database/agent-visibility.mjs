import assert from 'node:assert/strict';
export async function runAgentVisibilityTests({db,check,asUser,customer,agent,admin}) {
  const second='40000000-0000-4000-8000-000000000001';
  const own='40000000-0000-4000-8000-000000000002';
  const foreign='40000000-0000-4000-8000-000000000003';
  const previous='40000000-0000-4000-8000-000000000004';
  const ids=[own,foreign,previous];
  await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,'second-agent@example.test','{}')`,[second]);
  await db.query("update profiles set role='agent' where id=$1",[second]);
  for(const [id,owner,assignee] of [[own,customer,agent],[foreign,customer,second],[previous,agent,null]]) {
    await db.query("insert into tickets(id,title,content,category,customer_id,assignee_id) values($1,'Visibility test','Please check this private inquiry in detail.','other',$2,$3)",[id,owner,assignee]);
    await db.query("insert into ticket_replies(ticket_id,author_id,content,is_internal) values($1,$2,'A private reply for this customer',false)",[id,admin]);
  }
  await check('agent list and direct lookup exclude other assignments and former customer tickets',()=>asUser(agent,async()=>{
    const result=await db.query('select id from ticket_workspace where id=any($1::uuid[])',[ids]);
    assert.deepEqual(result.rows.map(r=>r.id),[own]);
    assert.equal((await db.query('select id from tickets where id=$1',[foreign])).rows.length,0);
    assert.equal((await db.query('select id from ticket_replies where ticket_id=$1',[previous])).rows.length,0);
  }));
  await check('second agent sees only their own assignment',()=>asUser(second,async()=>{
    assert.deepEqual((await db.query('select id from ticket_workspace where id=any($1::uuid[])',[ids])).rows.map(r=>r.id),[foreign]);
  }));
  await check('admin retains access to every assignment and unassigned inquiry',()=>asUser(admin,async()=>{
    assert.equal((await db.query('select id from ticket_workspace where id=any($1::uuid[])',[ids])).rows.length,3);
  }));
  await db.query('update tickets set assignee_id=$1 where id=$2',[second,own]);
  await check('reassigned ticket and replies disappear from the previous agent',()=>asUser(agent,async()=>{
    assert.equal((await db.query('select id from ticket_workspace where id=$1',[own])).rows.length,0);
    assert.equal((await db.query('select id from ticket_replies where ticket_id=$1',[own])).rows.length,0);
    await assert.rejects(db.query("select support_ticket_command($1,'reply',$2)",[own,JSON.stringify({content:'Attempt after reassignment',isInternal:true})]),/접근 권한/);
  }));
}
