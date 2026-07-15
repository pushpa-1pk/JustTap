const BaseRepository = require('./base.repository');
const NotificationDelivery = require('../models/notificationDelivery.model');

class DeliveryRepository extends BaseRepository {
  constructor() {
    super(NotificationDelivery);
  }
}

module.exports = DeliveryRepository;