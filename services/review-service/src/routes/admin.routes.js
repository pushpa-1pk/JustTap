const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * Platform User-Facing Operations Flagging Vectors
 * Accessible by authenticated customers to report terms violations.
 */
router.post('/reviews/:reviewId/report', authMiddleware, adminController.submitAbuseReport);

/**
 * Restricted Internal Governance Control Panel Routes
 * Explicitly guards endpoint lines against privilege escalations.
 */
const verifyAdminRole = (req, res, next) => {
  if (!req.user || String(req.user.role).toLowerCase() !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access Denied: Action requires elevated administrative scopes.' 
    });
  }
  next();
};

// Apply administrative boundary guards
router.use(authMiddleware, verifyAdminRole);

router.get('/moderation/reports', adminController.getAbuseReportsQueue);
router.patch('/moderation/reviews/:reviewId', adminController.moderateReview);

module.exports = router;
