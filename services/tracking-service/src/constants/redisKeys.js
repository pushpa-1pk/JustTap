const RESCHEDULE_STATUS = Object.freeze({
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED"
});

module.exports = {
  providerPresence: (id) => `provider:presence:${id}`,
  providerLocationKey: 'provider_locations',
  activeTelemetryBuffer: (bookingId) => `tracking:booking:${bookingId}:latest`,
  socketSessionMapping: (userId) => `socket:user:${userId}:sessions`,
  geofenceStateLock: (bookingId, phase) => `tracking:geofence:${bookingId}:lock:${phase}`,
  RESCHEDULE_STATUS
};