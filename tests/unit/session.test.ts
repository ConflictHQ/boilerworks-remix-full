import { describe, it, expect } from "vitest";
import crypto from "crypto";

// Test the token hashing function directly (same logic as session.server.ts)
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

describe("session token hashing", () => {
  it("produces a 64-character hex string", () => {
    const token = crypto.randomUUID();
    const hash = hashToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces deterministic output for the same input", () => {
    const token = "test-token-value";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
  });

  it("produces different output for different input", () => {
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });
});
