// frontend/src/services/authService.ts
import axios from 'axios';
import apiClient from '../utils/apiClient'; // Use our authenticated client

// Backend API URL - MAKE SURE PORT MATCHES YOUR BACKEND'S PORT (e.g., 5001)
const API_URL = 'http://localhost:5001/api'; // Base API prefix
const AUTH_API_URL = `${API_URL}/auth`; // Specific path for auth routes

// --- Interfaces ---
export interface LoginResponse { token: string; message?: string; }
export interface AdminProfileData { id: string; name: string; email: string; role: string; profilePicUrl?: string; }
export interface UpdateAdminProfileData { name?: string; email?: string; }

// --- Login Function (should be working) ---
export const adminLogin = async (userId: string, password: string): Promise<LoginResponse> => {
    try {
        console.log(`[AuthService] Attempting login for user: ${userId} at ${AUTH_API_URL}/admin/login`);
        const response = await axios.post<LoginResponse>(`${AUTH_API_URL}/admin/login`, { userId, password });
        console.log('[AuthService] Response received from backend API:', response.data);
        if (response.data && typeof response.data.token === 'string') {
             return response.data;
        } else {
             console.error('[AuthService] Backend response missing token:', response.data);
             throw new Error('Login successful according to server, but token was missing in response.');
        }
    } catch (error: any) {
        // ... (keep existing error handling) ...
         console.error('[AuthService] Login service error:', error.response?.data || error.message || error);
         const status = error.response?.status;
         const serverMessage = error.response?.data?.message;
         let errorMessage = 'Login request failed.';
         if (status === 401) { errorMessage = serverMessage || 'Invalid User ID or Password.'; }
         else if (error.code === 'ERR_NETWORK') { errorMessage = 'Network Error: Cannot connect to the server.';}
         else if (serverMessage) { errorMessage = serverMessage; }
         else if (error.message) { errorMessage = error.message; }
         throw new Error(errorMessage);
    }
};

// --- Get Admin Profile ---
export const getMyProfile = async (): Promise<AdminProfileData> => {
    try {
        console.log(`[AuthService] Attempting GET ${AUTH_API_URL}/admin/me`);
        // Use apiClient to automatically send token
        const response = await apiClient.get<AdminProfileData>(`${AUTH_API_URL}/admin/me`);
        console.log('[AuthService] Fetched profile:', response.data);
        // Basic check if expected data is present
        if (!response.data || !response.data.id || !response.data.role) {
             console.error('[AuthService] Received invalid profile data structure:', response.data);
             throw new Error('Received invalid profile data from server.');
        }
        return response.data;
    } catch (error: any) {
        console.error('[AuthService] Error fetching profile:', error.response?.data || error.message || error);
        const status = error.response?.status;
        let errorMessage = 'Failed to fetch profile.';
        if (status === 401 || status === 403) { errorMessage = 'Unauthorized to fetch profile.';}
         else if (error.code === 'ERR_NETWORK') { errorMessage = 'Network Error: Cannot connect to server for profile.';}
         else if (error.response?.data?.message) { errorMessage = error.response.data.message; }
         else if (error.message) { errorMessage = error.message; }
        throw new Error(errorMessage);
    }
};

// --- Update Admin Profile ---
export const updateMyProfile = async (data: UpdateAdminProfileData): Promise<AdminProfileData> => {
     try {
        console.log(`[AuthService] Attempting PUT ${AUTH_API_URL}/admin/me with data:`, data);
        // Use apiClient to automatically send token
        const response = await apiClient.put<AdminProfileData>(`${AUTH_API_URL}/admin/me`, data);
        console.log('[AuthService] Updated profile response:', response.data);
         if (!response.data || !response.data.id || !response.data.role) {
             console.error('[AuthService] Received invalid profile data structure after update:', response.data);
             throw new Error('Received invalid profile data from server after update.');
        }
        return response.data;
    } catch (error: any) {
        console.error('[AuthService] Error updating profile:', error.response?.data || error.message || error);
         const status = error.response?.status;
         let errorMessage = 'Failed to update profile.';
         if (status === 401 || status === 403) { errorMessage = 'Unauthorized to update profile.';}
         else if (error.code === 'ERR_NETWORK') { errorMessage = 'Network Error: Cannot connect to server to update profile.';}
         else if (error.response?.data?.message) { errorMessage = error.response.data.message; }
         else if (error.message) { errorMessage = error.message; }
        throw new Error(errorMessage);
    }
};

