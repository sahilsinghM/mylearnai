import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Supabase mock factory ---
function makeSupabaseMock({
  user = null as { id: string } | null,
  session = undefined as Record<string, unknown> | undefined | null,
  dbError = null as { message: string } | null,
} = {}) {
  const singleMock = vi.fn().mockResolvedValue({ data: session ?? null, error: dbError });

  const eqUserMock = vi.fn().mockReturnValue({ single: singleMock });
  const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
  const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });

  const fromMock = vi.fn().mockReturnValue({ select: selectMock });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: fromMock,
  };
}

function makeGetRequest(sessionId: string) {
  return new NextRequest(
    `http://localhost/api/proof/session/${sessionId}`
  );
}

describe("GET /api/proof/session/[sessionId]", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    const supabase = makeSupabaseMock({ user: null });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { GET } = await import("../proof/session/[sessionId]/route");
    const res = await GET(makeGetRequest("session-123"), {
      params: Promise.resolve({ sessionId: "session-123" }),
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when session not found", async () => {
    const user = { id: "user-abc" };
    const supabase = makeSupabaseMock({ user, session: null, dbError: { message: "not found" } });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { GET } = await import("../proof/session/[sessionId]/route");
    const res = await GET(makeGetRequest("session-123"), {
      params: Promise.resolve({ sessionId: "session-123" }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });

  it("returns 404 when session exists but gaps is null (not yet processed)", async () => {
    const user = { id: "user-abc" };
    const sessionData = {
      id: "session-123",
      gaps: null,
      acceptance_criteria: null,
      project_title: null,
      project_desc: null,
      github_url: null,
    };
    const supabase = makeSupabaseMock({ user, session: sessionData });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { GET } = await import("../proof/session/[sessionId]/route");
    const res = await GET(makeGetRequest("session-123"), {
      params: Promise.resolve({ sessionId: "session-123" }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not ready");
  });

  it("returns 200 with session data when session is ready", async () => {
    const user = { id: "user-abc" };
    const sessionData = {
      id: "session-123",
      gaps: [{ concept: "Closures", severity: "med", evidence: "Struggled with closures" }],
      acceptance_criteria: ["Must use closures"],
      project_title: "Closure Explorer",
      project_desc: "Build a project using closures",
      github_url: null,
    };
    const supabase = makeSupabaseMock({ user, session: sessionData });
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(supabase),
    }));

    const { GET } = await import("../proof/session/[sessionId]/route");
    const res = await GET(makeGetRequest("session-123"), {
      params: Promise.resolve({ sessionId: "session-123" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("session-123");
    expect(json.gaps).toHaveLength(1);
    expect(json.project_title).toBe("Closure Explorer");
  });
});
