const crypto = require("crypto");
const searchContainer = require("../bootstrap/search.container");
const BookingRequestRepository = require("../repositories/bookingRequest.repository");
const BookingServiceClient = require("../clients/booking/booking.client");
const BookingRequestService = require("../services/booking/bookingRequest.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class BookingRequestController {
  constructor() {
    this.requestService = new BookingRequestService(
      new BookingRequestRepository(),
      new BookingServiceClient(),
      searchContainer.getSearchService()
    );
  }

  dispatchRequest = asyncHandler(async (req, res) => {
    const trackingMeta = {
      requestId: req.headers["x-request-id"] || crypto.randomUUID(),
      customerId: req.user.userId,
    };

    const result = await this.requestService.sendRequestToProvider(
      req.validatedBody.bookingId,
      {
        ...req.validatedBody,
        customerId: req.user.userId,
      },
      trackingMeta
    );

    new ApiResponse(201, "Booking request routed successfully", result).send(res);
  });

  acceptRequest = asyncHandler(async (req, res) => {
    const result = await this.requestService.acceptBookingRequest(
      req.user.userId,
      req.validatedParams.id,
      { requestId: req.headers["x-request-id"] || crypto.randomUUID() }
    );

    new ApiResponse(200, "Booking request accepted successfully", result).send(res);
  });

  rejectRequest = asyncHandler(async (req, res) => {
    const result = await this.requestService.handleNegativeResolution(
      req.validatedParams.id,
      "PROVIDER_REJECTED",
      { requestId: req.headers["x-request-id"] || crypto.randomUUID() }
    );

    new ApiResponse(200, "Booking request rejected successfully", result).send(res);
  });
}

module.exports = new BookingRequestController();
