const jwt = require("jsonwebtoken");
const axios = require("axios");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const normalizeRole = (role) => String(role || "").trim().toUpperCase();

const authClient = axios.create({
  baseURL: env.AUTH_SERVICE_URL,
  timeout: env.AUTH_USER_LOOKUP_TIMEOUT_MS,
});

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError("Authentication is required.", 401));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (decoded.type && decoded.type !== "access") {
      return next(new ApiError("Invalid access token type.", 401));
    }

    let authUser = null;
    if (env.AUTH_USER_LOOKUP_REQUIRED) {
      const response = await authClient.get("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      authUser = response.data?.data || null;

      if (!authUser || String(authUser.id) !== String(decoded.userId)) {
        return next(new ApiError("Authenticated user mismatch.", 401));
      }
    }

    const normalizedRole = normalizeRole(authUser?.role || decoded.role);

    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: normalizedRole,
      accountStatus: authUser?.accountStatus || decoded.accountStatus,
      ...(authUser || {}),
    };
    req.user.role = normalizedRole;
    req.accessToken = token;
    req.auth = decoded;

    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (error.response) {
      return next(new ApiError("Unable to validate authenticated user.", 503));
    }

    return next(new ApiError("Invalid or expired access token.", 401));
  }
};

module.exports = authenticate;
