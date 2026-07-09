const ApiError = require("../utils/ApiError");
const { toSlug } = require("../utils/slug.util");
const providerCustomSkillRepository = require("../repositories/provider-custom-skill.repository");
const serviceRepository = require("../repositories/service.repository");
const categoryRepository = require("../repositories/category.repository");
const providerServiceService = require("./provider-service.service");
const logger = require("./logger.service");

class CustomSkillService {
  async createCustomSkill(providerId, accessToken, data) {
    await providerServiceService.assertVerifiedProvider(accessToken);

    const existing = await providerCustomSkillRepository.findByProviderAndSkillName(
      providerId,
      data.skillName
    );

    if (existing) {
      throw new ApiError(409, "You already submitted this custom skill.");
    }

    const skill = await providerCustomSkillRepository.create({
      providerId,
      ...data,
      status: "Pending",
    });

    logger.info("CUSTOM_SKILL_CREATED", {
      providerId,
      customSkillId: skill._id,
    });

    return skill;
  }

  async getProviderCustomSkills(providerId) {
    return providerCustomSkillRepository.findByProviderId(providerId);
  }

  async updateCustomSkill(id, providerId, accessToken, data) {
    await providerServiceService.assertVerifiedProvider(accessToken);

    const skill = await providerCustomSkillRepository.findOwnedById(id, providerId);

    if (!skill) {
      throw new ApiError(404, "Custom skill not found.");
    }

    if (skill.status !== "Pending") {
      throw new ApiError(409, "Only pending custom skills can be edited.");
    }

    if (data.skillName && data.skillName.toLowerCase() !== skill.skillName.toLowerCase()) {
      const duplicate = await providerCustomSkillRepository.findByProviderAndSkillName(
        providerId,
        data.skillName
      );
      if (duplicate && duplicate._id.toString() !== id) {
        throw new ApiError(409, "You already submitted this custom skill.");
      }
    }

    const updated = await providerCustomSkillRepository.update(id, data);
    logger.info("CUSTOM_SKILL_UPDATED", { providerId, customSkillId: id });
    return updated;
  }

  async deleteCustomSkill(id, providerId, accessToken) {
    await providerServiceService.assertVerifiedProvider(accessToken);

    const skill = await providerCustomSkillRepository.findOwnedById(id, providerId);

    if (!skill) {
      throw new ApiError(404, "Custom skill not found.");
    }

    if (skill.status === "Approved" && skill.convertedServiceId) {
      throw new ApiError(
        409,
        "Approved custom skills converted to official services cannot be deleted."
      );
    }

    await providerCustomSkillRepository.delete(id);
    logger.info("CUSTOM_SKILL_DELETED", { providerId, customSkillId: id });
    return { message: "Custom skill deleted successfully." };
  }

  async listCustomSkills({ status, page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    return providerCustomSkillRepository.findAll({ status, skip, limit });
  }

  async approveCustomSkill(id, adminId, adminRemarks = "") {
    const skill = await providerCustomSkillRepository.findById(id);

    if (!skill) {
      throw new ApiError(404, "Custom skill not found.");
    }

    if (skill.status !== "Pending") {
      throw new ApiError(409, "Only pending custom skills can be approved.");
    }

    const updated = await providerCustomSkillRepository.update(id, {
      status: "Approved",
      adminRemarks,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    });

    logger.info("CUSTOM_SKILL_APPROVED", { customSkillId: id, adminId });
    return updated;
  }

  async rejectCustomSkill(id, adminId, adminRemarks) {
    const skill = await providerCustomSkillRepository.findById(id);

    if (!skill) {
      throw new ApiError(404, "Custom skill not found.");
    }

    if (skill.status !== "Pending") {
      throw new ApiError(409, "Only pending custom skills can be rejected.");
    }

    const updated = await providerCustomSkillRepository.update(id, {
      status: "Rejected",
      adminRemarks,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    });

    logger.info("CUSTOM_SKILL_REJECTED", { customSkillId: id, adminId });
    return updated;
  }

  async convertCustomSkillToService(id, adminId, data) {
    const skill = await providerCustomSkillRepository.findById(id);

    if (!skill) {
      throw new ApiError(404, "Custom skill not found.");
    }

    if (skill.status !== "Approved") {
      throw new ApiError(409, "Only approved custom skills can be converted.");
    }

    if (skill.convertedServiceId) {
      throw new ApiError(409, "This custom skill has already been converted.");
    }

    const category = await categoryRepository.findById(data.categoryId);

    if (!category || !category.isActive) {
      throw new ApiError(404, "Category not found.");
    }

    const slug = toSlug(skill.skillName);
    const [existingName, existingSlug] = await Promise.all([
      serviceRepository.findByCategoryAndName(data.categoryId, skill.skillName),
      serviceRepository.findByCategoryAndSlug(data.categoryId, slug),
    ]);

    if (existingName || existingSlug) {
      throw new ApiError(
        409,
        "An official service with this name already exists in the category."
      );
    }

    const service = await serviceRepository.create({
      categoryId: data.categoryId,
      name: skill.skillName,
      slug,
      description: skill.description,
      estimatedDuration: data.estimatedDuration ?? 60,
      isPopular: data.isPopular ?? false,
      isActive: true,
    });

    const updatedSkill = await providerCustomSkillRepository.update(id, {
      convertedServiceId: service._id,
      adminRemarks: data.adminRemarks || skill.adminRemarks,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    });

    logger.info("CUSTOM_SKILL_CONVERTED", {
      customSkillId: id,
      serviceId: service._id,
      adminId,
    });

    return {
      customSkill: updatedSkill,
      service,
    };
  }
}

module.exports = new CustomSkillService();
