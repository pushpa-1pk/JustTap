const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const authClientService = require("../services/auth-client.service");

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    throw new ApiError(401, "Authorization header is required.");
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Invalid authorization header format.");
  }

  return token;
};

const verifyToken = async (req, res, next) => {
  try {
    const token = getBearerToken(req.get("authorization"));
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (payload.type !== "access") {
      throw new ApiError(401, "Invalid access token type.");
    }

    const authUser = await authClientService.getCurrentUser(token);

    if (authUser) {
      if (authUser.id !== payload.userId) {
        throw new ApiError(401, "Authenticated user mismatch.");
      }

      if (authUser.role !== payload.role) {
        throw new ApiError(403, "Role mismatch for authenticated user.");
      }

      if (authUser.accountStatus && authUser.accountStatus !== "ACTIVE") {
        throw new ApiError(
          403,
          `Account is ${String(authUser.accountStatus).toLowerCase()}.`
        );
      }
    } else if (env.AUTH_USER_LOOKUP_REQUIRED) {
      throw new ApiError(503, "Unable to validate authenticated user.");
    }

    req.user = {
      id: payload.userId,
      phone: payload.phone,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
      ...(authUser || {}),
    };
    req.auth = payload;
    req.accessToken = token;

    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError(401, "Invalid or expired access token."));
  }
};

const verifyRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to access this resource.")
      );
    }

    return next();
  };
};

const optionalVerifyToken = async (req, res, next) => {
  if (!req.get("authorization")) {
    return next();
  }

  return verifyToken(req, res, next);
};

module.exports = {
  verifyToken,
  verifyRole,
  optionalVerifyToken,
};
