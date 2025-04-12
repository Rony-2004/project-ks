// src/components/layout/Footer.tsx
import React from 'react';
import { FaFacebookSquare, FaInstagram, FaEnvelope } from 'react-icons/fa'; // Make sure react-icons is installed
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.socialLinks}>
        <a href="YOUR_FACEBOOK_LINK" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <FaFacebookSquare className={styles.icon} />
        </a>
        <a href="YOUR_INSTAGRAM_LINK" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <FaInstagram className={styles.icon} />
        </a>
        <a href="mailto:YOUR_EMAIL_ADDRESS" aria-label="Email">
          <FaEnvelope className={styles.icon} />
        </a>
      </div>
      <div className={styles.copyright}>
        © {currentYear} KHANKA SHARIF. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;