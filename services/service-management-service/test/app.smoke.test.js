const test = require("node:test");
const assert = require("node:assert/strict");

test("app module loads", () => {
  const app = require("../src/app");
  assert.equal(typeof app, "function");
});
