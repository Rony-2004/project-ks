// frontend/src/pages/area-admin/AreaAdminPaymentHistory.tsx (Fixed Area Column)
import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
// ** REMOVED getAllAreas import **
import { getMyAreaPayments, PaymentDataWithMember } from '../../services/paymentService'; // Verify path
import styles from '../admin/AreaAdminPaymentHistory.module.css'; // Verify path & CSS file existence
import { FaSearch } from 'react-icons/fa'; // Import Search Icon

// Define Area type locally
interface Area {
    id: string;
    name: string;
}

const AreaAdminPaymentHistory: React.FC = () => {
    // Initial log
    console.log('[AreaAdminPaymentHistory] Component trying to render...');

    // --- State Variables ---
    const [payments, setPayments] = useState<PaymentDataWithMember[]>([]); // Full list from API
    const [isLoading, setIsLoading] = useState<boolean>(true); // Loading for payments
    const [error, setError] = useState<string | null>(null);
    // State for Search & Filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const currentYear = new Date().getFullYear();
    const [filterMonth, setFilterMonth] = useState<string>(''); // Default: All months
    const [filterYear, setFilterYear] = useState<string>(currentYear.toString()); // Default: Current year
    // ** NEW: State for the derived list of assigned areas **
    const [assignedAreas, setAssignedAreas] = useState<Area[]>([]);
    // ** NEW: State for the Area Filter Dropdown **
    const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>(''); // '' means 'All Areas'


    // --- Fetch Payments ---
    const fetchPayments = async () => {
        setIsLoading(true); // Set loading true when fetching payments
        setError(null);
        console.log('[AreaAdminPaymentHistory] Fetching payment history...');
        try {
            // ** IMPORTANT: Ensure getMyAreaPayments returns member with area { id, name } and areaId included **
            const data = await getMyAreaPayments();
            setPayments(Array.isArray(data) ? data : []);
            console.log('[AreaAdminPaymentHistory] Fetched payments count:', data?.length ?? 0);
        } catch (err: any) {
            console.error('[AreaAdminPaymentHistory] Error fetching payments:', err);
            setError(err.message || 'Could not load payment history.');
        } finally {
            setIsLoading(false); // Set loading false after fetching payments
        }
    };

    // Run fetchPayments on mount
    useEffect(() => {
        fetchPayments();
    }, []);

    // ** NEW: Effect to derive assigned areas from the PAYMENTS list **
    useEffect(() => {
        // console.log('[DeriveAreasEffect - Payments] Running. Payments length:', payments?.length); // Optional log
        if (payments && payments.length > 0) {
            const uniqueAreas = new Map<string, Area>();
            payments.forEach(payment => {
                // Check if payment includes member and member includes area with id/name
                const areaId = payment.member?.area?.id;
                const areaName = payment.member?.area?.name;

                if (areaId && areaName && !uniqueAreas.has(areaId)) {
                    uniqueAreas.set(areaId, { id: areaId, name: areaName });
                }
            });
            // Convert map values back to an array and sort alphabetically by name
            const sortedAreas = Array.from(uniqueAreas.values()).sort((a, b) => a.name.localeCompare(b.name));
            setAssignedAreas(sortedAreas);
            // console.log('[DeriveAreasEffect - Payments] Setting assignedAreas:', sortedAreas); // Optional log
        } else {
            setAssignedAreas([]);
            // console.log('[DeriveAreasEffect - Payments] Setting assignedAreas to empty array.'); // Optional log
        }
    }, [payments]); // Re-run whenever the payments list changes


    // --- Helper Functions ---
    const formatMonthYear = (month: number, year: number): string => {
       try { if (!month || !year || isNaN(month) || isNaN(year)) return 'N/A'; const date = new Date(year, month - 1); return date.toLocaleString('default', { month: 'long', year: 'numeric'}); } catch (e) { return 'Invalid Date'; }
    };
    // ** REMOVED formatDate function **
    // const formatDate = (dateString: string | null | undefined): string => {
    //    try { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString(); } catch (e) { return 'Invalid Date'; }
    // };
    const formatDateTime = (dateString: string | null | undefined): string => {
       try { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleString(); } catch (e) { return 'Invalid Date'; }
    };

    // --- ** UPDATED ** Filter & Search Logic ---
    const filteredAndSearchedPayments = useMemo(() => {
        // console.log('[AreaAdminPaymentHistory] Filtering/Searching payments...');
        const lowerCaseSearchQuery = searchQuery.toLowerCase();
        const monthFilter = parseInt(filterMonth, 10) || 0;
        const yearFilter = parseInt(filterYear, 10) || 0;

        const results = payments.filter(payment => {
            // Original Month/Year Filters
            const monthMatch = !monthFilter || payment.paymentMonth === monthFilter;
            const yearMatch = !yearFilter || payment.paymentYear === yearFilter;

            // Original Search Filter (by member name)
            const memberName = payment.member?.name ?? '';
            const searchMatch = !searchQuery || memberName.toLowerCase().includes(lowerCaseSearchQuery);

            // ** NEW: Area Filter **
            // Assumes PaymentDataWithMember includes member.areaId
            const areaMatch = !selectedAreaFilter || payment.member?.areaId === selectedAreaFilter;

            // Combine all filters
            return monthMatch && yearMatch && searchMatch && areaMatch; // Added areaMatch
        });
        // console.log(`[AreaAdminPaymentHistory] Filtering done. Found ${results.length} matching payments.`);
        return results;
    // Add selectedAreaFilter to dependency array
    }, [payments, filterMonth, filterYear, searchQuery, selectedAreaFilter]); // <-- Added dependency


    // --- Component Return (JSX) ---
     // console.log(`[AreaAdminPaymentHistory] Starting JSX render... isLoading=${isLoading}, error=${error}`);
    return (
        <div className={styles.container}>
            <h2>My Payment Recording History</h2>
            <p>This table shows payments you have recorded.</p>

            {/* Filter and Search Controls - Original Structure */}
            <div className={styles.controlsContainer}>
                 {/* Existing Filter Container now includes Area */}
                 <div className={styles.filterContainer}>
                     {/* Existing Month Filter */}
                     <div className={styles.formGroup}>
                         <label htmlFor="filterMonth">Filter by Month:</label>
                         <select id="filterMonth" value={filterMonth} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterMonth(e.target.value)} className={styles.filterSelectSmall} > {/* Using existing class */}
                             <option value="">-- All Months --</option>
                             {Array.from({ length: 12 }, (_, i) => i + 1).map(m => ( <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })} ({m})</option> ))}
                         </select>
                     </div>
                     {/* Existing Year Filter */}
                     <div className={styles.formGroup}>
                         <label htmlFor="filterYear">Filter by Year:</label>
                         <div className={styles.yearFilterGroup}>
                             <input type="number" id="filterYear" placeholder="All Years" min="2020" max="2099" value={filterYear} onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterYear(e.target.value)} className={styles.yearInput}/> {/* Using existing class */}
                             {filterYear && <button onClick={() => setFilterYear('')} className={styles.clearButton} title="Clear Year Filter">X</button>}
                         </div>
                     </div>
                     {/* ** NEW: Area Filter Added Here (inside existing filterContainer) ** */}
                     <div className={styles.formGroup}>
                         <label htmlFor="areaFilter" className={styles.filterLabel}>Filter by Area:</label>
                         <select
                             id="areaFilter"
                             name="areaFilter"
                             value={selectedAreaFilter}
                             onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAreaFilter(e.target.value)}
                             className={styles.filterSelectSmall} // Using same class as month filter
                             // Disable if payments loading OR no assigned areas derived
                             disabled={isLoading || assignedAreas.length === 0}
                             title="Filter payments by member area"
                         >
                             <option value="">All My Areas</option>
                             {/* ** UPDATED: Populate from derived assignedAreas ** */}
                             {assignedAreas.map(area => (
                                 <option key={area.id} value={area.id}>
                                     {area.name}
                                 </option>
                             ))}
                         </select>
                         {/* Optional: Message if disabled */}
                         { !isLoading && assignedAreas.length === 0 && payments.length > 0 &&
                            <span className={styles.errorMessageSmall}>(No areas found in payment history)</span>
                         }
                     </div>
                 </div>
                 {/* Existing Search Container (Unchanged Position) */}
                 <div className={styles.searchContainer}>
                     <FaSearch className={styles.searchIcon} />
                     <input type="search" placeholder="Search by Member Name..." value={searchQuery} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className={styles.searchInput} />
                 </div>
             </div>

            {/* Display List Section */}
            <div className={styles.listSection}>
                 <h3>
                     Payment Records
                     {/* Display filter status */}
                     {selectedAreaFilter && assignedAreas.find(a => a.id === selectedAreaFilter)
                         ? ` (Area: ${assignedAreas.find(a => a.id === selectedAreaFilter)?.name})`
                         : ''}
                     {filterMonth ? ` (Month: ${new Date(0, parseInt(filterMonth, 10) - 1).toLocaleString('default', { month: 'long' })})` : ''}
                     {filterYear ? ` (Year: ${filterYear})` : ''}
                 </h3>
                 {isLoading && <p className={styles.loadingText}>Loading payment history...</p>}
                 {!isLoading && error && <p className={styles.errorMessage}>{error}</p>}
                 {!isLoading && !error && filteredAndSearchedPayments.length === 0 && (
                     <p className={styles.noDataText}>
                         {(filterMonth || filterYear || searchQuery || selectedAreaFilter) ? 'No payment records match the current filters/search.' : 'No payment records found.'}
                     </p>
                 )}
                 {!isLoading && !error && filteredAndSearchedPayments.length > 0 && (
                     <div className={styles.tableContainer}>
                         <table className={styles.table}>
                             <thead>
                                 <tr>
                                     <th>Payment ID</th>
                                     <th>Member Name</th>
                                     <th>Amount Paid</th>
                                     <th>Method</th>
                                     <th>For Month/Year</th>
                                     {/* *** MODIFICATION 1: Changed header from "Date Paid" to "Area" *** */}
                                     <th>Area</th>
                                     <th>Date Recorded</th>
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
                                         {/* *** MODIFICATION 2: Changed cell content to display Area Name *** */}
                                         <td>{payment.member?.area?.name ?? 'N/A'}</td>
                                         {/* Keep Date Recorded */}
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
