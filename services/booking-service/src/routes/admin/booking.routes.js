const express = require('express');
const router = express.Router();
const AdminQueryService = require('../../services/booking/queries/admin-query.service');
const AdminCommandService = require('../../services/booking/commands/admin-command.service');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const { bookingIdSchema } = require('../../validators/booking.validator');
const Joi = require('joi');

const adminQuery = new AdminQueryService();
const adminCommand = new AdminCommandService();

router.use(authenticate, authorize('ADMIN'));

// Administrative Diagnostics Endpoints
router.get('/search', async (req, res, next) => {
  try {
    const result = await adminQuery.searchBookings(req.query, req.query.page, req.query.limit);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/analytics', async (req, res, next) => {
  try {
    const report = await adminQuery.getAnalyticsOverview();
    res.status(200).json({ success: true, data: report });
  } catch (err) { next(err); }
});

// Administrative Override Controls
const manualAssignBodySchema = Joi.object({
  providerId: Joi.string().hex().length(24).required(),
  businessName: Joi.string().required(),
  phone: Joi.string().required()
});

router.post('/:id/assign-provider', validate({ params: bookingIdSchema, body: manualAssignBodySchema }), async (req, res, next) => {
  try {
    const adminActor = { userId: req.user.userId, role: req.user.role };
    const result = await adminCommand.forceAssignProvider(req.params.id, adminActor, req.validatedBody);
    res.status(200).json({ success: true, message: 'Provider manual assignment complete.', data: result });
  } catch (err) { next(err); }
});

module.exports = router;
