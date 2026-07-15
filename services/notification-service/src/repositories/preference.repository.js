const BaseRepository = require('./base.repository');
const NotificationPreference = require('../models/preference.model');

class PreferenceRepository extends BaseRepository {
  constructor() {
    super(NotificationPreference);
  }

  async resolveUserPreferences(userId) {
    let pref = await this.findOne({ userId });
    if (!pref) {
      pref = await this.create({ userId });
    }
    return pref;
  }
}

module.exports = PreferenceRepository;