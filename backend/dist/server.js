"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const areaAdminRoutes_1 = __importDefault(require("./routes/areaAdminRoutes"));
const memberRoutes_1 = __importDefault(require("./routes/memberRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const areaRoutes_1 = __importDefault(require("./routes/areaRoutes")); // <-- 1. Import Area routes
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
const API_PREFIX = process.env.API_PREFIX || '/api';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Use Routes
app.use(`${API_PREFIX}/auth`, authRoutes_1.default);
app.use(`${API_PREFIX}/area-admins`, areaAdminRoutes_1.default); // Routes for managing Area Admins themselves
app.use(`${API_PREFIX}/members`, memberRoutes_1.default);
app.use(`${API_PREFIX}/payments`, paymentRoutes_1.default);
app.use(`${API_PREFIX}/areas`, areaRoutes_1.default); // <-- 2. Use Area routes
console.log(`Area routes mounted at ${API_PREFIX}/areas`); // Log mounting
// Test Route
app.get('/', (req, res) => { res.send('Backend is Running!'); });
// Start Server
app.listen(PORT, () => { console.log(`Backend server running on http://localhost:${PORT}`); });
