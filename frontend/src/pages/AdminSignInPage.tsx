// src/pages/AdminSignInPage.tsx
// ** MODIFIED to use EMAIL instead of User ID **

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// ** IMPORTANT: Assumes adminLogin service function expects an OBJECT { email, password } **
import { adminLogin } from '../services/authService';
import styles from './AdminSignInPage.module.css';

const AdminSignInPage: React.FC = () => {
    // --- MODIFIED State: Use email instead of userId ---
    const [email, setEmail] = useState('');
    // ----------------------------------------------------
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth(); // Get login function from context

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // --- MODIFIED Service Call: Send email and password object ---
            const loginData = { email, password };
            console.log("Attempting admin login with:", { email: loginData.email, password: '***' }); // Log data being sent
            const response = await adminLogin(loginData); // Pass object to service
            // -------------------------------------------------------------

            if (response.token && response.user) { // Check for user data too
                // Use user data returned from backend if needed by context/local storage
                login('admin', response.token, response.user); // Pass user data to context if needed
                navigate('/admin/dashboard');
            } else {
                setError('Login failed: Invalid response from server.');
            }
        } catch (err: any) {
            console.error("Admin login page error:", err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.signInContainer}>
            <div className={styles.signInBox}>
                <h1 className={styles.title}>Admin Sign In</h1>
                <p className={styles.subtitle}>Enter credentials for admin access.</p>
                <form onSubmit={handleSubmit}>
                    {/* --- MODIFIED Input Group for Email --- */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label> {/* Changed label */}
                        <input
                            type="email" // Changed type to email
                            id="email" // Changed id
                            name="email" // Added name attribute
                            value={email} // Use email state
                            onChange={(e) => setEmail(e.target.value)} // Use setEmail
                            required
                            autoComplete='email' // Changed autocomplete
                        />
                    </div>
                    {/* --------------------------------------- */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                             type="password"
                             id="password"
                             name="password" // Added name attribute
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             required
                             autoComplete='current-password'
                         />
                    </div>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    <button type="submit" className={styles.submitButton} disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
                 <div className={styles.backLink}>
                    <Link to="/login">&larr; Back to Role Selection</Link>
                </div>
            </div>
        </div>
    );
};

export default AdminSignInPage;