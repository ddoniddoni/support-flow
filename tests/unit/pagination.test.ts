import assert from "node:assert/strict";
import { test } from "node:test";
import { collectPages, normalizePagination } from "@/lib/data/pagination";

test("invalid URL pagination cannot produce negative or unbounded ranges", () => {
  for (const value of [NaN, Infinity, -1, 0, 1.5]) {
    assert.deepEqual(normalizePagination(value, value), { page: 1, pageSize: 10 });
  }
  assert.deepEqual(normalizePagination(2, 7), { page: 2, pageSize: 7 });
  assert.deepEqual(normalizePagination(1_000_000, 10_000), { page: 100_000, pageSize: 100 });
});

test("aggregates include rows beyond the Supabase response limit", async () => {
  const rows = Array.from({ length: 1234 }, (_, id) => ({ id }));
  const calls: [number, number][] = [];
  const result = await collectPages(async (from, to) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  });
  assert.deepEqual(result, rows);
  assert.deepEqual(calls, [[0,499],[500,999],[1000,1499]]);
});

test("aggregate failures never masquerade as partial success", async () => {
  await assert.rejects(collectPages(async (from) => from === 0
    ? { data: Array(500).fill({ id: 1 }), error: null }
    : { data: null, error: new Error("network failure") }), /network failure/);
});
