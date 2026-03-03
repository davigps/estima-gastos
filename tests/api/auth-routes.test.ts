import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock @/lib/auth to avoid jose's realm boundary issue in Vitest/jsdom.
// The auth unit tests (auth.test.ts) cover the JWT logic separately.
const mockSignToken = vi.hoisted(() => vi.fn().mockResolvedValue("mock-jwt-token"));
vi.mock("@/lib/auth", () => ({
  signToken: mockSignToken,
  verifyToken: vi.fn(),
}));

import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";

// AUTH_PASSWORD is set in tests/setup.ts
describe("POST /api/auth/login", () => {
  it("senha correta → status 200, { ok: true }, set-cookie session", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: "testpassword123" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await login(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ ok: true });

    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("session=");
    // mockSignToken was called and its return value used as the cookie value
    expect(cookie).toContain("mock-jwt-token");
  });

  it("senha incorreta → status 401, { error: 'Senha incorreta' }", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: "wrong-password" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await login(req);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("Senha incorreta");
  });

  it("body sem password → status 401", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await login(req);
    expect(response.status).toBe(401);
  });

  // Nota de segurança: não há rate limiting — potencial brute force (melhoria futura).
});

describe("POST /api/auth/logout", () => {
  it("retorna 200 com { ok: true }", async () => {
    const response = await logout();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it("cookie session definido com maxAge=0", async () => {
    const response = await logout();
    const cookie = response.headers.get("set-cookie");
    expect(cookie?.toLowerCase()).toContain("max-age=0");
  });
});
