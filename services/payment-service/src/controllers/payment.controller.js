const { v4: uuidv4 } = require("uuid");
const paymentService = require("../services/payment.service");
const refundService = require("../services/refund.service");
const withdrawalService = require("../services/withdrawal.service");
const bookingClient = require("../services/clients/booking.client");
const walletTransactionRepository = require("../repositories/walletTransaction.repository");
const walletRepository = require("../repositories/wallet.repository");
const CustomerWallet = require("../models/customerWallet.model");
const CustomerWalletTransaction = require("../models/customerWalletTransaction.model");
const PaymentMethod = require("../models/paymentMethod.model");
const Coupon = require("../models/coupon.model");
const Invoice = require("../models/invoice.model");
const { logger } = require("../config/logger");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

class PaymentController {
  initiateGatewayOrder = async (req, res, next) => {
    try {
      const correlationId = req.headers["x-correlation-id"] || `tx-cor-${uuidv4()}`;
      const requestId = req.headers["x-request-id"] || `req-${uuidv4()}`;
      const customerId = req.user.id;
      const { bookingId } = req.body;

      logger.info("Processing secure order initialization context lookup", { bookingId, customerId });

      const booking = await bookingClient.getBookingById(bookingId, correlationId);
      const bookingContext = this._buildBookingPaymentContext(booking);

      if (String(bookingContext.customerId) !== String(customerId)) {
        throw new ApiError(403, "Authorization rejected: Token context parameters do not match the target booking ownership lines.");
      }

      if (bookingContext.paymentStatus === "PAID") {
        throw new ApiError(409, "Payment has already been completed for this booking.");
      }

      const orderRecord = await paymentService.createPaymentOrder({
        bookingId: bookingContext.bookingId,
        customerId: bookingContext.customerId,
        providerId: bookingContext.providerId,
        amountPaise: bookingContext.amountPaise,
        bookingSnapshot: bookingContext.bookingSnapshot,
        correlationId,
        requestId
      });

      return res.status(201).json(
        new ApiResponse(201, orderRecord, "Secure gateway payment context initialized successfully.")
      );
    } catch (error) {
      next(error);
    }
  };

  getLedgerAuditHistory = async (req, res, next) => {
    try {
      const providerId = req.user.id;
      const limit = parseInt(req.query.limit || "10", 10);
      const nextCursor = req.query.nextCursor || null;

      const paginatedResults = await walletTransactionRepository.getLedgerCursorStream(providerId, {
        limit,
        nextCursor
      });

      return res.status(200).json(
        new ApiResponse(200, paginatedResults.items, "Cursor stream history parsed cleanly.", paginatedResults.meta)
      );
    } catch (error) {
      next(error);
    }
  };

  verifyAndCapture = async (req, res, next) => {
    try {
      const correlationId = req.headers["x-correlation-id"] || `tx-cor-${uuidv4()}`;
      const requestId = req.headers["x-request-id"] || `req-${uuidv4()}`;

      const paymentRecord = await paymentService.verifyAndCapturePayment({
        ...req.body,
        actorUserId: req.user.id,
        correlationId,
        requestId
      });

      return res.status(200).json(new ApiResponse(200, paymentRecord, "Handshake signature capture complete."));
    } catch (error) {
      next(error);
    }
  };

  triggerClawbackRefund = async (req, res, next) => {
    try {
      const correlationId = req.headers["x-correlation-id"] || `tx-cor-${uuidv4()}`;
      const refundRecord = await refundService.executeMarketplaceRefund({
        ...req.body,
        correlationId,
        approvedBy: req.user?.id || "CUSTOMER_SERVICE_DESK"
      });
      return res.status(201).json(new ApiResponse(201, refundRecord, "Refund approved."));
    } catch (error) {
      next(error);
    }
  };

  payoutProviderFunds = async (req, res, next) => {
    try {
      const correlationId = req.headers["x-correlation-id"] || `tx-cor-${uuidv4()}`;
      const providerId = req.user.id;

      const withdrawalRecord = await withdrawalService.requestProviderWithdrawal({
        providerId,
        amountPaise: req.body.amountPaise,
        bankDetails: req.body.bankDetails,
        correlationId
      });
      return res.status(201).json(new ApiResponse(201, withdrawalRecord, "Withdrawal pending processing."));
    } catch (error) {
      next(error);
    }
  };

