# Phase 3: Profile Management Service - Complete Documentation

## Overview

Phase 3 implements the complete Profile Management Service for JustTap, handling:

- ✅ Customer profile creation and management
- ✅ Provider profile creation and verification workflow
- ✅ Address management with geolocation support
- ✅ Provider services and pricing management
- ✅ Document upload and verification
- ✅ Bank details with encryption
- ✅ Admin approval workflow for provider verification
- ✅ Profile completion tracking
- ✅ Location-based provider search

## Architecture

```
Profile Service
├── Models (7 total)
│   ├── CustomerProfile
│   ├── ProviderProfile
│   ├── Address (GeoJSON)
│   ├── ProviderService
│   ├── Document
│   ├── BankDetails (Encrypted)
│   └── ApprovalRequest
├── Repositories (7 total)
├── Services (6 total)
├── Controllers (6 total)
└── Routes (8 total)
```

## Key Features

### 1. Customer Profile Management

**Features:**
- Create and update customer profile
- Track profile completion percentage
- Manage multiple addresses
- Set preferred address
- Support multiple languages

**API Endpoints:**
```
POST /api/v1/profiles/customer
GET /api/v1/profiles/customer
PUT /api/v1/profiles/customer
GET /api/v1/profiles/customer/with-addresses
```

### 2. Provider Profile Management

**Features:**
- Create provider profile with verification status
- Update profile information
- Track location with GeoJSON
- Toggle online/offline status
- Calculate profile completion
- Request admin approval

**API Endpoints:**
```
POST /api/v1/profiles/provider
GET /api/v1/profiles/provider
PUT /api/v1/profiles/provider
PUT /api/v1/profiles/provider/location
PUT /api/v1/profiles/provider/online-status
POST /api/v1/profiles/provider/request-approval
```

**Verification Status Flow:**
```
pending → approval requested → approved → can receive bookings
      ↓
   rejected → can resubmit
```

### 3. Address Management

**Features:**
- Create, read, update, delete addresses
- GeoJSON coordinates for location-based queries
- Primary address management
- Multiple address labels (home, work, other)

**API Endpoints:**
```
POST /api/v1/addresses
GET /api/v1/addresses
GET /api/v1/addresses/:id
PUT /api/v1/addresses/:id
PUT /api/v1/addresses/:id/set-primary
DELETE /api/v1/addresses/:id
```

### 4. Provider Services

**Features:**
- Add multiple services with pricing
- Support different price types (fixed, hourly, per_unit)
- Track experience for each service
- Activate/deactivate services

**API Endpoints:**
```
POST /api/v1/provider-services
GET /api/v1/provider-services
PUT /api/v1/provider-services/:id
DELETE /api/v1/provider-services/:id
```

### 5. Document Management

**Features:**
- Upload documents (Aadhar, PAN, Profile Photo, Trade License, GST, Shop License)
- Document verification workflow
- Track document status (pending, approved, rejected)
- Admin document verification

**API Endpoints:**
```
POST /api/v1/documents/upload
GET /api/v1/documents
GET /api/v1/documents/status
DELETE /api/v1/documents/:id
```

### 6. Bank Details

**Features:**
- Add bank details with encryption
- AES-256-CBC encryption for sensitive data
- Account number masked in responses
- Update and delete bank details

**API Endpoints:**
```
POST /api/v1/bank-details
GET /api/v1/bank-details
PUT /api/v1/bank-details
DELETE /api/v1/bank-details
```

### 7. Admin Approval Workflow

**Features:**
- View pending provider approval requests
- Review provider profile and documents
- Approve or reject providers
- Document-level verification
- Track approval history

**API Endpoints:**
```
GET /api/v1/admin/pending-approvals
GET /api/v1/admin/approvals/:approvalRequestId
POST /api/v1/admin/approvals/:approvalRequestId/approve
POST /api/v1/admin/approvals/:approvalRequestId/reject
POST /api/v1/admin/documents/:documentId/verify
```

## Provider Approval Workflow (Step-by-Step)

### Step 1: Provider Registration
Provider creates profile with basic info
- Business name
- Experience
- Working radius
- Working hours

### Step 2: Profile Completion
Provider fills profile to 80%+ completion

### Step 3: Document Upload
Provider uploads required documents:
- Aadhar (mandatory)
- PAN (mandatory)
- Profile Photo (mandatory)
- Optional: Trade License, GST, Shop License

### Step 4: Bank Details
Provider adds encrypted bank details:
- Account holder name
- Account number (encrypted)
- IFSC code (encrypted)
- Bank name

### Step 5: Request Approval
Provider submits approval request
- System validates 80% completion
- System checks all required documents
- System checks bank details
- Creates approval request with status "pending"

