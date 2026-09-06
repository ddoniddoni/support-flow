/** Bound untrusted URL pagination before passing it to PostgREST. */
export function normalizePagination(page = 1, pageSize = 10) {
  return {
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100_000) : 1,
    pageSize: Number.isSafeInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 10,
  };
}

/** Fetch every page for aggregate views; Supabase limits a single response. */
export async function collectPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const { data, error } = await fetchPage(from, from + size - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < size) return rows;
  }
}
