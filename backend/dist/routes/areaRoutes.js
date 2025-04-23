"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/areaRoutes.ts
const express_1 = __importDefault(require("express"));
const areaController_1 = require("../controllers/areaController"); // Import area controllers
const authMiddleware_1 = require("../middleware/authMiddleware"); // Import middleware
const router = express_1.default.Router();
// Apply authentication and ADMIN ONLY restriction to all area routes
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.restrictTo)('admin')); // Only main admin can manage areas
// Define CRUD routes for /api/areas
router.route('/')
    .get(areaController_1.getAllAreas) // GET /api/areas
    .post(areaController_1.createArea); // POST /api/areas
// Define CRUD routes for /api/areas/:id
router.route('/:id')
    // GET /api/areas/:id (Add controller later if needed)
    // .get(getAreaById)
    .put(areaController_1.updateArea) // PUT /api/areas/:id
    .delete(areaController_1.deleteArea); // DELETE /api/areas/:id
exports.default = router;
