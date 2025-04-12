// src/components/layout/Navbar.tsx
import React from 'react';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        KHANKA SHARIF
      </div>
    </nav>
  );
};

export default Navbar;