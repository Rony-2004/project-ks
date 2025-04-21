// frontend/src/pages/admin/AdminOverview.tsx
// ** FINAL CODE - Using User's CSS Module and 2x2 Layout **

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Import necessary MUI components for layout, loading, errors
import { Box, Typography, CircularProgress, Alert, Grid } from '@mui/material';
import { startOfMonth, isWithinInterval } from 'date-fns';

// Import Services - ** Ensure these paths and functions are correct **
import { getMembers } from '../../services/memberService';
import { getAllAreas } from '../../services/areaService';
import { getAllPaymentsAdmin } from '../../services/paymentService';
import { getAreaAdmins } from '../../services/areaAdminService'; // Using this based on user's previous code

import styles from './AdminOverview.module.css'; // Import the CSS module

// --- Updated State Interface ---
interface OverviewStats {
    memberCount: number;
    areaCount: number;
    areaAdminCount: number;
    totalCollected: number; // All time total
    // Add more stats later if needed
}

// --- Refactored StatCard to match CSS Module Structure ---
interface StatCardProps {
    title: string;
    value: string | number;
}
const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
    <div className={styles.statCard}>
        <h4>{title}</h4>
        <p className={styles.statValue}>{value}</p>
    </div>
);
// --- End StatCard Component ---


// ** Main Overview Component **
function AdminOverview() {
    // --- State ---
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const COMPONENT_NAME = '[AdminOverview]';

    // --- Fetch Data ---
    useEffect(() => {
        const fetchOverviewData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [memberData, areaAdminData, areaData, paymentData] = await Promise.all([
                    getMembers(),
                    getAreaAdmins(), // Ensure this service function exists and works
                    getAllAreas(),
                    getAllPaymentsAdmin()
                ]);

                // Calculate total collected amount (All Time)
                const totalCollectedAllTime = paymentData.reduce((sum, payment) => sum + payment.amountPaid, 0);

                // Set all stats
                setStats({
                    memberCount: memberData.length,
                    areaAdminCount: areaAdminData.length,
                    areaCount: areaData.length,
                    totalCollected: totalCollectedAllTime
                });

            } catch (err: any) {
                setError('Failed to load overview data. Please check service connections.');
                console.error("Error fetching overview data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOverviewData();
    }, []); // Fetch on mount

    // --- Rendering Logic ---
    if (loading) {
        // Use MUI CircularProgress but apply CSS module class if needed for positioning/text
        return (
             <div className={styles.overviewContainer}>
                 <h2>Admin Overview</h2>
                 <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                 </Box>
                {/* <p className={styles.loadingText}>Loading overview...</p> */}
             </div>
        );
    }

    if (error) {
         // Use MUI Alert but apply CSS module class if needed
        return (
            <div className={styles.overviewContainer}>
                <h2>Admin Overview</h2>
                 <Alert severity="error" className={styles.errorMessage}>{error}</Alert>
            </div>
        );
    }

    return (
        // Apply CSS module class to the main container
        <div className={styles.overviewContainer}>
            {/* Use MUI Typography for consistency, or keep h2 if preferred */}
            <Typography variant="h4" component="h2" gutterBottom>
                Admin Overview
            </Typography>

            {stats && (
                // Apply CSS module class for the grid layout
                <div className={styles.statsGrid}>

                    {/* Total Members Card -> Links to Members Page */}
                    <Grid item xs={12} md={6}> {/* Use Grid item for layout */}
                        <Link to="/admin/dashboard/members" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                           <StatCard title="Total Members" value={stats.memberCount} />
                        </Link>
                    </Grid>

                    {/* Total Areas Card -> Links to Areas Page */}
                    <Grid item xs={12} md={6}> {/* Use Grid item for layout */}
                        <Link to="/admin/dashboard/areas" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                           <StatCard title="Total Areas" value={stats.areaCount} />
                        </Link>
                    </Grid>

                    {/* Total Area Admins Card -> Links to Area Admins Page */}
                    <Grid item xs={12} md={6}> {/* Use Grid item for layout */}
                         <Link to="/admin/dashboard/area-admins" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                            <StatCard title="Area Admins" value={stats.areaAdminCount} />
                        </Link>
                    </Grid>

                    {/* Total Collected Card -> Links to Payments Page */}
                    <Grid item xs={12} md={6}> {/* Use Grid item for layout */}
                        <Link to="/admin/dashboard/payments" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                            <StatCard
                                title="Total Collected (All Time)"
                                value={stats.totalCollected.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                            />
                       </Link>
                    </Grid>

                </div>
            )}
            {/* Add Charts or other sections below if needed */}
        </div>
    );
}

export default AdminOverview;