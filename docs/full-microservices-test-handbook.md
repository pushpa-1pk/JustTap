# Full Microservices Test Handbook

This document helps you test the current JustTap platform before building:

- matching microservice
- location microservice

Covered services:

- `auth-service`
- `profile-service`
- `service-management-service`
- `booking-service`

Related guides:

- [pre-matching-microservices-test-guide.md](/D:/JustTap/docs/pre-matching-microservices-test-guide.md)
- [booking-service-postman-guide.md](/D:/JustTap/docs/booking-service-postman-guide.md)
- [pre-matching-local.environment.json](/D:/JustTap/docs/postman/pre-matching-local.environment.json)

## Before Running Anything

You should have:

- Node.js installed
- MongoDB running
- Redis running
- all service dependencies installed with `npm install`

Important shared setup:

- `JWT_ACCESS_SECRET` must match across `auth-service`, `profile-service`, `service-management-service`, and `booking-service`
- `AUTH_SERVICE_URL`, `PROFILE_SERVICE_URL`, and `SERVICE_MANAGEMENT_SERVICE_URL` must point to the correct running services
- booking-service depends on the other 3 services being up

Recommended local ports:

- `auth-service`: `4000`
- `profile-service`: `4001`
- `service-management-service`: `4002`
- `booking-service`: `3001`

Recommended startup order:

1. `auth-service`
2. `profile-service`
3. `service-management-service`
4. `booking-service`

Recommended terminal commands:

```bash
cd services/auth-service && npm install && npm run dev
cd services/profile-service && npm install && npm run dev
cd services/service-management-service && npm install && npm run dev
cd services/booking-service && npm install && npm run dev
```

Core env values you should set:

```text
AUTH SERVICE
PORT=4000
MONGO_URI=...
REDIS_URL=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
SMS_PROVIDER=mock

PROFILE SERVICE
PORT=4001
MONGO_URI=...
JWT_ACCESS_SECRET=...
AUTH_SERVICE_URL=http://127.0.0.1:4000

SERVICE MANAGEMENT SERVICE
PORT=4002
MONGO_URI=...
JWT_ACCESS_SECRET=...
AUTH_SERVICE_URL=http://127.0.0.1:4000
PROFILE_SERVICE_URL=http://127.0.0.1:4001

BOOKING SERVICE
PORT=3001
MONGO_URI=...
REDIS_URL=...
JWT_ACCESS_SECRET=...
AUTH_SERVICE_URL=http://127.0.0.1:4000
PROFILE_SERVICE_URL=http://127.0.0.1:4001
SERVICE_MANAGEMENT_SERVICE_URL=http://127.0.0.1:4002
```

## Platform Workflow To Verify Before Matching/Location

Test in this order:

1. auth login for customer/provider/admin
2. customer profile creation
3. provider profile creation
4. provider approval readiness
5. admin category creation
6. admin service creation
7. provider service offer creation in service-management
8. customer booking creation
9. provider booking lifecycle
10. admin analytics/search

If all of those pass, your pre-matching base is in good shape.

## Health Endpoints

Test these first:

- `GET {{AUTH_BASE_URL}}/api/v1/health`
  Input: none
  Expected output: service running response

- `GET {{AUTH_BASE_URL}}/api/v1/health/live`
  Input: none
  Expected output: liveness response

- `GET {{AUTH_BASE_URL}}/api/v1/health/ready`
  Input: none
  Expected output: readiness response

- `GET {{PROFILE_BASE_URL}}/api/v1/health`
  Input: none
  Expected output: profile service running response

- `GET {{PROFILE_BASE_URL}}/api/v1/health/`
  Input: none
  Expected output: profile health response

- `GET {{SERVICE_BASE_URL}}/api/v1/health`
  Input: none
  Expected output: service-management running response

- `GET {{SERVICE_BASE_URL}}/api/v1/health/live`
  Input: none
  Expected output: liveness response

- `GET {{SERVICE_BASE_URL}}/api/v1/health/ready`
  Input: none
  Expected output: readiness response

- `GET {{BOOKING_BASE_URL}}/health`
  Input: none
  Expected output: booking service running response

