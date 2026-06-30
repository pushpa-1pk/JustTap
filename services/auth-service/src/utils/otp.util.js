const bcrypt = require("bcrypt");
const { randomInt } = require("node:crypto");

const generateOTP = () => {
  return randomInt(100000, 1000000).toString();
};

const hashOTP = async (otp) => {
  return bcrypt.hash(otp, 10);
};

const compareOTP = async (otp, hashedOTP) => {
  return bcrypt.compare(otp, hashedOTP);
};

const getOTPKey = (phone) => `otp:${phone}`;

const getOTPAttemptsKey = (phone) => `otp_attempts:${phone}`;

const getOTPRateLimitKey = (phone) => {
  return `otp_rate:${phone}`;
};

module.exports = {
  generateOTP,
  hashOTP,
  compareOTP,
  getOTPKey,
  getOTPAttemptsKey,
  getOTPRateLimitKey,
};
