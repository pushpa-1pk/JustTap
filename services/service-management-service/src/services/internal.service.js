const providerServiceRepository = require("../repositories/provider-service.repository");

class InternalService {
  async filterProvidersByService(providerIds, serviceId) {
    const { items } = await providerServiceRepository.search({
      serviceId,
      isAvailable: true,
    });

    return items
      .filter((item) => providerIds.includes(String(item.providerId)))
      .map((item) => ({
        providerId: String(item.providerId),
        providerServiceId: String(item._id),
        price: Number(item.price || 0),
        priceType: item.priceType || "fixed",
        currency: "INR",
        experienceYears: Number(item.experience || 0),
      }));
  }
}

module.exports = new InternalService();