## Auth Service

Base: `{{AUTH_BASE_URL}}/api/v1/auth`

### Workflow

1. send OTP
2. verify OTP
3. call `/me`
4. optionally refresh token
5. optionally logout

### APIs

- `POST /send-otp`
  Input:
  ```json
  { "phone": "9999999999" }
  ```
  Expected output:
  - success response
  - whether user already exists
  - auth flow hint

- `POST /verify-otp`
  Input:
  ```json
  {
    "phone": "9999999999",
    "otp": "123456",
    "role": "customer",
    "deviceId": "customer-device-1",
    "deviceName": "Postman Customer",
    "platform": "WEB",
    "appVersion": "1.0.0"
  }
  ```
  Expected output:
  - `accessToken`
  - `refreshToken`
  - `user`
  - `session`
  - `isNewUser`

- `POST /refresh-token`
  Input:
  ```json
  {
    "refreshToken": "{{customerRefreshToken}}",
    "deviceId": "customer-device-1",
    "deviceName": "Postman Customer",
    "platform": "WEB",
    "appVersion": "1.0.0"
  }
  ```
  Expected output:
  - new `accessToken`
  - rotated `refreshToken`

- `GET /me`
  Auth: Bearer token
  Input: none
  Expected output:
  - user id
  - phone
  - role
  - account status
  - verification/profile flags

- `POST /logout`
  Auth: Bearer token
  Input:
  ```json
  { "deviceId": "customer-device-1" }
  ```
  Expected output:
  - logout confirmation

- `POST /logout-all`
  Auth: Bearer token
  Input: none
  Expected output:
  - all-device logout confirmation

## Profile Service

Base groups:

- `{{PROFILE_BASE_URL}}/api/v1/profiles/customer`
- `{{PROFILE_BASE_URL}}/api/v1/profiles/provider`
- `{{PROFILE_BASE_URL}}/api/v1/addresses`
- `{{PROFILE_BASE_URL}}/api/v1/provider-services`
- `{{PROFILE_BASE_URL}}/api/v1/documents`
- `{{PROFILE_BASE_URL}}/api/v1/bank-details`
- `{{PROFILE_BASE_URL}}/api/v1/admin`
- `{{PROFILE_BASE_URL}}/api/v1/internal`

### Critical Workflow

1. customer creates profile
2. customer creates address
3. provider creates profile
4. provider toggles online status
5. provider requests approval
6. admin reviews approval/documents if your flow requires it

### Customer Profile APIs

- `POST /api/v1/profiles/customer`
  Auth: customer
  Input:
  ```json
  {
    "fullName": "Test Customer",
    "gender": "Male",
    "dateOfBirth": "1998-05-10",
    "email": "customer@test.com",
    "language": "English"
  }
  ```
  Expected output:
  - created customer profile

- `GET /api/v1/profiles/customer`
  Auth: customer
  Input: none
  Expected output:
  - current customer profile

- `PUT /api/v1/profiles/customer`
  Auth: customer
  Input: any subset of create fields
  Expected output:
  - updated customer profile

- `GET /api/v1/profiles/customer/with-addresses`
  Auth: customer
  Input: none
  Expected output:
  - customer profile
  - linked addresses

### Provider Profile APIs

- `POST /api/v1/profiles/provider`
  Auth: provider
  Input:
  ```json
  {
    "businessName": "Fast Electric Works",
    "experience": 5,
    "workingRadius": 20,
    "latitude": 19.08,
    "longitude": 72.88,
    "workingHours": { "start": "09:00", "end": "18:00" },
    "bio": "Home electrical repair expert"
  }
  ```
  Expected output:
  - created provider profile

- `GET /api/v1/profiles/provider`
  Auth: provider
  Input: none
  Expected output:
  - provider profile

- `PUT /api/v1/profiles/provider`
  Auth: provider
  Input: any subset of provider profile fields
  Expected output:
  - updated provider profile

- `PUT /api/v1/profiles/provider/location`
  Auth: provider
  Input:
  ```json
  { "latitude": 19.08, "longitude": 72.88 }
  ```
  Expected output:
  - updated provider location

