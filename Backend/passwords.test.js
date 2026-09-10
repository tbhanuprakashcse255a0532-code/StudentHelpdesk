import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword } from "./hash-password.js";
import { verifyPassword } from "./auth.js";
test("Argon2 hashes accept correct passwords and reject wrong passwords", async () => {
  const hash = await hashPassword("test-only-password");
  assert.equal(await verifyPassword(hash, "test-only-password"), true);
  assert.equal(await verifyPassword(hash, "wrong"), false);
  assert.equal(await verifyPassword("invalid", "test-only-password"), false);
});

