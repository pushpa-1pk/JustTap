const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const loadStorageService = () => {
  process.env.NODE_ENV = "test";
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/justtap_profile_test";
  process.env.JWT_ACCESS_SECRET = "test-secret";
  process.env.BANK_ENCRYPTION_SECRET = "bank-secret";
  process.env.PUBLIC_BASE_URL = "http://127.0.0.1:4001";
  process.env.STORAGE_DRIVER = "local";
  process.env.UPLOADS_DIR_NAME = "uploads-test";

  const envPath = require.resolve("../src/config/env");
  const loggerPath = require.resolve("../src/services/logger.service");
  const servicePath = require.resolve("../src/services/upload-storage.service");

  delete require.cache[envPath];
  delete require.cache[loggerPath];
  delete require.cache[servicePath];

  return require("../src/services/upload-storage.service");
};

test("upload storage stores and deletes local files", async () => {
  const storageService = loadStorageService();

  const result = await storageService.storeFile({
    file: {
      buffer: Buffer.from("hello world"),
      mimetype: "image/png",
      originalname: "avatar.png",
      size: 11,
    },
    folder: "test-suite/profile-images",
  });

  assert.equal(result.storageProvider, "local");
  assert.match(result.url, /uploads-test\/test-suite\/profile-images\//);

  const savedPath = storageService.getLocalFilePath(result.storageKey);
  const savedContents = await fs.readFile(savedPath, "utf8");
  assert.equal(savedContents, "hello world");

  await storageService.deleteAsset(result);

  await assert.rejects(fs.access(savedPath));
});

test.after(async () => {
  const uploadsRoot = path.join(__dirname, "..", "uploads-test");
  await fs.rm(uploadsRoot, { recursive: true, force: true });
});