### Step 6: Admin Review
Admin receives notification in pending approvals list
Admin can:
- View provider profile
- Review all documents
- Verify individual documents
- Check bank details (partially masked)

### Step 7: Admin Decision
Admin approves or rejects:
- **Approve**: All documents marked approved, provider status → approved, can now receive bookings
- **Reject**: Rejection reason saved, provider status → rejected, can resubmit after fixing

### Step 8: Provider Receives Decision
- If approved: Status updated, can start receiving booking requests
- If rejected: Can fix issues and resubmit (request type changes to "resubmit")

## Database Models Details

### CustomerProfile
```javascript
{
  userId: ObjectId,              // Reference to User
  fullName: String,              // Required
  email: String,                 // Optional, validated
  gender: "male|female|other",   // Optional
  dateOfBirth: Date,             // Optional
  profileImage: String,          // Image URL
  language: "en|hi|te|ta|kn|ml", // Default: en
  profileCompletion: Number,     // 0-100
  preferredAddressId: ObjectId,  // Reference to Address
  timestamps: true
}
```

### ProviderProfile
```javascript
{
  userId: ObjectId,                                    // Reference to User
  businessName: String,                              // Required
  experience: Number,                                // Years of experience
  workingRadius: Number,                            // In kilometers
  currentLocation: { type: "Point", coordinates },  // GeoJSON
  workingHours: { startTime, endTime },            // HH:MM format
  isOnline: Boolean,                                // Current status
  rating: Number,                                   // 0-5 stars
  totalRatings: Number,                             // Count of ratings
  completedJobs: Number,                            // Booking count
  verificationStatus: "pending|approved|rejected|suspended",
  rejectionReason: String,                          // If rejected
  profileCompletion: Number,                        // 0-100
  approvalRequestedAt: Date,                        // First submission
  approvedAt: Date,                                 // Approval date
  approvedBy: ObjectId,                             // Admin ID
  indexes: { currentLocation: "2dsphere" }          // Geospatial
}
```

### Address
```javascript
{
  userId: ObjectId,                                // Reference to User
  label: "home|work|other",                        // Address type
  addressLine1: String,                            // Required
  addressLine2: String,                            // Optional
  city: String,                                    // Required
  state: String,                                   // Required
  country: String,                                 // Default: "India"
  pincode: String,                                 // 6 digits
  location: { type: "Point", coordinates },       // GeoJSON [longitude, latitude]
  isPrimary: Boolean,                              // Primary address flag
  indexes: { location: "2dsphere", userId/isPrimary }
}
```

### Document
```javascript
{
  providerId: ObjectId,                            // Reference to ProviderProfile
  documentType: "aadhar|pan|profile_photo|trade_license|gst|shop_license",
  fileUrl: String,                                 // Cloudinary URL
  status: "pending|approved|rejected",
  rejectionReason: String,                         // Admin feedback
  verifiedAt: Date,                                // Verification timestamp
  verifiedBy: ObjectId,                            // Admin ID
  indexes: { providerId, documentType }
}
```

### BankDetails
```javascript
{
  providerId: ObjectId,                            // Reference to ProviderProfile (unique)
  accountHolderName: String,                       // Required
  encryptedAccountNumber: String,                  // AES-256-CBC encrypted
  encryptedIFSC: String,                           // AES-256-CBC encrypted
  bankName: String,                                // Required
  verified: Boolean,                               // Admin verification flag
  methods: {
    encryptData(data),                             // Encrypt data
    decryptData(encryptedData),                    // Decrypt data
    getDecryptedAccountNumber(),                   // Get unencrypted account
    getDecryptedIFSC()                             // Get unencrypted IFSC
  }
}
```

### ApprovalRequest
```javascript
{
  providerId: ObjectId,                            // Reference to ProviderProfile
  requestType: "initial|resubmit",                 // First or resubmission
  status: "pending|approved|rejected",
  requiredDocuments: {                             // Docs system requires
    aadhar: Boolean,
    pan: Boolean,
    profilePhoto: Boolean
  },
  submittedDocuments: {                            // Docs provider uploaded
    aadhar: Boolean,
    pan: Boolean,
    profilePhoto: Boolean
  },
  feedback: String,                                // Admin feedback
  rejectionReason: String,                         // Why rejected
  submittedAt: Date,                               // When submitted
  reviewedAt: Date,                                // When reviewed
  reviewedBy: ObjectId,                            // Admin ID
  indexes: { providerId, status }
}
```

## API Response Format

### Success Response
```javascript
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { /* actual data */ },
  "errors": []
}
```

