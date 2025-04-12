// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define the shape of the context data
interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  // token: string | null; // Optional: if you need direct token access
  login: (role: string, token: string) => void; // Function to call on successful login
  logout: () => void; // Function to call on logout
}

// Create the actual context object
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the provider component
interface AuthProviderProps {
  children: ReactNode; // Allows wrapping other components
}

// Create the Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  // const [token, setToken] = useState<string | null>(null);

  // Effect to check localStorage for existing session on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('authRole');
    if (storedToken && storedRole) {
      setIsAuthenticated(true);
      setUserRole(storedRole);
      // setToken(storedToken);
      console.log(`AuthContext: Restored session for role ${storedRole}`);
    }
  }, []); // Empty dependency array means this runs only once on mount

  // Login function: updates state and saves to localStorage
  const login = (role: string, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authRole', role);
    setIsAuthenticated(true);
    setUserRole(role);
    // setToken(token);
    console.log(`AuthContext: Logged in as ${role}`);
  };

  // Logout function: updates state and clears localStorage
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    setIsAuthenticated(false);
    setUserRole(null);
    // setToken(null);
    console.log('AuthContext: Logged out');
  };

  // Provide the context values to children components
  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- THIS IS THE IMPORTANT PART ---
// Custom hook to easily consume (use) the AuthContext in other components
// Make sure 'export' is present here!
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // Ensure the hook is used within the Provider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};