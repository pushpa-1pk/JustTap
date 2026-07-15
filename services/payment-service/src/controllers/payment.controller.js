const { v4: uuidv4 } = require("uuid");
const paymentService = require("../services/payment.service");
const refundService = require("../services/refund.service");
const withdrawalService = require("../services/withdrawal.service");
const bookingClient = require("../services/clients/booking.client");
const walletTransactionRepository = require("../repositories/walletTransaction.repository");
const walletRepository = require("../repositories/wallet.repository");
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
}

module.exports = new PaymentController();
