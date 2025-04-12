// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminSignInPage from './pages/AdminSignInPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/auth/ProtectedRoute'; // Import ProtectedRoute

// Import placeholder dashboard sections
import AdminOverview from './pages/admin/AdminOverview';
import AdminMembers from './pages/admin/AdminMembers';
import AdminAreaAdmins from './pages/admin/AdminAreaAdmins';
import AdminPayments from './pages/admin/AdminPayments';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/signin" element={<AdminSignInPage />} />
        {/* Add Area Admin public routes later */}

        {/* --- Protected Admin Routes --- */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}> {/* Wrap parent route */}
          <Route path="/admin/dashboard" element={<AdminDashboardPage />}> {/* Layout component */}
            {/* Nested routes render inside AdminDashboardPage's <Outlet /> */}
            <Route index element={<AdminOverview />} /> {/* Default view at /admin/dashboard */}
            <Route path="members" element={<AdminMembers />} /> {/* /admin/dashboard/members */}
            <Route path="area-admins" element={<AdminAreaAdmins />} /> {/* /admin/dashboard/area-admins */}
            <Route path="payments" element={<AdminPayments />} /> {/* /admin/dashboard/payments */}
            {/* Add more nested admin routes here (e.g., settings) */}
          </Route>
          {/* Add other top-level admin routes here if they don't use the dashboard layout */}
        </Route>

        {/* --- Protected Area Admin Routes (Example Structure) --- */}
        {/*
        <Route element={<ProtectedRoute allowedRoles={['areaAdmin']} />}>
           <Route path="/area-admin/dashboard" element={<AreaAdminDashboardPage />}>
              <Route index element={<AreaAdminOverview />} />
              <Route path="members" element={<AreaAdminMembersLocal />} />
           </Route>
        </Route>
        */}

        {/* Optional: Catch-all 404 */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;