import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Supabase mock factory ---
function makeSupabaseMock({
  user = null as { id: string } | null,
  upsertError = null as { message: string } | null,
  deleteError = null as { message: string } | null,
} = {}) {
  const upsertMock = vi.fn().mockResolvedValue({ error: upsertError });
  const deleteMock = vi.fn().mockResolvedValue({ error: deleteError });

  // chainable builder for .from().upsert() and .from().delete().eq().eq()
  const eqDeleteBuilder = {
    eq: vi.fn().mockReturnThis(),
  };
  // make the last eq resolve
  eqDeleteBuilder.eq.mockImplementation(function (this: typeof eqDeleteBuilder) {
    (this as { _resolve?: () => Promise<{ error: null }> })._resolve = () => deleteMock();
    return {
      eq: vi.fn().mockImplementation(() => deleteMock()),
    };
  });

  const fromMock = vi.fn().mockReturnValue({
    upsert: upsertMock,
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: deleteError }),
      }),
    }),
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: fromMock,
  };
}

// --- helpers ---
function makeRequest(body: unknown, method = "POST") {
  return new NextRequest("http://localhost/api/resources/completions", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/resources/completions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    const supabase = makeSupabaseMock({ user: null });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { POST } = await import("../resources/completions/route");
    const res = await POST(makeRequest({ resourceId: "res-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 and upserts when authenticated", async () => {
    const user = { id: "user-abc" };
    const supabase = makeSupabaseMock({ user });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { POST } = await import("../resources/completions/route");
    const res = await POST(makeRequest({ resourceId: "res-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    // Verify upsert was called with correct args
    const fromCall = supabase.from.mock.calls[0];
    expect(fromCall[0]).toBe("user_resource_completions");
    const upsertCall = supabase.from.mock.results[0].value.upsert.mock.calls[0];
    expect(upsertCall[0]).toMatchObject({ user_id: "user-abc", resource_id: "res-1" });
  });

  it("is idempotent — duplicate mark returns 200 without error", async () => {
    const user = { id: "user-abc" };
    // Upsert with onConflict does not return error on duplicate
    const supabase = makeSupabaseMock({ user, upsertError: null });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { POST } = await import("../resources/completions/route");
    const res1 = await POST(makeRequest({ resourceId: "res-1" }));
    expect(res1.status).toBe(200);

    vi.resetModules();
    const supabase2 = makeSupabaseMock({ user, upsertError: null });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase2),
    }));
    const { POST: POST2 } = await import("../resources/completions/route");
    const res2 = await POST2(makeRequest({ resourceId: "res-1" }));
    expect(res2.status).toBe(200);
  });

  it("returns 400 for missing resourceId", async () => {
    const user = { id: "user-abc" };
    const supabase = makeSupabaseMock({ user });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { POST } = await import("../resources/completions/route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/resources/completions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    const supabase = makeSupabaseMock({ user: null });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { DELETE } = await import("../resources/completions/route");
    const res = await DELETE(makeRequest({ resourceId: "res-1" }, "DELETE"));
    expect(res.status).toBe(401);
  });

  it("returns 200 and deletes row when authenticated", async () => {
    const user = { id: "user-abc" };
    const supabase = makeSupabaseMock({ user });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { DELETE } = await import("../resources/completions/route");
    const res = await DELETE(makeRequest({ resourceId: "res-1" }, "DELETE"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 200 even when row did not exist (delete is idempotent)", async () => {
    const user = { id: "user-abc" };
    // Supabase DELETE on non-existent row returns no error
    const supabase = makeSupabaseMock({ user, deleteError: null });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { DELETE } = await import("../resources/completions/route");
    const res = await DELETE(makeRequest({ resourceId: "nonexistent" }, "DELETE"));
    expect(res.status).toBe(200);
  });
});

describe("Migration file", () => {
  it("migration SQL file exists and has correct schema", async () => {
    const { existsSync, readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { resolve, dirname } = await import("node:path");

    const dir = dirname(fileURLToPath(import.meta.url));
    const migrationPath = resolve(dir, "../../../../supabase/migrations/20260604_user_resource_completions.sql");

    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.user_resource_completions");
    expect(sql).toContain("user_id");
    expect(sql).toContain("resource_id");
    expect(sql).toContain("completed_at");
    expect(sql).toContain("PRIMARY KEY (user_id, resource_id)");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("auth.uid()");
  });
});
