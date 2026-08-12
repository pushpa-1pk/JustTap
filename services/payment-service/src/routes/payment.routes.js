const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const settlementController = require("../controllers/settlement.controller");
const paymentValidator = require("../validators/payment.validator");
const validate = require("../middlewares/validate.middleware");
const telemetry = require("../middlewares/telemetry.middleware");

// Limiters
const { orderCreationLimiter, checkoutVerifyLimiter, withdrawalLimiter } = require("../middlewares/rateLimit.middleware");
const { verifyAuthenticationToken, enforceUserRole } = require("../middlewares/auth.middleware");

// Inject operational request telemetry processing loops across the active router context space
router.use(telemetry);

/* ====================================================================== */
/* API V1 Route Mappings Interface Nodes                                   */
/* ====================================================================== */

router.post(
  "/orders",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  orderCreationLimiter, // Custom isolated limiter tier node
  validate(paymentValidator.createOrder),
  paymentController.initiateGatewayOrder
);

router.post(
  "/verify",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  checkoutVerifyLimiter,
  validate(paymentValidator.verifyPayment),
  paymentController.verifyAndCapture
);

router.post(
  "/refunds",
  verifyAuthenticationToken,
  enforceUserRole(["ADMIN"]),
  validate(paymentValidator.executeRefund),
  paymentController.triggerClawbackRefund
);

router.post(
  "/settlements",
  verifyAuthenticationToken,
  enforceUserRole(["ADMIN"]),
  validate(paymentValidator.initializeSettlement),
  settlementController.initializeSettlement
);

router.post(
  "/settlements/release",
  verifyAuthenticationToken,
  enforceUserRole(["ADMIN"]),
  validate(paymentValidator.releaseSettlement),
  settlementController.releaseSettlementFunds
);

router.get(
  "/wallet",
  verifyAuthenticationToken,
  enforceUserRole(["PROVIDER"]),
  paymentController.getProviderWalletProjection
);

router.get(
  "/wallet/transactions",
  verifyAuthenticationToken,
  enforceUserRole(["PROVIDER"]),
  paymentController.getLedgerAuditHistory
);

router.post(
  "/withdrawals",
  verifyAuthenticationToken,
  enforceUserRole(["PROVIDER"]),
  withdrawalLimiter,
  validate(paymentValidator.requestWithdrawal),
  paymentController.payoutProviderFunds
);

/* ====================================================================== */
/* Customer Profile Module Extension Nodes                                */
/* ====================================================================== */

router.get(
  "/wallet/customer",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.getCustomerWallet
);

router.get(
  "/wallet/customer/transactions",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.getCustomerTransactions
);

router.post(
  "/wallet/customer/add-funds",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.addCustomerFunds
);

router.get(
  "/methods",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.getPaymentMethods
);

router.post(
  "/methods",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.addPaymentMethod
);

router.delete(
  "/methods/:id",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.deletePaymentMethod
);

router.put(
  "/methods/:id/default",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.setDefaultPaymentMethod
);

router.get(
  "/coupons/available",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.getAvailableCoupons
);

router.get(
  "/invoices",
  verifyAuthenticationToken,
  enforceUserRole(["CUSTOMER"]),
  paymentController.getCustomerInvoices
);

module.exports = router;
