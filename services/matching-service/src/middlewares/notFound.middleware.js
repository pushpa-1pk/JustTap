const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
  next(new ApiError(`Target path resource execution route does not exist: ${req.originalUrl}`, 404));
};

module.exports = notFound;