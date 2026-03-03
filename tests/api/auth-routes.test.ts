import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// AUTH_PASSWORD and JWT_SECRET are set in tests/setup.ts

describe("POST /api/auth/login", () => {
  // Import inside test to ensure env vars are set before module loads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let login: (req: NextRequest) => Promise<any>;

  beforeEach(async () => {
    vi.resetModules();
    process.env.AUTH_PASSWORD = "testpassword123";
    const mod = await import("@/app/api/auth/login/route");
    login = mod.POST;
  });

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
    const { POST: logout } = await import("@/app/api/auth/logout/route");
    const response = await logout();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it("cookie session definido com maxAge=0", async () => {
    const { POST: logout } = await import("@/app/api/auth/logout/route");
    const response = await logout();
    const cookie = response.headers.get("set-cookie");
    expect(cookie?.toLowerCase()).toContain("max-age=0");
  });
});
