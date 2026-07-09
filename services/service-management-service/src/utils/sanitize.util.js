const HTML_TAG_REGEX = /<[^>]*>/g;

const sanitizeString = (value) => value.replace(HTML_TAG_REGEX, "").trim();

const deepSanitize = (value) => {
  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepSanitize(item)])
    );
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  return value;
};

module.exports = {
  deepSanitize,
};
