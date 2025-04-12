// src/pages/HomePage.tsx
import React from 'react';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/home/HeroSection';
import Footer from '../components/layout/Footer';
import styles from './HomePage.module.css'; // Import styles for the page layout

const HomePage: React.FC = () => {
  return (
    <div className={styles.pageContainer}> {/* Main container for 100vh flex layout */}
      <Navbar />
      {/* Main content area that grows */}
      <main className={styles.mainContent}>
         <HeroSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;