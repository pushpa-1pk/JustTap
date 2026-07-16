const jwt = require("jsonwebtoken");
const config = require("../config/env");
const ApiError = require("../utils/apiError");

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

const authMiddleware = (req, res, next) => {
  try {
    const token = getBearerToken(req.get("authorization"));
    const payload = jwt.verify(token, config.jwt.secret);

    req.user = {
      id: payload.userId || payload.id || payload.sub,
      role: String(payload.role || "").toLowerCase(),
      phone: payload.phone || null,
    };

    if (!req.user.id) {
      throw new ApiError(401, "Authenticated token payload is missing user identity.");
    }

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
  const allowedRoles = (Array.isArray(roles) ? roles : [roles]).map((role) =>
    String(role).toLowerCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required."));
    }

    if (!allowedRoles.includes(String(req.user.role || "").toLowerCase())) {
      return next(new ApiError(403, "You do not have permission to access this resource."));
    }

    return next();
  };
};

module.exports = authMiddleware;
module.exports.verifyRole = verifyRole;
