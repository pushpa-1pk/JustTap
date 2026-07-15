const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header signature structure mismatched.' });
  }

  const token = authorizationHeader.split(' ')[1];
  try {
    const validatedUserDecoded = jwt.verify(token, env.JWT_SECRET);
    const userId = validatedUserDecoded.userId || validatedUserDecoded.id || validatedUserDecoded.sub;
    if (!userId) {
      return res.status(403).json({ success: false, error: 'Authentication token missing user identifier.' });
    }

    req.user = {
      id: userId,
      role: validatedUserDecoded.role || null,
      roles: validatedUserDecoded.roles || []
    };
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Authentication challenge signature expired or invalid.' });
  }
};
