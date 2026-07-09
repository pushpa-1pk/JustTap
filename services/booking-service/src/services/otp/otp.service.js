const crypto = require('crypto');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/api.error');
const BookingOTPRepository = require('../../repositories/booking-otp.repository');
const { TIMEOUT_CONFIGS } = require('../../constants/booking.constants');

class OTPService {
  constructor() {
    this.otpRepo = new BookingOTPRepository();
  }

  /**
   * Generates a 6-digit number, hashes it with bcrypt, and stores it in the database outbox layer
   */
  async generateVerificationOTP(bookingId, purpose, session = null) {
    const cleartextOtp = String(crypto.randomInt(100000, 999999));
    
    // Consistent secure hashing matching our global identity parameters
    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(cleartextOtp, saltRounds);
    const expiresAt = new Date(Date.now() + TIMEOUT_CONFIGS.OTP_EXPIRY_MS);

    const otpPayload = {
      bookingId,
      hashedOtp,
      otpPurpose: purpose,
      attemptCount: 0,
      maxAttempts: 3,
      expiresAt
    };

    await this.otpRepo.upsertOTP(otpPayload, session);
    return cleartextOtp;
  }

  /**
   * Validates input codes against bcrypt hashes while tracking brute-force attempt counts
   */
  async verifyVerificationOTP(bookingId, rawOtp, session = null) {
    // Explicitly uses our updated query logic that filters out expired records
    const activeOtpRecord = await this.otpRepo.findActiveOTP(bookingId);

    if (!activeOtpRecord) {
      throw new ApiError('Verification Expired: No active, unexpired verification tokens exist for this booking record.', 404);
    }

    if (activeOtpRecord.attemptCount >= activeOtpRecord.maxAttempts) {
      throw new ApiError('Security Lockout: Maximum validation attempts reached. Please request a new token.', 429);
    }

    // Secure constant-time string comparison using bcrypt
    const isCodeValid = await bcrypt.compare(rawOtp, activeOtpRecord.hashedOtp);

    if (!isCodeValid) {
      await this.otpRepo.incrementAttempt(bookingId);
      const remaining = activeOtpRecord.maxAttempts - (activeOtpRecord.attemptCount + 1);
      throw new ApiError(`Verification Failed: Invalid token code entered. Attempts remaining: ${remaining}`, 400);
    }

    await this.otpRepo.markAsVerified(bookingId, session);
    return true;
  }
}

module.exports = OTPService;
