const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const env = require("../config/env");
const { parseDurationToMs } = require("../utils/duration.util");

class JwtService {
  generateAccessToken(user, overrides = {}) {
    return jwt.sign(
      this.buildPayload(user, "access", overrides),
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.ACCESS_TOKEN_EXPIRES || "15m",
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      }
    );
  }

  generateRefreshToken(user, overrides = {}) {
    return jwt.sign(
      this.buildPayload(user, "refresh", overrides),
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.REFRESH_TOKEN_EXPIRES || "30d",
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      }
    );
  }

  verifyAccessToken(token) {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (payload.type !== "access") {
      throw new Error("Invalid access token type.");
    }

    return payload;
  }

  verifyRefreshToken(token) {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (payload.type !== "refresh") {
      throw new Error("Invalid refresh token type.");
    }

    return payload;
  }

  getAccessTokenExpiresInSeconds() {
    return Math.floor(
      parseDurationToMs(env.ACCESS_TOKEN_EXPIRES || "15m") / 1000
    );
  }

  getRefreshTokenExpiryDate() {
    return new Date(
      Date.now() + parseDurationToMs(env.REFRESH_TOKEN_EXPIRES || "30d")
    );
  }

  buildPayload(user, type, overrides = {}) {
    return {
      sub: user._id.toString(),
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
      roles: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role],
      tokenVersion: user.tokenVersion,
      type,
      jti: overrides.jti || randomUUID(),
      familyId: overrides.familyId || null,
      deviceId: overrides.deviceId || null,
    };
  }
}

module.exports = new JwtService();
