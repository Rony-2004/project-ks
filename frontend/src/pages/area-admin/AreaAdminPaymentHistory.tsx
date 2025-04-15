// frontend/src/pages/area-admin/AreaAdminPaymentHistory.tsx (Combined Search + Filters - VERIFIED)
import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { getMyAreaPayments, PaymentDataWithMember } from '../../services/paymentService'; // Verify path
import styles from '../admin/AdminMembers.module.css'; // Verify path & CSS file existence
import { FaSearch } from 'react-icons/fa'; // Import Search Icon

const AreaAdminPaymentHistory: React.FC = () => {
    // Initial log to confirm component starts rendering
    console.log('[AreaAdminPaymentHistory] Component trying to render...');

    // --- State Variables ---
    const [payments, setPayments] = useState<PaymentDataWithMember[]>([]); // Full list from API
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // State for Search & Filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const currentYear = new Date().getFullYear();
    const [filterMonth, setFilterMonth] = useState<string>(''); // Default: All months
    const [filterYear, setFilterYear] = useState<string>(currentYear.toString()); // Default: Current year

    // --- Fetch Payments ---
    const fetchPayments = async () => {
        setIsLoading(true); setError(null);
        console.log('[AreaAdminPaymentHistory] Fetching payment history...');
        try {
            const data = await getMyAreaPayments();
            setPayments(Array.isArray(data) ? data : []); // Ensure it's always an array
            console.log('[AreaAdminPaymentHistory] Fetched payments count:', data?.length ?? 0);
        } catch (err: any) {
            console.error('[AreaAdminPaymentHistory] Error fetching payments:', err);
            setError(err.message || 'Could not load payment history.');
        } finally { setIsLoading(false); }
    };
    useEffect(() => { fetchPayments(); }, []); // Run once on mount

    // --- Helper Functions ---
    const formatMonthYear = (month: number, year: number): string => {
         try { if (!month || !year || isNaN(month) || isNaN(year)) return 'N/A'; const date = new Date(year, month - 1); return date.toLocaleString('default', { month: 'long', year: 'numeric'}); } catch (e) { return 'Invalid Date'; }
    };
    const formatDate = (dateString: string | null | undefined): string => {
         try { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString(); } catch (e) { return 'Invalid Date'; }
    };
    const formatDateTime = (dateString: string | null | undefined): string => {
         try { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleString(); } catch (e) { return 'Invalid Date'; }
    };

    // --- Filter & Search Logic ---
    const filteredAndSearchedPayments = useMemo(() => {
        console.log('[AreaAdminPaymentHistory] Filtering/Searching payments...');
        const lowerCaseSearchQuery = searchQuery.toLowerCase();
        const monthFilter = parseInt(filterMonth, 10) || 0;
        const yearFilter = parseInt(filterYear, 10) || 0;

        const results = payments.filter(payment => {
            const monthMatch = !monthFilter || payment.paymentMonth === monthFilter;
            const yearMatch = !yearFilter || payment.paymentYear === yearFilter;
            const memberName = payment.member?.name ?? '';
            const searchMatch = !searchQuery || memberName.toLowerCase().includes(lowerCaseSearchQuery);
            return monthMatch && yearMatch && searchMatch;
        });
        console.log(`[AreaAdminPaymentHistory] Filtering done. Found ${results.length} matching payments.`);
        return results;
    }, [payments, filterMonth, filterYear, searchQuery]);


    // --- Component Return (JSX) ---
     console.log(`[AreaAdminPaymentHistory] Starting JSX render... isLoading=${isLoading}, error=${error}`);
    return (
        <div className={styles.container}>
            <h2>My Payment Recording History</h2>
            <p>This table shows payments you have recorded.</p>

            {/* Filter and Search Controls */}
            <div className={styles.controlsContainer}>
                 <div className={styles.filterContainer}>
                     <div className={styles.formGroup}>
                         <label htmlFor="filterMonth">Filter by Month:</label>
                         <select id="filterMonth" value={filterMonth} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterMonth(e.target.value)} >
                             <option value="">-- All Months --</option>
                             {Array.from({ length: 12 }, (_, i) => i + 1).map(m => ( <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })} ({m})</option> ))}
                         </select>
                     </div>
                     <div className={styles.formGroup}>
                         <label htmlFor="filterYear">Filter by Year:</label>
                         <div className={styles.yearFilterGroup}>
                             <input type="number" id="filterYear" placeholder="All Years" min="2020" max="2099" value={filterYear} onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterYear(e.target.value)} />
                             {filterYear && <button onClick={() => setFilterYear('')} className={styles.clearButton} title="Clear Year Filter">X</button>}
                         </div>
                     </div>
                 </div>
                 <div className={styles.searchContainer}>
                      <FaSearch className={styles.searchIcon} />
                      <input type="search" placeholder="Search by Member Name..." value={searchQuery} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className={styles.searchInput} />
                  </div>
            </div>

            {/* Display List Section */}
            <div className={styles.listSection}>
                 {isLoading && <p className={styles.loadingText}>Loading payment history...</p>}
                 {!isLoading && error && <p className={styles.errorMessage}>{error}</p>}
                 {!isLoading && !error && filteredAndSearchedPayments.length === 0 && (
                     <p className={styles.noDataText}>
                        {(filterMonth || filterYear || searchQuery) ? 'No payment records match the current filters/search.' : 'No payment records found.'}
                    </p>
                 )}
                 {!isLoading && !error && filteredAndSearchedPayments.length > 0 && (
                     <div className={styles.tableContainer}>
                         <table className={styles.table}>
                             <thead>
                                 <tr>
                                     <th>Payment ID</th><th>Member Name</th><th>Amount Paid</th><th>Method</th>
                                     <th>For Month/Year</th><th>Date Paid</th><th>Date Recorded</th>
                                     {/* No Actions column */}
                                 </tr>
                             </thead>
                             <tbody>
                                 {filteredAndSearchedPayments.map((payment) => (
                                     <tr key={payment.id}>
                                         <td>{payment.id ?? 'N/A'}</td>
                                         <td>{payment.member?.name ?? 'N/A'}</td>
                                         <td>{payment.amountPaid ?? 'N/A'}</td>
                                         <td>{payment.paymentMethod ?? 'N/A'}</td>
                                         <td>{formatMonthYear(payment.paymentMonth, payment.paymentYear)}</td>
                                         <td>{formatDate(payment.paymentDate)}</td>
                                         <td>{formatDateTime(payment.createdAt)}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 )}
             </div>
        </div>
    );
};

export default AreaAdminPaymentHistory;