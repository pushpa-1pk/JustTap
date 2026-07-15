const asyncHandler = (executionFn) => {
  return (req, res, next) => {
    Promise.resolve(executionFn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;