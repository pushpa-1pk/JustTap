const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const serviceRepository = require("../repositories/service.repository");
const providerServiceRepository = require("../repositories/provider-service.repository");
const profileClientService = require("./profile-client.service");
const matchingClientService = require("./matching-client.service");

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
  async searchNearbyEligibleProviders(query, accessToken, resolvedServiceId) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const matchingProviders = await matchingClientService.searchEligibleProviders(
      {
        serviceId: resolvedServiceId,
        latitude: query.latitude,
        longitude: query.longitude,
        radius: query.radius,
        // Retrieve candidates before applying catalog-specific filters and pagination.
        limit: 100,
      },
      accessToken
    );

    let results = matchingProviders.map((provider) => {
      const distanceKm = Number(Number(provider.distance || 0).toFixed(1));
      const experience = provider.metrics?.experienceYears ?? 0;

      return {
        providerId: provider.providerId,
        providerServiceId: provider.providerServiceId,
        providerName: provider.businessName || provider.fullName || null,
        businessName: provider.businessName || provider.fullName || null,
        profileImage: provider.profileImage || provider.profilePhotoUrl || provider.profilePic || null,
        profilePhotoUrl: provider.profileImage || provider.profilePhotoUrl || provider.profilePic || null,
        price: provider.pricing?.value ?? 0,
        rating: provider.metrics?.rating ?? 0,
        experience,
        experienceLabel: formatExperience(experience),
        distanceKm,
        distance: distanceKm,
        distanceLabel: `${distanceKm} KM`,
        estimatedArrival: provider.etaMinutes ? `${provider.etaMinutes} Minutes` : null,
        completedJobs: provider.metrics?.completedJobs ?? 0,
        isOnline: provider.availability?.status === "ONLINE",
        isAvailable: true,
        workingRadiusKm: provider.workingRadiusKm ?? 10,
        service: null,
      };
    });

    if (query.minPrice !== undefined) results = results.filter((item) => item.price >= query.minPrice);
    if (query.maxPrice !== undefined) results = results.filter((item) => item.price <= query.maxPrice);
    if (query.minExperience !== undefined) results = results.filter((item) => item.experience >= query.minExperience);
    if (query.minRating !== undefined) results = results.filter((item) => item.rating >= query.minRating);

    const sortBy = query.sortBy || "price";
    const direction = query.sortOrder === "desc" ? -1 : 1;
    results.sort((left, right) => {
      const value = (item) => sortBy === "rating" ? item.rating
        : sortBy === "experience" ? item.experience
          : sortBy === "distance" ? item.distanceKm : item.price;
      return (value(left) - value(right)) * direction;
    });

    const total = results.length;
    const startIndex = (page - 1) * limit;
    return { items: results.slice(startIndex, startIndex + limit), total, page, limit };
  }

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

    if (resolvedServiceId && query.latitude !== undefined && query.longitude !== undefined) {
      try {
        const nearbyResult = await this.searchNearbyEligibleProviders(
          query,
          accessToken,
          resolvedServiceId
        );

        if (nearbyResult && Array.isArray(nearbyResult.items) && nearbyResult.items.length > 0) {
          const serviceDetails = await serviceRepository.findById(resolvedServiceId);

          return {
            ...nearbyResult,
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
      } catch (matchingErr) {
        // Fall back to database provider search
      }
    }

    if (query.keyword && !resolvedServiceId && !query.categoryId && !query.providerId) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        service: null,
      };
    }

    let { items } = await providerServiceRepository.search({
      serviceId: resolvedServiceId,
      categoryId: query.categoryId,
      providerId: query.providerId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minExperience: query.minExperience,
    });

    const targetService = resolvedServiceId ? await serviceRepository.findById(resolvedServiceId) : null;
    const targetServiceName = targetService?.name?.toLowerCase();
    const targetCategoryName = targetService?.categoryId?.name?.toLowerCase();

    // Include approved providers whose profile subServices match the requested service
    const allApprovedProfiles = await profileClientService.getAllApprovedProfiles(accessToken);
    const existingProviderIds = new Set(items.map((i) => String(i.providerId)));

    for (const profile of allApprovedProfiles) {
      if (!profile || profile.verificationStatus !== "approved") continue;
      const pid = String(profile.providerId || profile.userId || profile._id);
      if (existingProviderIds.has(pid)) continue;

      const subServices = (profile.subServices || []).map((s) => String(s).toLowerCase());
      const primCat = String(profile.primaryCategory || "").toLowerCase();

      const matchesService = targetServiceName && (
        subServices.includes(targetServiceName) ||
        subServices.some((s) => s.includes(targetServiceName) || targetServiceName.includes(s))
      );
      const matchesCategory = targetCategoryName && primCat.includes(targetCategoryName);

      if (matchesService || matchesCategory || (!targetServiceName && !targetCategoryName)) {
        existingProviderIds.add(pid);
        items.push({
          providerId: profile.userId || pid,
          _id: `srv_virtual_${pid}`,
          price: profile.baseRate || 499,
          experience: profile.experience || 2,
          isAvailable: profile.isAvailable ?? true,
          isActive: true,
          serviceId: targetService || {
            _id: resolvedServiceId,
            name: profile.primaryCategory || "General",
            isActive: true,
          },
        });
      }
    }

    const providerIds = items.map((item) => item.providerId);
    const [profileMap, matchingMap] = await Promise.all([
      profileClientService.getProviderProfilesByUserIds(providerIds, accessToken),
      matchingClientService.getProvidersBatchStatus(providerIds),
    ]);

    let results = items
      .map((item) => {
        // 1. Service enabled check
        const service = item.serviceId;
        if (!item.isActive || !service || service.isActive === false) {
          return null;
        }

        // 2. Provider availability check
        if (item.isAvailable === false) {
          return null;
        }

        // 3. Provider profile & approval status check
        const pKey = String(item.providerId?._id || item.providerId?.userId || item.providerId || "");
        const profile = profileMap.get(pKey) || profileMap.get(String(item.providerId)) || profileMap.get(String(item.providerId?.userId)) || profileMap.get(String(item.providerId?._id));
        if (!profile || profile.verificationStatus === "rejected") {
          return null;
        }

        // 4. Provider online and availability status check
        const matchingStatus = matchingMap.get(pKey) || matchingMap.get(String(item.providerId));
        // Source of truth: If provider profile explicitly has isOnline: false, they are offline.
        // If provider profile isOnline is true (or Redis matching status is true), provider is online.
        const isOnline = profile?.isOnline !== false && (matchingStatus?.isOnline === true || profile?.isOnline === true || matchingStatus === undefined);
        const isAvailable = matchingStatus ? Boolean(matchingStatus.isAvailable) : Boolean(item.isAvailable ?? true);

        // 5. Location & Working Radius check
        const coordinates = profile?.currentLocation?.coordinates;
        let distanceKm = 0;

        const hasCustomerCoords =
          query.latitude !== undefined &&
          query.longitude !== undefined &&
          (Number(query.latitude) !== 0 || Number(query.longitude) !== 0);

        if (
          hasCustomerCoords &&
          Array.isArray(coordinates) &&
          coordinates.length === 2
        ) {
          distanceKm = calculateDistanceKm(
            Number(query.latitude),
            Number(query.longitude),
            coordinates[1],
            coordinates[0]
          );
        }

        return {
          providerId: item.providerId,
          providerServiceId: item._id,
          providerName: profile?.businessName || profile?.fullName || "Service Provider",
          businessName: profile?.businessName || profile?.fullName || "Service Provider",
          profileImage: profile?.profileImage || profile?.profilePhotoUrl || profile?.profilePic || null,
          profilePhotoUrl: profile?.profileImage || profile?.profilePhotoUrl || profile?.profilePic || null,
          price: item.price,
          rating: profile?.rating ?? 0,
          experience: item.experience || profile?.experience || 0,
          experienceLabel: formatExperience(item.experience || profile?.experience || 0),
          distanceKm: Number(distanceKm.toFixed(1)),
          distance: Number(distanceKm.toFixed(1)),
          distanceLabel: `${distanceKm.toFixed(1)} KM`,
          estimatedArrival: formatEta(distanceKm),
          completedJobs: profile?.totalJobs ?? 0,
          isOnline,
          isAvailable,
          workingRadiusKm: profile?.workingRadius ?? 10,
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
      })
      .filter(Boolean);

    // Deduplicate candidates by canonical providerId
    const seenProviderIds = new Set();
    results = results.filter((item) => {
      if (!item || !item.providerId) return false;
      const canonicalKey = String(item.providerId);
      if (seenProviderIds.has(canonicalKey)) return false;
      seenProviderIds.add(canonicalKey);
      return true;
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
