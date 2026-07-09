# Pre-Matching Microservices Test Guide

This guide is for testing the current platform before starting:

- Matching microservice
- Location microservice

Covered services:

- `auth-service`
- `profile-service`
- `service-management-service`
- `booking-service`

---

## Goal

Before building matching and location, we want to prove that:

1. users can authenticate
2. customer and provider profiles can be created
3. admin can create catalog data
4. provider can offer a service
5. customer can create a booking from a valid provider service
6. provider can complete the booking lifecycle

---

## Service Base URLs

Use these in Postman environment variables:

```text
AUTH_BASE_URL=http://127.0.0.1:4000
PROFILE_BASE_URL=http://127.0.0.1:4001
SERVICE_BASE_URL=http://127.0.0.1:4002
BOOKING_BASE_URL=http://127.0.0.1:3001
```

Recommended variables:

```text
customerToken=
providerToken=
adminToken=
customerRefreshToken=
providerRefreshToken=
adminRefreshToken=
categoryId=
serviceId=
providerServiceId=
bookingId=
```

---

## Run Order

Start and verify services in this order:

1. `auth-service`
2. `profile-service`
3. `service-management-service`
4. `booking-service`

Health checks:

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/health"
curl --location "{{PROFILE_BASE_URL}}/api/v1/health"
curl --location "{{SERVICE_BASE_URL}}/api/v1/health"
curl --location "{{BOOKING_BASE_URL}}/health"
```

---

## Phase 1: Auth Service

Auth routes:

- `POST /api/v1/auth/send-otp`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/refresh-token`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`

### 1. Customer Login

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/send-otp" \
--header "Content-Type: application/json" \
--data "{
  \"phone\": \"9999999999\"
}"
```

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/verify-otp" \
--header "Content-Type: application/json" \
--data "{
  \"phone\": \"9999999999\",
  \"otp\": \"123456\",
  \"role\": \"customer\",
  \"deviceId\": \"customer-device-1\",
  \"deviceName\": \"Postman Customer\",
  \"platform\": \"WEB\",
  \"appVersion\": \"1.0.0\"
}"
```

Save:

- `accessToken` -> `customerToken`
- `refreshToken` -> `customerRefreshToken`

### 2. Provider Login

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/verify-otp" \
--header "Content-Type: application/json" \
--data "{
  \"phone\": \"8888888888\",
  \"otp\": \"123456\",
  \"role\": \"provider\",
  \"deviceId\": \"provider-device-1\",
  \"deviceName\": \"Postman Provider\",
  \"platform\": \"WEB\",
  \"appVersion\": \"1.0.0\"
}"
```

Save:

- `accessToken` -> `providerToken`
- `refreshToken` -> `providerRefreshToken`

