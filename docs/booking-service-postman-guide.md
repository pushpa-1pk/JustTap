# Booking Service Test Guide

## What This Microservice Does

The booking service manages the full booking lifecycle for JustTap:

1. Customer creates a booking for a selected provider service.
2. Booking service validates the customer through `auth-service`.
3. Booking service fetches customer profile from `profile-service`.
4. Booking service validates the selected service/provider from `service-management-service`.
5. Booking is stored with:
   - customer snapshot
   - provider snapshot
   - price snapshot
   - address snapshot
   - booking timeline entry
   - outbox event
6. Provider accepts the booking.
7. Provider advances the booking through lifecycle states.
8. OTP is used to verify start/completion handshakes.
9. Customer/provider/admin can cancel or reschedule when allowed.
10. Admin can search bookings, view analytics, and force assign a provider.

## Upstream Dependencies

This microservice depends on:

- `auth-service`
- `profile-service`
- `service-management-service`
- MongoDB
- Redis

Important:

- Booking creation now **does not trust client snapshots or client price input**.
- It fetches customer/service/provider data from the upstream services.

## Base URLs

Use these values in Postman variables:

```text
BOOKING_BASE_URL=http://127.0.0.1:3001
AUTH_BASE_URL=http://127.0.0.1:4000
PROFILE_BASE_URL=http://127.0.0.1:4001
SERVICE_BASE_URL=http://127.0.0.1:4002
```

Recommended Postman variables:

```text
customerToken=
providerToken=
adminToken=
serviceId=
providerServiceId=
bookingId=
```

## Required Environment Variables For Booking Service

At minimum:

```text
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/justtap-booking
REDIS_URL=redis://127.0.0.1:6379
JWT_ACCESS_SECRET=your-access-secret
AUTH_SERVICE_URL=http://127.0.0.1:4000
PROFILE_SERVICE_URL=http://127.0.0.1:4001
SERVICE_MANAGEMENT_SERVICE_URL=http://127.0.0.1:4002
```

## Booking Lifecycle

Main public lifecycle path:

```text
PENDING_PROVIDER_RESPONSE
-> PROVIDER_ACCEPTED
-> ON_THE_WAY
-> ARRIVED
-> SERVICE_STARTED
-> SERVICE_COMPLETED
-> COMPLETED
```

Other operational states:

```text
REQUESTED
SEARCHING_PROVIDER
PAYMENT_PENDING
DISPUTED
CANCELLED
FAILED
```

## Public Endpoints

### Health

- `GET /health`

### Customer

- `POST /api/v1/bookings/customer`
- `GET /api/v1/bookings/customer/history`
- `GET /api/v1/bookings/customer/:id`
- `GET /api/v1/bookings/customer/:id/timeline`

### Provider Commands

- `PATCH /api/v1/bookings/provider/:id/accept`
- `PATCH /api/v1/bookings/provider/:id/advance`
- `POST /api/v1/bookings/provider/:id/verify-handshake`

### Provider Queries

- `GET /api/v1/bookings/provider/pending`
- `GET /api/v1/bookings/provider/active`
- `GET /api/v1/bookings/provider/history`
- `GET /api/v1/bookings/provider/:id`

### Shared Command Endpoints

- `POST /api/v1/bookings/:id/cancel`
- `POST /api/v1/bookings/:id/reschedule`

### Admin

- `GET /api/v1/admin/bookings/search`
- `GET /api/v1/admin/bookings/analytics`
- `POST /api/v1/admin/bookings/:id/assign-provider`

## Important Current Limitation

There are service-layer dispute classes in the codebase, but there are currently **no public dispute routes mounted** for testing through HTTP.

## Postman / cURL Test Flow

### 1. Health Check

```bash
curl --location "{{BOOKING_BASE_URL}}/health"
```

### 2. Get Customer Access Token

