// Existing workflow fixtures send replies against the conversation they just read.
// Collision tests intentionally bypass this helper and supply stale/missing versions.
export async function versionedReply(db, ticketId, action, payload) {
  if (action !== 'reply' || payload.expectedReplyOrder !== undefined) return payload;
  const { rows } = await db.query('select coalesce(max(reply_order),0)::float8 n from ticket_replies where ticket_id=$1 and not is_internal', [ticketId]);
  return { ...payload, expectedReplyOrder: rows[0].n };
}
