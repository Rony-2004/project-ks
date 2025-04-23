"use strict";
// backend/src/controllers/authController.ts
// ** FINAL CORRECTED VERSION - Admin uses DB & Hashing **
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminProfile = exports.getAdminProfile = exports.areaAdminLoginHandler = exports.adminLoginHandler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt")); // Use bcrypt for both admin and area admin
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client"); // Assuming you have UserRole enum
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// --- ADMIN LOGIN HANDLER (Uses DB & Hashed Password) ---
const adminLoginHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST /api/auth/admin/login ---`);
    // Admin logs in with email & password now
    const { email, password } = req.body;
    console.log(`[${controllerStartTime.toISOString()}] Request Body: email=${email}, password=${password ? '******' : undefined}`);
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and Password required' });
    }
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
    if (!jwtSecret) {
        console.error(`[${controllerStartTime.toISOString()}] AdminLogin: FAIL - Server config error (JWT_SECRET missing)`);
        return res.status(500).json({ message: 'Server configuration error.' });
    }
    console.log(`[${controllerStartTime.toISOString()}] AdminLogin: JWT config OK.`);
    try {
        console.log(`[${controllerStartTime.toISOString()}] AdminLogin: Finding admin user by email: ${email}...`);
        // 1. Find the admin user in the database by email
        const adminUser = yield prisma_1.default.user.findUnique({
            where: { email: email }
        });
        // 2. Check if user exists and has the 'Admin' role
        // Make sure UserRole.Admin matches your Prisma Enum name
        if (!adminUser || adminUser.role !== client_1.UserRole.Admin) {
            console.log(`[${controllerStartTime.toISOString()}] AdminLogin: FAIL - User not found or not an Admin.`);
            return res.status(401).json({ message: 'Invalid credentials' }); // Generic message
        }
        console.log(`[${controllerStartTime.toISOString()}] AdminLogin: Found Admin user: ${adminUser.id}. Comparing hash...`);
        // 3. Compare submitted password with stored hash using bcrypt
        if (!adminUser.passwordHash) {
            console.error(`[${controllerStartTime.toISOString()}] AdminLogin: FAIL - Admin user ${adminUser.id} has no password hash set in DB.`);
            return res.status(500).json({ message: 'Admin account configuration error.' });
        }
        const passwordMatches = yield bcrypt_1.default.compare(password, adminUser.passwordHash);
        if (passwordMatches) {
            console.log(`[${controllerStartTime.toISOString()}] AdminLogin: Password MATCH.`);
            // 4. Generate JWT with ACTUAL Database ID and Role
            const payload = {
                id: adminUser.id, // <<<--- Use the actual ID from the database
                role: adminUser.role // <<<--- Use the actual Role from the database
            };
            console.log(">>> [AdminLogin] Signing JWT with payload:", payload);
            const token = jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
            console.log(`[${controllerStartTime.toISOString()}] AdminLogin: Token signed.`);
            // 5. Send Response (exclude password hash)
            return res.status(200).json({
                token: token,
                message: 'Admin login successful',
                user: {
                    id: adminUser.id,
                    name: adminUser.name,
                    email: adminUser.email,
                    role: adminUser.role
                }
            });
        }
        else {
            console.log(`[${controllerStartTime.toISOString()}] AdminLogin: FAIL - Password MISMATCH.`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    }
    catch (error) {
        console.error(`[${controllerStartTime.toISOString()}] AdminLogin: FAIL - Database or other error:`, error);
        return res.status(500).json({ message: 'Authentication error' });
    }
}); // End adminLoginHandler
exports.adminLoginHandler = adminLoginHandler;
// --- AREA ADMIN LOGIN HANDLER (Remains the same) ---
const areaAdminLoginHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST /api/auth/area-admin/login ---`);
    const { email, password } = req.body;
    console.log(`[${controllerStartTime.toISOString()}] Request Body: email=${email}, password=${password ? '******' : undefined}`);
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and Password required' });
    }
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
    if (!jwtSecret) {
        return res.status(500).json({ message: 'Server config error.' });
    }
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { email: email } });
        if (!user || user.role !== client_1.UserRole.AreaAdmin) {
            console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: User not found or not AreaAdmin.`);
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }
        if (!user.passwordHash) {
            console.error(`[${controllerStartTime.toISOString()}] AreaAdminLogin: FAIL - AreaAdmin user ${user.id} has no password hash set.`);
            return res.status(500).json({ message: 'Account configuration error.' });
        }
        const passwordMatches = yield bcrypt_1.default.compare(password, user.passwordHash);
        if (passwordMatches) {
            // Ensure role value matches what your 'restrictTo' middleware expects
            const payload = { id: user.id, role: 'areaAdmin', name: user.name };
            const token = jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
            return res.status(200).json({
                token: token, message: 'Area Admin login successful',
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        }
        else {
            console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: Password MISMATCH.`);
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }
    }
    catch (error) {
        console.error(`[${controllerStartTime.toISOString()}] AreaAdminLogin Error:`, error);
        return res.status(500).json({ message: 'Authentication error' });
    }
}); // End areaAdminLoginHandler
exports.areaAdminLoginHandler = areaAdminLoginHandler;
// --- GET Admin Profile ('/me') (Uses Database) ---
const getAdminProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // @ts-ignore
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // ID from corrected token
    // @ts-ignore
    const loggedInUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const logPrefix = `[${new Date().toISOString()}] getAdminProfile DB:`;
    console.log(`${logPrefix} requested by user ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);
    if (loggedInUserRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Not an admin user' });
    }
    if (!loggedInUserId) {
        return res.status(401).json({ message: 'Unauthorized: Admin ID missing from token' });
    }
    try {
        const adminUser = yield prisma_1.default.user.findUnique({
            where: { id: loggedInUserId },
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true /*, profilePictureUrl: true */ }
        });
        if (!adminUser) {
            return res.status(404).json({ message: 'Admin profile not found' });
        }
        console.log(`${logPrefix} Profile found for ID: ${loggedInUserId}.`);
        res.status(200).json(adminUser); // Return actual data
    }
    catch (error) {
        console.error(`${logPrefix} Error fetching admin profile:`, error);
        res.status(500).json({ message: 'Error fetching profile data' });
    }
});
exports.getAdminProfile = getAdminProfile;
// --- UPDATE Admin Profile ('/me') (Uses Database) ---
const updateAdminProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // @ts-ignore
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Actual DB ID from token
    // @ts-ignore
    const loggedInUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const logPrefix = `[${new Date().toISOString()}] updateAdminProfile DB:`;
    const { name } = req.body; // Allow updating name
    console.log(`${logPrefix} requested by user: ${loggedInUserId} with data:`, req.body);
    if (loggedInUserRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    if (!loggedInUserId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
        return res.status(400).json({ message: 'Invalid name (min 3 chars)' });
    }
    try {
        const updatedAdmin = yield prisma_1.default.user.update({
            where: { id: loggedInUserId },
            data: { name: name.trim() },
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true /*, profilePictureUrl: true */ }
        });
        console.log(`${logPrefix} Profile updated successfully for ID: ${loggedInUserId}.`);
        res.status(200).json(updatedAdmin); // Return updated data
    }
    catch (error) {
        console.error(`${logPrefix} Error updating admin profile for ID ${loggedInUserId}:`, error);
        // @ts-ignore
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Admin user not found during update.' });
        }
        res.status(500).json({ message: 'Error updating profile' });
    }
});
exports.updateAdminProfile = updateAdminProfile;
// --- Password Change & DP Upload functions to be added later ---