- `PUT /api/v1/profiles/provider/online-status`
  Auth: provider
  Input:
  ```json
  { "isOnline": true }
  ```
  Expected output:
  - updated online status

- `POST /api/v1/profiles/provider/request-approval`
  Auth: provider
  Input: none
  Expected output:
  - approval request created or submitted

### Address APIs

- `POST /api/v1/addresses`
  Auth: logged-in user
  Input:
  ```json
  {
    "label": "home",
    "addressLine1": "123 Main Street",
    "addressLine2": "Near Park",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India",
    "latitude": 19.076,
    "longitude": 72.8777,
    "isPrimary": true
  }
  ```
  Expected output:
  - created address

- `GET /api/v1/addresses`
  Auth: logged-in user
  Input: none
  Expected output:
  - list of addresses

- `GET /api/v1/addresses/:id`
  Auth: logged-in user
  Input: address id
  Expected output:
  - one address

- `PUT /api/v1/addresses/:id`
  Auth: logged-in user
  Input: partial address update
  Expected output:
  - updated address

- `PUT /api/v1/addresses/:id/set-primary`
  Auth: logged-in user
  Input: none
  Expected output:
  - selected address becomes primary

- `DELETE /api/v1/addresses/:id`
  Auth: logged-in user
  Input: none
  Expected output:
  - deletion confirmation

### Profile-Service Provider Services APIs

These exist, but booking currently depends on service-management provider services, not these.

- `POST /api/v1/provider-services`
- `GET /api/v1/provider-services`
- `PUT /api/v1/provider-services/:id`
- `DELETE /api/v1/provider-services/:id`

Expected output:
- provider-linked profile service data

### Document APIs

- `POST /api/v1/documents/upload`
  Auth: provider
  Input:
  - multipart file upload or `fileUrl`
  - `documentType` required
  Allowed `documentType`:
  - `aadhar`
  - `pan`
  - `profile_photo`
  - `trade_license`
  - `gst`
  - `shop_license`
  Expected output:
  - uploaded document record

- `GET /api/v1/documents`
  Auth: provider
  Input: none
  Expected output:
  - all provider documents

- `GET /api/v1/documents/status`
  Auth: provider
  Input: none
  Expected output:
  - document verification summary

- `GET /api/v1/documents/:id/file`
  Auth: provider or admin
  Input: document id
  Expected output:
  - file stream or redirect

- `DELETE /api/v1/documents/:id`
  Auth: provider
  Input: document id
  Expected output:
  - delete confirmation

### Bank Details APIs

- `POST /api/v1/bank-details`
  Auth: provider
  Input:
  ```json
  {
    "accountHolderName": "Test Provider",
    "accountNumber": "123456789012",
    "ifscCode": "HDFC0123456",
    "bankName": "HDFC Bank",
    "accountType": "SAVINGS"
  }
  ```
  Expected output:
  - created bank details

- `GET /api/v1/bank-details`
  Auth: provider
  Input: none
  Expected output:
  - provider bank details

- `PUT /api/v1/bank-details`
  Auth: provider
  Input: any subset of bank fields
  Expected output:
  - updated bank details

- `DELETE /api/v1/bank-details`
  Auth: provider
  Input: none
  Expected output:
  - delete confirmation

### Profile Admin APIs

- `GET /api/v1/admin/pending-approvals`
  Auth: admin
  Input: none
  Expected output:
  - list of pending provider approvals

- `GET /api/v1/admin/approvals/:approvalRequestId`
  Auth: admin
  Input: approval request id
  Expected output:
  - approval details

- `POST /api/v1/admin/approvals/:approvalRequestId/approve`
  Auth: admin
  Input: usually no body
  Expected output:
  - provider approved

- `POST /api/v1/admin/approvals/:approvalRequestId/reject`
  Auth: admin
  Input: rejection payload if controller requires it
  Expected output:
  - provider rejected

- `POST /api/v1/admin/documents/:documentId/verify`
  Auth: admin
  Input: document verification payload if required
  Expected output:
  - document verification update

### Internal APIs

