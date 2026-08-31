const ApiError = require('../utils/apiError');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(new ApiError(400, error.details.map((detail) => detail.message).join(', ')));
    }
    req[source] = value;
    next();
  };
};

module.exports = validate;
