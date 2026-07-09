const crypto = require('crypto');

const generateBookingNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  return `BKG-${datePart}-${suffix}`;
};

module.exports = generateBookingNumber;
