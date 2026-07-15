const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

function getBearerToken(req) {
  const authorization = req.get("authorization");
  if (!authorization) {
    throw new ApiError(401, "Authorization header is required.");
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Invalid authorization header format.");
  }

  return token;
}

function verifyAuthenticationToken(req, res, next) {
  try {
    const token = getBearerToken(req);
    const payload = jwt.verify(token, env.auth.accessSecret, {
      issuer: env.auth.issuer,
      audience: env.auth.audience
    });

    if (payload.type && payload.type !== "access") {
      throw new ApiError(401, "Invalid access token type.");
    }

    req.auth = payload;
    req.user = {
      id: payload.userId || payload.sub,
      role: payload.role
    };

    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError(401, "Invalid or expired access token."));
  }
}

function enforceUserRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to access this resource."));
    }

    return next();
  };
}

module.exports = {
  verifyAuthenticationToken,
  enforceUserRole
};
