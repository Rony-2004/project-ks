// frontend/src/components/layout/Header.tsx
// ** MODIFIED: Shows "ADMIN" text for admin, Name for area admin **

import React from 'react'; // Removed useState, useEffect, useCallback
import styles from './Header.module.css'; // Ensure CSS file exists and is correct
import { useAuth } from '../../contexts/AuthContext'; // Needs userRole, logout, isAuthenticated, currentUser
// Removed authService imports as profile isn't fetched here anymore
// Removed FaUserCircle, FaEdit icons
import { FaSignOutAlt } from 'react-icons/fa';
// Removed EditProfileModal import

// ** IMPORTANT: Adjust this based on what your AuthContext provides **
interface ContextUser {
    id: string;
    name: string | null;
    email?: string; // Optional
    role: string;
}

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
    console.log('[Header] Rendering component...');
    // Get necessary data from Auth Context
    // Assuming currentUser holds details like { id, name, email, role }
    const { userRole, logout, isAuthenticated, currentUser } = useAuth() as {
        userRole: string | null;
        logout: () => void;
        isAuthenticated: boolean;
        currentUser: ContextUser | null; // Adjust type based on your context
    };

    const handleLogoutClick = () => {
        console.log('[Header] Logging out...');
        logout();
    }

    console.log(`[Header] Auth State: isAuthenticated=${isAuthenticated}, userRole=${userRole}, currentUser=`, currentUser);

    return (
        <header className={styles.header}>
            <div className={styles.headerContent}>
                <div className={styles.headerLeft}>
                   {/* You can put a Logo or Title here */}
                   <span className={styles.headerTitle}>WELCOME TO DASHBOARD </span>
                </div>
                <div className={styles.headerRight}>
                    {/* Display content based on authentication and role */}
                    {isAuthenticated ? (
                        <div className={styles.profileMenu}> {/* Reuse profileMenu style for alignment */}
                            {userRole === 'admin' && (
                                <>
                                    {/* Display static text for Admin */}
                                    <span className={styles.profileName}>ADMIN</span>
                                    
                                </>
                            )}
                            {userRole === 'areaAdmin' && (
                                <>
                                    {/* Display Area Admin Name */}
                                     {/* Use currentUser from context */}
                                    <span className={styles.profileName} title={currentUser?.email ?? ''}>
                                        {currentUser?.name || 'Area Admin'}
                                    </span>
                                    
                                </>
                            )}
                             {/* Fallback or handle other roles if necessary */}
                             {userRole !== 'admin' && userRole !== 'areaAdmin' && (
                                <span className={styles.error}>Unknown Role</span>
                                // Optionally show logout for any authenticated user
                                // <button onClick={handleLogoutClick} className={styles.logoutButton} title="Logout">
                                //     <FaSignOutAlt /> <span className={styles.logoutText}>Logout</span>
                                // </button>
                             )}
                        </div>
                    ) : (
                        // Optional: Show something if user is not authenticated (e.g., on public pages if header is shared)
                        <span className={styles.profileName}>Guest</span>
                    )}
                </div>
            </div>
        </header>
        // Removed EditProfileModal rendering as it's not triggered from here anymore
    );
};

export default Header;