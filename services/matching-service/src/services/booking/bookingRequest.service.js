const crypto = require("crypto");
const MATCHING_BOOKING_STATUS = require("../../constants/bookingStatus");
const ApiError = require("../../utils/ApiError");

class BookingRequestService {
  constructor(bookingRequestRepository, bookingServiceClient, searchService) {
    this.requestRepo = bookingRequestRepository;
    this.bookingClient = bookingServiceClient;
    this.searchService = searchService;
  }

  async sendRequestToProvider(bookingId, payload, trackingMeta = {}) {
    const {
      providerId,
      serviceId,
      latitude,
      longitude,
      customerId,
      providerSnapshot = null,
    } = payload;

    const booking = await this.bookingClient.getBooking(bookingId, trackingMeta.requestId);
    if (!booking) {
      throw new ApiError("Booking not found.", 404);
    }

    if (String(booking.customerId) !== String(customerId)) {
      throw new ApiError("You do not have access to this booking.", 403);
    }

    const lockToken = crypto.randomUUID();
    const acquired = await this.requestRepo.acquireProviderLock(providerId, lockToken);

    if (!acquired) {
      throw new ApiError("Provider is already processing another request.", 409);
    }

    try {
      await this.bookingClient.startMatchingRequest(
        bookingId,
        {
          providerId,
          providerSnapshot,
        },
        trackingMeta.requestId
      );

      const staged = await this.requestRepo.stageReservationState(bookingId, {
        bookingId,
        providerId,
        serviceId,
        customerId,
        lockToken,
        latitude,
        longitude,
        providerSnapshot,
      });

      return {
        bookingId,
        providerId,
        status: MATCHING_BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
        expiresAt: staged.expiresAt,
      };
    } catch (error) {
      await this.requestRepo.releaseProviderLock(providerId, lockToken);
      throw error;
    }
  }

  async acceptBookingRequest(providerId, bookingId, trackingMeta = {}) {
    const staged = await this.requestRepo.getStagedReservation(bookingId);
    if (!staged) {
      throw new ApiError("Booking request is no longer active.", 409);
    }

    if (String(staged.providerId) !== String(providerId)) {
      throw new ApiError("Booking request ownership mismatch.", 403);
    }

    const booking = await this.bookingClient.acceptMatchingRequest(
      bookingId,
      providerId,
      trackingMeta.requestId
    );

    await Promise.all([
      this.requestRepo.clearStagedReservation(bookingId),
      this.requestRepo.releaseProviderLock(providerId, staged.lockToken),
    ]);

    return {
      bookingId,
      status: MATCHING_BOOKING_STATUS.PROVIDER_ACCEPTED,
      booking,
    };
  }

  async handleNegativeResolution(bookingId, reason, trackingMeta = {}) {
    const staged = await this.requestRepo.getStagedReservation(bookingId);
    if (!staged) {
      return {
        bookingId,
        status: MATCHING_BOOKING_STATUS.SEARCHING_PROVIDER,
        reason,
        recommendedProviders: [],
      };
    }

    let fallbackCandidateProvider = null;
    let fallbackLockToken = null;

    try {
      const fallback = await this.searchService.searchNearbyProviders(
        {
          latitude: staged.latitude,
          longitude: staged.longitude,
          serviceId: staged.serviceId,
          radius: 10,
          limit: 5,
        },
        {
          requestId: trackingMeta.requestId || `fallback_${bookingId}`,
          customerId: staged.customerId,
        }
      );

      fallbackCandidateProvider = fallback.providers.find(
        (provider) => String(provider.providerId) !== String(staged.providerId)
      );

      if (fallbackCandidateProvider) {
        fallbackLockToken = crypto.randomUUID();
        const acquired = await this.requestRepo.acquireProviderLock(
          fallbackCandidateProvider.providerId,
          fallbackLockToken
        );

        if (!acquired) {
          fallbackCandidateProvider = null;
          fallbackLockToken = null;
        }
      }
    } catch (error) {
      fallbackCandidateProvider = null;
      fallbackLockToken = null;
    }

    const booking = await this.bookingClient.rejectOrTimeoutMatchingRequest(
      bookingId,
      {
        reason,
        fallbackCandidateProvider:
          fallbackCandidateProvider
            ? {
                providerId: fallbackCandidateProvider.providerId,
                businessName: fallbackCandidateProvider.businessName,
                phone: null,
              }
            : null,
      },
      trackingMeta.requestId
    );

    await Promise.all([
      this.requestRepo.clearStagedReservation(bookingId),
      this.requestRepo.releaseProviderLock(staged.providerId, staged.lockToken),
    ]);

    if (fallbackCandidateProvider && fallbackLockToken) {
      await this.requestRepo.stageReservationState(bookingId, {
        bookingId,
        providerId: fallbackCandidateProvider.providerId,
        serviceId: staged.serviceId,
        customerId: staged.customerId,
        lockToken: fallbackLockToken,
        latitude: staged.latitude,
        longitude: staged.longitude,
        providerSnapshot: {
          businessName: fallbackCandidateProvider.businessName || null,
          phone: null,
        },
      });
    }

    return {
      bookingId,
      status: fallbackCandidateProvider
        ? MATCHING_BOOKING_STATUS.PENDING_PROVIDER_RESPONSE
        : MATCHING_BOOKING_STATUS.SEARCHING_PROVIDER,
      reason,
      booking,
      recommendedProviders: fallbackCandidateProvider ? [fallbackCandidateProvider] : [],
    };
  }

  async handleTimedOutRequest(bookingId) {
    const acquired = await this.requestRepo.acquireProcessingLock(bookingId);
    if (!acquired) {
      return null;
    }

    try {
      return await this.handleNegativeResolution(bookingId, "PROVIDER_TIMEOUT", {
        requestId: `timeout_${bookingId}`,
      });
    } finally {
      await this.requestRepo.releaseProcessingLock(bookingId);
    }
  }
}

module.exports = BookingRequestService;
