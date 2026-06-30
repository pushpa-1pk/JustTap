const { USER_ROLES } = require("./constants");

const SIGNUP_ROLES = [
  USER_ROLES.CUSTOMER,
  USER_ROLES.PROVIDER,
];

const getAllowedSignupRoles = () => {
  return [...SIGNUP_ROLES];
};

const resolveSignupRole = (role) => {
  if (!role) {
    throw new Error("Role is required for new registration.");
  }

  if (!SIGNUP_ROLES.includes(role)) {
    throw new Error("Invalid signup role.");
  }

  return role;
};

const assertExistingUserRole = (user, requestedRole) => {
  if (!requestedRole) {
    return;
  }

  if (user.role !== requestedRole) {
    throw new Error(
      `This phone number is already registered as ${user.role}.`
    );
  }
};

module.exports = {
  getAllowedSignupRoles,
  resolveSignupRole,
  assertExistingUserRole,
};
