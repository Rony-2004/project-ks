// frontend/src/services/authService.ts (VERIFIED - Includes areaAdminLogin export)
import axios from 'axios';
import apiClient from '../utils/apiClient'; // Use our authenticated client

// Backend API URL - Check Port!
const API_URL = 'http://localhost:5001/api';
const AUTH_API_URL = `${API_URL}/auth`;

// --- Interfaces ---
export interface LoginResponse { token: string; message?: string; }
export interface AdminProfileData { id: string; name: string; email: string; role: string; profilePicUrl?: string; }
export interface UpdateAdminProfileData { name?: string; email?: string; }

// --- Admin Login ---
export const adminLogin = async (userId: string, password: string): Promise<LoginResponse> => {
    try {
        console.log(`[AuthService] Attempting Admin login for user: ${userId}`);
        const response = await axios.post<LoginResponse>(`${AUTH_API_URL}/admin/login`, { userId, password });
        console.log('[AuthService] Admin login response received:', response.data);
        if (response.data && typeof response.data.token === 'string') { return response.data; }
        else { throw new Error('Login response missing token.'); }
    } catch (error: any) {
        console.error('[AuthService] Admin login service error:', error.response?.data || error.message || error);
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;
        let errorMessage = 'Admin login request failed.';
        if (status === 401) { errorMessage = serverMessage || 'Invalid User ID or Password.'; }
        else if (error.code === 'ERR_NETWORK') { errorMessage = 'Network Error: Cannot connect to server.';}
        else if (serverMessage) { errorMessage = serverMessage; }
        else if (error.message) { errorMessage = error.message; }
        throw new Error(errorMessage);
    }
};

// --- ** Area Admin Login ** ---
// V V V V V MAKE SURE 'export' IS HERE V V V V V
export const areaAdminLogin = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        console.log(`[AuthService] Attempting Area Admin login for email: ${email}`);
        const response = await axios.post<LoginResponse>(`${AUTH_API_URL}/area-admin/login`, { email, password });
        console.log('[AuthService] Area Admin login response received:', response.data);
        if (response.data && typeof response.data.token === 'string') {
             return response.data;
        } else {
             console.error('[AuthService] Area Admin login response missing token:', response.data);
             throw new Error('Login successful but token was missing in response.');
        }
    } catch (error: any) {
        console.error('[AuthService] Area Admin login service error:', error.response?.data || error.message || error);
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;
        let errorMessage = 'Area Admin login request failed.';
        if (status === 401) { errorMessage = serverMessage || 'Invalid Email or Password.'; }
        else if (error.code === 'ERR_NETWORK') { errorMessage = 'Network Error: Cannot connect to the server.';}
        else if (serverMessage) { errorMessage = serverMessage; }
        else if (error.message) { errorMessage = error.message; }
        throw new Error(errorMessage);
    }
};
// ^ ^ ^ ^ ^ MAKE SURE 'export' IS HERE ^ ^ ^ ^ ^


// --- Profile Functions ---
export const getMyProfile = async (): Promise<AdminProfileData> => { /* ... keep implementation ... */ };
export const updateMyProfile = async (data: UpdateAdminProfileData): Promise<AdminProfileData> => { /* ... keep implementation ... */};