- `GET /api/v1/internal/providers/:userId`
  Auth: token required
  Input: provider user id
  Expected output:
  - provider public profile

## Service-Management Service

Base groups:

- `{{SERVICE_BASE_URL}}/api/v1/admin`
- `{{SERVICE_BASE_URL}}/api/v1/provider`
- `{{SERVICE_BASE_URL}}/api/v1`

### Critical Workflow

1. admin creates category
2. admin creates service
3. provider creates provider service offer
4. customer/provider search reads that offer

### Admin Category APIs

- `POST /api/v1/admin/categories`
  Auth: admin
  Input:
  ```json
  {
    "name": "Home Services",
    "slug": "home-services",
    "description": "Home maintenance services",
    "isActive": true
  }
  ```
  Expected output:
  - created category

- `GET /api/v1/admin/categories`
  Auth: admin
  Query:
  - `includeInactive`
  - `page`
  - `limit`
  Expected output:
  - paginated category list

- `GET /api/v1/admin/categories/:categoryId`
  Auth: admin
  Input: category id
  Expected output:
  - one category

- `PUT /api/v1/admin/categories/:categoryId`
  Auth: admin
  Input: partial category fields
  Expected output:
  - updated category

- `DELETE /api/v1/admin/categories/:categoryId`
  Auth: admin
  Input: none
  Expected output:
  - delete/soft-delete confirmation

### Admin Service APIs

- `POST /api/v1/admin/services`
  Auth: admin
  Input:
  ```json
  {
    "categoryId": "{{categoryId}}",
    "name": "Electrician",
    "slug": "electrician",
    "description": "Electrical repair and installation",
    "estimatedDuration": 60,
    "isPopular": true,
    "isActive": true
  }
  ```
  Expected output:
  - created service

- `GET /api/v1/admin/services`
  Auth: admin
  Query:
  - `categoryId`
  - `includeInactive`
  - `keyword`
  - `isPopular`
  - `page`
  - `limit`
  Expected output:
  - paginated services

- `GET /api/v1/admin/services/:serviceId`
  Auth: admin
  Input: service id
  Expected output:
  - one service

- `PUT /api/v1/admin/services/:serviceId`
  Auth: admin
  Input: partial service fields
  Expected output:
  - updated service

- `DELETE /api/v1/admin/services/:serviceId`
  Auth: admin
  Input: none
  Expected output:
  - delete confirmation

### Provider Service Offer APIs

- `POST /api/v1/provider/services`
  Auth: provider
  Input:
  ```json
  {
    "serviceId": "{{serviceId}}",
    "price": 499,
    "experience": 5,
    "isAvailable": true
  }
  ```
  Expected output:
  - created provider offer
  - save `_id` as `providerServiceId`

- `GET /api/v1/provider/services`
  Auth: provider
  Input: none
  Expected output:
  - current provider offers

- `PUT /api/v1/provider/services/:providerServiceId`
  Auth: provider
  Input:
  ```json
  { "price": 599, "experience": 6 }
  ```
  Expected output:
  - updated provider offer

- `PATCH /api/v1/provider/services/:providerServiceId/status`
  Auth: provider
  Input:
  ```json
  { "isAvailable": true }
  ```
  Expected output:
  - updated availability

- `DELETE /api/v1/provider/services/:providerServiceId`
  Auth: provider
  Input: none
  Expected output:
  - removal confirmation

### Custom Skill APIs

- `POST /api/v1/provider/custom-skills`
  Auth: provider
  Input:
  ```json
  {
    "skillName": "Fan Repair",
    "description": "Ceiling fan repair",
    "experience": 3
  }
  ```
  Expected output:
  - created custom skill

- `GET /api/v1/provider/custom-skills`
  Auth: provider
  Input: none
  Expected output:
  - provider custom skill list

- `PUT /api/v1/provider/custom-skills/:customSkillId`
  Auth: provider
  Input: partial custom skill fields
  Expected output:
  - updated custom skill

- `DELETE /api/v1/provider/custom-skills/:customSkillId`
  Auth: provider
  Input: none
  Expected output:
  - delete confirmation