Use auth-service first:

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/send-otp" \
--header "Content-Type: application/json" \
--data "{\"phone\":\"9999999999\"}"
```

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/verify-otp" \
--header "Content-Type: application/json" \
--data "{
  \"phone\":\"9999999999\",
  \"otp\":\"123456\",
  \"role\":\"customer\",
  \"deviceId\":\"postman-customer-device\",
  \"platform\":\"WEB\"
}"
```

Save:

- `accessToken` as `customerToken`

### 3. Get Provider Access Token

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/verify-otp" \
--header "Content-Type: application/json" \
--data "{
  \"phone\":\"8888888888\",
  \"otp\":\"123456\",
  \"role\":\"provider\",
  \"deviceId\":\"postman-provider-device\",
  \"platform\":\"WEB\"
}"
```

Save:

- `accessToken` as `providerToken`

### 4. Get Admin Access Token

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/verify-otp" \
--header "Content-Type: application/json" \
--data "{
  \"phone\":\"7777777777\",
  \"otp\":\"123456\",
  \"role\":\"admin\",
  \"deviceId\":\"postman-admin-device\",
  \"platform\":\"WEB\"
}"
```

Save:

- `accessToken` as `adminToken`

### 5. Make Sure Customer Profile Exists

Booking creation needs a customer profile with `fullName`.

```bash
curl --location "{{PROFILE_BASE_URL}}/api/v1/profiles/customer" \
--header "Authorization: Bearer {{customerToken}}"
```

If profile does not exist, create it in profile-service first.

### 6. Find a Service and Provider Service

Get a valid service:

```bash
curl --location "{{SERVICE_BASE_URL}}/api/v1/services"
```

Get providers for one service:

```bash
curl --location "{{SERVICE_BASE_URL}}/api/v1/services/{{serviceId}}/providers?latitude=19.0760&longitude=72.8777" \
--header "Authorization: Bearer {{customerToken}}"
```

From response save:

- `serviceId`
- `providerServiceId`

### 7. Create Booking

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/customer" \
--header "Authorization: Bearer {{customerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"serviceId\": \"{{serviceId}}\",
  \"providerServiceId\": \"{{providerServiceId}}\",
  \"bookingType\": \"SCHEDULED\",
  \"scheduledStartTime\": \"2026-07-10T10:00:00.000Z\",
  \"scheduledEndTime\": \"2026-07-10T11:00:00.000Z\",
  \"couponCode\": \"\",
  \"couponDiscountAmount\": 0,
  \"customerAddressSnapshot\": {
    \"label\": \"Home\",
    \"addressLine1\": \"123 Main Street\",
    \"addressLine2\": \"Near Park\",
    \"landmark\": \"Blue Gate\",
    \"city\": \"Mumbai\",
    \"state\": \"Maharashtra\",
    \"pincode\": \"400001\",
    \"location\": {
      \"type\": \"Point\",
      \"coordinates\": [72.8777, 19.0760]
    }
  },
  \"additionalNotes\": \"Please call before arrival\"
}"
```

Expected:

- booking created
- status should start as `PENDING_PROVIDER_RESPONSE`
- timeline entry created
- outbox event created

Save:

- `bookingId`

### 8. Customer Reads Booking

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/customer/{{bookingId}}" \
--header "Authorization: Bearer {{customerToken}}"
```

### 9. Customer Reads Timeline

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/customer/{{bookingId}}/timeline" \
--header "Authorization: Bearer {{customerToken}}"
```

### 10. Provider Pending Queue

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/pending" \
--header "Authorization: Bearer {{providerToken}}"
```

### 11. Provider Accepts Booking

```bash
curl --location --request PATCH "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/accept" \
--header "Authorization: Bearer {{providerToken}}"
```

Expected:

- status becomes `PROVIDER_ACCEPTED`

### 12. Provider Advances to ON_THE_WAY

```bash
curl --location --request PATCH "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/advance" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"nextStatus\": \"ON_THE_WAY\"
}"
```

### 13. Provider Advances to ARRIVED

```bash
curl --location --request PATCH "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/advance" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"nextStatus\": \"ARRIVED\"
}"
```

Expected:

- OTP should be generated internally for `START_SERVICE`

### 14. Provider Verifies START_SERVICE OTP

You need the OTP value from DB/logs because the current service stores it hashed and does not expose a public OTP-read endpoint.

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/verify-handshake" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"rawOtp\": \"123456\",
  \"purpose\": \"START_SERVICE\"
}"
```

Expected:

- status becomes `SERVICE_STARTED`

### 15. Provider Verifies COMPLETE_SERVICE OTP

After `START_SERVICE` verification, the service now generates a second OTP for completion.

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/verify-handshake" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"rawOtp\": \"123456\",
  \"purpose\": \"COMPLETE_SERVICE\"
}"
```

