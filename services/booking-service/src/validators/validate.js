const ApiError = require('../utils/api.error');

/**
 * Validates multiple target express parameters concurrently
 * Usage: validate({ body: schema, params: schema })
 */
const validate = (specs) => {
  return (req, res, next) => {
    const errorAccumulator = [];
    const targets = ['body', 'params', 'query'];

    targets.forEach((target) => {
      if (specs[target]) {
        const { error, value } = specs[target].validate(req[target], {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true
        });

        if (error) {
          error.details.forEach((detail) => {
            errorAccumulator.push({
              field: `${target}.${detail.path.join('.')}`,
              message: detail.message.replace(/"/g, '')
            });
          });
        } else {
          // Re-attach the validated and sanitized value back to the request segment
          req[target] = value;
          req[`validated${target.charAt(0).toUpperCase()}${target.slice(1)}`] = value;
        }
      }
    });

    if (errorAccumulator.length > 0) {
      return next(new ApiError('Request schema validation failed.', 400, errorAccumulator));
    }

    next();
  };
};

module.exports = validate;
