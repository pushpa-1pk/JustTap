const admin = require('firebase-admin');
const env = require('./env');
const logger = require('./logger');

let firebaseAppInstance = null;

if (env.FIREBASE_CREDENTIALS_JSON && !admin.apps.length) {
  try {
    const serviceAccountJson = JSON.parse(env.FIREBASE_CREDENTIALS_JSON);
    firebaseAppInstance = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson)
    });
    logger.info('📱 Firebase Cloud Messaging (FCM) engine framework initialization verified.');
  } catch (err) {
    logger.error('❌ Failed parsing string block structural signature for Firebase config initialization:', err);
  }
} else if (admin.apps.length) {
  firebaseAppInstance = admin.app();
} else {
  logger.warn('⚠️ FIREBASE_CREDENTIALS_JSON missing. FCM worker will step back into logs trace emulations.');
}

module.exports = firebaseAppInstance;