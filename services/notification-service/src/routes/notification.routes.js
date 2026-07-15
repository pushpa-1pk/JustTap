const express = require('express');
const authGate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const NotificationController = require('../controllers/notification.controller');
const container = require('../bootstrap/container');
const {
  registerDeviceSchema,
  updatePreferencesSchema
} = require('../validators/request.validator');

const router = express.Router();

const initRoutes = () => {
  const controller = new NotificationController(container);

  router.post('/devices/register', authGate, validate(registerDeviceSchema), controller.registerDevice);
  router.put('/preferences', authGate, validate(updatePreferencesSchema), controller.updateUserPreferences);
  router.get('/', authGate, controller.fetchNotificationFeed);
  router.post('/:id/read', authGate, controller.markNotificationRead);
  router.post('/:id/click', authGate, controller.markNotificationClicked);

  return router;
};

module.exports = initRoutes;
