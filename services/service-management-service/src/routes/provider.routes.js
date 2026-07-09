const express = require("express");
const providerController = require("../controllers/provider.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { providerRateLimiter } = require("../middlewares/rate-limit.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createProviderService,
  updateProviderService,
  updateProviderServiceStatus,
} = require("../validators/provider-service.validator");
const {
  createCustomSkill,
  updateCustomSkill,
} = require("../validators/custom-skill.validator");
const {
  providerServiceIdParam,
  customSkillIdParam,
} = require("../validators/common.validator");

const router = express.Router();

router.use(providerRateLimiter, verifyToken, verifyRole(["provider"]));

router.post("/services", validate(createProviderService), providerController.addService);
router.get("/services", providerController.listServices);
router.put("/services/:providerServiceId", validate(providerServiceIdParam, "params"), validate(updateProviderService), providerController.updateService);
router.patch("/services/:providerServiceId/status", validate(providerServiceIdParam, "params"), validate(updateProviderServiceStatus), providerController.updateServiceStatus);
router.delete("/services/:providerServiceId", validate(providerServiceIdParam, "params"), providerController.deleteService);

router.post("/custom-skills", validate(createCustomSkill), providerController.createCustomSkill);
router.get("/custom-skills", providerController.listCustomSkills);
router.put("/custom-skills/:customSkillId", validate(customSkillIdParam, "params"), validate(updateCustomSkill), providerController.updateCustomSkill);
router.delete("/custom-skills/:customSkillId", validate(customSkillIdParam, "params"), providerController.deleteCustomSkill);

module.exports = router;