  getProviderWalletProjection = async (req, res, next) => {
    try {
      const wallet = await walletRepository.findByProviderId(req.user.id);
      if (!wallet) {
        throw new ApiError(404, "Wallet profile account not found.");
      }
      return res.status(200).json(new ApiResponse(200, wallet, "Balances resolved."));
    } catch (error) {
      next(error);
    }
  };

  _buildBookingPaymentContext(booking) {
    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    if (!booking.providerId) {
      throw new ApiError(409, "Booking must be assigned to a provider before payment can be captured.");
    }

    if (!booking.snapshotPricing?.totalAmountToPay) {
      throw new ApiError(422, "Booking pricing snapshot is incomplete.");
    }

    return {
      bookingId: booking._id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      paymentStatus: booking.paymentStatus,
      amountPaise: Math.round(Number(booking.snapshotPricing.totalAmountToPay) * 100),
      bookingSnapshot: {
        customerName: booking.customerSnapshot?.fullName || "Customer",
        providerName: booking.providerSnapshot?.businessName || "Provider",
        serviceName: booking.serviceName || booking.bookingType || "Service Booking",
        basePricePaise: Math.round(Number(booking.snapshotPricing.serviceBasePrice || 0) * 100),
        scheduledTime: booking.scheduledStartTime
      }
    };
  }

  getCustomerWallet = async (req, res, next) => {
    try {
      const customerId = req.user.id;
      let wallet = await CustomerWallet.findOne({ customerId });
      if (!wallet) {
        wallet = await CustomerWallet.create({
          customerId,
          balancePaise: 0,
          rewardPoints: 0,
          cashbackPaise: 0,
          referralBonusPaise: 0,
        });
      }
      return res.status(200).json(new ApiResponse(200, wallet, "Customer wallet resolved."));
    } catch (error) {
      next(error);
    }
  };

  getCustomerTransactions = async (req, res, next) => {
    try {
      const customerId = req.user.id;
      const transactions = await CustomerWalletTransaction.find({ customerId }).sort({ createdAt: -1 });
      return res.status(200).json(new ApiResponse(200, transactions, "Customer transactions resolved."));
    } catch (error) {
      next(error);
    }
  };

  addCustomerFunds = async (req, res, next) => {
    try {
      throw new ApiError(501, "Wallet top-ups require a verified payment-gateway flow and are not enabled yet.");
    } catch (error) {
      next(error);
    }
  };

  getPaymentMethods = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const methods = await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
      return res.status(200).json(new ApiResponse(200, methods, "Payment methods resolved."));
    } catch (error) {
      next(error);
    }
  };

  addPaymentMethod = async (req, res, next) => {
    try {
      throw new ApiError(501, "Saving a payment method requires gateway tokenization and is not enabled yet.");
    } catch (error) {
      next(error);
    }
  };

  deletePaymentMethod = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const method = await PaymentMethod.findOne({ _id: id, userId });
      if (!method) {
        throw new ApiError(404, "Payment method not found.");
      }

      await PaymentMethod.deleteOne({ _id: id, userId });

      if (method.isDefault) {
        const nextMethod = await PaymentMethod.findOne({ userId });
        if (nextMethod) {
          nextMethod.isDefault = true;
          await nextMethod.save();
        }
      }

      return res.status(200).json(new ApiResponse(200, null, "Payment method deleted successfully."));
    } catch (error) {
      next(error);
    }
  };

  setDefaultPaymentMethod = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const method = await PaymentMethod.findOne({ _id: id, userId });
      if (!method) {
        throw new ApiError(404, "Payment method not found.");
      }

      await PaymentMethod.updateMany({ userId }, { isDefault: false });

      method.isDefault = true;
      await method.save();

      return res.status(200).json(new ApiResponse(200, method, "Default payment method updated."));
    } catch (error) {
      next(error);
    }
  };

  getAvailableCoupons = async (req, res, next) => {
    try {
      const coupons = await Coupon.find({ isActive: true, expiryDate: { $gt: new Date() } });
      return res.status(200).json(new ApiResponse(200, coupons, "Available coupons resolved."));
    } catch (error) {
      next(error);
    }
  };

  getCustomerInvoices = async (req, res, next) => {
    try {
      const recipientId = req.user.id;
      const invoices = await Invoice.find({ recipientId, deletedAt: null }).sort({ createdAt: -1 });
      return res.status(200).json(new ApiResponse(200, invoices, "Customer invoices resolved."));
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new PaymentController();
