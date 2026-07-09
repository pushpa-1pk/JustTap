const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const cloudinary = require("cloudinary").v2;
const env = require("../config/env");
const logger = require("./logger.service");

const SERVICE_ROOT = path.resolve(__dirname, "..", "..");
const UPLOADS_ROOT = path.join(SERVICE_ROOT, env.UPLOADS_DIR_NAME);

const MIME_EXTENSION_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/jpg": ".jpg",
  "application/pdf": ".pdf",
};

class UploadStorageService {
  constructor() {
    this.cloudinaryConfigured = false;
  }

  getPublicUrl(relativeKey) {
    const normalizedKey = relativeKey.replace(/\\/g, "/");
    return `${env.PUBLIC_BASE_URL}/${env.UPLOADS_DIR_NAME}/${normalizedKey}`;
  }

  getLocalFilePath(relativeKey) {
    return path.join(UPLOADS_ROOT, relativeKey);
  }

  getFileExtension(file) {
    const originalExtension = path.extname(file.originalname || "");
    if (originalExtension) {
      return originalExtension.toLowerCase();
    }

    return MIME_EXTENSION_MAP[file.mimetype] || "";
  }

  async ensureLocalDirectory(relativeFolder) {
    await fs.mkdir(path.join(UPLOADS_ROOT, relativeFolder), { recursive: true });
  }

  ensureCloudinaryConfigured() {
    if (this.cloudinaryConfigured) {
      return;
    }

    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });

    this.cloudinaryConfigured = true;
  }

  async storeFile({ file, folder }) {
    if (env.STORAGE_DRIVER === "cloudinary") {
      return this.storeInCloudinary({ file, folder });
    }

    return this.storeLocally({ file, folder });
  }

  async storeLocally({ file, folder }) {
    const extension = this.getFileExtension(file);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const relativeKey = path.posix.join(folder, filename);

    await this.ensureLocalDirectory(folder);
    await fs.writeFile(this.getLocalFilePath(relativeKey), file.buffer);

    logger.info("FILE_STORED_LOCALLY", {
      storageKey: relativeKey,
      mimetype: file.mimetype,
      sizeBytes: file.size,
    });

    return {
      url: this.getPublicUrl(relativeKey),
      storageProvider: "local",
      storageKey: relativeKey,
      mimeType: file.mimetype,
      originalName: file.originalname,
      sizeBytes: file.size,
    };
  }

  async storeInCloudinary({ file, folder }) {
    this.ensureCloudinaryConfigured();

    const finalFolder = `${env.CLOUDINARY_FOLDER_PREFIX}/${folder}`.replace(/\/+/g, "/");

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: finalFolder,
          resource_type: "auto",
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(uploadResult);
        }
      );

      uploadStream.end(file.buffer);
    });

    logger.info("FILE_STORED_CLOUDINARY", {
      storageKey: result.public_id,
      mimetype: file.mimetype,
      sizeBytes: file.size,
    });

    return {
      url: result.secure_url,
      storageProvider: "cloudinary",
      storageKey: result.public_id,
      mimeType: file.mimetype,
      originalName: file.originalname,
      sizeBytes: file.size,
    };
  }

  async deleteAsset({ storageProvider, storageKey }) {
    if (!storageProvider || !storageKey) {
      return;
    }

    try {
      if (storageProvider === "cloudinary") {
        this.ensureCloudinaryConfigured();
        await cloudinary.uploader.destroy(storageKey, {
          resource_type: "image",
          invalidate: true,
        });
        await cloudinary.uploader.destroy(storageKey, {
          resource_type: "raw",
          invalidate: true,
        });
        return;
      }

      await fs.unlink(this.getLocalFilePath(storageKey));
    } catch (error) {
      logger.warn("FILE_DELETE_SKIPPED", {
        storageProvider,
        storageKey,
        error: error.message,
      });
    }
  }
}

module.exports = new UploadStorageService();
