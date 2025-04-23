"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/memberRoutes.ts (VERIFIED)
const express_1 = __importDefault(require("express"));
const memberController_1 = require("../controllers/memberController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect); // Apply login check to all
// GET is allowed for both roles (controller filters)
router.get('/', (0, authMiddleware_1.restrictTo)('admin', 'areaAdmin'), memberController_1.getAllMembers);
// POST, PUT, DELETE only for Admin
router.post('/', (0, authMiddleware_1.restrictTo)('admin'), memberController_1.createMember);
router.route('/:id')
    .put((0, authMiddleware_1.restrictTo)('admin'), memberController_1.updateMember)
    .delete((0, authMiddleware_1.restrictTo)('admin'), memberController_1.deleteMember);
exports.default = router;
