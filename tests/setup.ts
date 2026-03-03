import "@testing-library/jest-dom/vitest";

// Fix jose realm boundary issue: jsdom replaces globalThis.TextEncoder with its own
// implementation whose Uint8Array instances don't pass native instanceof checks.
// Restore the native Node.js TextEncoder so jose's internal encoding works correctly.
import { TextEncoder, TextDecoder } from "util";
Object.assign(globalThis, { TextEncoder, TextDecoder });

// Set test environment variables before any module loads
process.env.JWT_SECRET = "test-secret-key-minimum-32-characters!!";
process.env.AUTH_PASSWORD = "testpassword123";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
