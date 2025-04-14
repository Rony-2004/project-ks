// frontend/src/pages/AreaAdminDashboardPage.tsx (UPDATED)
import React from 'react';
import { Outlet } from 'react-router-dom'; // <-- Import Outlet
import DashboardLayout from '../components/layout/DashboardLayout'; // <-- Import the layout

const AreaAdminDashboardPage: React.FC = () => {
  // Basic structure using the shared layout
  // The actual content (like the member list) will render in the <Outlet />
  return (
    <DashboardLayout>
      <Outlet /> {/* <-- Nested routes will render here */}
    </DashboardLayout>
  );
};

export default AreaAdminDashboardPage;