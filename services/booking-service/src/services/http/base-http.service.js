const ApiError = require('../../utils/api.error');

class BaseHttpService {
  async getJson(url, { headers = {}, timeoutMs = 3000 } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new ApiError(
          payload?.message || `Request failed with status ${response.status}.`,
          response.status >= 400 && response.status < 500 ? response.status : 503
        );
      }

      return payload?.data ?? payload;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError('Upstream service request timed out.', 503);
      }

      throw new ApiError(error.message || 'Upstream service request failed.', 503);
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = BaseHttpService;
