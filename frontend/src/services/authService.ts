// frontend/src/services/authService.ts
// ** FINAL FIXED CODE - Added apiClient import and usage **

import apiClient from '../utils/apiClient'; // <<<--- ADDED THIS IMPORT

// --- Interfaces ---
// Interface for login data
export interface LoginCredentials {
    email?: string;
    password?: string;
}

// Interface for user data included in response/context
export interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
    profilePictureUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

// Combined Login Response
export interface LoginResponse {
    token: string;
    message?: string;
    user?: UserData; // Backend should return user details
}

// Profile data interfaces
export interface AdminProfileData extends UserData {}
export interface UpdateAdminProfileData { name?: string; email?: string; }


// --- Admin Login Service Function ---
export const adminLogin = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const SERVICE_NAME = '[AuthService adminLogin]';
    if (!credentials.email || !credentials.password) {
        throw new Error("Email and Password are required for admin login.");
    }
    try {
        console.log(`${SERVICE_NAME} Attempting login with:`, { email: credentials.email });
        // Use apiClient for the request
        const response = await apiClient.post<LoginResponse>('/auth/admin/login', {
             email: credentials.email,
             password: credentials.password
        });

        console.log('[AuthService] Admin login response received:', response.data);
        if (response.data?.token && response.data?.user) {
            return response.data;
        } else {
            console.error('[AuthService] Admin login response missing token or user data:', response.data);
            throw new Error('Login failed: Invalid response from server.');
        }
    } catch (error: any) {
        console.error(`${SERVICE_NAME} service error:`, error.response?.data || error.message || error);
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;
        let errorMessage = 'Admin login request failed.';
        if (status === 401) { errorMessage = serverMessage || 'Invalid Credentials.'; }
        else if (error.code === 'ERR_NETWORK') { errorMessage = 'Network Error: Cannot connect to server.';}
        else if (serverMessage) { errorMessage = serverMessage; }
        throw new Error(errorMessage);
    }
};

// --- Area Admin Login Service Function ---
export const areaAdminLogin = async (credentials: LoginCredentials): Promise<LoginResponse> => {
     const SERVICE_NAME = '[AuthService areaAdminLogin]';
     if (!credentials.email || !credentials.password) {
         throw new Error("Email and Password are required for area admin login.");
     }
     try {
        console.log(`${SERVICE_NAME} Attempting login with:`, { email: credentials.email });
        // Use apiClient for the request
        const response = await apiClient.post<LoginResponse>('/auth/area-admin/login', {
            email: credentials.email,
            password: credentials.password
        });
        console.log('[AuthService] Area Admin login response received:', response.data);
         if (response.data?.token && response.data?.user) {
            return response.data;
        } else {
            console.error('[AuthService] Area Admin login response missing token or user data:', response.data);
            throw new Error('Login failed: Invalid response from server.');
        }
     } catch (error: any) {
         console.error(`${SERVICE_NAME} service error:`, error.response?.data || error.message || error);
         const status = error.response?.status;
         const serverMessage = error.response?.data?.message;
         let errorMessage = 'Area Admin login request failed.';
         if (status === 401) { errorMessage = serverMessage || 'Invalid Credentials.'; }
         else if (error.code === 'ERR_NETWORK') { errorMessage = 'Network Error: Cannot connect to server.';}
         else if (serverMessage) { errorMessage = serverMessage; }
         throw new Error(errorMessage);
     }
};


// --- Profile Functions ---
// GET Admin Profile
export const getAdminProfile = async (): Promise<AdminProfileData> => {
    const SERVICE_NAME = '[AuthService getAdminProfile]';
    try {
        console.log(`${SERVICE_NAME} Fetching admin profile...`);
        // Use apiClient for the request
        const response = await apiClient.get<AdminProfileData>('/auth/admin/me');
        console.log(`${SERVICE_NAME} Profile data received.`);
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error fetching profile:`, error.response?.data || error.message);
        if (error.response?.status === 401) { // Check specifically for 401 Unauthorized
             console.log(`${SERVICE_NAME} Unauthorized (401). Token might be expired or invalid.`);
             // Optionally trigger logout or refresh token logic here via context/events
             throw new Error('Session expired or invalid. Please login again.'); // More specific error
         }
        throw new Error(error.response?.data?.message || 'Failed to fetch profile.');
    }
};

// UPDATE Admin Profile
// Currently only updates name based on previous controller
export const updateAdminProfile = async (data: { name: string }): Promise<AdminProfileData> => {
    const SERVICE_NAME = '[AuthService updateAdminProfile]';
    if (!data.name || data.name.trim().length < 3) {
        throw new Error("Name must be at least 3 characters long.");
    }
    try {
        console.log(`${SERVICE_NAME} Updating admin profile with data:`, data);
         // Use apiClient for the request
        const response = await apiClient.put<AdminProfileData>('/auth/admin/me', data);
        console.log(`${SERVICE_NAME} Profile update successful.`);
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error updating profile:`, error.response?.data || error.message);
        if (error.response?.status === 401) { // Check specifically for 401 Unauthorized
             console.log(`${SERVICE_NAME} Unauthorized (401). Token might be expired or invalid.`);
             throw new Error('Session expired or invalid. Please login again.'); // More specific error
         }
        throw new Error(error.response?.data?.message || 'Failed to update profile.');
    }
};