const Preference = require('../../models/preference.model');

class PreferenceService {
  async resolvePreferences(userId) {
    let preference = await Preference.findOne({ userId });
    if (!preference) {
      preference = await Preference.create({ userId });
    }
    return preference;
  }

  async updatePreferences(userId, patchData) {
    return Preference.findOneAndUpdate(
      { userId },
      { $set: patchData },
      { new: true, upsert: true }
    );
  }
}

module.exports = new PreferenceService();