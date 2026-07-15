const { redisClient } = require("../config/redis");
const env = require("../config/env");
const keys = require("../constants/redisKeys");

class BookingRequestRepository {
  constructor() {
    this.releaseLockLua = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;
  }

  async acquireProviderLock(providerId, lockToken, ttlSeconds = env.BOOKING_REQUEST_TTL_SECONDS) {
    const result = await redisClient.set(keys.providerLock(providerId), lockToken, {
      NX: true,
      EX: ttlSeconds,
    });
    return result === "OK" || result === true;
  }

  async releaseProviderLock(providerId, lockToken) {
    await redisClient.eval(this.releaseLockLua, {
      keys: [keys.providerLock(providerId)],
      arguments: [lockToken],
    });
  }

  async stageReservationState(
    bookingId,
    metadata,
    ttlSeconds = env.BOOKING_REQUEST_TTL_SECONDS
  ) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const payload = {
      ...metadata,
      bookingId: String(metadata.bookingId || bookingId),
      providerId: String(metadata.providerId),
      serviceId: String(metadata.serviceId),
      customerId: String(metadata.customerId),
      lockToken: String(metadata.lockToken),
      latitude: Number(metadata.latitude),
      longitude: Number(metadata.longitude),
      createdAt: metadata.createdAt || new Date().toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
    };

    await redisClient
      .multi()
      .set(keys.bookingRequest(bookingId), JSON.stringify(payload), { EX: ttlSeconds })
      .zAdd(keys.bookingRequestTimeouts, { score: expiresAt, value: String(bookingId) })
      .exec();

    return payload;
  }

  async getStagedReservation(bookingId) {
    const data = await redisClient.get(keys.bookingRequest(bookingId));
    return data ? JSON.parse(data) : null;
  }

  async clearStagedReservation(bookingId) {
    await redisClient
      .multi()
      .del(keys.bookingRequest(bookingId))
      .zRem(keys.bookingRequestTimeouts, String(bookingId))
      .exec();
  }

  async acquireProcessingLock(bookingId, ttlSeconds = 30) {
    const result = await redisClient.set(
      keys.bookingRequestProcessingLock(bookingId),
      "1",
      { NX: true, EX: ttlSeconds }
    );
    return result === "OK" || result === true;
  }

  async releaseProcessingLock(bookingId) {
    await redisClient.del(keys.bookingRequestProcessingLock(bookingId));
  }

  async popExpiredBookingIds(now = Date.now(), limit = env.TIMEOUT_WORKER_BATCH_SIZE) {
    const bookingIds = await redisClient.zRangeByScore(
      keys.bookingRequestTimeouts,
      0,
      now,
      { LIMIT: { offset: 0, count: limit } }
    );

    if (!bookingIds.length) {
      return [];
    }

    await redisClient.zRem(keys.bookingRequestTimeouts, bookingIds);
    return bookingIds;
  }
}

module.exports = BookingRequestRepository;
