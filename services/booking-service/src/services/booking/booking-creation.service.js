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
    let customerProfile = null;
    try {
      customerProfile = await profileClientService.getCustomerProfile(actor.accessToken);
    } catch (err) {
      customerProfile = null;
    }

    const resolvedFullName =
      customerProfile?.fullName?.trim() ||
      actor.fullName?.trim() ||
      actor.name?.trim() ||
      (actor.phone ? `Customer ${actor.phone.slice(-4)}` : 'Valued Customer');

    const resolvedPhone =
      actor.phone ||
      actor.phoneNumber ||
      customerProfile?.phone ||
      customerProfile?.emergencyContact?.phone ||
      '+910000000000';

    return {
      fullName: resolvedFullName,
      phone: resolvedPhone
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

    if (!providerOffer) {
      throw new ApiError('Selected provider service offer is no longer available.', 404);
    }

    const offerServiceId = String(
      providerOffer.service?.id ||
      providerOffer.service?._id ||
      providerOffer.serviceId?._id ||
      providerOffer.serviceId ||
      dto.serviceId
    );

    if (offerServiceId && String(dto.serviceId) && offerServiceId !== String(dto.serviceId)) {
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
    const existingBooking = await this.bookingRepo.findByCustomerAndIdempotencyKey(
      actor.userId,
      actor.idempotencyKey
    );
    if (existingBooking) return existingBooking;

    // Check if an identical booking was created in the last 15 seconds for the same customer, service, and time
    const recentDuplicate = await this.bookingRepo.findOne({
      customerId: actor.userId,
      serviceId: dto.serviceId,
      providerServiceId: dto.providerServiceId,
      scheduledStartTime: new Date(dto.scheduledStartTime),
      createdAt: { $gte: new Date(Date.now() - 15000) }
    }, null, { session });

    if (recentDuplicate) {
      return recentDuplicate;
    }

    // Check if customer has any unpaid overdue bookings
    // Exclude: test bookings (BK-TEST-*) and already-cancelled bookings (CANCELLED+PENDING ghost state)
    const overdueCutoffTime = new Date(Date.now() - (72 * 60 * 60 * 1000));
    const overdueBooking = await this.bookingRepo.findOne({
      customerId: actor.userId,
      bookingStatus: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.FAILED] },
      bookingNumber: { $not: /^BK-TEST-/ },
      $or: [
        { bookingStatus: BOOKING_STATUS.OVERDUE },
        { paymentStatus: PAYMENT_STATUS.OVERDUE },
        {
          bookingStatus: BOOKING_STATUS.PAYMENT_PENDING,
          updatedAt: { $lte: overdueCutoffTime }
        }
      ]
    });

    if (overdueBooking) {
      throw new ApiError('New booking creation blocked: You have an unpaid overdue booking. Please clear your outstanding balance to proceed.', 403);
    }

    this.validationService.validateSchedulingWindow(dto.scheduledStartTime, dto.scheduledEndTime, dto.bookingType);
    const customerSnapshot = await this.buildCustomerSnapshot(actor);
    const { service, providerOffer } = await this.buildProviderSelection(dto, actor);

    if (!service?.isActive) {
      throw new ApiError('Selected service is no longer available for booking.', 409);
    }

    const resolvedDistanceKm =
      typeof providerOffer.distanceKm === 'number' && Number.isFinite(providerOffer.distanceKm)
        ? providerOffer.distanceKm
        : 0;

    const offerPrice = Number(
      providerOffer.price ?? providerOffer.baseRate ?? providerOffer.pricing?.value ?? 500
    );

    const invoice = this.pricingService.calculateInvoice(
      offerPrice,
      resolvedDistanceKm,
      {}
    );

    const bookingPayload = {
      bookingNumber: generateBookingNumber(),
      customerId: actor.userId,
      idempotencyKey: actor.idempotencyKey,
      providerId: providerOffer.providerId,
      serviceId: dto.serviceId,
      providerServiceId: dto.providerServiceId,
      bookingType: dto.bookingType,
      bookingStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE,
      paymentStatus: PAYMENT_STATUS.PENDING,
      scheduledStartTime: dto.scheduledStartTime,
      // Service duration is authoritative. Ignore a client-provided end time.
      scheduledEndTime: new Date(
        new Date(dto.scheduledStartTime).getTime() + Number(service.estimatedDuration) * 60 * 1000
      ),
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
