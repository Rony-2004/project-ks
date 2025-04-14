// frontend/src/App.tsx (UPDATED - Area Admin Nested Route)
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Page Components ---
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminSignInPage from './pages/AdminSignInPage';
import AreaAdminSignInPage from './pages/AreaAdminSignInPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AreaAdminDashboardPage from './pages/AreaAdminDashboardPage'; // Layout for Area Admin

// --- Admin Section Components ---
import AdminOverview from './pages/admin/AdminOverview';
import AdminMembers from './pages/admin/AdminMembers';
import AdminAreaAdmins from './pages/admin/AdminAreaAdmins';
import AdminPayments from './pages/admin/AdminPayments';

// --- Area Admin Section Components ---
import AreaAdminMyMembers from './pages/area-admin/AreaAdminMyMembers'; // <-- Import new component

// --- Auth Wrapper ---
import ProtectedRoute from './components/auth/ProtectedRoute';

import './App.css';

function App() {
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
          <Route path="/area-admin/dashboard" element={<AreaAdminDashboardPage />}> {/* Layout */}
             {/* --- NESTED AREA ADMIN ROUTE --- */}
             <Route index element={<AreaAdminMyMembers />} /> {/* Default view */}
             {/* Add other routes like 'payments' later */}
             {/* <Route path="payments" element={<AreaAdminPayments />} /> */}
             {/* --- END NESTED --- */}
          </Route>
        </Route>

        {/* Not Found Route */}
       
      </Routes>
  );
}

export default App;