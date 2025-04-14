// frontend/src/App.tsx (Ensure NO BrowserRouter here)
import React from 'react'; // Ensure React is imported
import { Routes, Route } from 'react-router-dom';

// --- Page and Component Imports ---
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminSignInPage from './pages/AdminSignInPage';
import AreaAdminSignInPage from './pages/AreaAdminSignInPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AreaAdminDashboardPage from './pages/AreaAdminDashboardPage';
import AdminOverview from './pages/admin/AdminOverview';
import AdminMembers from './pages/admin/AdminMembers';
import AdminAreaAdmins from './pages/admin/AdminAreaAdmins';
import AdminPayments from './pages/admin/AdminPayments';
import ProtectedRoute from './components/auth/ProtectedRoute';

import './App.css';

function App() {
  // --- NO BrowserRouter here ---
  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/signin" element={<AdminSignInPage />} />
        <Route path="/area-admin/signin" element={<AreaAdminSignInPage />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />}>
            <Route index element={<AdminOverview />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="area-admins" element={<AdminAreaAdmins />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>
        </Route>

        {/* Protected Area Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['areaAdmin']} />}>
          <Route path="/area-admin/dashboard" element={<AreaAdminDashboardPage />} />
          {/* Nest Area Admin specific pages here later */}
        </Route>

        {/* Not Found Route */}
        
      </Routes>
  );
   // --- NO closing </BrowserRouter> here ---
}

export default App;