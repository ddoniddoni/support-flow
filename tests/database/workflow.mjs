import { versionedReply } from "./reply-fixture.mjs";
import assert from 'node:assert/strict';
export async function runWorkflowTests({ db, check, asUser, customer, agent, admin, other }) {
  const ticket = '10000000-0000-4000-8000-000000000001';
  const otherTicket = '10000000-0000-4000-8000-000000000002';
  await db.query(`insert into tickets(id,title,content,category,customer_id,assignee_id)
    values ($1,'Payment failed','Payment failed repeatedly, please help.','billing',$2,$3),
    ($4,'Other ticket','Private customer ticket content','other',$5,null)`, [ticket,customer,agent,otherTicket,other]);
  const command = async (action, payload, id = ticket) => {
    const { rows } = await db.query('select support_ticket_command($1,$2,$3) as result', [id,action,JSON.stringify(await versionedReply(db,id,action,payload))]);
    return rows[0].result;
  };
  const analysis = {
    provider:'mock',model:'mock-ticket-triage-v1',category:'billing',sentiment:'negative',urgency:'high',intent:'billing_issue',
    tags:['payment'], summary:'Payment failed',reason:'Payment dispute requires review',reply_draft:'We will investigate.',
    confidence:0.6,needs_review:true,validation_status:'valid',raw_response:{internal:'trace'},suggested_priority:'high',
  };
  await check('anonymous callers cannot read tickets or execute commands', () => asUser('', async () => {
    await assert.rejects(db.query('select * from ticket_workspace'), /permission denied/);
  }, 'anon'));
  await check('anonymous callers cannot execute the mutation RPC', () => asUser('', async () => {
    await assert.rejects(command('update', {status:'resolved'}), /permission denied/);
  }, 'anon'));
  await check('service intake can read the projection and save a customer analysis', () => asUser('', async () => {
    const { rows } = await db.query('select * from ticket_workspace where id=$1',[ticket]);
    assert.equal(rows.length,1);
    const saved = await command('save_analysis', {analysis,actorId:customer});
    assert.equal(saved.created_by,customer);
  }, 'service_role'));
  await check('service intake cannot analyze an unrelated customer ticket', () => asUser('', async () => {
    await assert.rejects(command('save_analysis', {analysis,actorId:other}), /접근 권한/);
  }, 'service_role'));
  await check('customer cannot read denormalized AI fields directly', () => asUser(customer, async () => {
    await assert.rejects(db.query('select ai_sentiment from tickets'), /permission denied/);
  }));
  await check('customer sees only own tickets and no AI analysis', () => asUser(customer, async () => {
    const { rows } = await db.query('select * from ticket_workspace');
    assert.equal(rows.length,1); assert.equal(rows[0].ai_analysis,null);
  }));
  await check('customer cannot create pre-assigned urgent tickets', () => asUser(customer, async () => {
    await assert.rejects(db.query(`insert into tickets(title,content,category,customer_id,priority)
      values ('Forged ticket','Bad request','other',$1,'urgent')`, [customer]), /permission denied/);
  }));
  await check('customer can create a normal ticket', () => asUser(customer, async () => {
    const { rows } = await db.query(`insert into tickets(title,content,category,customer_id)
      values ('Normal ticket','Please help with my account','account',$1) returning id`, [customer]);
    assert.equal(rows.length,1);
  }));
  await check('customer cannot trigger manual AI analysis', () => asUser(customer, async () => {
    await assert.rejects(command('save_analysis',{analysis,actorId:admin}), /접근 권한/);
  }));
  await check('agent cannot change priority even by calling RPC directly', () => asUser(agent, async () => {
    await assert.rejects(command('update',{priority:'urgent'}), /관리자만/);
  }));
  await check('agent cannot access an unassigned ticket', () => asUser(agent, async () => {
    await assert.rejects(command('update',{status:'resolved'},otherTicket), /접근 권한/);
  }));
  await check('admin cannot assign a customer as an agent', () => asUser(admin, async () => {
    await assert.rejects(command('update',{assigneeId:customer}), /상담원 계정/);
  }));
  await check('status change and audit record persist together', () => asUser(agent, async () => {
    const updated = await command('update',{status:'in_progress'});
    assert.equal(updated.status,'in_progress');
    const { rows } = await db.query("select * from ticket_logs where ticket_id=$1 and action='status_changed'",[ticket]);
    assert.equal(rows.length,1); assert.equal(rows[0].actor_id,agent);
  }));
  for (const [name, actor] of [['agent', agent], ['admin', admin]]) {
    await check(`${name} cannot resolve without a public reply`, () => asUser(actor, async () => {
      await assert.rejects(command('update', {status:'resolved'}), /고객 공개 답변/);
    }));
  }
  await check('internal note cannot satisfy resolution requirement', () => asUser(agent, async () => {
    await command('reply',{content:'Internal investigation only',isInternal:true});
    await assert.rejects(command('update',{status:'resolved'}), /고객 공개 답변/);
  }));
  await check('service direct writes cannot bypass resolution requirement', () => asUser('', async () => {
    await assert.rejects(db.query("update tickets set status='resolved' where id=$1",[ticket]), /고객 공개 답변/);
  }, 'service_role'));
  await check('a ticket with a public reply may return to resolved', () => asUser(agent, async () => {
    await command('reply',{content:'A real customer-facing answer'});
    await command('update',{status:'open'});
    const updated=await command('update',{status:'resolved'});
    assert.equal(updated.status,'resolved');
  }));
  await check('public reply resolves ticket and logs AI draft usage atomically', () => asUser(agent, async () => {
    await command('reply',{content:'We have resolved your issue.',source:'ai_draft'});
    const { rows } = await db.query('select status from tickets where id=$1',[ticket]);
    assert.equal(rows[0].status,'resolved');
    const logs = await db.query('select action from ticket_logs where ticket_id=$1',[ticket]);
    assert.deepEqual(logs.rows.map(r=>r.action).sort(), ['ai_draft_used_as_customer_reply','reply_added','status_changed']);
  }));
  await check('staff can continue a public conversation', () => asUser(agent, async () => {
    await command('reply',{content:'First reply'});
    await command('reply',{content:'Second reply'});
    assert.equal((await db.query('select id from ticket_replies where ticket_id=$1',[ticket])).rows.length,2);
  }));
  await check('internal notes do not resolve a ticket', () => asUser(agent, async () => {
    await command('reply',{content:'Internal investigation',isInternal:true});
    const { rows } = await db.query('select status from tickets where id=$1',[ticket]);
    assert.equal(rows[0].status,'open');
  }));
  await check('clients cannot bypass reply RPC and its audit trail', () => asUser(agent, async () => {
    await assert.rejects(db.query(`insert into ticket_replies(ticket_id,author_id,content)
      values ($1,$2,'Bypass')`,[ticket,agent]), /permission denied/);
  }));
  await check('AI saves use authenticated actor, never caller-supplied identity', () => asUser(agent, async () => {
    const saved = await command('save_analysis',{analysis,actorId:admin});
    assert.equal(saved.created_by,agent); assert.equal(saved.raw_response,undefined);
    const { rows } = await db.query('select * from ticket_workspace where id=$1',[ticket]);
    assert.equal(rows[0].latest_ai_analysis_id,saved.id); assert.equal(rows[0].ai_needs_review,true);
  }));
  await check('concurrent/stale AI generation cannot overwrite latest analysis', () => asUser(agent, async () => {
    await command('save_analysis',{analysis});
    await assert.rejects(command('save_analysis',{analysis}), /다른 분석/);
  }));
  await check('reviewing an obsolete analysis cannot restore it as latest', () => asUser(agent, async () => {
    const first = await command('save_analysis',{analysis});
    await command('save_analysis',{analysis,expectedAnalysisId:first.id});
    await assert.rejects(command('review',{analysisId:first.id,decision:'approved'}), /최신 분석/);
  }));
  await check('rejecting an analysis clears its draft and writes a review event', () => asUser(agent, async () => {
    const first = await command('save_analysis',{analysis});
    const rejected = await command('review',{analysisId:first.id,decision:'rejected'});
    assert.equal(rejected.reply_draft,null); assert.equal(rejected.needs_review,false);
    assert.equal(rejected.review_decision,'rejected');
    const projection = (await db.query('select * from ticket_workspace where id=$1',[ticket])).rows[0];
    assert.equal(projection.ai_sentiment,null); assert.equal(projection.ai_urgency,null);
    assert.equal(projection.ai_confidence,null); assert.equal(projection.ai_urgency_rank,0);
    const { rows } = await db.query('select * from ticket_ai_review_events where ticket_id=$1',[ticket]);
    assert.equal(rows.length,1); assert.equal(rows[0].reviewer_id,agent);
  }));
  await check('invalid corrections are rejected by the database', () => asUser(agent, async () => {
    const first = await command('save_analysis',{analysis});
    await assert.rejects(command('review',{analysisId:first.id,decision:'corrected',correction:{summary:''}}), /수정 내용/);
  }));
  await check('audit failure rolls back the business mutation', async () => {
    await db.exec(`create function public.fail_test_log() returns trigger language plpgsql as $$
      begin raise exception 'simulated audit failure'; end $$;
      create trigger test_log_failure before insert on ticket_logs for each row execute function fail_test_log();`);
    await asUser(agent, async () => {
      await db.exec('savepoint before_command');
      await assert.rejects(command('reply',{content:'Must roll back'}), /simulated audit failure/);
      await db.exec('rollback to before_command');
      const { rows } = await db.query('select status from tickets where id=$1',[ticket]);
      assert.equal(rows[0].status,'open');
      assert.equal((await db.query('select * from ticket_replies where ticket_id=$1',[ticket])).rows.length,0);
    });
    await db.exec('drop trigger test_log_failure on ticket_logs; drop function fail_test_log();');
  });
  // Persist a staff analysis, then query it as the customer (not an empty-table test).
  await db.exec(`begin; set local role authenticated; select set_config('request.jwt.claim.sub','${agent}',true);`);
  await command('save_analysis',{analysis});
  await command('reply',{content:'Staff-only internal note',isInternal:true});
  await db.exec('commit');
  await check('customer cannot see existing AI content, internal notes or audit logs', () => asUser(customer, async () => {
    assert.equal((await db.query('select * from ticket_ai_analyses')).rows.length,0);
    assert.equal((await db.query('select * from ticket_replies')).rows.length,0);
    assert.equal((await db.query('select * from ticket_logs')).rows.length,0);
    const { rows } = await db.query('select * from ticket_workspace');
    assert.equal(rows[0].ai_analysis,null); assert.equal(rows[0].latest_ai_analysis_id,null);
    assert.equal(rows[0].ai_sentiment,null);
  }));
}
