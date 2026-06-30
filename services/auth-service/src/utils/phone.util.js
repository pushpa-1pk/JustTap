const normalizePhoneNumber = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    throw new Error("Phone number is required");
  }

  const digits = raw.replace(/[^\d+]/g, "");

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^\+91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  throw new Error("Invalid Indian phone number");
};

module.exports = {
  normalizePhoneNumber,
};
