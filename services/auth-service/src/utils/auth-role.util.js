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

const getUserRoles = (user) => {
  const roles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : [user.role];

  return [...new Set(roles.filter(Boolean))];
};

const resolveExistingUserRole = (user, requestedRole) => {
  const userRoles = getUserRoles(user);

  if (!requestedRole) {
    return user.role || userRoles[0] || USER_ROLES.CUSTOMER;
  }

  if (!SIGNUP_ROLES.includes(requestedRole)) {
    throw new Error("Invalid login role.");
  }

  return requestedRole;
};

module.exports = {
  getAllowedSignupRoles,
  resolveSignupRole,
  getUserRoles,
  resolveExistingUserRole,
};
