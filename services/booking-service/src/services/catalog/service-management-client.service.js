const BaseHttpService = require('../http/base-http.service');
const env = require('../../config/env');
const ApiError = require('../../utils/api.error');

class ServiceManagementClientService extends BaseHttpService {
  async getService(serviceId) {
    if (!env.serviceManagementServiceUrl) {
      throw new ApiError('Service Management service URL is not configured.', 503);
    }

    return this.getJson(`${env.serviceManagementServiceUrl}/api/v1/services/${serviceId}`, {
      timeoutMs: env.serviceLookupTimeoutMs
    });
  }

  async getProviderForService(serviceId, providerServiceId, accessToken, coordinates) {
    if (!env.serviceManagementServiceUrl) {
      throw new ApiError('Service Management service URL is not configured.', 503);
    }

    const query = new URLSearchParams();
    if (coordinates) {
      query.set('latitude', String(coordinates.latitude));
      query.set('longitude', String(coordinates.longitude));
    }

    const url = `${env.serviceManagementServiceUrl}/api/v1/services/${serviceId}/providers?${query.toString()}`;
    const result = await this.getJson(url, {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`
          }
        : {},
      timeoutMs: env.serviceLookupTimeoutMs
    });

    const providers = result?.providers || [];
    const matchedProvider = providers.find(
      (provider) => String(provider.providerServiceId) === String(providerServiceId)
    );

    if (!matchedProvider) {
      throw new ApiError('Provider service not found for the selected service.', 404);
    }

    return matchedProvider;
  }
}

module.exports = new ServiceManagementClientService();
