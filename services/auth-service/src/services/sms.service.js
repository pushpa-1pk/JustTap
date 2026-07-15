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

    if (env.SMS_PROVIDER === "msg91") {
      const mobile = this.normalizeIndianMobile(phone, env.MSG91_COUNTRY);
      const payload = {
        mobiles: mobile,
        message: `Your JustTap OTP is ${otp}. It expires in 5 minutes.`,
        sender: env.MSG91_SENDER_ID,
        route: env.MSG91_ROUTE,
        country: env.MSG91_COUNTRY,
      };

      if (env.MSG91_DLT_TEMPLATE_ID) {
        payload.DLT_TE_ID = env.MSG91_DLT_TEMPLATE_ID;
      }

      const response = await fetch("https://control.msg91.com/api/v2/sendsms", {
        method: "POST",
        headers: {
          authkey: env.MSG91_AUTH_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error("SMS_SEND_FAILED", {
          provider: "msg91",
          phone,
          status: response.status,
          message: data?.message,
          type: data?.type,
        });
        throw new Error(data?.message || "Failed to send OTP via MSG91.");
      }

      logger.info("SMS_SENT", {
        provider: "msg91",
        phone,
        messageId: data?.request_id || data?.message || null,
      });

      return {
        success: true,
        provider: "msg91",
        messageId: data?.request_id || data?.message || null,
      };
    }

    if (env.SMS_PROVIDER === "twilio") {
      const body = new URLSearchParams({
        To: phone,
        From: env.TWILIO_FROM_NUMBER,
        Body: `Your JustTap OTP is ${otp}. It expires in 5 minutes.`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
          env.TWILIO_ACCOUNT_SID
        )}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        logger.error("SMS_SEND_FAILED", {
          provider: "twilio",
          phone,
          status: response.status,
          code: data?.code,
          message: data?.message,
        });
        throw new Error(data?.message || "Failed to send OTP via Twilio.");
      }

      logger.info("SMS_SENT", {
        provider: "twilio",
        phone,
        messageId: data?.sid,
      });

      return {
        success: true,
        provider: "twilio",
        messageId: data?.sid || null,
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

    if (env.SMS_PROVIDER === "msg91") {
      return {
        status: "up",
        provider: "msg91",
      };
    }

    if (env.SMS_PROVIDER === "twilio") {
      return {
        status: "up",
        provider: "twilio",
      };
    }

    return {
      status: "down",
      provider: env.SMS_PROVIDER,
    };
  }

  normalizeIndianMobile(phone, defaultCountryCode) {
    const digits = String(phone || "").replace(/\D/g, "");

    if (!digits) {
      throw new Error("Phone number is required for SMS delivery.");
    }

    if (digits.length === 10) {
      return `${defaultCountryCode}${digits}`;
    }

    return digits;
  }
}

module.exports = new SMSService();
