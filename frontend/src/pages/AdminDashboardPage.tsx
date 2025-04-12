// src/pages/AdminDashboardPage.tsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet for nested routes
import DashboardLayout from '../components/layout/DashboardLayout'; // Import the layout

const AdminDashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
       {/* Content for the specific dashboard page will be rendered here via Outlet */}
       {/* We define nested routes in App.tsx */}
       <Outlet />
    </DashboardLayout>
  );
};

export default AdminDashboardPage;