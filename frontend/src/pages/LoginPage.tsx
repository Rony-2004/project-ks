// frontend/src/pages/LoginPage.tsx (VERIFIED - Check Imports)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaUsersCog } from 'react-icons/fa';
import RoleCard from '../components/login/RoleCard'; // <-- VERIFY THIS PATH
import styles from './LoginPage.module.css';       // <-- VERIFY THIS PATH & FILE EXISTS

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const handleAdminClick = () => {
        console.log("[LoginPage] Admin role selected, navigating to /admin/signin");
        navigate('/admin/signin');
    };

    const handleAreaAdminClick = () => {
        console.log(">>> handleAreaAdminClick: Attempting navigation to /area-admin/signin");
        navigate('/area-admin/signin');
    };

    // Features for Admin Card
    const adminFeatures = [
        'View All Members & Payments', 'Manage Area Admins', 'Assign Members to Areas',
        'Oversee Fund Transfers', 'Generate Reports',
     ];
     // Features for Area Admin Card
    const areaAdminFeatures = [
        'View Members in Your Area', 'Add New Members (Local)', 'Track Local Payments (Cash/Online)',
        'Mark Payments as Received', 'Transfer Funds to Admin',
    ];

    return (
        <div className={styles.loginPageContainer}>
            <button onClick={() => navigate('/')} className={styles.backButton}>&larr; Back to Home</button>
            <h1 className={styles.mainHeading}>Select Your Role</h1>
            <p className={styles.subHeading}>Choose how you want to access the Khanka Sharif Fund system.</p>
            <div className={styles.cardsContainer}>
                {/* Admin Card */}
                <RoleCard
                  icon={<FaUserShield />}
                  roleType="ADMIN"
                  title="I am an Admin"
                  description="Access the main dashboard with full control..."
                  features={adminFeatures}
                  buttonText="Continue as Admin"
                  colorScheme="admin"
                  onClick={handleAdminClick}
                />

                {/* Area Admin Card */}
                <RoleCard
                  icon={<FaUsersCog />}
                  roleType="AREA ADMIN"
                  title="I am an Area Admin"
                  description="Manage members and track payments "
                  features={areaAdminFeatures}
                  buttonText="Continue as Area Admin"
                  colorScheme="areaAdmin"
                  onClick={handleAreaAdminClick}
                />
            </div>
        </div>
    );
};

export default LoginPage;