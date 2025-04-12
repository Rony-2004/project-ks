// frontend/src/services/authService.ts
import axios from 'axios';

// Backend API URL - Updated Port and Path
const API_URL = 'http://localhost:5001/api/auth'; // <--- Changed port to 5001, path includes /api

interface LoginResponse {
    token: string;
    message?: string;
}

export const adminLogin = async (userId: string, password: string): Promise<LoginResponse> => {
    try {
        // Send POST request to the UPDATED backend endpoint
        const response = await axios.post<LoginResponse>(`${API_URL}/admin/login`, {
            userId: userId,
            password: password
        });
        return response.data;
    } catch (error: any) {
        console.error('Login service error:', error.response?.data || error.message);
        // Check for specific network errors vs application errors
        if (error.code === 'ERR_NETWORK') {
             throw new Error('Network Error: Cannot connect to the server. Is the backend running on port 5001?');
        }
        throw new Error(error.response?.data?.message || 'Login request failed.');
    }
};

// Add areaAdminLogin function here later...