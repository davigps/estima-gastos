import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";

// JWT_SECRET is set in tests/setup.ts before this module loads
import { signToken, verifyToken } from "@/lib/auth";

const TEST_SECRET = "test-secret-key-minimum-32-characters!!";
const secret = new TextEncoder().encode(TEST_SECRET);

describe("signToken", () => {
  it("gera string JWT válida", async () => {
    const token = await signToken({ authenticated: true });
    expect(typeof token).toBe("string");
    // JWT has 3 parts separated by dots
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
    const differentSecret = new TextEncoder().encode("completely-different-secret-32ch!!");
    const tokenWithDiffSecret = await new SignJWT({ test: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(differentSecret);
    expect(await verifyToken(tokenWithDiffSecret)).toBeNull();
  });

  it("retorna null para token expirado", async () => {
    // Create a token that is already expired (exp = 60s ago)
    const expiredToken = await new SignJWT({ expired: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(secret);
    expect(await verifyToken(expiredToken)).toBeNull();
  });

  it("retorna null para string aleatória", async () => {
    expect(await verifyToken("not-a-jwt-string")).toBeNull();
  });

  it("retorna null para string vazia", async () => {
    expect(await verifyToken("")).toBeNull();
  });
});
