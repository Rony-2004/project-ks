// frontend/src/pages/admin/AdminOverview.tsx
import React, { useState, useEffect } from 'react';
import { getMembers } from '../../services/memberService'; // Import member service
import { getAreaAdmins } from '../../services/areaAdminService'; // Import area admin service
import styles from './AdminOverview.module.css'; // Create this CSS file

interface OverviewStats {
    memberCount: number;
    areaAdminCount: number;
    // Add more stats later, e.g., total amount due
}

const AdminOverview: React.FC = () => {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOverviewData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch data in parallel
                const [memberData, areaAdminData] = await Promise.all([
                    getMembers(),
                    getAreaAdmins()
                ]);

                setStats({
                    memberCount: memberData.length,
                    areaAdminCount: areaAdminData.length
                    // Calculate other stats here later
                });

            } catch (err: any) {
                setError('Failed to load overview data.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOverviewData();
    }, []);


    return (
        <div className={styles.overviewContainer}>
            <h2>Admin Overview</h2>

            {isLoading && <p className={styles.loadingText}>Loading overview...</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}

            {stats && !isLoading && !error && (
                <div className={styles.statsGrid}>
                    {/* Stat Card for Members */}
                    <div className={styles.statCard}>
                        <h4>Total Members</h4>
                        <p className={styles.statValue}>{stats.memberCount}</p>
                    </div>

                    {/* Stat Card for Area Admins */}
                    <div className={styles.statCard}>
                        <h4>Total Area Admins</h4>
                        <p className={styles.statValue}>{stats.areaAdminCount}</p>
                    </div>

                    {/* Add more Stat Cards here later */}
                    {/* Example:
                    <div className={styles.statCard}>
                        <h4>Amount Due This Month</h4>
                        <p className={styles.statValue}>₹ {stats.amountDue || 0}</p>
                    </div>
                    */}
                </div>
            )}

            {/* Add Charts or Recent Activity sections later */}
        </div>
    );
};

export default AdminOverview;