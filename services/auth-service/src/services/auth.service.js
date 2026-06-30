const redisService = require("./redis.service");
const smsService = require("./sms.service");
const jwtService = require("./jwt.service");
const refreshTokenService = require("./refreshToken.service");
const sessionService = require("./session.service");
const auditService = require("./audit.service");
const eventService = require("./event.service");
const tokenBlacklistService = require("./token-blacklist.service");
const userRepository = require("../repositories/user.repository");
const {
  resolveSignupRole,
  assertExistingUserRole,
} = require("../utils/auth-role.util");

const {
  generateOTP,
  hashOTP,
  compareOTP,
  getOTPKey,
  getOTPAttemptsKey,
  getOTPRateLimitKey,
} = require("../utils/otp.util");

const { OTP, ACCOUNT_STATUS } = require("../utils/constants");
const ApiError = require("../utils/ApiError");

class AuthService {
  async sendOtp(phone) {
    await this.checkOTPRateLimit(phone);

    const existingUser = await userRepository.findByPhone(phone);

    const redisKey = getOTPKey(phone);
    const otpExists = await redisService.exists(redisKey);

    if (otpExists) {
      throw new ApiError(
        429,
        "OTP already sent. Please wait before requesting another OTP."
      );
    }

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    await redisService.set(redisKey, hashedOTP, OTP.EXPIRY_SECONDS);
    await redisService.set(getOTPAttemptsKey(phone), 0, OTP.EXPIRY_SECONDS);

    try {
      await smsService.sendOTP(phone, otp);
    } catch (error) {
      await redisService.delete(redisKey);
      await redisService.delete(getOTPAttemptsKey(phone));
      throw error;
    }

    await auditService.logOTPSent({ phone });

    return {
      isExistingUser: Boolean(existingUser),
      authFlow: existingUser ? "LOGIN" : "REGISTER",
      requiresRoleSelection: !existingUser,
      role: existingUser ? existingUser.role : null,
    };
  }

  async verifyOtp(data) {
    const {
      phone,
      otp,
      role,
      deviceId,
      deviceName,
      platform,
      appVersion,
      ipAddress,
      userAgent,
    } = data;

    const otpKey = getOTPKey(phone);
    const attemptsKey = getOTPAttemptsKey(phone);
    const hashedOTP = await redisService.get(otpKey);

    if (!hashedOTP) {
      await auditService.logOTPFailed({
        phone,
        reason: "OTP_NOT_FOUND",
      });

      throw new ApiError(401, "OTP expired or not found.");
    }

    const isValid = await compareOTP(otp, hashedOTP);

    if (!isValid) {
      const attempts = await this.incrementOTPAttempts(phone);

      await auditService.logOTPFailed({
        phone,
        reason: "INVALID_OTP",
        attempts,
      });

      if (attempts >= OTP.MAX_ATTEMPTS) {
        await redisService.delete(otpKey);
        await redisService.delete(attemptsKey);
        throw new ApiError(
          429,
          "Maximum OTP attempts exceeded. Please request a new OTP."
        );
      }

      throw new ApiError(401, "Invalid OTP.");
    }

    let user = await userRepository.findByPhone(phone);
    const isNewUser = !user;

    if (!user) {
      let signupRole;

      try {
        signupRole = resolveSignupRole(role);
      } catch (error) {
        throw new ApiError(400, error.message);
      }

      user = await userRepository.create({
        phone,
        role: signupRole,
        isPhoneVerified: true,
      });
    } else {
      try {
        assertExistingUserRole(user, role);
      } catch (error) {
        throw new ApiError(409, error.message);
      }

      if (!user.isPhoneVerified) {
        user = await userRepository.updateById(user._id, {
          isPhoneVerified: true,
        });
      }
    }

    await redisService.delete(otpKey);
    await redisService.delete(attemptsKey);

    if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
      throw new ApiError(
        403,
        `Account is ${user.accountStatus.toLowerCase()}.`
      );
    }

    user = await userRepository.updateLastLogin(user._id);

    const sessionPayload = {
      deviceId,
      deviceName,
      platform,
      appVersion,
      ipAddress,
      userAgent,
    };

    const session = await sessionService.createOrUpdateSession(
      user._id,
      sessionPayload
    );

    const accessToken = jwtService.generateAccessToken(user, {
      deviceId,
    });

    await refreshTokenService.revokeByDevice(user._id, deviceId, "NEW_LOGIN");

    const { refreshToken, refreshTokenExpiresAt } =
      await refreshTokenService.issueToken({
        user,
        session: sessionPayload,
      });

    await auditService.logOTPVerified({
      phone,
      userId: user._id,
    });

    await auditService.logLogin({
      userId: user._id,
      phone,
      deviceId,
      platform,
    });

