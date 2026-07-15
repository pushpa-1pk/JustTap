const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

let transporter = null;

if (env.SMTP_HOST && env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // Use true for 465, false for alternate ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    pool: true, // Use connection pooling for rapid marketplace email routing (invoices, receipts)
    maxConnections: 5,
    maxMessages: 100
  });

  transporter.verify((err, success) => {
    if (err) logger.error('❌ Transporter SMTP protocol connection authorization failed:', err);
    else logger.info('📧 Mail processing channel pool verified and ready.');
  });
} else {
  logger.warn('⚠️ SMTP credential configs missing. Email distribution layer tracking fallback active.');
}

module.exports = transporter;