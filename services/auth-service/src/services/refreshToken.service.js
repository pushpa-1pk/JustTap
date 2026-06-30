const bcrypt = require("bcrypt");
const { randomUUID } = require("node:crypto");
const refreshTokenRepository = require("../repositories/refreshToken.repository");
const jwtService = require("./jwt.service");
const sessionService = require("./session.service");
const auditService = require("./audit.service");
const ApiError = require("../utils/ApiError");

class RefreshTokenService {
  async issueToken({ user, session, familyId = randomUUID() }) {
    const refreshToken = jwtService.generateRefreshToken(user, {
      familyId,
      deviceId: session.deviceId,
    });
    const payload = jwtService.verifyRefreshToken(refreshToken);
    const expiresAt = jwtService.getRefreshTokenExpiryDate();
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await refreshTokenRepository.create({
      userId: user._id,
      jti: payload.jti,
      familyId,
      tokenHash,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      platform: session.platform,
      appVersion: session.appVersion,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastUsedAt: new Date(),
      expiresAt,
    });

    return {
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
      jti: payload.jti,
      familyId,
    };
  }

  async findByJti(jti) {
    return refreshTokenRepository.findByJti(jti);
  }

  async rotateToken({ user, currentToken, payload, session }) {
    const storedToken = await refreshTokenRepository.findByJti(payload.jti);

    if (!storedToken) {
      await this.handleTokenReuse({
        userId: payload.userId,
        familyId: payload.familyId,
        deviceId: payload.deviceId || session.deviceId,
        reason: "TOKEN_RECORD_NOT_FOUND",
      });
    }

    if (storedToken.deviceId !== session.deviceId) {
      throw new ApiError(401, "Refresh token device mismatch.");
    }

    if (storedToken.revokedAt) {
      await this.handleTokenReuse({
        userId: payload.userId,
        familyId: storedToken.familyId,
        deviceId: storedToken.deviceId,
        reason: "REVOKED_TOKEN_REUSED",
      });
    }

    const tokenMatches = await bcrypt.compare(
      currentToken,
      storedToken.tokenHash
    );

    if (!tokenMatches) {
      await this.handleTokenReuse({
        userId: payload.userId,
        familyId: storedToken.familyId,
        deviceId: storedToken.deviceId,
        reason: "TOKEN_HASH_MISMATCH",
      });
    }

    const nextToken = await this.issueToken({
      user,
      session,
      familyId: storedToken.familyId,
    });

    await refreshTokenRepository.revokeByJti(storedToken.jti, {
      replacedByJti: nextToken.jti,
      revokeReason: "ROTATED",
    });

    await refreshTokenRepository.touchLastUsed(storedToken.jti);

    return nextToken;
  }

  async revokeByDevice(userId, deviceId, reason = "LOGOUT") {
    return refreshTokenRepository.revokeByDevice(userId, deviceId, {
      revokeReason: reason,
    });
  }

  async revokeByJti(jti, reason = "REVOKED") {
    return refreshTokenRepository.revokeByJti(jti, {
      revokeReason: reason,
    });
  }

  async revokeAllByUser(userId, reason = "LOGOUT_ALL") {
    return refreshTokenRepository.revokeAllUserTokens(userId, {
      revokeReason: reason,
    });
  }

  async handleTokenReuse({ userId, familyId, deviceId, reason }) {
    await refreshTokenRepository.revokeFamily(userId, familyId, {
      revokeReason: reason,
    });
    await sessionService.deleteByDevice(userId, deviceId);
    await auditService.logTokenReuseDetected({
      userId,
      familyId,
      deviceId,
      reason,
    });

    throw new ApiError(
      401,
      "Refresh token reuse detected. Please log in again."
    );
  }
}

module.exports = new RefreshTokenService();
