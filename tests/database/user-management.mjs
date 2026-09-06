import assert from 'node:assert/strict';

export async function runUserManagementTests({ db, check, asUser, customer, agent, admin, other }) {
  const change = (id, role) => db.query('select admin_change_user_role($1,$2) as result', [id, role]);
  await check('customers cannot grant roles through RPC', () => asUser(customer, async () => {
    await assert.rejects(change(other, 'admin'), /관리자만/);
  }));
  await check('agents cannot grant roles through RPC', () => asUser(agent, async () => {
    await assert.rejects(change(other, 'admin'), /관리자만/);
  }));
  await check('anonymous users cannot call user management', () => asUser('', async () => {
    await assert.rejects(change(other, 'admin'), /permission denied/);
  }, 'anon'));
  await check('private helper cannot spoof an admin actor', () => asUser(customer, async () => {
    await assert.rejects(db.query('select supportflow_private.manage_user_role($1,$2,$3,false)', [admin, other, 'admin']), /관리자만/);
  }));
  await check('authenticated users cannot call account finalization', () => asUser(admin, async () => {
    await assert.rejects(db.query('select admin_finalize_user($1,$2,$3)', [admin, other, 'admin']), /permission denied/);
  }));
  await check('admin cannot remove their own admin role', () => asUser(admin, async () => {
    await assert.rejects(change(admin, 'customer'), /본인의 역할/);
  }));
  await check('assigned agent cannot lose ticket access through a role change', () => asUser(admin, async () => {
    await assert.rejects(change(agent, 'customer'), /이관/);
  }));
  await check('admin role change persists the target role and audit together', () => asUser(admin, async () => {
    await change(other, 'admin');
    const { rows } = await db.query('select role from profiles where id=$1', [other]);
    assert.equal(rows[0].role, 'admin');
    const audit = await db.query('select * from user_management_events where target_id=$1', [other]);
    assert.equal(audit.rows[0].actor_id, admin);
    assert.equal(audit.rows[0].previous_role, 'customer');
    assert.equal(audit.rows[0].next_role, 'admin');
  }));
  await check('stale admin sessions are rechecked inside the database', () => asUser(admin, async () => {
    await change(other, 'admin');
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [other]);
    await change(admin, 'customer');
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [admin]);
    await assert.rejects(change(other, 'customer'), /관리자만/);
  }));
  await check('service-created customer also has a creation audit record', () => asUser('', async () => {
    await db.query('select admin_finalize_user($1,$2,$3)', [admin, other, 'customer']);
    const { rows } = await db.query('select action,previous_role from user_management_events where target_id=$1', [other]);
    assert.equal(rows[0].action, 'user_created');
    assert.equal(rows[0].previous_role, null);
  }, 'service_role'));
  await check('finalization rejects an actor who is no longer admin', () => asUser('', async () => {
    await assert.rejects(db.query('select admin_finalize_user($1,$2,$3)', [customer, other, 'admin']), /관리자만/);
  }, 'service_role'));
  await check('non-admin cannot read user management audit records', () => asUser(customer, async () => {
    const { rows } = await db.query('select * from user_management_events');
    assert.equal(rows.length, 0);
  }));
  await check('admins cannot forge audit records directly', () => asUser(admin, async () => {
    await assert.rejects(db.query("insert into user_management_events(target_email,action,next_role) values ('fake@test.com','user_created','admin')"), /permission denied/);
  }));
}
