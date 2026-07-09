const express = require("express");
const adminController = require("../controllers/admin.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { adminRateLimiter } = require("../middlewares/rate-limit.middleware");
const validate = require("../middlewares/validate.middleware");
const { createCategory, updateCategory } = require("../validators/category.validator");
const { createService, updateService } = require("../validators/service.validator");
const {
  approveCustomSkill,
  rejectCustomSkill,
  convertCustomSkill,
} = require("../validators/custom-skill.validator");
const {
  categoryIdParam,
  serviceIdParam,
  customSkillIdParam,
  serviceListQuery,
  adminCategoryListQuery,
  customSkillListQuery,
} = require("../validators/common.validator");

const router = express.Router();

router.use(adminRateLimiter, verifyToken, verifyRole(["admin"]));

router.post("/categories", validate(createCategory), adminController.createCategory);
router.get("/categories", validate(adminCategoryListQuery, "query"), adminController.listCategories);
router.get("/categories/:categoryId", validate(categoryIdParam, "params"), adminController.getCategory);
router.put("/categories/:categoryId", validate(categoryIdParam, "params"), validate(updateCategory), adminController.updateCategory);
router.delete("/categories/:categoryId", validate(categoryIdParam, "params"), adminController.deleteCategory);

router.post("/services", validate(createService), adminController.createService);
router.get("/services", validate(serviceListQuery, "query"), adminController.listServices);
router.get("/services/:serviceId", validate(serviceIdParam, "params"), adminController.getService);
router.put("/services/:serviceId", validate(serviceIdParam, "params"), validate(updateService), adminController.updateService);
router.delete("/services/:serviceId", validate(serviceIdParam, "params"), adminController.deleteService);

router.get("/custom-skills", validate(customSkillListQuery, "query"), adminController.listCustomSkills);
router.post("/custom-skills/:customSkillId/approve", validate(customSkillIdParam, "params"), validate(approveCustomSkill), adminController.approveCustomSkill);
router.post("/custom-skills/:customSkillId/reject", validate(customSkillIdParam, "params"), validate(rejectCustomSkill), adminController.rejectCustomSkill);
router.post("/custom-skills/:customSkillId/convert", validate(customSkillIdParam, "params"), validate(convertCustomSkill), adminController.convertCustomSkill);

module.exports = router;
