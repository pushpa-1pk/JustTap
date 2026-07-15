const test = require("node:test");
const assert = require("node:assert/strict");

const BookingRequestService = require("../src/services/booking/bookingRequest.service");

test("BookingRequestService stages a request after booking ownership validation", async () => {
  const repo = {
    acquireProviderLock: async () => true,
    stageReservationState: async (bookingId, payload) => ({
      ...payload,
      bookingId,
      expiresAt: "2026-07-11T12:00:00.000Z",
    }),
    releaseProviderLock: async () => {},
  };

  const bookingClient = {
    getBooking: async () => ({ _id: "booking-1", customerId: "customer-1" }),
    startMatchingRequest: async () => ({ _id: "booking-1" }),
  };

  const service = new BookingRequestService(repo, bookingClient, {
    searchNearbyProviders: async () => ({ total: 0, providers: [] }),
  });

  const result = await service.sendRequestToProvider(
    "booking-1",
    {
      providerId: "provider-1",
      serviceId: "service-1",
      latitude: 18.5,
      longitude: 73.8,
      customerId: "customer-1",
    },
    { requestId: "req-1" }
  );

  assert.equal(result.bookingId, "booking-1");
  assert.equal(result.providerId, "provider-1");
  assert.equal(result.status, "PENDING_PROVIDER_RESPONSE");
});

test("BookingRequestService rejects provider acceptance when ownership mismatches", async () => {
  const repo = {
    getStagedReservation: async () => ({
      bookingId: "booking-1",
      providerId: "provider-1",
      lockToken: "lock-1",
    }),
  };

  const service = new BookingRequestService(repo, {}, {});

  await assert.rejects(
    () => service.acceptBookingRequest("provider-2", "booking-1", { requestId: "req-2" }),
    /ownership mismatch/i
  );
});
