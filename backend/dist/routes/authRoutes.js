"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/authRoutes.ts (MODIFIED)
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController"); // Verify controller path
const authMiddleware_1 = require("../middleware/authMiddleware"); // Verify middleware path
const router = express_1.default.Router();
// --- Public Auth Routes (These run BEFORE the 'protect' middleware) ---
router.post('/admin/login', authController_1.adminLoginHandler);
router.post('/area-admin/login', authController_1.areaAdminLoginHandler); // <-- 2. Add/Uncomment this route
// --- Protected Routes ---
// All routes defined BELOW this line will first run the 'protect' middleware
router.use(authMiddleware_1.protect);
// Specific routes for the logged-in admin ('/api/auth/admin/me')
// These require a valid token (from protect) AND the 'admin' role (from restrictTo)
router.route('/admin/me')
    .get((0, authMiddleware_1.restrictTo)('admin'), authController_1.getAdminProfile)
    .put((0, authMiddleware_1.restrictTo)('admin'), authController_1.updateAdminProfile);
// Add other PROTECTED auth-related routes here later if needed
exports.default = router;
