// frontend/src/App.tsx (VERIFIED - Includes all routes)
import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Keep these imports

// --- Page Components (Ensure all these files exist and export correctly) ---
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminSignInPage from './pages/AdminSignInPage';
import AreaAdminSignInPage from './pages/AreaAdminSignInPage';
import AdminDashboardPage from './pages/AdminDashboardPage';   // Admin layout component
import AreaAdminDashboardPage from './pages/AreaAdminDashboardPage'; // Area Admin layout component


// --- Admin Dashboard Section Components ---
import AdminOverview from './pages/admin/AdminOverview';
import AdminMembers from './pages/admin/AdminMembers';
import AdminAreaAdmins from './pages/admin/AdminAreaAdmins';
import AdminPayments from './pages/admin/AdminPayments';

// --- Area Admin Section Components ---
import AreaAdminMyMembers from './pages/area-admin/AreaAdminMyMembers';     // Area Admin Members list
import AreaAdminPaymentHistory from './pages/area-admin/AreaAdminPaymentHistory'; // <-- Area Admin Payment History page

// --- Auth Wrapper ---
import ProtectedRoute from './components/auth/ProtectedRoute'; // Verify path

import './App.css'; // Main app styles

function App() {
  // NO BrowserRouter should be here - MUST be in main.tsx
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
            {/* Add more nested admin routes here */}
          </Route>
          {/* Add other top-level admin-only routes here */}
        </Route>

        {/* --- Protected Area Admin Routes --- */}
        <Route element={<ProtectedRoute allowedRoles={['areaAdmin']} />}>
          {/* This Route uses the Area Admin Layout */}
          <Route path="/area-admin/dashboard" element={<AreaAdminDashboardPage />}>
             {/* Nested Area Admin pages render in Outlet */}
             <Route index element={<AreaAdminMyMembers />} /> {/* Default view */}
             {/* --- THIS IS THE ROUTE FOR PAYMENT HISTORY --- */}
             <Route path="history" element={<AreaAdminPaymentHistory />} />
             {/* --- END PAYMENT HISTORY ROUTE --- */}
             {/* Add other nested area admin routes here */}
          </Route>
           {/* Add other top-level area-admin-only routes here */}
        </Route>

        {/* --- Not Found Route --- */}
       

      </Routes>
  );
  // NO closing </BrowserRouter> here
}

export default App;