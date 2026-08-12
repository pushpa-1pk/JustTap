// Centralized API endpoints registry for JustTap Microservices
export const API_BASE_URLS = {
  auth: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:4000/api/v1',
  profiles: import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:4001/api/v1',
  services: import.meta.env.VITE_SERVICE_API_URL || 'http://localhost:4002/api/v1',
  bookings: import.meta.env.VITE_BOOKING_API_URL || 'http://localhost:5000/api/v1',
  payments: import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5005/api/v1',
  reviews: import.meta.env.VITE_REVIEW_API_URL || 'http://localhost:5006/api/v1',
  trackingSocket: import.meta.env.VITE_TRACKING_SOCKET_URL || 'http://localhost:5004',
};

// Endpoints mapping helpers
export const ENDPOINTS = {
  auth: {
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  profiles: {
    customer: '/profiles/customer',
    provider: '/profiles/provider',
    addresses: '/addresses',
    documents: '/documents',
    bankDetails: '/bank-details',
    admin: {
      pendingApprovals: '/admin/pending-approvals',
      approvalDetails: (id: string) => `/admin/approvals/${id}`,
      approveProvider: (id: string) => `/admin/approvals/${id}/approve`,
      rejectProvider: (id: string) => `/admin/approvals/${id}/reject`,
      verifyDocument: (id: string) => `/admin/documents/${id}/verify`,
    },
    support: {
      faqs: '/support/faqs',
      tickets: '/support/tickets',
    }
  },
  services: {
    admin: {
      categories: '/admin/categories',
      categoryDetail: (id: string) => `/admin/categories/${id}`,
      services: '/admin/services',
      serviceDetail: (id: string) => `/admin/services/${id}`,
      customSkills: '/admin/custom-skills',
      approveCustomSkill: (id: string) => `/admin/custom-skills/${id}/approve`,
      rejectCustomSkill: (id: string) => `/admin/custom-skills/${id}/reject`,
      convertCustomSkill: (id: string) => `/admin/custom-skills/${id}/convert`,
    },
    provider: {
      services: '/provider/services',
      serviceStatus: (id: string) => `/provider/services/${id}/status`,
      customSkills: '/provider/custom-skills',
    },
    categories: '/categories',
    services: '/services',
  },
  bookings: {
    admin: {
      search: '/admin/bookings/search',
      analytics: '/admin/bookings/analytics',
      assignProvider: (id: string) => `/admin/bookings/${id}/assign-provider`,
    },
    cancel: (id: string) => `/bookings/${id}/cancel`,
    reschedule: (id: string) => `/bookings/${id}/reschedule`,
  },
  payments: {
    refunds: '/payments/refunds',
    settlements: '/payments/settlements',
    releaseSettlement: '/payments/settlements/release',
    withdrawals: '/payments/withdrawals',
    invoices: '/payments/invoices',
  },
  reviews: {
    admin: {
      reportsQueue: '/admin/moderation/reports',
      moderateReview: (id: string) => `/admin/moderation/reviews/${id}`,
      reportReview: (id: string) => `/admin/reviews/${id}/report`,
    }
  }
};
