module.exports = {
  providerPresence: (providerId) => `matching:provider:presence:${providerId}`,
  providerLocations: "matching:geo:providers",
  providerLocationTimestamp: (providerId) =>
    `matching:provider:location-timestamp:${providerId}`,
  providerLock: (providerId) => `matching:provider-lock:${providerId}`,
  bookingRequest: (bookingId) => `matching:booking-request:${bookingId}`,
  bookingRequestTimeouts: "matching:booking-request:timeouts",
  bookingRequestProcessingLock: (bookingId) =>
    `matching:booking-request-processing:${bookingId}`,
  rateSearch: (customerId) => `matching:rate:search:${customerId}`,
  rateLocation: (providerId) => `matching:rate:location:${providerId}`,
};
