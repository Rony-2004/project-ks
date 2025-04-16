// frontend/src/pages/area-admin/AreaAdminMyMembers.tsx (2x2 Filter Layout - Final)
// No changes needed in this file from the previous version with the Payment Status filter.
// The layout fix is handled entirely by the corrected CSS.
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import {
    // ** IMPORTANT: Ensure MemberData interface includes isCurrentMonthPaid?: boolean; **
    getMembers, MemberData
} from '../../services/memberService'; // Verify path
import {
    recordPayment, RecordPaymentData, PaymentData
} from '../../services/paymentService'; // Verify path
import styles from '../admin/AdminMembers.module.css'; // Using shared styles
import { FaMoneyCheckAlt, FaSearch } from 'react-icons/fa';

// Define Area type locally
interface Area {
    id: string;
    name: string;
}

// ** Add isCurrentMonthPaid to MemberData if not defined in service file **
// interface MemberData {
//   // ... other existing fields
//   area?: { id: string; name: string; } | null;
//   areaId?: string;
//   isCurrentMonthPaid?: boolean; // <-- Assumed field from backend
// }


const AreaAdminMyMembers: React.FC = () => {
    // --- State Variables ---
    const [myMembersList, setMyMembersList] = useState<MemberData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [assignedAreas, setAssignedAreas] = useState<Area[]>([]);
    const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('');
    // State for Payment Status Filter
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'due'>('all');


    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
    const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
    const [numberOfMonths, setNumberOfMonths] = useState<string>('1');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
    const [paymentDate, setPaymentDate] = useState<string>('');
    const [startMonth, setStartMonth] = useState<string>('');
    const [startYear, setStartYear] = useState<string>('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);


    // --- Fetch Members ---
    const fetchMyMembers = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            // ** Assumes getMembers now fetches members including 'isCurrentMonthPaid' boolean **
            const data = await getMembers();
            setMyMembersList(data ?? []);
        } catch (error: any) { setFetchError(error.message || 'Failed to load members'); }
        finally { setIsLoading(false); }
    };

    // Fetch members on component mount
    useEffect(() => {
        fetchMyMembers();
    }, []);

    // Effect to derive assigned areas from the member list
    useEffect(() => {
        if (myMembersList && myMembersList.length > 0) {
            const uniqueAreas = new Map<string, Area>();
            myMembersList.forEach(member => {
                const areaId = member.area?.id;
                const areaName = member.area?.name;
                if (areaId && areaName && !uniqueAreas.has(areaId)) {
                    uniqueAreas.set(areaId, { id: areaId, name: areaName });
                }
            });
            const sortedAreas = Array.from(uniqueAreas.values()).sort((a, b) => a.name.localeCompare(b.name));
            setAssignedAreas(sortedAreas);
        } else {
            setAssignedAreas([]);
        }
    }, [myMembersList]);


    // --- Payment Modal Logic ---
    const handleOpenPaymentModal = (member: MemberData) => {
        if (!member) return;
        const currentDate = new Date();
        setSelectedMember(member);
        setNumberOfMonths('1'); setPaymentMethod('Cash');
        setPaymentDate(currentDate.toISOString().split('T')[0]);
        setStartMonth((currentDate.getMonth() + 1).toString());
        setStartYear(currentDate.getFullYear().toString());
        setPaymentError(null); setPaymentSuccess(null); setIsSubmittingPayment(false);
        setIsPaymentModalOpen(true);
    };
    const handleClosePaymentModal = () => { setIsPaymentModalOpen(false); setSelectedMember(null); };

    const calculatedTotalAmount = useMemo(() => {
        if (!selectedMember) return 0;
        const numMonths = parseInt(numberOfMonths, 10);
        const monthsToCalc = isNaN(numMonths) || numMonths < 1 ? 1 : numMonths;
        return (selectedMember.monthlyAmount || 0) * monthsToCalc;
    }, [selectedMember, numberOfMonths]);

    const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedMember) return;
        setPaymentError(null); setPaymentSuccess(null); setIsSubmittingPayment(true);

        const numMonths = parseInt(numberOfMonths, 10);
        const initialMonth = parseInt(startMonth, 10);
        const initialYear = parseInt(startYear, 10);
        const amountPerMonth = selectedMember.monthlyAmount;

        let validationError = null;
        if (isNaN(numMonths) || numMonths < 1 || numMonths > 24) { validationError = "Invalid number of months (1-24)."; }
        else if (isNaN(initialMonth) || initialMonth < 1 || initialMonth > 12) { validationError = "Invalid starting month."; }
        else if (isNaN(initialYear) || initialYear < 2020 || initialYear > 2099) { validationError = "Invalid starting year."; }
        else if (!amountPerMonth || amountPerMonth <= 0) { validationError = "Member's monthly amount invalid."; }
        else if (!paymentDate) { validationError = "Invalid payment date."; }
        if(validationError) { setPaymentError(validationError); setIsSubmittingPayment(false); return; }

        const paymentPromises: Promise<PaymentData>[] = [];
        let currentMonth = initialMonth; let currentYear = initialYear;

        for (let i = 0; i < numMonths; i++) {
            const paymentDataForMonth: RecordPaymentData = {
                memberId: selectedMember.id, amountPaid: amountPerMonth,
                paymentMethod: paymentMethod, paymentMonth: currentMonth,
                paymentYear: currentYear, paymentDate: paymentDate
            };
            paymentPromises.push(recordPayment(paymentDataForMonth));
            currentMonth++;
            if (currentMonth > 12) { currentMonth = 1; currentYear++; }
        }

        try {
            await Promise.all(paymentPromises);
            setPaymentSuccess(`${numMonths} month(s) payment recorded successfully!`);
            fetchMyMembers(); // Refresh member list to update status
            setTimeout(() => { handleClosePaymentModal(); }, 2500);
        } catch (error: any) { setPaymentError(error.message || `Failed to record one or more payments.`); }
        finally { setIsSubmittingPayment(false); }
    };


    // --- Filter members (Search, Area, Payment Status) ---
    const filteredMembers = useMemo(() => {
        let members = myMembersList;

        // 1. Filter by Payment Status
        if (paymentStatusFilter === 'paid') {
            members = members.filter(member => member.isCurrentMonthPaid === true);
        } else if (paymentStatusFilter === 'due') {
            members = members.filter(member => !member.isCurrentMonthPaid);
        }

        // 2. Filter by Search Query
        if (searchQuery && searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            members = members.filter(member =>
                member.name.toLowerCase().includes(lowerCaseQuery) ||
                member.phone.toLowerCase().includes(lowerCaseQuery) ||
                (member.area?.name ?? '').toLowerCase().includes(lowerCaseQuery)
            );
        }

        // 3. Filter by Selected Area
        if (selectedAreaFilter !== '') {
            members = members.filter(member => member.areaId === selectedAreaFilter);
        }

        return members;
    }, [myMembersList, searchQuery, selectedAreaFilter, paymentStatusFilter]);


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>My Assigned Members</h2>

             {/* Wrapper for all controls - Uses flex-direction: column */}
             <div className={styles.controlsWrapper}>

                {/* Top Row: Search | Area Filter */}
                {/* This container uses flex-direction: row */}
                <div className={styles.controlsContainer}>
                    {/* Search Bar Container (gets flex: 1 from CSS) */}
                    <div className={styles.searchContainer}>
                        <FaSearch className={styles.searchIcon} />
                        <input type="search" placeholder="Search members..." value={searchQuery} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className={styles.searchInput} />
                    </div>

                    {/* Area Filter Container (gets flex: 1 from CSS) */}
                    <div className={styles.filterContainer}>
                        <label htmlFor="areaFilter" className={styles.filterLabel}>Area:</label>
                        <select id="areaFilter" name="areaFilter" value={selectedAreaFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAreaFilter(e.target.value)} className={styles.filterSelect} disabled={isLoading || assignedAreas.length === 0} title="Filter members by area">
                            <option value="">All My Areas</option>
                            {assignedAreas.map(area => (<option key={area.id} value={area.id}>{area.name}</option>))}
                        </select>
                    </div>
                </div>
                {/* End Top Row */}

                {/* Bottom Row: Payment Status Filter | Spacer */}
                 {/* This container also uses flex-direction: row */}
                <div className={styles.controlsContainer}>
                     {/* Payment Status Filter Container (gets flex: 1 from CSS) */}
                     <div className={styles.filterContainer}>
                         <label htmlFor="paymentStatusFilter" className={styles.filterLabel}>Payment Status:</label>
                         <select
                             id="paymentStatusFilter"
                             name="paymentStatusFilter"
                             value={paymentStatusFilter}
                             onChange={(e: ChangeEvent<HTMLSelectElement>) => setPaymentStatusFilter(e.target.value as 'all' | 'paid' | 'due')}
                             className={styles.filterSelect} // Reuse class
                             disabled={isLoading}
                             title="Filter members by current month payment status"
                         >
                             <option value="all">Show All</option>
                             <option value="paid">Paid (Current Month)</option>
                             <option value="due">Due (Current Month)</option>
                         </select>
                     </div>
                     {/* Empty Spacer div (gets flex: 1 from CSS) */}
                     {/* This div ensures the Payment Status filter only takes up half the width */}
                     <div style={{ flex: 1 }}></div>

                </div>
                 {/* End Bottom Row */}

            </div>
            {/* End Controls Wrapper */}


            {/* Display Members List */}
            {/* CSS rules for table alignment should be in the CSS file */}
            <div className={styles.listSection}>
                 <h3>
                     Members List
                     {/* Filter status display */}
                     {selectedAreaFilter && assignedAreas.find(a => a.id === selectedAreaFilter) ? ` (Area: ${assignedAreas.find(a => a.id === selectedAreaFilter)?.name})` : ''}
                     {paymentStatusFilter !== 'all' ? ` (Status: ${paymentStatusFilter === 'paid' ? 'Paid' : 'Due'})`: ''}
                 </h3>
                {isLoading && <p className={styles.loadingText}>Loading members...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {!isLoading && !fetchError && filteredMembers.length === 0 && (
                    <p className={styles.noDataText}>
                        {searchQuery || selectedAreaFilter || paymentStatusFilter !== 'all'
                            ? 'No members found matching filters.'
                            : 'You currently have no members assigned.'}
                    </p>
                )}
                {!isLoading && !fetchError && filteredMembers.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Area</th><th>Monthly Amount</th><th>Created At</th><th>Record Payment</th></tr></thead>
                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.id}</td><td>{member.name}</td><td>{member.phone}</td>
                                        <td>{member.area?.name ?? 'N/A'}</td>
                                        <td className={styles.amountCell}>{member.monthlyAmount}</td>
                                        <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                                        <td className={styles.actionCell}>
                                            <button
                                                onClick={() => handleOpenPaymentModal(member)}
                                                className={`
                                                    ${styles.actionButton} ${styles.recordButton}
                                                    ${member.isCurrentMonthPaid ? styles.paidButton : styles.dueButton}
                                                `}
                                                title={member.isCurrentMonthPaid ? `Paid (${new Date().toLocaleString('default', { month: 'long' })})` : "Record Payment"}
                                            >
                                                <FaMoneyCheckAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Recording Modal */}
            {isPaymentModalOpen && selectedMember && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                         {/* ... existing modal content ... */}
                         <h3>Record Payment for {selectedMember.name}</h3>
                         <p>Monthly Amount Due: <strong>{selectedMember.monthlyAmount}</strong></p>
                         <form onSubmit={handlePaymentSubmit} className={styles.paymentForm}>
                             <div className={styles.formGrid}>
                                 <div className={styles.formGroup}><label htmlFor="numMonths">Pay for how many months?</label><input type="number" id="numMonths" name="numberOfMonths" min="1" max="24" value={numberOfMonths} onChange={(e) => setNumberOfMonths(e.target.value)} required /></div>
                                 <div className={styles.formGroup}><label>Total Amount To Record</label><input type="text" value={calculatedTotalAmount.toFixed(2)} readOnly className={styles.readOnlyInput} /></div>
                                 <div className={styles.formGroup}><label htmlFor="payMonth">Starting Month</label><select id="payMonth" name="startMonth" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} required >{/* Month Options */}<option value="">--Select Month--</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })} ({m})</option>))}</select></div>
                                 <div className={styles.formGroup}><label htmlFor="payYear">Starting Year</label><input type="number" id="payYear" name="startYear" min="2020" max="2099" value={startYear} onChange={(e) => setStartYear(e.target.value)} required /></div>
                                 <div className={styles.formGroup}><label htmlFor="payMethod">Payment Method</label><select id="payMethod" name="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Online')} required ><option value="Cash">Cash</option><option value="Online">Online</option></select></div>
                                 <div className={styles.formGroup}><label htmlFor="payDate">Payment Date Received</label><input type="date" id="payDate" name="paymentDate" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required /></div>
                             </div>
                             {paymentError && <p className={styles.errorMessage}>{paymentError}</p>}
                             {paymentSuccess && <p className={styles.successMessage}>{paymentSuccess}</p>}
                             <div className={styles.modalActions}>
                                 <button type="submit" className={styles.submitButton} disabled={isSubmittingPayment || parseInt(numberOfMonths, 10) < 1}> {isSubmittingPayment ? 'Saving...' : `Record ${numberOfMonths} Month(s) Payment`} </button>
                                 <button type="button" className={styles.cancelButton} onClick={handleClosePaymentModal} disabled={isSubmittingPayment}> Cancel </button>
                             </div>
                         </form>
                    </div>
                </div>
             )}
        </div> // End container div
    );
}; // End Component

export default AreaAdminMyMembers;
