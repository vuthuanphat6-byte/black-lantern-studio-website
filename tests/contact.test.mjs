import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContact } from "../server/validation.mjs";
const valid = {
  name: "Người kiểm thử",
  email: "dev@example.com",
  topic: "feedback",
  message: "Đây là nội dung kiểm thử đủ độ dài.",
};
test("accepts and normalizes a valid contact", () => {
  assert.equal(
    validateContact({ ...valid, name: "  Nguyễn An  " }).value.name,
    "Nguyễn An",
  );
});
test("rejects injected email headers", () => {
  assert.ok(
    validateContact({ ...valid, email: "a@b.com\r\nBcc: other@example.com" })
      .error,
  );
});
test("rejects invalid topic, honeypot and oversize text", () => {
  for (const change of [
    { topic: "admin" },
    { website: "spam" },
    { message: "x".repeat(5001) },
  ])
    assert.ok(validateContact({ ...valid, ...change }).error);
});
test("rejects missing fields and wrong data types", () => {
  for (const input of [null, [], {}, { ...valid, name: {} }])
    assert.ok(validateContact(input).error);
});
