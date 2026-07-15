const axios = require("axios");
const env = require("../../config/env");

class GatewayClient {
  constructor() {
    this.client = axios.create({
      baseURL: "https://api.razorpay.com/v1",
      timeout: 10000,
      auth: {
        username: env.gateway.razorpayKeyId,
        password: env.gateway.razorpayKeySecret
      }
    });
  }

  async createOrder({ amount, currency, receipt, notes }) {
    const payload = new URLSearchParams({
      amount: String(amount),
      currency,
      receipt
    });

    Object.entries(notes || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        payload.append(`notes[${key}]`, String(value));
      }
    });

    const response = await this.client.post("/orders", payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    return response.data;
  }

  async fetchPayment(paymentId) {
    const response = await this.client.get(`/payments/${paymentId}`);
    return response.data;
  }

  async capturePayment(paymentId, amount, currency) {
    const payload = new URLSearchParams({
      amount: String(amount),
      currency
    });

    const response = await this.client.post(`/payments/${paymentId}/capture`, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    return response.data;
  }

  async refundPayment(paymentId, amount, notes = {}) {
    const payload = new URLSearchParams({
      amount: String(amount)
    });

    Object.entries(notes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        payload.append(`notes[${key}]`, String(value));
      }
    });

    const response = await this.client.post(`/payments/${paymentId}/refund`, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    return response.data;
  }
}

module.exports = new GatewayClient();