Expected:

- status becomes `SERVICE_COMPLETED`
- payment status is marked `PAID`

### 16. Provider Marks Booking COMPLETED

```bash
curl --location --request PATCH "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/advance" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"nextStatus\": \"COMPLETED\"
}"
```

### 17. Cancel Booking

Customer/provider/admin can call:

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/{{bookingId}}/cancel" \
--request POST \
--header "Authorization: Bearer {{customerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"reasonCode\": \"CUSTOMER_CHANGED_MIND\",
  \"customExplanation\": \"No longer needed\"
}"
```

### 18. Reschedule Booking

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/{{bookingId}}/reschedule" \
--request POST \
--header "Authorization: Bearer {{customerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"newStartTime\": \"2026-07-11T12:00:00.000Z\",
  \"newEndTime\": \"2026-07-11T13:00:00.000Z\",
  \"reasonCode\": \"CUSTOMER_REQUEST\",
  \"customExplanation\": \"Need later slot\"
}"
```

### 19. Customer Booking History

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/customer/history?page=1&limit=10" \
--header "Authorization: Bearer {{customerToken}}"
```

### 20. Provider Active Bookings

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/active?page=1&limit=10" \
--header "Authorization: Bearer {{providerToken}}"
```

### 21. Admin Search

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/admin/bookings/search?page=1&limit=10" \
--header "Authorization: Bearer {{adminToken}}"
```

### 22. Admin Analytics

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/admin/bookings/analytics" \
--header "Authorization: Bearer {{adminToken}}"
```

### 23. Admin Force Assign Provider

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/admin/bookings/{{bookingId}}/assign-provider" \
--request POST \
--header "Authorization: Bearer {{adminToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"providerId\": \"64f111111111111111111111\",
  \"businessName\": \"Provider Business Name\",
  \"phone\": \"+919999999999\"
}"
```

## Validation Rules You Should Expect

### Create Booking

- `serviceId` required
- `providerServiceId` required
- `bookingType` must be `INSTANT` or `SCHEDULED`
- `scheduledStartTime` must be future
- `scheduledEndTime` must be after `scheduledStartTime`
- valid GeoJSON coordinates required

### Advance Status

- `nextStatus` must be a known booking status

### Verify OTP

- `rawOtp` must be exactly 6 digits
- `purpose` must be `START_SERVICE` or `COMPLETE_SERVICE`

### Cancel

- `reasonCode` must be one of:
  - `CUSTOMER_CHANGED_MIND`
  - `FOUND_BETTER_PRICE`
  - `PROVIDER_DELAYED`
  - `PROVIDER_NO_SHOW`
  - `CUSTOMER_NO_SHOW`
  - `EMERGENCY`
  - `OTHER`

### Reschedule

- `newStartTime` must be future
- `newEndTime` must be after `newStartTime`
- `reasonCode` must be one of:
  - `CUSTOMER_REQUEST`
  - `PROVIDER_REQUEST`
  - `EMERGENCY`
  - `WEATHER`
  - `OTHER`

## What Happens Internally On Booking Creation

When customer calls `POST /api/v1/bookings/customer`:

1. Token is verified locally.
2. Booking service validates user against `auth-service`.
3. Booking service fetches customer profile from `profile-service`.
4. Booking service fetches service/provider info from `service-management-service`.
5. It calculates pricing snapshot internally.
6. It creates booking document in MongoDB.
7. It writes timeline entry.
8. It writes outbox event for async processing.

## Good Test Order

Use this order:

1. `GET /health`
2. get customer/provider/admin tokens
3. verify customer profile exists
4. get `serviceId`
5. get `providerServiceId`
6. create booking
7. read booking
8. provider pending list
9. provider accept
10. provider advance states
11. timeline check
12. cancel/reschedule scenarios
13. admin search/analytics

## Known Practical Testing Note

For OTP-based handshake testing, this service does not expose the raw OTP in HTTP responses. You will need one of:

- a debug-only OTP endpoint
- DB inspection
- logs/dev instrumentation
