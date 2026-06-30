const env = require("../config/env");
const logger = require("./logger.service");

class SMSService {
  async sendOTP(phone, otp) {
    if (env.SMS_PROVIDER === "mock") {
      logger.info("SMS_SENT_MOCK", {
        phone,
        otp,
      });

      return {
        success: true,
        provider: "mock",
        messageId: `mock_${Date.now()}`,
      };
    }

    throw new Error(`Unsupported SMS provider: ${env.SMS_PROVIDER}`);
  }

  async getHealth() {
    if (env.SMS_PROVIDER === "mock") {
      return {
        status: env.IS_PRODUCTION ? "down" : "degraded",
        provider: "mock",
      };
    }

    return {
      status: "down",
      provider: env.SMS_PROVIDER,
    };
  }
}

module.exports = new SMSService();
