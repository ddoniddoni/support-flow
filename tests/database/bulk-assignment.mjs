import assert from 'node:assert/strict';
export async function runBulkAssignmentTests({ db, check, asUser, customer, agent, admin }) {
  const first='30000000-0000-4000-8000-000000000001';
  const second='30000000-0000-4000-8000-000000000002';
  const missing='30000000-0000-4000-8000-000000000099';
  await db.query("insert into tickets(id,title,content,category,customer_id,status) values ($1,'Bulk first','First test inquiry with sufficient detail','other',$3,'open'),($2,'Bulk second','Second test inquiry with sufficient detail','other',$3,'closed')",[first,second,customer]);
  const assign=async(ids,target=agent)=>(await db.query('select bulk_assign_tickets($1::uuid[],$2) as result',[ids,target])).rows[0].result;
  for(const [label,actor]of [['customer',customer],['agent',agent]]) {
    await check(`${label} cannot bulk assign`,()=>asUser(actor,async()=>assert.rejects(assign([first,second]),/관리자만/)));
  }
  await check('anonymous cannot bulk assign',()=>asUser('',async()=>assert.rejects(assign([first]),/permission denied/),'anon'));
  await check('bulk assignment updates all tickets and logs each change',()=>asUser(admin,async()=>{
    assert.deepEqual(await assign([first,second]),{changed:2,unchanged:0});
    const rows=(await db.query('select assignee_id,status from tickets where id=any($1) order by id',[[first,second]])).rows;
    assert.deepEqual(rows,[{assignee_id:agent,status:'open'},{assignee_id:agent,status:'closed'}]);
    const logs=(await db.query('select actor_id,before_value,after_value from ticket_logs where ticket_id=any($1)',[[first,second]])).rows;
    assert.equal(logs.length,2);for(const log of logs){assert.equal(log.actor_id,admin);assert.equal(log.before_value,null);assert.equal(log.after_value,agent);}
  }));
  await check('repeat bulk assignment is a no-op and duplicate IDs are deduplicated',()=>asUser(admin,async()=>{
    assert.deepEqual(await assign([first,first,second]),{changed:2,unchanged:0});
    assert.deepEqual(await assign([first,second]),{changed:0,unchanged:2});
    assert.equal((await db.query('select count(*)::int as n from ticket_logs where ticket_id=any($1)',[[first,second]])).rows[0].n,2);
  }));
  await check('missing ticket prevents every assignment',()=>asUser(admin,async()=>{
    await db.exec('savepoint attempt');await assert.rejects(assign([first,missing]),/존재하지/);await db.exec('rollback to savepoint attempt');
    assert.equal((await db.query('select assignee_id from tickets where id=$1',[first])).rows[0].assignee_id,null);
  }));
  await check('bulk target must be an agent',()=>asUser(admin,async()=>assert.rejects(assign([first],customer),/상담원/)));
  await check('empty bulk selection is rejected',()=>asUser(admin,async()=>assert.rejects(assign([]),/1건 이상/)));
  await check('oversized bulk selection is rejected',()=>asUser(admin,async()=>assert.rejects(assign(Array(101).fill(first)),/100건 이하/)));
  await db.exec(`create function public.fail_second_bulk_log() returns trigger language plpgsql as $$ begin if new.ticket_id='${second}' then raise exception 'simulated audit failure'; end if; return new; end $$;
    create trigger fail_second_bulk_log before insert on public.ticket_logs for each row execute function public.fail_second_bulk_log();`);
  try {
    await check('failure on the second audit rolls back the entire batch',()=>asUser(admin,async()=>{
      await db.exec('savepoint attempt');await assert.rejects(assign([first,second]),/simulated audit failure/);await db.exec('rollback to savepoint attempt');
      const rows=(await db.query('select assignee_id from tickets where id=any($1)',[[first,second]])).rows;
      assert(rows.every(r=>r.assignee_id===null));
      assert.equal((await db.query('select count(*)::int as n from ticket_logs where ticket_id=any($1)',[[first,second]])).rows[0].n,0);
    }));
  } finally { await db.exec('drop trigger fail_second_bulk_log on public.ticket_logs; drop function public.fail_second_bulk_log();'); }
}
