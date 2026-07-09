const jwt = require('jsonwebtoken');
const ApiError = require('../utils/api.error');
const env = require('../config/env');
const authClientService = require('../services/auth/auth-client.service');

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError('Authentication failed: Bearer access token missing.', 401));
    }

    // Verify token validity against our locked down access secret configuration keys
    const decoded = jwt.verify(token, env.jwtAccessSecret);

    if (decoded.type && decoded.type !== 'access') {
      return next(new ApiError('Invalid access token type.', 401));
    }

    const authUser = await authClientService.getCurrentUser(token);

    if (authUser) {
      if (String(authUser.id) !== String(decoded.userId)) {
        return next(new ApiError('Authenticated user mismatch.', 401));
      }

      if (normalizeRole(authUser.role) !== normalizeRole(decoded.role)) {
        return next(new ApiError('Role mismatch for authenticated user.', 403));
      }

      if (authUser.accountStatus && authUser.accountStatus !== 'ACTIVE') {
        return next(new ApiError(`Account is ${String(authUser.accountStatus).toLowerCase()}.`, 403));
      }
    }

    // Context hydration loop
    req.user = {
      userId: decoded.userId,
      role: normalizeRole(decoded.role),
      phone: decoded.phone,
      ...(authUser || {})
    };
    req.user.role = normalizeRole(req.user.role);
    req.auth = decoded;
    req.accessToken = token;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError('Authentication token signature is expired or malformed.', 401));
  }
};

module.exports = authenticate;
