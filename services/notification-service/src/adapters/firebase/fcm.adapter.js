const firebaseAdminModule = require('firebase-admin');
const logger = require('../../config/logger');

const admin = firebaseAdminModule.default || firebaseAdminModule;

if (!Array.isArray(admin.apps) && !admin.apps) {
  admin.apps = [];
}

if ((!admin.apps || admin.apps.length === 0) && process.env.FIREBASE_CREDENTIALS_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    logger.error('Firebase structural mapping init fallback error triggered:', err);
  }
}

class FcmAdapter {
  async sendMulticastPush(tokens, title, body, dataPayload = {}) {
    if (!admin.apps || admin.apps.length === 0) {
      logger.warn('FCM configurations not localized. Emulating success tracking logs.');
      return { successCount: tokens.length, failureCount: 0, responses: [] };
    }

    const message = {
      tokens,
      notification: { title, body },
      data: { ...dataPayload, click_action: 'FLUTTER_NOTIFICATION_CLICK' }
    };

    return admin.messaging().sendEachForMulticast(message);
  }
}

module.exports = FcmAdapter;
