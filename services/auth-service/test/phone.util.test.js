const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizePhoneNumber } = require("../src/utils/phone.util");

test("normalizePhoneNumber accepts local 10-digit Indian numbers", () => {
  assert.equal(normalizePhoneNumber("9876543210"), "+919876543210");
});

test("normalizePhoneNumber accepts country-code numbers without plus", () => {
  assert.equal(normalizePhoneNumber("919876543210"), "+919876543210");
});

test("normalizePhoneNumber rejects invalid numbers", () => {
  assert.throws(
    () => normalizePhoneNumber("12345"),
    /Invalid Indian phone number/
  );
});
