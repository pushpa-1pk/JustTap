const transporter = require('../../../adapters/email/nodemailer.adapter');

class EmailChannel {
  constructor(emailAdapter, logger) {
    this.emailAdapter = emailAdapter;
    this.logger = logger;
  }

  async send(jobData) {
    const { metadata, title, body } = jobData;
    const targetEmail = metadata?.email || jobData.metadata?.get('email');
    
    if (!targetEmail) {
      throw new Error('PAYLOAD_MISSING_EMAIL_ADDRESS');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || 'noreply@justtap.in',
      to: targetEmail,
      subject: title,
      text: body,
      html: `<p>${body}</p>`
    };

    if (!transporter) {
      throw new Error('SMTP_TRANSPORT_NOT_CONFIGURED');
    }

    const info = await transporter.sendMail(mailOptions);
    return { success: true, provider: 'SMTP_GATEWAY', providerMessageId: info.messageId };
  }
}

module.exports = EmailChannel;