### Error Response
```javascript
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Authentication & Authorization

### Token Format
```
Authorization: Bearer <jwt_token>
```

### Token Payload
```javascript
{
  "id": "userId",
  "role": "customer|provider|admin",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Role-Based Access

| Resource | Customer | Provider | Admin |
|----------|----------|----------|-------|
| Get own profile | ✓ | ✓ | - |
| Update own profile | ✓ | ✓ | - |
| Create address | ✓ | ✓ | - |
| Manage services | - | ✓ | - |
| Upload documents | - | ✓ | - |
| Add bank details | - | ✓ | - |
| Request approval | - | ✓ | - |
| View pending approvals | - | - | ✓ |
| Approve/Reject provider | - | - | ✓ |
| Verify documents | - | - | ✓ |

## Setup & Installation

```bash
# 1. Navigate to service directory
cd services/profile-service

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start service
npm run dev

# Service runs on: http://localhost:4002
```

## Environment Configuration

```env
NODE_ENV=development
PORT=4002
MONGO_URI=mongodb://localhost:27017/justtap_profile
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=15m
ENCRYPTION_KEY=your_32_char_key_here
AUTH_SERVICE_URL=http://localhost:4001/api/v1
CORS_ORIGIN=http://localhost:3000
```

## Security Features

1. **JWT Authentication**
   - Access token validation on all protected routes
   - Role-based authorization checks

2. **Data Encryption**
   - AES-256-CBC for bank details
   - Secure key derivation from environment

3. **Input Validation**
   - Joi schema validation on all inputs
   - Email format validation
   - Pincode format validation (6 digits)
   - IFSC format validation

4. **Security Headers**
   - Helmet.js middleware
   - CORS protection
   - XSS prevention

5. **Audit Trail**
   - Admin ID tracking for approvals
   - Timestamps for all operations
   - Verification timestamps for documents

## Error Handling

Consistent error handling with specific HTTP status codes:

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Profile retrieved |
| 201 | Created | Address created |
| 400 | Bad Request | Invalid email |
| 401 | Unauthorized | Missing token |
| 403 | Forbidden | Admin-only resource |
| 404 | Not Found | Profile not found |
| 409 | Conflict | Profile already exists |
| 500 | Server Error | Database error |

## Testing Workflow

### Test Customer Profile
```bash
# Create profile
POST /api/v1/profiles/customer
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "gender": "male"
}

# Get profile
GET /api/v1/profiles/customer

# Update profile
PUT /api/v1/profiles/customer
{
  "fullName": "John Updated"
}
```

### Test Provider Approval Flow
```bash
# 1. Create provider profile
POST /api/v1/profiles/provider
{
  "businessName": "John's Services",
  "experience": 5,
  "workingRadius": 15
}

# 2. Update location
PUT /api/v1/profiles/provider/location
{
  "latitude": 28.7041,
  "longitude": 77.1025
}

# 3. Add service
POST /api/v1/provider-services
{
  "serviceId": "electrician",
  "serviceName": "Electrician",
  "basePrice": 500,
  "priceType": "fixed"
}

# 4. Upload documents
POST /api/v1/documents/upload
{
  "documentType": "aadhar",
  "fileUrl": "https://cloudinary.com/..."
}

# 5. Add bank details
POST /api/v1/bank-details
{
  "accountHolderName": "John Doe",
  "accountNumber": "123456789012",
  "ifsc": "SBIN0001234",
  "bankName": "State Bank of India"
}

# 6. Request approval
POST /api/v1/profiles/provider/request-approval

# 7. Admin reviews (as admin user)
GET /api/v1/admin/pending-approvals

# 8. Admin approves
POST /api/v1/admin/approvals/:approvalRequestId/approve
{
  "feedback": "Documents verified successfully"
}
```

## Next Steps

1. **Notification Integration**
   - Send SMS on approval/rejection
   - Email notifications

2. **Cloudinary Integration**
   - Automatic document upload
   - Image optimization

3. **Matching Service Integration**
   - Use provider profiles for booking matching
   - Location-based searches

4. **Admin Dashboard**
   - Web interface for approvals
   - Analytics and reporting

5. **Advanced Features**
   - Provider ratings and reviews
   - Promotional offers
   - Performance analytics

## Support & Debugging

### Common Issues

**Issue: Provider not receiving bookings despite approval**
- Check verificationStatus is "approved"
- Check isOnline is true
- Check currentLocation is set

**Issue: Bank details encryption failing**
- Verify ENCRYPTION_KEY is 32 characters
- Check encryption key hasn't changed

**Issue: Address GeoJSON queries not working**
- Ensure 2dsphere index exists on location field
- Coordinates must be [longitude, latitude]

### Logs Location
- All logs printed to console
- Use LOG_LEVEL env variable to control verbosity

## Contributors

Phase 3 Implementation - Complete Profile Management Service

---

**Status:** ✅ Phase 3 Complete
**Version:** 1.0.0
**Last Updated:** 2024