    await eventService.publish("UserLoggedIn", {
      userId: user._id.toString(),
      phone,
      deviceId,
      platform,
      isNewUser,
    });

    return this.buildAuthResponse({
      user: {
        id: user._id.toString(),
        phone: user.phone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        profileCompleted: user.profileCompleted,
        accountStatus: user.accountStatus,
      },
      session: {
        id: session._id.toString(),
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        platform: session.platform,
        appVersion: session.appVersion,
        isOnline: session.isOnline,
        lastSeen: session.lastSeen,
      },
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      isNewUser,
    });
  }

  async refreshAccessToken(data) {
    const {
      refreshToken,
      deviceId,
      deviceName,
      platform,
      appVersion,
      ipAddress,
      userAgent,
    } = data;

    let payload;

    try {
      payload = jwtService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token.");
    }

    if (payload.deviceId && payload.deviceId !== deviceId) {
      throw new ApiError(401, "Refresh token device mismatch.");
    }

    const user = await this.getActiveUserById(payload.userId);

    if (user.tokenVersion !== payload.tokenVersion) {
      await sessionService.deleteByDevice(user._id, deviceId);
      throw new ApiError(401, "Refresh token has been revoked.");
    }

    const existingSession =
      await refreshTokenService.findByJti(payload.jti);

    const sessionPayload = {
      deviceId,
      deviceName: deviceName || existingSession?.deviceName,
      platform: platform || existingSession?.platform || "WEB",
      appVersion: appVersion || existingSession?.appVersion,
      ipAddress: ipAddress || existingSession?.ipAddress,
      userAgent: userAgent || existingSession?.userAgent,
    };

    const session = await sessionService.createOrUpdateSession(
      user._id,
      sessionPayload
    );

    const accessToken = jwtService.generateAccessToken(user, {
      deviceId,
    });

    const rotatedToken = await refreshTokenService.rotateToken({
      user,
      currentToken: refreshToken,
      payload,
      session: {
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        platform: session.platform,
        appVersion: session.appVersion,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: rotatedToken.refreshToken,
      refreshTokenExpiresAt: rotatedToken.refreshTokenExpiresAt,
      expiresIn: jwtService.getAccessTokenExpiresInSeconds(),
    };
  }

  async getCurrentUser(userId) {
    const user = await this.getActiveUserById(userId);

    return {
      id: user._id.toString(),
      phone: user.phone,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      profileCompleted: user.profileCompleted,
      accountStatus: user.accountStatus,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async logout(data) {
    const { userId, deviceId, accessTokenJti, accessTokenExp } = data;

    await refreshTokenService.revokeByDevice(userId, deviceId, "LOGOUT");
    await tokenBlacklistService.blacklistToken(accessTokenJti, accessTokenExp);
    await sessionService.deleteByDevice(userId, deviceId);

    await auditService.logLogout({
      userId,
      deviceId,
      scope: "single-device",
    });

    await eventService.publish("UserLoggedOut", {
      userId: userId.toString(),
      deviceId,
      scope: "single-device",
    });

    return {
      loggedOut: true,
      deviceId,
    };
  }

  async logoutAllDevices(userId) {
    await refreshTokenService.revokeAllByUser(userId);
    await sessionService.deleteAllByUser(userId);
    await userRepository.incrementTokenVersion(userId);

    await auditService.logLogout({
      userId,
      scope: "all-devices",
    });

    await eventService.publish("UserLoggedOut", {
      userId: userId.toString(),
      scope: "all-devices",
    });

    return {
      loggedOut: true,
      allDevices: true,
    };
  }

  async incrementOTPAttempts(phone) {
    const key = getOTPAttemptsKey(phone);
    return redisService.increment(key);
  }

  async checkOTPRateLimit(phone) {
    const key = getOTPRateLimitKey(phone);
    const requests = await redisService.incrementWithExpiry(
      key,
      OTP.RATE_LIMIT_WINDOW
    );

    if (requests > OTP.MAX_REQUESTS_PER_WINDOW) {
      await auditService.logRateLimitExceeded({
        phone,
        requests,
      });

      throw new ApiError(
        429,
        "OTP request limit exceeded. Please try again after 15 minutes."
      );
    }
  }

  async getActiveUserById(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(401, "User not found.");
    }

    if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
      throw new ApiError(
        403,
        `Account is ${user.accountStatus.toLowerCase()}.`
      );
    }

    return user;
  }

  buildAuthResponse({
    user,
    session,
    accessToken,
    refreshToken,
    refreshTokenExpiresAt,
    isNewUser = false,
  }) {
    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      expiresIn: jwtService.getAccessTokenExpiresInSeconds(),
      user,
      session,
      isNewUser,
    };
  }
}

module.exports = new AuthService();
