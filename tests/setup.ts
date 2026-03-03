import "@testing-library/jest-dom/vitest";

// Set test environment variables before any module loads
process.env.JWT_SECRET = "test-secret-key-minimum-32-characters!!";
process.env.AUTH_PASSWORD = "testpassword123";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
