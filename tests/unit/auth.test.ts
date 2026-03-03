import { describe, it, expect, vi } from "vitest";
import { createHmac } from "node:crypto";

// Mock jose with a native Node.js crypto implementation to avoid
// jsdom/Vitest realm boundary issues with TextEncoder/Uint8Array instanceof checks.
vi.mock("jose", async () => {
  function base64url(str: string): string {
    return Buffer.from(str).toString("base64url");
  }
  function decodeBase64url(str: string): string {
    return Buffer.from(str, "base64url").toString();
  }

  return {
    SignJWT: class {
      private _payload: Record<string, unknown>;
      private _exp?: number;

      constructor(payload: Record<string, unknown>) {
        this._payload = { ...payload };
      }

      setProtectedHeader() { return this; }

      setIssuedAt() {
        this._payload.iat = Math.floor(Date.now() / 1000);
        return this;
      }

      setExpirationTime(exp: number | string) {
        if (typeof exp === "string" && exp === "7d") {
          this._payload.exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
        } else if (typeof exp === "number") {
          this._payload.exp = exp;
        }
        return this;
      }

      async sign(key: Uint8Array) {
        const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const body = base64url(JSON.stringify(this._payload));
        const input = `${header}.${body}`;
        const sig = createHmac("sha256", Buffer.from(key)).update(input).digest("base64url");
        return `${input}.${sig}`;
      }
    },

    jwtVerify: async (token: string, key: Uint8Array) => {
      const parts = token.split(".");
      if (parts.length !== 3) throw Object.assign(new Error("Invalid JWT"), { code: "ERR_JWS_INVALID" });

      const [header, body, sig] = parts;
      const expectedSig = createHmac("sha256", Buffer.from(key)).update(`${header}.${body}`).digest("base64url");
      if (sig !== expectedSig) {
        throw Object.assign(new Error("signature verification failed"), { code: "ERR_JWS_INVALID" });
      }

      const payload = JSON.parse(decodeBase64url(body)) as Record<string, unknown>;
      const now = Math.floor(Date.now() / 1000);
      if (typeof payload.exp === "number" && payload.exp < now) {
        throw Object.assign(new Error("JWTExpired"), { code: "ERR_JWT_EXPIRED" });
      }
      return { payload };
    },
  };
});

// JWT_SECRET is set in tests/setup.ts
import { signToken, verifyToken } from "@/lib/auth";

const TEST_SECRET = "test-secret-key-minimum-32-characters!!";

describe("signToken", () => {
  it("gera string JWT válida", async () => {
    const token = await signToken({ authenticated: true });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("token contém o payload passado", async () => {
    const token = await signToken({ userId: "123", role: "admin" });
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("123");
    expect(payload!.role).toBe("admin");
  });
});

describe("verifyToken", () => {
  it("valida token gerado por signToken", async () => {
    const token = await signToken({ authenticated: true });
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.authenticated).toBe(true);
  });

  it("retorna null para token com secret diferente", async () => {
    // Create a token manually with a different secret
    function base64url(str: string) { return Buffer.from(str).toString("base64url"); }
    const differentSecret = Buffer.from("completely-different-secret-32ch!!");
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = base64url(JSON.stringify({ test: true, exp: Math.floor(Date.now() / 1000) + 3600 }));
    const input = `${header}.${body}`;
    const sig = createHmac("sha256", differentSecret).update(input).digest("base64url");
    const tokenWithDiffSecret = `${input}.${sig}`;

    expect(await verifyToken(tokenWithDiffSecret)).toBeNull();
  });

  it("retorna null para token expirado", async () => {
    function base64url(str: string) { return Buffer.from(str).toString("base64url"); }
    const secret = Buffer.from(TEST_SECRET);
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    // Expired 60 seconds ago
    const body = base64url(JSON.stringify({ expired: true, exp: Math.floor(Date.now() / 1000) - 60 }));
    const input = `${header}.${body}`;
    const sig = createHmac("sha256", secret).update(input).digest("base64url");
    const expiredToken = `${input}.${sig}`;

    expect(await verifyToken(expiredToken)).toBeNull();
  });

  it("retorna null para string aleatória", async () => {
    expect(await verifyToken("not-a-jwt-string")).toBeNull();
  });

  it("retorna null para string vazia", async () => {
    expect(await verifyToken("")).toBeNull();
  });
});
