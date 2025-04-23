"use strict";
// backend/src/middleware/authMiddleware.ts
// ** CORRECTED restrictTo Function **
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
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
// Optional: import prisma from '../lib/prisma'; // Not strictly needed here
dotenv_1.default.config();
// --- protect Middleware (Keep As Is) ---
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    const jwtSecret = process.env.JWT_SECRET;
    console.log(`[Protect Middleware] Running for URL: ${req.originalUrl}`);
    if (!jwtSecret) {
        console.error("[Protect Middleware] JWT_SECRET not defined.");
        return res.status(500).json({ message: 'Server config error (JWT)' });
    }
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log(`[Protect Middleware] Token found. Verifying...`);
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            console.log("[Protect Middleware] Decoded JWT Payload:", decoded);
            // Ensure decoded.role exists before attaching
            if (!decoded.id || !decoded.role) {
                console.error(`[Protect Middleware] Token payload missing id or role.`);
                return res.status(401).json({ message: 'Not authorized, invalid token payload' });
            }
            req.user = { id: decoded.id, role: decoded.role }; // Attach user
            console.log("[Protect Middleware] Attached req.user:", req.user);
            next(); // Proceed
        }
        catch (error) {
            console.error(`[Protect Middleware] Token verification FAILED:`, error.message || error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    else {
        console.log(`[Protect Middleware] No token found in Authorization header.`);
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
});
exports.protect = protect;
// --- *** CORRECTED restrictTo Function *** ---
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        var _a;
        // @ts-ignore - User object attached by protect middleware
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role; // e.g., 'Admin' or 'AreaAdmin' from Token
        // Convert allowed roles to lowercase ONCE for efficient checking
        const lowerCaseAllowedRoles = allowedRoles.map(role => role.toLowerCase());
        // Convert user's role from token to lowercase for comparison
        const lowerCaseUserRole = userRole === null || userRole === void 0 ? void 0 : userRole.toLowerCase();
        // ** Corrected Logging **
        console.log(`[Restrict Middleware] Checking role. User role: '${userRole}' (checking as '${lowerCaseUserRole}'), Allowed roles: [${lowerCaseAllowedRoles.join(', ')}]`);
        // ** Corrected Case-Insensitive Check **
        // Check if a user role exists and if its lowercase version is included in the lowercase allowed roles array
        if (!lowerCaseUserRole || !lowerCaseAllowedRoles.includes(lowerCaseUserRole)) {
            console.log(`[Restrict Middleware] Role restriction FAILED!`);
            // Use 403 Forbidden status code for authorization failures
            return res.status(403).json({
                message: `Forbidden: Your role ('${userRole}') is not authorized to access this resource.`
            });
        }
        // If the check passes:
        console.log(`[Restrict Middleware] Role check PASSED.`);
        next(); // User has one of the allowed roles, proceed to the next middleware/controller
    };
};
exports.restrictTo = restrictTo;
// --- *** END CORRECTED restrictTo Function *** ---