- `GET /api/v1/admin/custom-skills`
  Auth: admin
  Query:
  - `status`
  - `page`
  - `limit`
  Expected output:
  - paginated custom skills

- `POST /api/v1/admin/custom-skills/:customSkillId/approve`
  Auth: admin
  Input:
  ```json
  { "adminRemarks": "Looks good" }
  ```
  Expected output:
  - approved custom skill

- `POST /api/v1/admin/custom-skills/:customSkillId/reject`
  Auth: admin
  Input:
  ```json
  { "adminRemarks": "Needs more detail" }
  ```
  Expected output:
  - rejected custom skill

- `POST /api/v1/admin/custom-skills/:customSkillId/convert`
  Auth: admin
  Input:
  ```json
  {
    "categoryId": "{{categoryId}}",
    "estimatedDuration": 45,
    "isPopular": false
  }
  ```
  Expected output:
  - converted skill/service result

### Public Catalog APIs

- `GET /api/v1/categories`
  Input: pagination query
  Expected output:
  - public category list

- `GET /api/v1/categories/:categoryId`
  Input: category id
  Expected output:
  - one category

- `GET /api/v1/services`
  Query:
  - `categoryId`
  - `keyword`
  - `isPopular`
  - `page`
  - `limit`
  Expected output:
  - public service list

- `GET /api/v1/services/:serviceId`
  Input: service id
  Expected output:
  - one service

- `GET /api/v1/services/:serviceId/providers`
  Optional auth
  Query:
  - `latitude`
  - `longitude`
  - `minPrice`
  - `maxPrice`
  - `minExperience`
  - `minRating`
  - `sortBy`
  - `sortOrder`
  - `page`
  - `limit`
  Expected output:
  - provider list for service
  - this is what booking-service uses to validate provider selection

- `GET /api/v1/search/providers`
  Optional auth
  Query:
  - `keyword`
  - `categoryId`
  - `serviceId`
  - `providerId`
  - `minPrice`
  - `maxPrice`
  - `minExperience`
  - `minRating`
  - `latitude`
  - `longitude`
  - `sortBy`
  - `sortOrder`
  - `page`
  - `limit`
  Expected output:
  - provider search results

## Booking Service

Base groups:

- `{{BOOKING_BASE_URL}}/api/v1/bookings/customer`
- `{{BOOKING_BASE_URL}}/api/v1/bookings/provider`
- `{{BOOKING_BASE_URL}}/api/v1/bookings`
- `{{BOOKING_BASE_URL}}/api/v1/admin/bookings`

### Critical Workflow

1. customer creates booking
2. provider accepts
3. provider advances to `ON_THE_WAY`
4. provider advances to `ARRIVED`
5. start OTP verified
6. complete OTP verified
7. provider advances to `COMPLETED`
8. customer/admin can review booking and timeline

### Customer Booking APIs

- `POST /api/v1/bookings/customer`
  Auth: customer
  Input:
  ```json
  {
    "serviceId": "{{serviceId}}",
    "providerServiceId": "{{providerServiceId}}",
    "bookingType": "SCHEDULED",
    "scheduledStartTime": "2026-07-12T10:00:00.000Z",
    "scheduledEndTime": "2026-07-12T11:00:00.000Z",
    "couponCode": "",
    "couponDiscountAmount": 0,
    "customerAddressSnapshot": {
      "label": "Home",
      "addressLine1": "123 Main Street",
      "addressLine2": "Near Park",
      "landmark": "Blue Gate",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "location": {
        "type": "Point",
        "coordinates": [72.8777, 19.0760]
      }
    },
    "additionalNotes": "Please call before arrival"
  }
  ```
  Expected output:
  - created booking
  - booking starts at `PENDING_PROVIDER_RESPONSE`
  - authoritative customer/provider/pricing data derived from upstream services

- `GET /api/v1/bookings/customer/history`
  Auth: customer
  Query:
  - `page`
  - `limit`
  Expected output:
  - paginated customer bookings

- `GET /api/v1/bookings/customer/:id`
  Auth: customer owner
  Input: booking id
  Expected output:
  - one booking

