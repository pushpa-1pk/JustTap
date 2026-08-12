const test = require("node:test");
const assert = require("node:assert/strict");

const { USER_ROLES } = require("../src/utils/constants");
const {
  getAllowedSignupRoles,
  resolveSignupRole,
  getUserRoles,
  resolveExistingUserRole,
} = require("../src/utils/auth-role.util");

test("getAllowedSignupRoles exposes customer and provider only", () => {
  assert.deepEqual(getAllowedSignupRoles(), [
    USER_ROLES.CUSTOMER,
    USER_ROLES.PROVIDER,
  ]);
});

test("resolveSignupRole requires role for new registration", () => {
  assert.throws(
    () => resolveSignupRole(undefined),
    /Role is required for new registration/
  );
});

test("resolveSignupRole accepts provider", () => {
  assert.equal(resolveSignupRole(USER_ROLES.PROVIDER), USER_ROLES.PROVIDER);
});

test("resolveSignupRole rejects admin self signup", () => {
  assert.throws(
    () => resolveSignupRole(USER_ROLES.ADMIN),
    /Invalid signup role/
  );
});

test("getUserRoles falls back to legacy role", () => {
  assert.deepEqual(getUserRoles({ role: USER_ROLES.CUSTOMER }), [
    USER_ROLES.CUSTOMER,
  ]);
});

test("resolveExistingUserRole allows adding provider role", () => {
  assert.equal(
    resolveExistingUserRole({ role: USER_ROLES.CUSTOMER }, USER_ROLES.PROVIDER),
    USER_ROLES.PROVIDER
  );
});

test("resolveExistingUserRole rejects admin selection", () => {
  assert.throws(
    () => resolveExistingUserRole({ role: USER_ROLES.CUSTOMER }, USER_ROLES.ADMIN),
    /Invalid login role/
  );
});
