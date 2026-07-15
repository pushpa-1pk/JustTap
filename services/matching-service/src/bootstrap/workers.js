const BookingRequestRepository = require("../repositories/bookingRequest.repository");
const BookingServiceClient = require("../clients/booking/booking.client");
const RequestTimeoutWorker = require("../workers/request-timeout.worker");
const BookingRequestService = require("../services/booking/bookingRequest.service");
const searchContainer = require("./search.container");

const bootstrapBackgroundWorkers = async () => {
  const requestService = new BookingRequestService(
    new BookingRequestRepository(),
    new BookingServiceClient(),
    searchContainer.getSearchService()
  );

  const timeoutWorker = new RequestTimeoutWorker(requestService);
  await timeoutWorker.start();
  return timeoutWorker;
};

module.exports = bootstrapBackgroundWorkers;
