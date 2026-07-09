const ApiError = require('../utils/api.error');

/**
 * Restricts route invocation to specified administrative or operational personas
 * @param {...string} roles - Permitted user type tokens (CUSTOMER/PROVIDER/ADMIN)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError('Access Denied: Your account role does not have authorization to perform this action.', 403));
    }
    next();
  };
};

module.exports = authorize;