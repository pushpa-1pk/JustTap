const express = require("express");
const searchRoutes = require("./search.routes");
const providerRoutes = require("./provider.routes");
const bookingRoutes = require("./booking.routes");

const router = express.Router();

router.use("/search", searchRoutes);
router.use("/provider", providerRoutes);
router.use("/matching", bookingRoutes);

module.exports = router;
