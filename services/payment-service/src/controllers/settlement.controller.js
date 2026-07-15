const { v4: uuidv4 } = require("uuid");
const settlementService = require("../services/settlement.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

class SettlementController {
  initializeSettlement = asyncHandler(async (req, res) => {
    const { paymentId } = req.body;
    // Resilient Fallback: Ensure a correlation ID exists even if the gateway proxy skips injecting headers
    const correlationId = req.headers["x-correlation-id"] || `tx-cor-${uuidv4()}`;

    if (!paymentId) throw new ApiError(400, "Required payload attribute missing: paymentId field is mandatory.");

    const result = await settlementService.createEscrowSettlement({ paymentId, correlationId });
    return res.status(201).json(new ApiResponse(201, result, "Settlement initialized inside escrow hold."));
  });

  releaseSettlementFunds = asyncHandler(async (req, res) => {
    const { settlementId } = req.body;
    const correlationId = req.headers["x-correlation-id"] || `tx-cor-${uuidv4()}`;

    if (!settlementId) throw new ApiError(400, "Required payload attribute missing: settlementId field is mandatory.");

    const result = await settlementService.releaseEscrowToAvailable(
      settlementId,
      correlationId,
      req.user?.id || "MANUAL_RECONCILIATION_ADMIN"
    );
    return res.status(200).json(new ApiResponse(200, result, "Escrow payout cleared and shifted to available tracks successfully."));
  });
}

module.exports = new SettlementController();