### 3. Admin Login

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/verify-otp" \
--header "Content-Type: application/json" \
--data "{
  \"phone\": \"7777777777\",
  \"otp\": \"123456\",
  \"role\": \"admin\",
  \"deviceId\": \"admin-device-1\",
  \"deviceName\": \"Postman Admin\",
  \"platform\": \"WEB\",
  \"appVersion\": \"1.0.0\"
}"
```

Save:

- `accessToken` -> `adminToken`
- `refreshToken` -> `adminRefreshToken`

### 4. Verify Current User

```bash
curl --location "{{AUTH_BASE_URL}}/api/v1/auth/me" \
--header "Authorization: Bearer {{customerToken}}"
```

Expected:

- `id`
- `phone`
- `role`
- `accountStatus`

---

## Phase 2: Profile Service

Critical routes for booking flow:

- `POST /api/v1/profiles/customer`
- `GET /api/v1/profiles/customer`
- `POST /api/v1/profiles/provider`
- `GET /api/v1/profiles/provider`
- `PUT /api/v1/profiles/provider/online-status`
- `POST /api/v1/addresses`
- `GET /api/v1/addresses`

Note:

- Profile service also has `/api/v1/provider-services`, documents, bank details, and internal routes.
- For booking flow, the **required** profile pieces are:
  - customer profile
  - provider profile
  - customer address

### 5. Create Customer Profile

```bash
curl --location "{{PROFILE_BASE_URL}}/api/v1/profiles/customer" \
--header "Authorization: Bearer {{customerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"fullName\": \"Test Customer\",
  \"gender\": \"Male\",
  \"dateOfBirth\": \"1998-05-10\",
  \"email\": \"customer@test.com\",
  \"language\": \"English\"
}"
```

### 6. Create Customer Address

```bash
curl --location "{{PROFILE_BASE_URL}}/api/v1/addresses" \
--header "Authorization: Bearer {{customerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"label\": \"home\",
  \"addressLine1\": \"123 Main Street\",
  \"addressLine2\": \"Near Park\",
  \"city\": \"Mumbai\",
  \"state\": \"Maharashtra\",
  \"pincode\": \"400001\",
  \"country\": \"India\",
  \"latitude\": 19.0760,
  \"longitude\": 72.8777,
  \"isPrimary\": true
}"
```

### 7. Create Provider Profile

```bash
curl --location "{{PROFILE_BASE_URL}}/api/v1/profiles/provider" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"businessName\": \"Fast Electric Works\",
  \"experience\": 5,
  \"workingRadius\": 20,
  \"latitude\": 19.0800,
  \"longitude\": 72.8800,
  \"workingHours\": {
    \"start\": \"09:00\",
    \"end\": \"18:00\"
  },
  \"bio\": \"Home electrical repair expert\"
}"
```

### 8. Mark Provider Online

```bash
curl --location --request PUT "{{PROFILE_BASE_URL}}/api/v1/profiles/provider/online-status" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"isOnline\": true
}"
```

### 9. Provider Approval Note

Booking/service-management flows often expect the provider to be approved or verified.
If your provider approval workflow is enforced, complete that step before continuing.

You can also trigger approval request:

```bash
curl --location --request POST "{{PROFILE_BASE_URL}}/api/v1/profiles/provider/request-approval" \
--header "Authorization: Bearer {{providerToken}}"
```

---

## Phase 3: Service Management Service

This service is the main source of truth for:

- categories
- official services
- provider service offers used by booking-service

Critical routes for booking flow:

- `POST /api/v1/admin/categories`
- `POST /api/v1/admin/services`
- `POST /api/v1/provider/services`
- `GET /api/v1/services`
- `GET /api/v1/services/:serviceId/providers`

### 10. Admin Creates Category

```bash
curl --location "{{SERVICE_BASE_URL}}/api/v1/admin/categories" \
--header "Authorization: Bearer {{adminToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"name\": \"Home Services\",
  \"slug\": \"home-services\",
  \"description\": \"Home maintenance services\",
  \"isActive\": true
}"
```

Save:

- `categoryId`

### 11. Admin Creates Service

```bash
curl --location "{{SERVICE_BASE_URL}}/api/v1/admin/services" \
--header "Authorization: Bearer {{adminToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"categoryId\": \"{{categoryId}}\",
  \"name\": \"Electrician\",
  \"slug\": \"electrician\",
  \"description\": \"Electrical repair and installation\",
  \"estimatedDuration\": 60,
  \"isPopular\": true,
  \"isActive\": true
}"
```

Save:

- `serviceId`

### 12. Provider Adds Service Offer

This is the provider service record used later by booking-service.

```bash
curl --location "{{SERVICE_BASE_URL}}/api/v1/provider/services" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"serviceId\": \"{{serviceId}}\",
  \"price\": 499,
  \"experience\": 5,
  \"isAvailable\": true
}"
```

Save:

- `providerServiceId`

### 13. Verify Service Catalog

```bash
curl --location "{{SERVICE_BASE_URL}}/api/v1/services"
```

### 14. Verify Provider Search For Service

```bash
curl --location "{{SERVICE_BASE_URL}}/api/v1/services/{{serviceId}}/providers?latitude=19.0760&longitude=72.8777" \
--header "Authorization: Bearer {{customerToken}}"
```

Expected:

- provider list includes your `providerServiceId`
- provider name
- price
- distance
- service metadata

---

## Phase 4: Booking Service

For detailed booking-only guide, also see:

[booking-service-postman-guide.md](/D:/JustTap/docs/booking-service-postman-guide.md)

Critical booking flow:

1. customer creates booking
2. provider accepts
3. provider moves to `ON_THE_WAY`
4. provider moves to `ARRIVED`
5. start-service OTP verified
6. complete-service OTP verified
7. provider marks booking `COMPLETED`

### 15. Create Booking

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/customer" \
--header "Authorization: Bearer {{customerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"serviceId\": \"{{serviceId}}\",
  \"providerServiceId\": \"{{providerServiceId}}\",
  \"bookingType\": \"SCHEDULED\",
  \"scheduledStartTime\": \"2026-07-12T10:00:00.000Z\",
  \"scheduledEndTime\": \"2026-07-12T11:00:00.000Z\",
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

Save:

- `bookingId`

### 16. Customer Reads Booking

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/customer/{{bookingId}}" \
--header "Authorization: Bearer {{customerToken}}"
```

