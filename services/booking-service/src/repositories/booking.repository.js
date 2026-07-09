const BaseRepository = require('./base.repository');
const Booking = require('../models/booking.model');
const { BOOKING_STATUS } = require('../constants/booking-status');

class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking);
  }

  /**
   * Concurrency Safe Atomic State Mutator. Verifies the expected current state 
   * to eliminate race conditions when providers accept bookings.
   * @param {string} bookingId - Target database document primary key
   * @param {string} currentStatus - Expected source booking status state constant [cite: 194]
   * @param {string} nextStatus - Destination booking status state constant target [cite: 194]
   * @param {Object} [session=null] - Optional database operational session reference [cite: 183]
   * @returns {Promise<mongoose.Document|null>} Mutated state document or null if collision occurs [cite: 204]
   */
  async updateStatus(bookingId, currentStatus, nextStatus, session = null) {
    const options = { new: true, runValidators: true };
    if (session) options.session = session;

    // Direct temporal field sync configuration map mirroring core entity structure metrics
    const timestampFieldMap = {
      [BOOKING_STATUS.PROVIDER_ACCEPTED]: 'acceptedAt',
      [BOOKING_STATUS.ARRIVED]: 'arrivedAt',
      [BOOKING_STATUS.SERVICE_STARTED]: 'serviceStartedAt',
      [BOOKING_STATUS.SERVICE_COMPLETED]: 'serviceCompletedAt',
      [BOOKING_STATUS.COMPLETED]: 'completedAt'
    };

    const updatePayload = { bookingStatus: nextStatus };
    if (timestampFieldMap[nextStatus]) {
      updatePayload[timestampFieldMap[nextStatus]] = new Date();
    }

    return this.model.findOneAndUpdate(
      { 
        _id: bookingId, 
        bookingStatus: currentStatus, 
        deletedAt: null 
      },
      { $set: updatePayload },
      options
    );
  }

  /**
   * Retargets an active booking request to the next provider in the matching cascade queue
   * @param {string} bookingId - Target database booking key identifier
   * @param {Object} nextProviderSnapshot - Next provider's profile data snapshot
   * @param {mongoose.ClientSession} [session=null] - Active database session reference
   */
  async cycleNextProviderFallback(bookingId, nextProviderSnapshot, session = null) {
    const options = { new: true, runValidators: true };
    if (session) options.session = session;

    return this.model.findOneAndUpdate(
      { 
        _id: bookingId, 
        bookingStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE, 
        deletedAt: null 
      },
      {
        $set: {
          providerId: nextProviderSnapshot.providerId,
          providerSnapshot: {
            businessName: nextProviderSnapshot.businessName,
            phone: nextProviderSnapshot.phone
          },
          requestedAt: new Date() // Reset the matching lifecycle timer clock
        }
      },
      options
    );
  }

  async findCustomerBookings(customerId, page = 1, limit = 10) {
    return this.findPaginated({ customerId }, { page, limit });
  }

  async findProviderBookings(providerId, page = 1, limit = 10) {
    return this.findPaginated({ providerId }, { page, limit });
  }

  async findPendingProviderRequests(providerId) {
    return this.find(
      {
        providerId,
        bookingStatus: BOOKING_STATUS.PENDING_PROVIDER_RESPONSE
      },
      null,
      { requestedAt: 1 }
    );
  }

  async findUpcomingBookings(filter = {}, page = 1, limit = 10) {
    const upcomingFilter = {
      ...filter,
      bookingStatus: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.PROVIDER_ACCEPTED] },
      scheduledStartTime: { $gt: new Date() }
    };
    return this.findPaginated(upcomingFilter, { page, limit, sort: { scheduledStartTime: 1 } });
  }

  /**
   * Identifies unassigned local requests using GeoJSON spherical calculations [cite: 704]
   * @param {number} longitude - Geographic coordinate positioning parameter [cite: 681]
   * @param {number} latitude - Geographic coordinate positioning parameter [cite: 681]
   * @param {number} maxDistanceMeters - Maximum calculation distance threshold [cite: 704]
   * @param {Object} [filter={}] - Additional categorical lookup rules
   */
  async findNearbyGeospatialBookings(longitude, latitude, maxDistanceMeters, filter = {}) {
    return this.model.find({
      ...filter,
      bookingStatus: BOOKING_STATUS.REQUESTED,
      deletedAt: null,
      'customerAddressSnapshot.location': {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: maxDistanceMeters
        }
      }
    }).lean();
  }

  async updateSchedule(bookingId, startTime, endTime, session = null) {
    const options = { new: true, runValidators: true };
    if (session) options.session = session;

    return this.model.findOneAndUpdate(
      { _id: bookingId, deletedAt: null },
      {
        $set: {
          scheduledStartTime: new Date(startTime),
          scheduledEndTime: new Date(endTime)
        },
        $inc: { rescheduleCount: 1 } // Concurrency safe atomic increment protection
      },
      options
    );
  }
}

module.exports = BookingRepository;
