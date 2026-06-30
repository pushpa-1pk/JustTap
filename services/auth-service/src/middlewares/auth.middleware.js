const jwtService = require("../services/jwt.service");
const tokenBlacklistService = require("../services/token-blacklist.service");
const sessionService = require("../services/session.service");
const userRepository = require("../repositories/user.repository");
const ApiError = require("../utils/ApiError");
const { ACCOUNT_STATUS } = require("../utils/constants");

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

const authenticate = async (req, res, next) => {
  try {
    const token = getBearerToken(req.get("authorization"));
    const payload = jwtService.verifyAccessToken(token);

    if (await tokenBlacklistService.isBlacklisted(payload.jti)) {
      return next(new ApiError(401, "Access token has been revoked."));
    }

    const user = await userRepository.findById(payload.userId);

    if (!user) {
      return next(new ApiError(401, "User not found."));
    }

    if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
      return next(
        new ApiError(
          403,
          `Account is ${user.accountStatus.toLowerCase()}.`
        )
      );
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return next(new ApiError(401, "Access token has been revoked."));
    }

    if (payload.deviceId) {
      const activeSession = await sessionService.getByUserAndDevice(
        user._id,
        payload.deviceId
      );

      if (!activeSession) {
        return next(new ApiError(401, "Session is no longer active."));
      }
    }

    req.user = user;
    req.auth = payload;
    req.accessToken = token;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError(401, "Invalid or expired access token."));
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "You do not have permission to access this resource."
        )
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
