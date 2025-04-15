// frontend/src/App.tsx (MODIFIED)
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Page Components ---
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminSignInPage from './pages/AdminSignInPage';
import AreaAdminSignInPage from './pages/AreaAdminSignInPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AreaAdminDashboardPage from './pages/AreaAdminDashboardPage';

// --- Admin Dashboard Section Components ---
import AdminOverview from './pages/admin/AdminOverview';
import AdminMembers from './pages/admin/AdminMembers';
import AdminAreaAdmins from './pages/admin/AdminAreaAdmins';
import AdminPayments from './pages/admin/AdminPayments';
import ManageAreas from './pages/admin/ManageAreas';

// --- Area Admin Section Components ---
import AreaAdminMyMembers from './pages/area-admin/AreaAdminMyMembers';
import AreaAdminPaymentHistory from './pages/area-admin/AreaAdminPaymentHistory';

// --- Auth Wrapper ---
import ProtectedRoute from './components/auth/ProtectedRoute';

import './App.css';

function App() {
    return (
        <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/signin" element={<AdminSignInPage />} />
            <Route path="/area-admin/signin" element={<AreaAdminSignInPage />} />

            {/* --- Protected Admin Routes --- */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />}> {/* Admin Layout */}
                    {/* Nested Admin pages render in Outlet */}
                    <Route index element={<AdminOverview />} />
                    <Route path="members" element={<AdminMembers />} />
                    <Route path="area-admins" element={<AdminAreaAdmins />} />
                    <Route path="payments" element={<AdminPayments />} />
                    {/* --- ** 2. Add Manage Areas Route ** --- */}
                    <Route path="areas" element={<ManageAreas />} />
                    {/* --- End Add Manage Areas Route --- */}
                </Route>
            </Route>

            {/* --- Protected Area Admin Routes --- */}
            <Route element={<ProtectedRoute allowedRoles={['areaAdmin']} />}>
                <Route path="/area-admin/dashboard" element={<AreaAdminDashboardPage />}>
                    <Route index element={<AreaAdminMyMembers />} />
                    <Route path="history" element={<AreaAdminPaymentHistory />} />
                </Route>
            </Route>

            {/* --- Not Found Route --- */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}

        </Routes>
    );
}

export default App;