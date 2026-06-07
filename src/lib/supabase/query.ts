/*
 * Supabase reads return `{ data, error }`. The codebase repeatedly did
 * `const { data } = await builder; use(data ?? [])`, which drops `error` on the
 * floor — a failed query (e.g. a renamed/dropped column) silently became an
 * empty-but-valid result. That shipped a broken Master Roadmap to production and
 * hid behind a 1h cache.
 *
 * These helpers are the single place a read result is unwrapped. They throw on
 * `error` so failures surface, but still return `[]` / `null` for a legitimately
 * empty result — so empty-result behaviour is unchanged, only failures stop being
 * swallowed. Pass a short `context` so the thrown message names the read.
 */

type PgListResult<Row> = PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
type PgMaybeResult<Row> = PromiseLike<{ data: Row | null; error: { message: string } | null }>;
type PgCountResult = PromiseLike<{ count: number | null; error: { message: string } | null }>;

export async function query<Row>(builder: PgListResult<Row>, context: string): Promise<Row[]> {
  const { data, error } = await builder;
  if (error) throw new Error(`Supabase read failed [${context}]: ${error.message}`);
  return data ?? [];
}

export async function queryMaybe<Row>(builder: PgMaybeResult<Row>, context: string): Promise<Row | null> {
  const { data, error } = await builder;
  if (error) throw new Error(`Supabase read failed [${context}]: ${error.message}`);
  return data;
}

export async function queryCount(builder: PgCountResult, context: string): Promise<number> {
  const { count, error } = await builder;
  if (error) throw new Error(`Supabase count failed [${context}]: ${error.message}`);
  return count ?? 0;
}
