const BookingRepository = require('../../repositories/booking.repository');
const BookingValidationService = require('./booking-validation.service');
const BookingPricingService = require('./booking-pricing.service');
const BookingTimelineService = require('../timeline/timeline.service');
const BookingEventService = require('../event/booking-event.service');
const generateBookingNumber = require('../../utils/booking-number.generator');
const ApiError = require('../../utils/api.error');
const profileClientService = require('../profile/profile-client.service');
const serviceManagementClientService = require('../catalog/service-management-client.service');
const { BOOKING_STATUS } = require('../../constants/booking-status');
const { PAYMENT_STATUS } = require('../../constants/payment-status');
const { BOOKING_EVENTS } = require('../../constants/event.constants');

class BookingCreationService {
  constructor() {
    this.bookingRepo = new BookingRepository();
    this.timelineService = new BookingTimelineService();
    this.validationService = BookingValidationService;
    this.pricingService = BookingPricingService;
    this.eventService = new BookingEventService();
  }

  async buildCustomerSnapshot(actor) {
    const customerProfile = await profileClientService.getCustomerProfile(actor.accessToken);

    if (!customerProfile?.fullName) {
      throw new ApiError('Customer profile is incomplete. Full name is required before creating a booking.', 403);
    }

    if (!actor.phone) {
      throw new ApiError('Authenticated customer phone number is unavailable.', 403);
    }

    return {
      fullName: customerProfile.fullName,
      phone: actor.phone
    };
  }

  async buildProviderSelection(dto, actor) {
    const [longitude, latitude] = dto.customerAddressSnapshot.location.coordinates;

    const [service, providerOffer] = await Promise.all([
      serviceManagementClientService.getService(dto.serviceId),
      serviceManagementClientService.getProviderForService(
        dto.serviceId,
        dto.providerServiceId,
        actor.accessToken,
        { latitude, longitude }
      )
    ]);

    if (String(providerOffer.service?.id || providerOffer.serviceId || '') !== String(dto.serviceId)) {
      throw new ApiError('Selected provider service does not belong to the requested service.', 409);
    }

    return {
      service,
      providerOffer
    };
  }

  /**
   * Orchestrates the safe instantiation of a fresh booking contract
   */
  async create(actor, dto, session) {
    this.validationService.validateSchedulingWindow(dto.scheduledStartTime, dto.scheduledEndTime);
    const customerSnapshot = await this.buildCustomerSnapshot(actor);
    const { providerOffer } = await this.buildProviderSelection(dto, actor);

    const resolvedDistanceKm =
      typeof providerOffer.distanceKm === 'number' && Number.isFinite(providerOffer.distanceKm)
        ? providerOffer.distanceKm
        : 0;

    const invoice = this.pricingService.calculateInvoice(
      providerOffer.price,
      resolvedDistanceKm,
      { couponCode: dto.couponCode, couponDiscountAmount: dto.couponDiscountAmount }
    );

    const bookingPayload = {
      bookingNumber: generateBookingNumber(),
      customerId: actor.userId,
      providerId: providerOffer.providerId,
      serviceId: dto.serviceId,
      providerServiceId: dto.providerServiceId,
      bookingType: dto.bookingType,
      bookingStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
      paymentStatus: PAYMENT_STATUS.PENDING,
      scheduledStartTime: dto.scheduledStartTime,
      scheduledEndTime: dto.scheduledEndTime,
      customerSnapshot,
      providerSnapshot: {
        businessName: providerOffer.providerName || null,
        phone: null
      },
      snapshotPricing: invoice.pricing,
      customerAddressSnapshot: dto.customerAddressSnapshot,
      additionalNotes: dto.additionalNotes || ''
    };

    const booking = await this.bookingRepo.create(bookingPayload, session);

    await this.timelineService.logTransition({
      booking,
      fromStatus: BOOKING_STATUS.REQUESTED,
      toStatus: booking.bookingStatus,
      actor,
      metadata: { action: `INITIALIZE_${booking.bookingStatus}` },
      session
    });

    await this.eventService.dispatchEvent(
      booking._id,
      BOOKING_EVENTS.CREATED,
      { bookingNumber: booking.bookingNumber, customerId: booking.customerId, totalAmount: invoice.pricing.totalAmountToPay },
      session
    );

    return booking;
  }
}

module.exports = BookingCreationService;
