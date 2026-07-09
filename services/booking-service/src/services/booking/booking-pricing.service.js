const ApiError = require('../../utils/api.error');
const env = require('../../config/env');

class BookingPricingService {
  /**
   * Generates a complete invoice breakdown and splits provider payouts from platform fees
   */
  calculateInvoice(basePrice, distanceKm, adjustments = {}) {
    if (basePrice < 0 || distanceKm < 0) {
      throw new ApiError('Pricing Equation Error: Base prices or location distances cannot be negative value sets.', 400);
    }

    // Extracted from environment properties mapped safely within config abstractions
    const travelRatePerKm = env.travelRatePerKm || 15;
    const freeDistanceBufferKm = env.freeDistanceKm || 2;
    const platformCommissionRate = (env.platformCommissionPercent || 15) / 100;
    const taxRate = (env.gstPercent || 18) / 100;

    // 1. Travel Fees Logic
    let travelCharge = 0;
    if (distanceKm > freeDistanceBufferKm) {
      travelCharge = Math.round((distanceKm - freeDistanceBufferKm) * travelRatePerKm);
    }

    // 2. Coupon Discount Calculus
    let discountAmount = 0;
    if (adjustments.couponDiscountAmount && adjustments.couponDiscountAmount > 0) {
      discountAmount = Math.min(adjustments.couponDiscountAmount, basePrice + travelCharge);
    }

    // 3. Tax & Totals Math
    const netTaxableValue = (basePrice + travelCharge) - discountAmount;
    const taxAmount = Math.round(Math.max(0, netTaxableValue * taxRate));
    const totalAmountToPay = Math.max(0, netTaxableValue + taxAmount);

    // 4. Financial Split Isolation Calculations
    const platformCommissionFee = Math.round(basePrice * platformCommissionRate);
    const platformRevenue = platformCommissionFee + taxAmount;
    const providerPayout = totalAmountToPay - platformCommissionFee;

    return {
      pricing: {
        serviceBasePrice: basePrice,
        travelCharge,
        platformCommissionFee,
        taxAmount,
        discountAmount,
        couponDiscount: adjustments.couponCode || 'NONE',
        totalAmountToPay,
        currency: 'INR'
      },
      platformRevenue,
      providerPayout
    };
  }
}

module.exports = new BookingPricingService();