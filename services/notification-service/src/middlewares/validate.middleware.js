module.exports = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const extractedErrors = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message.replace(/['"]/g, '')
      }));

      return res.status(400).json({
        success: false,
        code: 'SCHEMA_VALIDATION_FAILED',
        errors: extractedErrors
      });
    }

    // Replace request body parameters with verified, sanitized parameters
    req.body = value;
    next();
  };
};
