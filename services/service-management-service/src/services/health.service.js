const { getDatabaseHealth } = require("../config/database");
const env = require("../config/env");

class HealthService {
  async getLiveness() {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const database = await getDatabaseHealth();
    const dependencies = {
      database,
      authServiceConfigured: Boolean(env.AUTH_SERVICE_URL),
      profileServiceConfigured: Boolean(env.PROFILE_SERVICE_URL),
    };

    const ready = database.state === "connected";

    return {
      status: ready ? "ready" : "not_ready",
      services: dependencies,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new HealthService();
