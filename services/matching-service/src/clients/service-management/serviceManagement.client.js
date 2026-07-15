const axios = require("axios");
const http = require("http");
const https = require("https");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const { ProviderCapabilityDTO } = require("./dto");

class ServiceManagementClient {
  constructor() {
    this.client = axios.create({
      baseURL: env.SERVICE_MANAGEMENT_SERVICE_URL,
      timeout: env.CLIENT_TIMEOUT_MS,
      httpAgent: new http.Agent({
        keepAlive: true,
        maxSockets: env.CLIENT_MAX_SOCKETS,
        keepAliveMsecs: env.MAX_HTTP_KEEP_ALIVE_MSEC,
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: env.CLIENT_MAX_SOCKETS,
        keepAliveMsecs: env.MAX_HTTP_KEEP_ALIVE_MSEC,
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Api-Key": env.INTERNAL_API_KEY,
      },
    });
  }

  async getProvidersOfferingService(providerIds, serviceId, requestId = "untracked") {
    try {
      const response = await this.client.post(
        "/api/v1/internal/providers/filter",
        {
          providerIds,
          serviceId,
        },
        {
          headers: { "X-Request-Id": requestId },
        }
      );

      return ProviderCapabilityDTO.fromResponseArray(response.data?.data?.providers);
    } catch (error) {
      throw new ApiError("Unable to fetch provider service capabilities.", 502);
    }
  }
}

module.exports = ServiceManagementClient;
