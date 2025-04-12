// src/components/layout/DashboardLayout.tsx
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode; // Content to display in the main area
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        {/* Optional: Add a header bar here if needed */}
        {/* <Header /> */}
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;