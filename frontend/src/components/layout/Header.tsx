// frontend/src/components/layout/Header.tsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './Header.module.css'; // Ensure CSS file exists and is correct
import { useAuth } from '../../contexts/AuthContext';
import { getMyProfile, AdminProfileData } from '../../services/authService'; // Ensure path is correct
import { FaUserCircle, FaEdit, FaSignOutAlt } from 'react-icons/fa';
import EditProfileModal from '../profile/EditProfileModal'; // Ensure path is correct

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
    console.log('[Header] Rendering component...'); // Log component render
    const { userRole, logout, isAuthenticated } = useAuth(); // Get isAuthenticated too
    const [profile, setProfile] = useState<AdminProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Use useCallback to memoize fetchProfile function
    const fetchProfile = useCallback(async () => {
        // Only fetch if authenticated and the correct role
        if (isAuthenticated && userRole === 'admin') {
            console.log('[Header] useEffect: Fetching profile...');
            // Don't reset loading if just refreshing
            // setIsLoading(true);
            setError(null);
            try {
                const data = await getMyProfile();
                console.log('[Header] useEffect: Profile data received:', data);
                setProfile(data);
            } catch (err: any) {
                console.error('[Header] useEffect: Error fetching profile:', err);
                setError(`Profile Error: ${err.message || 'Could not load.'}`);
            } finally {
                // Ensure loading is set to false even if fetch wasn't needed initially
                setIsLoading(false);
            }
        } else {
             console.log(`[Header] useEffect: Skipping profile fetch. Auth: ${isAuthenticated}, Role: ${userRole}`);
             setIsLoading(false); // Not fetching, so not loading
             setProfile(null); // Ensure profile is null if not admin/authed
        }
    }, [userRole, isAuthenticated]); // Depend on auth state

    // Fetch profile on initial load or when auth state changes
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const handleEditProfileClick = () => {
        setIsDropdownOpen(false);
        setIsEditModalOpen(true);
    }

    const handleLogoutClick = () => {
         setIsDropdownOpen(false);
         console.log('[Header] Logging out...');
         logout();
         // Navigation usually handled by ProtectedRoute checking isAuthenticated
    }

    // Function to be passed to the modal, triggers profile refresh
    const handleProfileUpdate = () => {
        console.log('[Header] handleProfileUpdate called, re-fetching profile...');
        fetchProfile(); // Re-fetch profile data after update
    }

    console.log(`[Header] Current state before return: isLoading=${isLoading}, error=${error}, profile=`, profile);

    return (
        <>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerLeft}> {/* Placeholder */} </div>
                    <div className={styles.headerRight}>
                        {/* Show loading indicator ONLY if loading AND profile isn't loaded yet */}
                        {isLoading && !profile && <span className={styles.loading}>Loading Profile...</span>}
                        {/* Show error if there's an error */}
                        {error && !profile && <span className={styles.error}>{error}</span>}
                        {/* Show profile menu ONLY if profile data exists */}
                        {profile && isAuthenticated && userRole === 'admin' && (
                            <div className={styles.profileMenu}>
                                <button onClick={toggleDropdown} className={styles.profileButton}>
                                    <FaUserCircle className={styles.profileIcon} />
                                    <span className={styles.profileName}>{profile.name || profile.id}</span>
                                    <span className={styles.dropdownIcon}>{isDropdownOpen ? '▲' : '▼'}</span>
                                </button>
                                {isDropdownOpen && (
                                    <div className={styles.dropdownMenu}>
                                         <div className={styles.dropdownHeader}>
                                            Signed in as <br/><strong>{profile.name || profile.id}</strong><br/>
                                            <small>({profile.email})</small>
                                        </div>
                                        <button onClick={handleEditProfileClick} className={styles.dropdownItem}>
                                            <FaEdit /> Edit Profile
                                        </button>
                                        <button onClick={handleLogoutClick} className={styles.dropdownItem}>
                                            <FaSignOutAlt /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                         {/* Show something if not admin/logged in but on a page with header? (unlikely with protected routes) */}
                         {!profile && !isLoading && !error && isAuthenticated && userRole !== 'admin' && (
                            <span className={styles.error}>Not Admin User</span>
                         )}
                    </div>
                </div>
            </header>

            {/* Render the Modal Component (ensure EditProfileModal component code is correct) */}
            {profile && ( // Only render modal if profile data exists
              <EditProfileModal
                  profile={profile}
                  isOpen={isEditModalOpen}
                  onClose={() => setIsEditModalOpen(false)}
                  onProfileUpdate={handleProfileUpdate}
              />
            )}
        </>
    );
};

export default Header;