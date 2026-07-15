const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { TRACKING_ROLES } = require('../constants/tracking.constants');
const logger = require('../config/logger');

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      logger.warn(`Handshake Refused: Missing authorization security token mapping vector for socket ${socket.id}`);
      return next(new Error('Authentication failed: Secure authorization credentials required.'));
    }

    // Fixed Bug 2: Enforced rigorous constraints on the identity token verification context signature
    const decoded = jwt.verify(token, config.jwtAccessSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      algorithms: ['HS256']
    });

    const absoluteRole = decoded.role?.toUpperCase();
    if (!Object.values(TRACKING_ROLES).includes(absoluteRole)) {
      logger.warn(`Handshake Revoked: Unauthorized tenancy role violation for client identity mapping context ID ${decoded.userId}`);
      return next(new Error('Authorization failed: Forbidden account operational access tier.'));
    }

    // Set immutable user identifier fields directly onto the connection socket descriptor state object
    socket.user = Object.freeze({
      userId: decoded.userId,
      role: absoluteRole
    });

    next();
  } catch (error) {
    logger.error('WebSocket gateway security validation phase initialization failure details:', error);
    return next(new Error('Authentication failed: Malformed or expired access security footprint.'));
  }
};

module.exports = socketAuthMiddleware;
