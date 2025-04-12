import { useNavigate } from 'react-router-dom';
import RoleCard from '../components/login/RoleCard'; // Assumes RoleCard exists
import styles from './LoginPage.module.css'; // Assumes CSS exists
import { FaUserShield, FaUsersCog } from 'react-icons/fa'; // Example icons

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const handleAdminClick = () => {
        console.log("Admin role selected, navigating to signin");
        navigate('/admin/signin'); // Navigate to Admin Sign-In Page
    };

    const handleAreaAdminClick = () => {
        console.log("Area Admin role selected");
        // TODO: Navigate to the actual Area Admin login form/dashboard
        // navigate('/area-admin/login');
    };

    // Dummy data for cards (replace with actual if needed)
    const adminFeatures = ['ADMIN', ''];
    const areaAdminFeatures = ['AREA ADMIN', ''];

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
                   description="Full access."
                   features={adminFeatures}
                   buttonText="Continue as Admin"
                   colorScheme="admin"
                   onClick={handleAdminClick} // This triggers navigation
                 />
                 {/* Area Admin Card */}
                 <RoleCard
                   icon={<FaUsersCog />}
                   roleType="AREA ADMIN"
                   title="I am an Area Admin"
                   description="Area-specific access."
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