"use strict";
// backend/src/routes/paymentRoutes.ts
// ** Added import for recordPaymentByAdmin and new POST /by-admin route **
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController"); // Verify path
const authMiddleware_1 = require("../middleware/authMiddleware"); // Verify path
const router = express_1.default.Router();
// --- Apply protect middleware to ALL payment routes below ---
router.use(authMiddleware_1.protect);
// --- Define Routes ---
// GET /api/payments?memberId=... (For Admin to get specific member payments)
router.get('/', (0, authMiddleware_1.restrictTo)('admin'), paymentController_1.getPayments);
// GET /api/payments/all - Get ALL payments (Admin only)
router.get('/all', (0, authMiddleware_1.restrictTo)('admin'), paymentController_1.getAllPayments);
// *** ADD THIS NEW ROUTE for Admin recording payment ***
// POST /api/payments/by-admin - Admin records a payment for any member
router.post('/by-admin', (0, authMiddleware_1.restrictTo)('admin'), paymentController_1.recordPaymentByAdmin);
// *** END ADDED ROUTE ***
// POST /api/payments - Record a new payment (Area Admin only) - Keep original separate
router.post('/', (0, authMiddleware_1.restrictTo)('areaAdmin'), paymentController_1.recordPayment);
// GET /api/payments/my-area - Get payments recorded by logged-in Area Admin
router.get('/my-area', (0, authMiddleware_1.restrictTo)('areaAdmin'), paymentController_1.getPaymentsForAreaAdmin);
// Routes for operating on a specific payment by its ID
router.route('/:paymentId')
    .put((0, authMiddleware_1.restrictTo)('admin', 'areaAdmin'), paymentController_1.updatePayment)
    .delete((0, authMiddleware_1.restrictTo)('admin', 'areaAdmin'), paymentController_1.deletePayment);
exports.default = router;
