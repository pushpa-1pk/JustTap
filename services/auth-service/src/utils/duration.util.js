const DEFAULT_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const parseDurationToMs = (value) => {
  if (typeof value === "number") {
    return value * 1000;
  }

  const normalized = String(value).trim();
  const match = normalized.match(/^(\d+)([smhd])$/i);

  if (!match) {
    return DEFAULT_DURATION_MS;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

module.exports = {
  parseDurationToMs,
};
