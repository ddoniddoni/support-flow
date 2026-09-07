import { versionedReply } from "./reply-fixture.mjs";
import assert from 'node:assert/strict';

export async function runSupportQualityTests({ db, check, asUser, customer, agent, admin, other }) {
  const templateId = '85000000-0000-4000-8000-000000000001';
  const ticketId = '85000000-0000-4000-8000-000000000002';
  const content = { title: '계정 안내', category: '계정', content: '계정 설정에서 변경할 수 있습니다.', isActive: true };
  const save = async (payload = content) => (await db.query('select save_reply_template($1,$2) result', [templateId, JSON.stringify(payload)])).rows[0].result;
  const switchTo = actor => db.query("select set_config('request.jwt.claim.sub',$1,true)", [actor]);
  const reply = async (text = '지원팀에서 안내드립니다.', isInternal = false) => (await db.query("select support_ticket_command($1,'reply',$2) result", [ticketId, JSON.stringify(await versionedReply(db,ticketId,'reply',{ content: text, isInternal }))])).rows[0].result;
  const rate = async (replyId, helpful = true, comment = '') => (await db.query('select submit_ticket_feedback($1,$2,$3,$4) result', [ticketId, replyId, helpful, comment])).rows[0].result;
  const state = async () => (await db.query('select status,assignee_id,response_started_at from tickets where id=$1', [ticketId])).rows[0];

  for (const actor of [customer, agent]) {
    await check(`${actor === customer ? 'customer' : 'agent'} cannot manage shared templates`, () => asUser(actor, () => assert.rejects(save(), /관리자만/)));
  }
  await check('admin template create and retry create exactly one audit event', () => asUser(admin, async () => {
    const first = await save(); const second = await save();
    assert.deepEqual(first, second); assert.equal(first.created_by, admin);
    await db.exec('reset role');
    assert.equal((await db.query('select count(*)::int n from supportflow_private.reply_template_events where template_id=$1', [templateId])).rows[0].n, 1);
  }));
  await check('admin can edit and deactivate; stale edits are rejected', () => asUser(admin, async () => {
    const first = await save();
    const changed = await save({ ...content, title: '새 계정 안내', updatedAt: first.updated_at, isActive: false });
    assert.equal(changed.is_active, false); assert.equal(changed.title, '새 계정 안내');
    assert.equal((await save({ ...content, title: changed.title, updatedAt: first.updated_at, isActive: false })).updated_at, changed.updated_at);
    await assert.rejects(save({ ...content, title: '오래된 편집', updatedAt: first.updated_at }), /다른 관리자가/);
  }));
  await check('template visibility respects role and active state', () => asUser(admin, async () => {
    const first = await save();
    await switchTo(customer);
    assert.equal((await db.query('select id from reply_templates')).rows.length, 0);
    await switchTo(agent);
    assert.equal((await db.query('select id from reply_templates')).rows.length, 1);
    await switchTo(admin); await save({ ...content, isActive: false, updatedAt: first.updated_at });
    await switchTo(agent);
    assert.equal((await db.query('select id from reply_templates')).rows.length, 0);
    await switchTo(admin);
    assert.equal((await db.query('select id from reply_templates')).rows.length, 1);
  }));
  await check('even admin cannot bypass template validation with direct table writes', () => asUser(admin, () => assert.rejects(db.query("insert into reply_templates(id,title,category,content,created_by,updated_by) values($1,'Direct','계정','Direct template',$2,$2)", [templateId, admin]), /permission denied/)));
  await check('template invalid input is rejected by database', () => asUser(admin, () => assert.rejects(save({ ...content, title: '  ' }), /입력값/)));

  await db.query("insert into tickets(id,title,content,category,customer_id,assignee_id) values($1,'Feedback test','Please help with an account issue','account',$2,$3)", [ticketId, customer, agent]);
  await check('unanswered ticket cannot receive feedback', () => asUser(customer, () => assert.rejects(rate(templateId), /최신 답변/)));
  for (const [actor, label] of [[agent, 'agent'], [admin, 'admin'], [other, 'other customer']]) {
    await check(`${label} cannot submit feedback for this customer`, () => asUser(agent, async () => {
      const answer = await reply(); await switchTo(actor);
      await assert.rejects(rate(answer.id), /고객 계정|접근 권한/);
    }));
  }
  await check('helpful feedback and retry preserve resolved state and record once', () => asUser(agent, async () => {
    const answer = await reply(); await switchTo(customer);
    const first = await rate(answer.id); const second = await rate(answer.id);
    assert.deepEqual(first, second); assert.equal(first.responder_id, agent);
    assert.equal((await state()).status, 'resolved');
    assert.equal((await db.query('select id from ticket_feedback where ticket_id=$1', [ticketId])).rows.length, 1);
    await db.exec('reset role');
    assert.equal((await db.query("select id from ticket_logs where ticket_id=$1 and action='customer_feedback_submitted'", [ticketId])).rows.length, 1);
  }));
  await check('negative feedback reopens once, retains assignee, starts response clock and notifies', () => asUser(agent, async () => {
    const answer = await reply(); await switchTo(customer);
    const first = await rate(answer.id, false, '여전히 로그인이 되지 않아요.');
    assert.deepEqual(await rate(answer.id, false, first.comment), first);
    const ticket = await state(); assert.equal(ticket.status, 'open'); assert.equal(ticket.assignee_id, agent); assert(ticket.response_started_at);
    const messages = (await db.query('select content,author_role,is_internal from ticket_replies where ticket_id=$1 order by reply_order', [ticketId])).rows;
    assert.equal(messages.length, 2); assert.equal(messages[1].author_role, 'customer'); assert.equal(messages[1].is_internal, false); assert(messages[1].content.includes(first.comment));
    await db.exec('reset role');
    assert.equal((await db.query("select id from support_notifications where ticket_id=$1 and recipient_id=$2 and kind='customer_message'", [ticketId, agent])).rows.length, 1);
  }));
  await check('customer cannot overwrite an existing evaluation', () => asUser(agent, async () => {
    const answer = await reply(); await switchTo(customer); await rate(answer.id);
    await assert.rejects(rate(answer.id, false, '해결되지 않았어요.'), /이미 등록/);
  }));
  await check('negative feedback requires an explanation in the database', () => asUser(agent, async () => {
    const answer = await reply(); await switchTo(customer);
    await assert.rejects(rate(answer.id, false, '  '), /3자 이상/);
  }));
  await check('old public answer cannot be rated after a newer staff answer', () => asUser(agent, async () => {
    const old = await reply(); await reply('다시 안내드립니다.'); await switchTo(customer);
    await assert.rejects(rate(old.id), /최신 답변/);
  }));
  await check('customer followup prevents rating the previous answer', () => asUser(agent, async () => {
    const old = await reply(); await switchTo(customer); await reply('아직 문제가 남아 있어요.');
    await assert.rejects(rate(old.id), /최신 답변/);
  }));
  await check('internal note does not replace latest eligible public answer', () => asUser(agent, async () => {
    const answer = await reply(); await reply('내부 검토 사항입니다.', true); await switchTo(customer);
    assert.equal((await rate(answer.id)).reply_id, answer.id);
  }));
  await check('new staff response can be evaluated again after reopening', () => asUser(agent, async () => {
    const first = await reply(); await switchTo(customer); await rate(first.id, false, '다시 확인 부탁드립니다.');
    await switchTo(agent); const second = await reply('수정된 내용을 다시 안내드립니다.');
    await switchTo(customer); await rate(second.id, true, '이제 해결됐어요.');
    assert.equal((await db.query('select id from ticket_feedback where ticket_id=$1', [ticketId])).rows.length, 2);
    assert.equal((await state()).status, 'resolved');
  }));
  await check('feedback can reopen a closed ticket with a staff answer', () => asUser(agent, async () => {
    const answer = await reply(); await db.query("select support_ticket_command($1,'update','{\"status\":\"closed\"}')", [ticketId]);
    await switchTo(customer); await rate(answer.id, false, '다시 문의할 내용이 있습니다.');
    assert.equal((await state()).status, 'open');
  }));
  await check('feedback list and statistics are scoped to current ticket access', () => asUser(agent, async () => {
    const answer = await reply(); await switchTo(customer); await rate(answer.id);
    for (const actor of [customer, agent, admin]) {
      await switchTo(actor);
      assert.equal((await db.query('select id from ticket_feedback where ticket_id=$1', [ticketId])).rows.length, 1);
      assert.equal((await db.query('select support_feedback_stats() result')).rows[0].result.total, 1);
    }
    await switchTo(other);
    assert.equal((await db.query('select id from ticket_feedback')).rows.length, 0);
    assert.equal((await db.query('select support_feedback_stats() result')).rows[0].result.total, 0);
    await db.exec('reset role'); await db.query('update tickets set assignee_id=null where id=$1', [ticketId]); await db.exec('set local role authenticated'); await switchTo(agent);
    assert.equal((await db.query('select id from ticket_feedback')).rows.length, 0);
  }));
  await check('feedback cannot be inserted directly even by admin', () => asUser(admin, () => assert.rejects(db.query("insert into ticket_feedback(ticket_id,reply_id,customer_id,responder_id,helpful) values($1,$1,$2,$3,true)", [ticketId, customer, agent]), /permission denied/)));
  await check('audit failure rolls back negative rating, reopen, message and notification together', () => asUser(agent, async () => {
    const answer = await reply(); await switchTo(customer);
    await db.exec(`reset role; create function public.fail_feedback_log() returns trigger language plpgsql as $$begin if new.action='customer_feedback_submitted' then raise exception 'feedback audit failure'; end if; return new; end $$; create trigger fail_feedback_log before insert on ticket_logs for each row execute function public.fail_feedback_log(); set local role authenticated; savepoint attempt;`);
    await assert.rejects(rate(answer.id, false, '다시 확인해야 합니다.'), /feedback audit failure/);
    await db.exec('rollback to savepoint attempt');
    assert.equal((await state()).status, 'resolved');
    assert.equal((await db.query('select id from ticket_feedback where ticket_id=$1', [ticketId])).rows.length, 0);
    assert.equal((await db.query('select id from ticket_replies where ticket_id=$1', [ticketId])).rows.length, 1);
    await db.exec('reset role');
    assert.equal((await db.query("select id from support_notifications where ticket_id=$1 and kind='customer_message'", [ticketId])).rows.length, 0);
  }));
}
