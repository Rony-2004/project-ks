// frontend/src/pages/AreaAdminSignInPage.tsx
// ** CORRECTED service function call in handleSubmit **

import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Verify path
// Ensure areaAdminLogin expects an object {email, password} in authService.ts
import { areaAdminLogin } from '../services/authService'; // Verify path
import styles from './AdminSignInPage.module.css'; // Verify path

const AreaAdminSignInPage: React.FC = () => {
    // State for the form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth(); // Get login function from context

    // Handle form submission
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);
        console.log('[AreaAdminSignInPage] Form submitted. Calling areaAdminLogin service...');

        try {
            // --- *** CORRECTED: Pass credentials as an object *** ---
            const credentials = { email, password };
            const response = await areaAdminLogin(credentials); // Pass the object
            // --- *** END CORRECTION *** ---

            console.log('[AreaAdminSignInPage] Response received from service:', response);
            if (response && response.token && response.user) { // Check for user object too
                console.log('[AreaAdminSignInPage] Token received. Calling auth context login...');
                // Pass user data from response to login context if needed
                login('areaAdmin', response.token, response.user);
                console.log('[AreaAdminSignInPage] Navigating to Area Admin dashboard...');
                navigate('/area-admin/dashboard');
            } else {
                console.error('[AreaAdminSignInPage] Login response invalid:', response);
                setError('Login failed: Invalid response received.');
            }
        } catch (err: any) {
            console.error('[AreaAdminSignInPage] Caught error during login:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    // JSX for the login form (no changes needed here)
    return (
        <div className={styles.signInContainer}>
            <div className={styles.signInBox}>
                <h1 className={styles.title}>Area Admin Sign In</h1>
                <p className={styles.subtitle}>Enter your credentials to access your area dashboard.</p>
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email" id="email" name="email"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            required autoComplete='email'
                            placeholder="Enter your registered email"
                         />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password" id="password" name="password"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            required autoComplete='current-password'
                            placeholder="Enter your password"
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

export default AreaAdminSignInPage;