const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const serviceRepository = require("../repositories/service.repository");
const providerServiceRepository = require("../repositories/provider-service.repository");
const profileClientService = require("./profile-client.service");

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const formatExperience = (years) => {
  if (!years) {
    return "0 Years";
  }

  return `${years} Year${years === 1 ? "" : "s"}`;
};

const formatEta = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) {
    return null;
  }

  const minutes = Math.max(5, Math.round(distanceKm * env.DEFAULT_ETA_MINUTES_PER_KM));
  return `${minutes} Minutes`;
};

class SearchService {
  async resolveServiceId({ serviceId, keyword }) {
    if (serviceId) {
      return serviceId;
    }

    if (!keyword) {
      return null;
    }

    const { items } = await serviceRepository.findAll({
      keyword,
      limit: 1,
    });

    return items[0]?._id?.toString() || null;
  }

  async searchProviders(query, accessToken) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const resolvedServiceId = await this.resolveServiceId(query);

    if (query.keyword && !resolvedServiceId && !query.categoryId && !query.providerId) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        service: null,
      };
    }

    const { items } = await providerServiceRepository.search({
      serviceId: resolvedServiceId,
      categoryId: query.categoryId,
      providerId: query.providerId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minExperience: query.minExperience,
    });

    const providerIds = items.map((item) => item.providerId);
    const profileMap = await profileClientService.getProviderProfilesByUserIds(
      providerIds,
      accessToken
    );

    let results = items.map((item) => {
      const profile = profileMap.get(item.providerId);
      const service = item.serviceId;
      const coordinates = profile?.currentLocation?.coordinates;
      let distanceKm = null;

      if (
        query.latitude !== undefined &&
        query.longitude !== undefined &&
        Array.isArray(coordinates) &&
        coordinates.length === 2
      ) {
        distanceKm = calculateDistanceKm(
          query.latitude,
          query.longitude,
          coordinates[1],
          coordinates[0]
        );
      }

      return {
        providerId: item.providerId,
        providerServiceId: item._id,
        providerName: profile?.businessName || null,
        price: item.price,
        rating: profile?.rating ?? 0,
        experience: item.experience,
        experienceLabel: formatExperience(item.experience),
        distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,
        distanceLabel:
          distanceKm !== null ? `${distanceKm.toFixed(1)} KM` : null,
        estimatedArrival: formatEta(distanceKm),
        completedJobs: profile?.totalJobs ?? 0,
        isOnline: profile?.isOnline ?? false,
        isAvailable: item.isAvailable,
        service: service
          ? {
              id: service._id,
              name: service.name,
              slug: service.slug,
              estimatedDuration: service.estimatedDuration,
              category: service.categoryId
                ? {
                    id: service.categoryId._id,
                    name: service.categoryId.name,
                    slug: service.categoryId.slug,
                  }
                : null,
            }
          : null,
      };
    });

    if (query.minRating !== undefined) {
      results = results.filter((item) => item.rating >= query.minRating);
    }

    const sortBy = query.sortBy || "price";
    const sortOrder = query.sortOrder || "asc";
    const direction = sortOrder === "desc" ? -1 : 1;

    results.sort((a, b) => {
      const getValue = (item) => {
        if (sortBy === "rating") return item.rating;
        if (sortBy === "experience") return item.experience;
        if (sortBy === "distance") {
          return item.distanceKm === null ? Number.MAX_SAFE_INTEGER : item.distanceKm;
        }
        return item.price;
      };

      const left = getValue(a);
      const right = getValue(b);

      if (left === right) {
        return 0;
      }

      return left > right ? direction : -direction;
    });

    const serviceDetails = resolvedServiceId
      ? await serviceRepository.findById(resolvedServiceId)
      : null;

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = results.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      service: serviceDetails
        ? {
            id: serviceDetails._id,
            name: serviceDetails.name,
            slug: serviceDetails.slug,
            description: serviceDetails.description,
            estimatedDuration: serviceDetails.estimatedDuration,
          }
        : null,
    };
  }

  async getServiceWithProviders(serviceId, query = {}, accessToken) {
    const service = await serviceRepository.findById(serviceId);

    if (!service || !service.isActive) {
      throw new ApiError(404, "Service not found.");
    }

    const searchResult = await this.searchProviders(
      {
        ...query,
        serviceId,
      },
      accessToken
    );

    return {
      service,
      providers: searchResult.items,
      totalProviders: searchResult.total,
    };
  }
}

module.exports = new SearchService();
