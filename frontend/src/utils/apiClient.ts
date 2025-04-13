// frontend/src/utils/apiClient.ts
import axios from 'axios';

// Use the same base URL as defined in your services
const API_BASE_URL = 'http://localhost:5001/api'; // Adjust if your prefix/port differs

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage (or your auth context/storage)
    const token = localStorage.getItem('authToken');
    if (token) {
      // If token exists, add the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Interceptor: Added Auth token to request header.');
    } else {
      console.log('Interceptor: No token found, request sent without Auth header.');
    }
    return config; // Return the modified config
  },
  (error) => {
    // Handle request errors
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for global error handling (e.g., 401 redirects)
apiClient.interceptors.response.use(
    (response) => response, // Simply return successful responses
    (error) => {
        if (error.response && error.response.status === 401) {
            // Example: Handle unauthorized errors globally
            console.error('API Client: Unauthorized (401). Token might be expired or invalid.');
            // Optionally clear auth state and redirect to login
            // logout(); // Assuming logout clears storage
            // window.location.href = '/login';
        }
        // Return the error to be handled by the calling function's catch block
        return Promise.reject(error);
    }
);


export default apiClient;