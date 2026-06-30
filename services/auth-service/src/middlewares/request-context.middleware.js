const { randomUUID } = require("node:crypto");
const requestContext = require("../services/request-context.service");

const requestContextMiddleware = (req, res, next) => {
  const requestId = req.get("x-request-id") || randomUUID();

  requestContext.run(
    {
      requestId,
      startedAt: Date.now(),
    },
    () => {
      req.requestId = requestId;
      res.setHeader("x-request-id", requestId);
      next();
    }
  );
};

module.exports = requestContextMiddleware;
