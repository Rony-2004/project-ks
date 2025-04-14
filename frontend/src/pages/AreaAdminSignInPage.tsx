// frontend/src/pages/AreaAdminSignInPage.tsx
import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Verify path
import { areaAdminLogin } from '../services/authService'; // Verify path & ensure function exists
// Reusing styles from Admin sign-in for consistency
import styles from './AdminSignInPage.module.css'; // Verify path & ensure CSS file exists

const AreaAdminSignInPage: React.FC = () => {
  // State specifically for this form
  const [email, setEmail] = useState(''); // Use email state
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hooks for navigation and authentication context
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from context

  // Handle form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default browser form submission
    setError(null); // Clear previous errors
    setIsLoading(true); // Show loading state on button
    console.log('[AreaAdminSignInPage] Form submitted. Calling areaAdminLogin service...');

    try {
      // Call the specific service function for area admin login
      const response = await areaAdminLogin(email, password); // Pass email and password

      console.log('[AreaAdminSignInPage] Response received from service:', response);
      // Check if backend responded successfully with a token
      if (response && response.token) {
        console.log('[AreaAdminSignInPage] Token received. Calling auth context login with role areaAdmin...');
        login('areaAdmin', response.token); // <-- Log in with 'areaAdmin' role
        console.log('[AreaAdminSignInPage] Navigating to Area Admin dashboard...');
        navigate('/area-admin/dashboard'); // <-- Redirect to Area Admin dashboard route
      } else {
        // Should ideally not happen if service throws error, but good failsafe
        console.error('[AreaAdminSignInPage] Login response invalid:', response);
        setError('Login failed: Invalid response received from server.');
      }
    } catch (err: any) {
      // Catch errors thrown by the areaAdminLogin service (e.g., 401, network error)
      console.error('[AreaAdminSignInPage] Caught error during login:', err);
      setError(err.message || 'An unexpected error occurred during login.'); // Display error from service/backend
    } finally {
      setIsLoading(false); // Stop loading state
    }
  };

  // JSX for the login form
  return (
    <div className={styles.signInContainer}> {/* Reuse container style */}
      <div className={styles.signInBox}> {/* Reuse box style */}
        {/* Update Titles and Text */}
        <h1 className={styles.title}>Area Admin Sign In</h1>
        <p className={styles.subtitle}>Enter your credentials to access your area dashboard.</p>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email" // Input type email
              id="email"
              name="email" // Add name attribute
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete='email'
              placeholder="Enter your registered email"
            />
          </div>
          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password" // Add name attribute
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete='current-password'
              placeholder="Enter your password"
            />
          </div>

          {/* Error Display */}
          {error && <p className={styles.errorMessage}>{error}</p>}

          {/* Submit Button */}
          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Link back to Role Selection */}
         <div className={styles.backLink}>
            <Link to="/login">&larr; Back to Role Selection</Link>
        </div>
      </div>
    </div>
  );
};

export default AreaAdminSignInPage; // Ensure component is exporteda