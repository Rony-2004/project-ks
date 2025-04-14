// frontend/src/components/layout/Sidebar.tsx (MODIFIED)
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Need role from context
// Import ALL possible icons needed for both roles
import {
    FaTachometerAlt, FaUsers, FaUserTie, FaMoneyBillWave, FaSignOutAlt,
    FaUserCog, FaListAlt // Add any icons needed for Area Admin
} from 'react-icons/fa';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  icon: React.ReactElement;
  label: string;
  roles: ('admin' | 'areaAdmin')[]; // Which roles see this link
  end?: boolean; // For NavLink 'end' prop
}

const Sidebar: React.FC = () => {
  const { userRole, logout } = useAuth(); // Get userRole
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
    // Add more Area Admin links later, e.g., mark payments
    // { path: '/area-admin/dashboard/payments', icon: <FaMoneyBillWave />, label: 'Record Payments', roles: ['areaAdmin'] },
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
                // Use 'end' prop if specified (important for index routes)
                end={item.end}
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