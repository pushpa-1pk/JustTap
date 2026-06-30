const { getDatabaseHealth } = require("../config/database");
const { getRedisHealth } = require("../config/redis");
const smsService = require("./sms.service");

class HealthService {
  async getLiveness() {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const [database, redis, sms] = await Promise.all([
      getDatabaseHealth(),
      getRedisHealth(),
      smsService.getHealth(),
    ]);

    const ready =
      database.state === "connected" &&
      redis.status === "up" &&
      sms.status !== "down";

    return {
      status: ready ? "ready" : "not_ready",
      services: {
        database,
        redis,
        sms,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new HealthService();
