import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the admin client before importing the route.
const insertMock = vi.fn();
const profileResult = { data: null as { id: string } | null };

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({ eq: () => ({ single: async () => profileResult }) }),
        };
      }
      if (table === "categories") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ ilike: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
            }),
          }),
        };
      }
      return { insert: insertMock };
    },
  }),
}));

import { POST } from "./route";

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/quick-add", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

beforeEach(() => {
  insertMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
  profileResult.data = null;
});

describe("POST /api/quick-add", () => {
  it("rejects a missing token", async () => {
    const res = await POST(req({ amount: 10 }));
    expect(res.status).toBe(401);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid token", async () => {
    profileResult.data = null; // no matching profile
    const res = await POST(req({ amount: 10 }, { "x-siri-token": "bad" }));
    expect(res.status).toBe(401);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a non-positive amount", async () => {
    profileResult.data = { id: "user-1" };
    const res = await POST(req({ amount: 0 }, { "x-siri-token": "good" }));
    expect(res.status).toBe(400);
  });

  it("inserts a transaction for a valid token", async () => {
    profileResult.data = { id: "user-1" };
    const res = await POST(req({ amount: 12.5, note: "Lunch" }, { "x-siri-token": "good" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", amount: 12.5, type: "expense", source: "siri" })
    );
  });
});
