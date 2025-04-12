// src/pages/AdminSignInPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminLogin } from '../services/authService'; // Uses the real service
import styles from './AdminSignInPage.module.css'; // Make sure CSS file exists

const AdminSignInPage: React.FC = () => {
  const [userId, setUserId] = useState('');
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
      // Call the service function that sends data to the backend
      const response = await adminLogin(userId, password); // REAL API CALL

      // Backend responded successfully (sent back a token)
      if (response.token) {
        login('admin', response.token); // Update global auth state via context
        navigate('/admin/dashboard'); // Go to dashboard
      } else {
        setError('Login successful but no token received.'); // Safety check
      }
    } catch (err: any) {
      // Catch errors from the service (backend error or network error)
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
          <div className={styles.inputGroup}>
            <label htmlFor="userId">User ID</label>
            <input type="text" id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} required autoComplete='username' />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete='current-password'/>
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