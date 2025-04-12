// src/components/home/HeroSection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import styles from './HeroSection.module.css';

const HeroSection: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  const handleLoginClick = () => {
    console.log("Login button clicked - navigating to /login");
    navigate('/login'); // Navigate to the login route
  };

  return (
    <div className={styles.heroContainer}>
      <div className={styles.contentWrapper}>
        {/* Left Side */}
        <div className={styles.leftPanel}>
           {/* ... heading, subheading, features ... */}
           <h1 className={styles.mainHeading}>
             KHANKA SHARIF COMMUNITY FUND
           </h1>
           <p className={styles.subHeading}>
           </p>
           <ul className={styles.featureList}>
             <li>✓ Area Admin Access Control</li>
             <li>✓ Easy Member Management</li>
             <li>✓ Online & Cash Payment Tracking</li>
             <li>✓ Automated SMS Notifications</li>
           </ul>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={handleLoginClick}>
              Login
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className={styles.rightPanel}>
          <img
            src="/khanka_sharif.jpg"
            alt="Khanka Sharif Community"
            className={styles.heroImage}
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;