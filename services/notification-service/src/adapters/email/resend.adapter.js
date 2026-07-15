class ResendAdapter {
  constructor(env, logger) {
    this.env = env;
    this.logger = logger;
  }

  async sendEmail(payload) {
    this.logger.warn('Resend adapter not configured. Email flow should use SMTP transporter.');
    return {
      provider: 'RESEND',
      providerMessageId: `resend_mock_${Date.now()}`,
      payload
    };
  }
}

module.exports = ResendAdapter;
