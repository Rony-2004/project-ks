// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path if needed
// Import icons (make sure react-icons is installed: npm install react-icons)
import { FaTachometerAlt, FaUsers, FaUserTie, FaMoneyBillWave, FaSignOutAlt, FaCog } from 'react-icons/fa';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to role selection after logout
  };

  // Define navigation items
  const navItems = [
    { path: '/admin/dashboard', icon: <FaTachometerAlt />, label: 'Overview' },
    { path: '/admin/dashboard/members', icon: <FaUsers />, label: 'Members' },
    { path: '/admin/dashboard/area-admins', icon: <FaUserTie />, label: 'Area Admins' },
    { path: '/admin/dashboard/payments', icon: <FaMoneyBillWave />, label: 'Payments' },
    // Add more links as needed
    // { path: '/admin/dashboard/settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        KHANKA SHARIF
        <span className={styles.panelType}>Admin Panel</span>
      </div>
      <nav className={styles.nav}>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              {/* Use NavLink for active state styling */}
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                }
                end // Use 'end' for Overview link to only match exact path
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.logoutArea}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;