- `GET /api/v1/bookings/customer/:id/timeline`
  Auth: customer owner
  Input: booking id
  Expected output:
  - timeline entries

### Provider Booking Command APIs

- `PATCH /api/v1/bookings/provider/:id/accept`
  Auth: provider owner
  Input: none
  Expected output:
  - status becomes `PROVIDER_ACCEPTED`

- `PATCH /api/v1/bookings/provider/:id/advance`
  Auth: provider owner
  Input:
  ```json
  { "nextStatus": "ON_THE_WAY" }
  ```
  or
  ```json
  { "nextStatus": "ARRIVED" }
  ```
  or
  ```json
  { "nextStatus": "COMPLETED" }
  ```
  Expected output:
  - updated booking status
  Note:
  - `SERVICE_STARTED` and `SERVICE_COMPLETED` are OTP-only transitions

- `POST /api/v1/bookings/provider/:id/verify-handshake`
  Auth: provider owner
  Input:
  ```json
  { "rawOtp": "123456", "purpose": "START_SERVICE" }
  ```
  or
  ```json
  { "rawOtp": "123456", "purpose": "COMPLETE_SERVICE" }
  ```
  Expected output:
  - starts/completes service
  - completion marks payment status paid

### Provider Booking Query APIs

- `GET /api/v1/bookings/provider/pending`
  Auth: provider
  Input: none
  Expected output:
  - pending provider assignments

- `GET /api/v1/bookings/provider/active`
  Auth: provider
  Query:
  - `page`
  - `limit`
  Expected output:
  - active jobs

- `GET /api/v1/bookings/provider/history`
  Auth: provider
  Query:
  - `page`
  - `limit`
  Expected output:
  - provider booking history

- `GET /api/v1/bookings/provider/:id`
  Auth: provider
  Input: booking id
  Expected output:
  - provider-visible booking details

### Shared Booking APIs

- `POST /api/v1/bookings/:id/cancel`
  Auth: customer/provider/admin with ownership or admin role
  Input:
  ```json
  {
    "reasonCode": "CUSTOMER_CHANGED_MIND",
    "customExplanation": "No longer needed"
  }
  ```
  Expected output:
  - booking cancelled
  - cancellation record created

- `POST /api/v1/bookings/:id/reschedule`
  Auth: customer/provider/admin with ownership or admin role
  Input:
  ```json
  {
    "newStartTime": "2026-07-13T10:00:00.000Z",
    "newEndTime": "2026-07-13T11:00:00.000Z",
    "reasonCode": "CUSTOMER_REQUEST",
    "customExplanation": "Need later slot"
  }
  ```
  Expected output:
  - booking rescheduled
  - reschedule history record created

### Booking Admin APIs

- `GET /api/v1/admin/bookings/search`
  Auth: admin
  Query:
  - `page`
  - `limit`
  - plus filter fields if used
  Expected output:
  - paginated booking list

- `GET /api/v1/admin/bookings/analytics`
  Auth: admin
  Input: none
  Expected output:
  - grouped booking metrics by status

- `POST /api/v1/admin/bookings/:id/assign-provider`
  Auth: admin
  Input:
  ```json
  {
    "providerId": "64f111111111111111111111",
    "businessName": "Provider Business Name",
    "phone": "+919999999999"
  }
  ```
  Expected output:
  - provider manually assigned

## What Must Pass Before Moving To Matching/Location

You should not move on until these pass:

- auth works for customer/provider/admin
- `/auth/me` returns correct role and active status
- customer profile has `fullName`
- customer address exists
- provider profile exists
- provider can be marked online
- admin can create categories and services
- provider can create service-management provider service offer
- public service/provider search returns that provider
- booking can be created using `serviceId + providerServiceId`
- provider can accept and move booking through the lifecycle
- booking timeline and analytics work

## Known Gaps / Practical Notes

- booking OTPs are not exposed by HTTP response
- full OTP lifecycle testing still needs logs or DB access
- booking dispute service code exists, but dispute routes are not publicly mounted
- booking depends on upstream services, so isolated booking-only testing is incomplete

