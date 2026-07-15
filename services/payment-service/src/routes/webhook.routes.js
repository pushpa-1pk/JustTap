const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const webhookService = require("../services/webhook.service");
const ApiResponse = require("../utils/ApiResponse");

router.post(
  "/razorpay",
  // Pass the raw text payload to preserve exact formatting for signature validation checks
  express.text({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    
    // Process the verified webhook event exactly once
    await webhookService.processGatewayWebhook(req.body, signature);
    
    // Always return a fast 200 OK success acknowledgment status to the gateway provider to avoid retry loops
    return res.status(200).json(new ApiResponse(200, { received: true }, "Webhook payload processed successfully"));
  })
);

module.exports = router;