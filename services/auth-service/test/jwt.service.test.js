const test = require("node:test");
const assert = require("node:assert/strict");

process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret";
process.env.ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
process.env.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "30d";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const jwtService = require("../src/services/jwt.service");

const user = {
  _id: {
    toString() {
      return "507f1f77bcf86cd799439011";
    },
  },
  phone: "+919876543210",
  role: "customer",
  tokenVersion: 1,
};

test("generateAccessToken embeds access token metadata", () => {
  const token = jwtService.generateAccessToken(user, {
    deviceId: "device-1",
  });
  const payload = jwtService.verifyAccessToken(token);

  assert.equal(payload.type, "access");
  assert.equal(payload.deviceId, "device-1");
  assert.ok(payload.jti);
});

test("generateRefreshToken embeds family and jti metadata", () => {
  const token = jwtService.generateRefreshToken(user, {
    deviceId: "device-2",
    familyId: "family-1",
  });
  const payload = jwtService.verifyRefreshToken(token);

  assert.equal(payload.type, "refresh");
  assert.equal(payload.deviceId, "device-2");
  assert.equal(payload.familyId, "family-1");
  assert.ok(payload.jti);
});
