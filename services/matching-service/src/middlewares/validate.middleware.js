const ApiError = require("../utils/ApiError");

const validate = (schemas) => {
  return (req, res, next) => {
    const targets = ["body", "params", "query"];
    const validationErrors = [];

    targets.forEach((target) => {
      if (schemas[target]) {
        const { error, value } = schemas[target].validate(req[target], {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });

        if (error) {
          error.details.forEach((err) => {
            validationErrors.push({
              field: `${target}.${err.path.join(".")}`,
              message: err.message
            });
          });
        } else {
          if (target === "body") req.validatedBody = value;
          if (target === "params") req.validatedParams = value;
          if (target === "query") req.validatedQuery = value;
        }
      }
    });

    if (validationErrors.length > 0) {
      return next(new ApiError("Request schema assertion validation failure", 400, validationErrors));
    }

    next();
  };
};

module.exports = validate;