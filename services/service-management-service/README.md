# Service Management Service

This service manages:

- Categories
- Official services
- Provider services and pricing
- Provider custom skills
- Provider discovery and marketplace search

## Environment

Create `.env` in [services/service-management-service](/D:/JustTap/services/service-management-service) from `.env.example`.

Required fields:

```env
NODE_ENV=development
PORT=4002
MONGO_URI=mongodb://127.0.0.1:27017/justtap_service_catalog
JWT_ACCESS_SECRET=replace-with-auth-access-secret
AUTH_SERVICE_URL=http://127.0.0.1:4000
AUTH_USER_LOOKUP_REQUIRED=true
AUTH_USER_LOOKUP_TIMEOUT_MS=3000
PROFILE_SERVICE_URL=http://127.0.0.1:4001
PROFILE_LOOKUP_TIMEOUT_MS=3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JSON_BODY_LIMIT=100kb
LOG_LEVEL=info
DEFAULT_ETA_MINUTES_PER_KM=3
```

## Run Commands

```powershell
cd D:\JustTap\services\service-management-service
npm install
npm run dev
```

Production start:

```powershell
cd D:\JustTap\services\service-management-service
npm install --omit=dev
npm start
```

## Dependencies

This service expects:

- `auth-service` running for `Bearer` token validation
- `profile-service` running for provider verification and provider profile enrichment
- MongoDB running on `MONGO_URI`

## Health Checks

```http
GET /api/v1/health
GET /api/v1/health/live
GET /api/v1/health/ready
```

## Postman Flow

Use these variables:

```text
baseUrl = http://127.0.0.1:4002/api/v1
adminToken = admin access token
providerToken = provider access token
customerToken = customer access token
categoryId = created category id
serviceId = created service id
providerServiceId = provider service id
customSkillId = custom skill id
```

### 1. Admin category flow

```http
POST {{baseUrl}}/admin/categories
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "Electrical",
  "description": "Electrical repair and installation",
  "sortOrder": 1,
  "icon": "https://cdn.example.com/icons/electrical.png",
  "bannerImage": "https://cdn.example.com/banners/electrical.png"
}
```

```http
GET {{baseUrl}}/admin/categories
Authorization: Bearer {{adminToken}}
```

```http
GET {{baseUrl}}/admin/categories/{{categoryId}}
Authorization: Bearer {{adminToken}}
```

```http
PUT {{baseUrl}}/admin/categories/{{categoryId}}
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "description": "Updated category description"
}
```

```http
DELETE {{baseUrl}}/admin/categories/{{categoryId}}
Authorization: Bearer {{adminToken}}
```

### 2. Admin official services flow

```http
POST {{baseUrl}}/admin/services
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "categoryId": "{{categoryId}}",
  "name": "Fan Installation",
  "description": "Install ceiling or wall fan",
  "estimatedDuration": 60,
  "isPopular": true
}
```

```http
GET {{baseUrl}}/admin/services?categoryId={{categoryId}}
Authorization: Bearer {{adminToken}}
```

```http
GET {{baseUrl}}/admin/services/{{serviceId}}
Authorization: Bearer {{adminToken}}
```

```http
PUT {{baseUrl}}/admin/services/{{serviceId}}
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "estimatedDuration": 75,
  "isPopular": false
}
```

```http
DELETE {{baseUrl}}/admin/services/{{serviceId}}
Authorization: Bearer {{adminToken}}
```

### 3. Provider service pricing flow

Provider must have an approved provider profile in `profile-service`.

```http
POST {{baseUrl}}/provider/services
Authorization: Bearer {{providerToken}}
Content-Type: application/json

{
  "serviceId": "{{serviceId}}",
  "price": 499,
  "experience": 5,
  "isAvailable": true
}
```

```http
GET {{baseUrl}}/provider/services
Authorization: Bearer {{providerToken}}
```

```http
PUT {{baseUrl}}/provider/services/{{providerServiceId}}
Authorization: Bearer {{providerToken}}
Content-Type: application/json

{
  "price": 599,
  "experience": 6
}
```

```http
PATCH {{baseUrl}}/provider/services/{{providerServiceId}}/status
Authorization: Bearer {{providerToken}}
Content-Type: application/json

{
  "isAvailable": false
}
```

```http
DELETE {{baseUrl}}/provider/services/{{providerServiceId}}
Authorization: Bearer {{providerToken}}
```

### 4. Provider custom skill flow

```http
POST {{baseUrl}}/provider/custom-skills
Authorization: Bearer {{providerToken}}
Content-Type: application/json

{
  "skillName": "Smart Door Lock Installation",
  "description": "Install and configure smart locks",
  "experience": 4
}
```

```http
GET {{baseUrl}}/provider/custom-skills
Authorization: Bearer {{providerToken}}
```

```http
PUT {{baseUrl}}/provider/custom-skills/{{customSkillId}}
Authorization: Bearer {{providerToken}}
Content-Type: application/json

{
  "description": "Updated provider custom skill description"
}
```

```http
DELETE {{baseUrl}}/provider/custom-skills/{{customSkillId}}
Authorization: Bearer {{providerToken}}
```

### 5. Admin custom skill approval flow

```http
GET {{baseUrl}}/admin/custom-skills?status=Pending
Authorization: Bearer {{adminToken}}
```

```http
POST {{baseUrl}}/admin/custom-skills/{{customSkillId}}/approve
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "adminRemarks": "Looks valid"
}
```

```http
POST {{baseUrl}}/admin/custom-skills/{{customSkillId}}/reject
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "adminRemarks": "Please provide more detail"
}
```

```http
POST {{baseUrl}}/admin/custom-skills/{{customSkillId}}/convert
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "categoryId": "{{categoryId}}",
  "estimatedDuration": 45,
  "isPopular": false
}
```

### 6. Customer/public browse and search flow

```http
GET {{baseUrl}}/categories
GET {{baseUrl}}/categories/{{categoryId}}
GET {{baseUrl}}/services
GET {{baseUrl}}/services?categoryId={{categoryId}}&keyword=fan
GET {{baseUrl}}/services/{{serviceId}}
```

Search providers:

```http
GET {{baseUrl}}/search/providers?serviceId={{serviceId}}&sortBy=price&sortOrder=asc&page=1&limit=20
Authorization: Bearer {{customerToken}}
```

Search with distance:

```http
GET {{baseUrl}}/search/providers?serviceId={{serviceId}}&latitude=19.0760&longitude=72.8777&sortBy=distance
Authorization: Bearer {{customerToken}}
```

Service detail with provider list:

```http
GET {{baseUrl}}/services/{{serviceId}}/providers?sortBy=rating&sortOrder=desc
Authorization: Bearer {{customerToken}}
```

## What Happens In This Service

- Admin creates categories and official services.
- Providers attach themselves to official services and set their own price.
- Providers can submit custom skills for admin review.
- Admin can approve, reject, or convert approved custom skills into official services.
- Customers can browse catalog data and compare providers by price, rating, experience, and distance.
- Search is enriched from `profile-service`, so provider business name, location, rating, jobs, and online status come from provider profiles.
