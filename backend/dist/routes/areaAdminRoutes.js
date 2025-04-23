"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/areaAdminRoutes.ts
const express_1 = __importDefault(require("express"));
const areaAdminController_1 = require("../controllers/areaAdminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Apply middleware to ALL routes in this file
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.restrictTo)('admin'));
// Routes for /api/area-admins
router.route('/')
    .get(areaAdminController_1.getAllAreaAdmins)
    .post(areaAdminController_1.createAreaAdmin);
// **NEW** Routes for /api/area-admins/:id
router.route('/:id')
    // .get(getAreaAdminById) // Add later if needed
    .put(areaAdminController_1.updateAreaAdmin) // Handle PUT requests for updates
    .delete(areaAdminController_1.deleteAreaAdmin); // Handle DELETE requests
exports.default = router;
