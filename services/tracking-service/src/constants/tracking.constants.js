module.exports = {
  TRACKING_ROLES: Object.freeze({
    CUSTOMER: 'CUSTOMER',
    PROVIDER: 'PROVIDER',
    ADMIN: 'ADMIN'
  }),
  SOCKET_EVENTS: Object.freeze({
    INBOUND: {
      UPDATE_LOCATION: 'tracking:v1:update', // Future-proof version prefix added
      JOIN_TRACKING: 'tracking:join',
      LEAVE_TRACKING: 'tracking:leave'
    },
    OUTBOUND: {
      STREAM_COORDINATES: 'telemetry:stream',
      PROVIDER_ARRIVED: 'geofence:arrived',
      EXCEPTION_RAISED: 'tracking:error'
    }
  }),
  GEOFENCE_STATES: Object.freeze({
    NONE: 'NONE',
    NEARBY: 'NEARBY',
    ARRIVED: 'ARRIVED',
    COMPLETED: 'COMPLETED'
  }),
  STREAM_EVENTS: Object.freeze({
    TRACKING_NEARBY: 'tracking:nearby',
    TRACKING_ARRIVED: 'tracking:arrived',
    LIFECYCLE_CLEANUP: 'booking:lifecycle:cleanup',
    LIFECYCLE_ACCEPTED: 'booking:lifecycle:accepted'
  }),
  // Senior Improvement: Centralized room builders mapping patterns cleanly
  ROOMS: Object.freeze({
    booking: (id) => `room:booking:${id}`,
    provider: (id) => `room:provider:${id}`,
    customer: (id) => `room:customer:${id}`,
    adminTracking: () => 'room:admin:tracking'
  })
};