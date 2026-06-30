const logger = require("./logger.service");
const { AUDIT_EVENTS } = require("../utils/constants");

class AuditService {
  async logOTPSent(data) {
    logger.info(AUDIT_EVENTS.OTP_SENT, data);
  }

  async logOTPVerified(data) {
    logger.info(AUDIT_EVENTS.OTP_VERIFIED, data);
  }

  async logOTPFailed(data) {
    logger.warn(AUDIT_EVENTS.OTP_FAILED, data);
  }

  async logRateLimitExceeded(data) {
    logger.warn(AUDIT_EVENTS.OTP_RATE_LIMIT_EXCEEDED, data);
  }

  async logLogin(data) {
    logger.info(AUDIT_EVENTS.LOGIN_SUCCESS, data);
  }

  async logLogout(data) {
    logger.info(AUDIT_EVENTS.LOGOUT, data);
  }

  async logTokenReuseDetected(data) {
    logger.warn(AUDIT_EVENTS.TOKEN_REUSE_DETECTED, data);
  }
}

module.exports = new AuditService();
