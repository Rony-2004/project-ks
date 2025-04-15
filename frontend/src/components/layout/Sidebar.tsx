// frontend/src/components/layout/Sidebar.tsx (Includes Payment History Link)
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Verify path
// Import ALL needed icons
import {
    FaTachometerAlt, FaUsers, FaUserTie, FaMoneyBillWave, FaSignOutAlt,
    FaListAlt, FaHistory // <-- Added FaHistory
} from 'react-icons/fa'; // Removed FaUserCog as it wasn't used
import styles from './Sidebar.module.css'; // Verify path

interface NavItem {
  path: string;
  icon: React.ReactElement;
  label: string;
  roles: ('admin' | 'areaAdmin')[];
  end?: boolean;
}

const Sidebar: React.FC = () => {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define ALL possible navigation items
  const allNavItems: NavItem[] = [
    // Admin Links
    { path: '/admin/dashboard', icon: <FaTachometerAlt />, label: 'Overview', roles: ['admin'], end: true },
    { path: '/admin/dashboard/members', icon: <FaUsers />, label: 'Members', roles: ['admin'] },
    { path: '/admin/dashboard/area-admins', icon: <FaUserTie />, label: 'Area Admins', roles: ['admin'] },
    { path: '/admin/dashboard/payments', icon: <FaMoneyBillWave />, label: 'Payments', roles: ['admin'] },

    // Area Admin Links
    { path: '/area-admin/dashboard', icon: <FaListAlt />, label: 'My Members', roles: ['areaAdmin'], end: true },
    // --- ADDED PAYMENT HISTORY LINK ---
    { path: '/area-admin/dashboard/history', icon: <FaHistory />, label: 'Payment History', roles: ['areaAdmin'] },
    // --- END ADDED LINK ---
  ];

  // Filter items based on current user's role
  const visibleNavItems = allNavItems.filter(item => userRole && item.roles.includes(userRole as 'admin' | 'areaAdmin'));

  // Determine Panel Title
  const panelTitle = userRole === 'admin' ? 'Admin Panel' : userRole === 'areaAdmin' ? 'Area Panel' : 'Panel';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        KHANKA SHARIF
        <span className={styles.panelType}>{panelTitle}</span>
      </div>
      <nav className={styles.nav}>
        <ul>
          {visibleNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                }
                end={item.end ?? false} // Use end prop, provide default
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