### 17. Provider Accepts Booking

```bash
curl --location --request PATCH "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/accept" \
--header "Authorization: Bearer {{providerToken}}"
```

### 18. Provider Advances to ON_THE_WAY

```bash
curl --location --request PATCH "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/advance" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"nextStatus\": \"ON_THE_WAY\"
}"
```

### 19. Provider Advances to ARRIVED

```bash
curl --location --request PATCH "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/advance" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"nextStatus\": \"ARRIVED\"
}"
```

### 20. OTP-Based Start / Complete

Use:

- `POST /api/v1/bookings/provider/:id/verify-handshake`

With:

- `purpose = START_SERVICE`
- `purpose = COMPLETE_SERVICE`

Note:

- raw OTP is not exposed by API
- you need DB/log access or debug support to complete this part

### 21. Provider Marks Booking Completed

```bash
curl --location --request PATCH "{{BOOKING_BASE_URL}}/api/v1/bookings/provider/{{bookingId}}/advance" \
--header "Authorization: Bearer {{providerToken}}" \
--header "Content-Type: application/json" \
--data "{
  \"nextStatus\": \"COMPLETED\"
}"
```

### 22. Customer Timeline

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/bookings/customer/{{bookingId}}/timeline" \
--header "Authorization: Bearer {{customerToken}}"
```

### 23. Admin Booking Analytics

```bash
curl --location "{{BOOKING_BASE_URL}}/api/v1/admin/bookings/analytics" \
--header "Authorization: Bearer {{adminToken}}"
```

---

## Minimum Acceptance Checklist

You are ready to move toward matching/location when all of these pass:

- auth tokens work for customer/provider/admin
- `GET /auth/me` returns correct role and status
- customer profile exists and has `fullName`
- provider profile exists and is usable
- admin can create category and service
- provider can add service offer in service-management
- service catalog returns that provider offer
- booking can be created from `serviceId + providerServiceId`
- provider can accept and advance booking
- timeline/history/analytics endpoints return expected results

---

## Important Notes

### 1. Use Service-Management Provider Services For Booking

Booking-service currently depends on provider offers created in:

- `service-management-service`
- route: `POST /api/v1/provider/services`

Not the similarly named profile-service route.

### 2. Booking Depends On Other Services

Booking creation is not standalone anymore. It requires:

- auth-service validation
- profile-service customer lookup
- service-management service/provider lookup

### 3. OTP Testing Is Still Manual

To fully verify service start/completion handshake, you still need:

- DB lookup
- logs
- or a future debug endpoint

### 4. Public Dispute Routes Are Not Mounted

Dispute service code exists in booking-service, but there is no public mounted route for Postman testing yet.

