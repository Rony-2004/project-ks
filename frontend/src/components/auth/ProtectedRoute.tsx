// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path if needed

interface ProtectedRouteProps {
  allowedRoles: string[]; // Array of roles allowed to access this route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, userRole } = useAuth();

  // 1. Check if user is authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /login');
    // Redirect to role selection or a specific login page if not logged in
    return <Navigate to="/login" replace />;
  }

  // 2. Check if the user's role is allowed
  if (userRole && allowedRoles.includes(userRole)) {
     console.log(`ProtectedRoute: Authenticated as ${userRole}, rendering outlet.`);
    // If authenticated and role is allowed, render the child route content
    return <Outlet />;
  } else {
     console.log(`ProtectedRoute: Role mismatch (User: ${userRole}, Allowed: ${allowedRoles}), redirecting to /login`);
    // If authenticated but wrong role, redirect (e.g., back to role selection)
    // Or potentially to an "Unauthorized" page
    return <Navigate to="/login" replace />; // Or redirect to an unauthorized page
  }
};

export default ProtectedRoute;