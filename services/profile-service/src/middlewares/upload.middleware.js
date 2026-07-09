const multer = require("multer");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const createUploadMiddleware = ({
  fieldName,
  maxFileSizeMb,
  allowedMimeTypes,
}) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
    },
    fileFilter(req, file, callback) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
        return;
      }

      callback(null, true);
    },
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError) {
        return next(new ApiError(400, error.message));
      }

      return next(error);
    });
  };
};

const profileImageUpload = createUploadMiddleware({
  fieldName: "profileImage",
  maxFileSizeMb: env.PROFILE_IMAGE_MAX_FILE_SIZE_MB,
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
});

const providerDocumentUpload = createUploadMiddleware({
  fieldName: "document",
  maxFileSizeMb: env.DOCUMENT_MAX_FILE_SIZE_MB,
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
});

module.exports = {
  profileImageUpload,
  providerDocumentUpload,
};
