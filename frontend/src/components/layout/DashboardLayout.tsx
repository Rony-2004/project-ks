// frontend/src/components/layout/DashboardLayout.tsx
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header'; // <-- Import Header
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.contentArea}> {/* Wrapper for Header + Page */}
        <Header /> {/* <-- Render Header */}
        <main className={styles.pageContent}>
          {children} {/* This is where <Outlet/> content goes */}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;