class ProviderCapabilityDTO {
  constructor(rawJson) {
    this.providerId = String(rawJson.providerId);
    this.providerServiceId = rawJson.providerServiceId
      ? String(rawJson.providerServiceId)
      : null;
    this.pricing = {
      value: Number(rawJson.price || rawJson.pricing?.value || 0),
      type: String(rawJson.priceType || rawJson.pricing?.type || "FIXED").toUpperCase(),
      currency: String(rawJson.currency || rawJson.pricing?.currency || "INR").toUpperCase(),
    };
    this.experienceYears = Number(
      rawJson.experienceYears || rawJson.experience || 0
    );
  }

  static fromResponseArray(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item) => new ProviderCapabilityDTO(item));
  }
}

module.exports = {
  ProviderCapabilityDTO,
};
