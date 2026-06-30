const test = require("node:test");
const assert = require("node:assert/strict");

const { USER_ROLES } = require("../src/utils/constants");
const {
  getAllowedSignupRoles,
  resolveSignupRole,
  assertExistingUserRole,
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

test("assertExistingUserRole allows matching role", () => {
  assert.doesNotThrow(() =>
    assertExistingUserRole({ role: USER_ROLES.PROVIDER }, USER_ROLES.PROVIDER)
  );
});

test("assertExistingUserRole rejects mismatched role", () => {
  assert.throws(
    () =>
      assertExistingUserRole(
        { role: USER_ROLES.CUSTOMER },
        USER_ROLES.PROVIDER
      ),
    /already registered as customer/
  );
});
