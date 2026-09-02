const test = require("node:test");
const assert = require("node:assert/strict");

const providerServiceRepository = require("../src/repositories/provider-service.repository");
const serviceRepository = require("../src/repositories/service.repository");
const profileClientService = require("../src/services/profile-client.service");
const searchService = require("../src/services/search.service");

test("searchProviders only returns approved, online providers inside their service radius", async () => {
  const originalSearch = providerServiceRepository.search;
  const originalServiceFindById = serviceRepository.findById;
  const originalProfiles = profileClientService.getProviderProfilesByUserIds;

  try {
    providerServiceRepository.search = async () => ({
      items: [
        {
          _id: "offer-1",
          providerId: "p1",
          price: 150,
          experience: 5,
          isAvailable: true,
          serviceId: {
            _id: "svc-1",
            name: "Plumbing",
            slug: "plumbing",
            estimatedDuration: 60,
            categoryId: { _id: "cat-1", name: "Home", slug: "home" },
          },
        },
        {
          _id: "offer-2",
          providerId: "p2",
          price: 120,
          experience: 3,
          isAvailable: true,
          serviceId: {
            _id: "svc-1",
            name: "Plumbing",
            slug: "plumbing",
            estimatedDuration: 60,
            categoryId: { _id: "cat-1", name: "Home", slug: "home" },
          },
        },
        {
          _id: "offer-3",
          providerId: "p3",
          price: 200,
          experience: 7,
          isAvailable: true,
          serviceId: {
            _id: "svc-1",
            name: "Plumbing",
            slug: "plumbing",
            estimatedDuration: 60,
            categoryId: { _id: "cat-1", name: "Home", slug: "home" },
          },
        },
      ],
    });

    serviceRepository.findById = async () => ({
      _id: "svc-1",
      name: "Plumbing",
      slug: "plumbing",
      description: "Plumbing services",
      estimatedDuration: 60,
    });

    profileClientService.getProviderProfilesByUserIds = async () =>
      new Map([
        [
          "p1",
          {
            userId: "p1",
            businessName: "Alpha Home Care",
            rating: 4.8,
            totalJobs: 10,
            verificationStatus: "approved",
            isOnline: true,
            workingRadius: 10,
            currentLocation: { coordinates: [77.6, 12.9] },
          },
        ],
        [
          "p2",
          {
            userId: "p2",
            businessName: "Offline Plumbing",
            rating: 4.1,
            totalJobs: 4,
            verificationStatus: "approved",
            isOnline: false,
            workingRadius: 10,
            currentLocation: { coordinates: [77.6, 12.9] },
          },
        ],
        [
          "p3",
          {
            userId: "p3",
            businessName: "Far Away Fix",
            rating: 4.9,
            totalJobs: 7,
            verificationStatus: "approved",
            isOnline: true,
            workingRadius: 2,
            currentLocation: { coordinates: [78.4, 13.4] },
          },
        ],
      ]);

    const result = await searchService.searchProviders(
      {
        serviceId: "svc-1",
        latitude: 12.9,
        longitude: 77.6,
        sortBy: "price",
        sortOrder: "asc",
      },
      null
    );

    assert.deepEqual(
      result.items.map((item) => item.providerId),
      ["p1"]
    );
    assert.equal(result.total, 1);
  } finally {
    providerServiceRepository.search = originalSearch;
    serviceRepository.findById = originalServiceFindById;
    profileClientService.getProviderProfilesByUserIds = originalProfiles;
  }
});
