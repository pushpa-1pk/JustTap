const axios = require("axios");
const http = require("http");
const https = require("https");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const {
  ProviderServiceAreaDTO,
  ProviderCardMetadataDTO,
} = require("./dto");

class ProfileManagementClient {
  constructor() {
    this.client = axios.create({
      baseURL: env.PROFILE_SERVICE_URL,
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

  async getProvidersServiceAreaStatus(providerIds, latitude, longitude, requestId = "untracked") {
    try {
      const response = await this.client.post(
        "/api/v1/internal/providers/service-area",
        {
          providerIds,
          customerLocation: { latitude, longitude },
        },
        {
          headers: { "X-Request-Id": requestId },
        }
      );

      return ProviderServiceAreaDTO.fromResponseArray(response.data?.data?.providers);
    } catch (error) {
      throw new ApiError("Unable to verify provider service areas.", 502);
    }
  }

  async getProviderCardMetadata(providerIds, requestId = "untracked") {
    try {
      const response = await this.client.post(
        "/api/v1/internal/providers/metadata-batch",
        { providerIds },
        {
          headers: { "X-Request-Id": requestId },
        }
      );

      return ProviderCardMetadataDTO.fromResponseArray(
        response.data?.data?.profiles
      );
    } catch (error) {
      throw new ApiError("Unable to fetch provider metadata.", 502);
    }
  }
}

module.exports = ProfileManagementClient;
