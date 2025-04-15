// frontend/src/pages/area-admin/AreaAdminMyMembers.tsx (Final Code)
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import {
    getMembers, MemberData // Ensure MemberData includes 'area: { id: string, name: string } | null' and 'areaId: string'
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

const AreaAdminMyMembers: React.FC = () => {
    // --- State Variables ---
    const [myMembersList, setMyMembersList] = useState<MemberData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [assignedAreas, setAssignedAreas] = useState<Area[]>([]);
    const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('');


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
            // Assumes getMembers fetches members with the 'area' object included
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
                // Add area only if it has both id and name and is not already added
                if (areaId && areaName && !uniqueAreas.has(areaId)) {
                    uniqueAreas.set(areaId, { id: areaId, name: areaName });
                }
            });
            // Convert map values back to an array and sort alphabetically by name
            const sortedAreas = Array.from(uniqueAreas.values()).sort((a, b) => a.name.localeCompare(b.name));
            setAssignedAreas(sortedAreas);
        } else {
            setAssignedAreas([]); // Clear if no members or members have no areas
        }
    }, [myMembersList]); // Re-run whenever the member list changes


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
            setTimeout(() => { handleClosePaymentModal(); }, 2500);
        } catch (error: any) { setPaymentError(error.message || `Failed to record one or more payments.`); }
        finally { setIsSubmittingPayment(false); }
    };


    // --- Filter members based on search query AND selected area ---
    const filteredMembers = useMemo(() => {
        let members = myMembersList;
        if (searchQuery && searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            members = members.filter(member =>
                member.name.toLowerCase().includes(lowerCaseQuery) ||
                member.phone.toLowerCase().includes(lowerCaseQuery) ||
                (member.area?.name ?? '').toLowerCase().includes(lowerCaseQuery)
            );
        }
        if (selectedAreaFilter !== '') {
            members = members.filter(member => member.areaId === selectedAreaFilter);
        }
        return members;
    }, [myMembersList, searchQuery, selectedAreaFilter]);


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>My Assigned Members</h2>

             {/* --- Controls Bar (Search Left, Filter Right) --- */}
             <div className={styles.controlsContainer}>
                {/* Search Bar */}
                <div className={styles.searchContainer}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="search"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {/* Area Filter Dropdown */}
                <div className={styles.filterContainer}>
                    <label htmlFor="areaFilter" className={styles.filterLabel}>Area:</label>
                    <select
                        id="areaFilter"
                        name="areaFilter"
                        value={selectedAreaFilter}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAreaFilter(e.target.value)}
                        className={styles.filterSelect}
                        // ** RESTORED original disabled condition **
                        disabled={isLoading || assignedAreas.length === 0}
                        title="Filter members by area"
                    >
                        <option value="">All My Areas</option>
                        {assignedAreas.map(area => (
                            <option key={area.id} value={area.id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>
                {/* --- End Filter --- */}
            </div>
            {/* --- End Controls Bar --- */}

            {/* --- Removed Temporary Debug Info Box --- */}

            {/* Display Members List */}
            {/* CSS Suggestion for Vertical Alignment: */}
            {/* .table th, .table td { vertical-align: middle; } */}
            {/* .table th:nth-child(5), .table td:nth-child(5) { text-align: center; } */}
            {/* .table th:last-child, .table td:last-child { text-align: center; } */}
            <div className={styles.listSection}>
                 <h3>
                     Members List
                     {selectedAreaFilter && assignedAreas.find(a => a.id === selectedAreaFilter)
                         ? ` (Filtered by Area: ${assignedAreas.find(a => a.id === selectedAreaFilter)?.name})`
                         : ''}
                 </h3>
                {isLoading && <p className={styles.loadingText}>Loading members...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {!isLoading && !fetchError && filteredMembers.length === 0 && (
                    <p className={styles.noDataText}>
                        {searchQuery || selectedAreaFilter ? 'No members found matching filters.' : 'You currently have no members assigned.'}
                    </p>
                )}
                {!isLoading && !fetchError && filteredMembers.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th><th>Name</th><th>Phone</th><th>Area</th>
                                    <th>Monthly Amount</th><th>Created At</th><th>Record Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.id}</td><td>{member.name}</td><td>{member.phone}</td>
                                        <td>{member.area?.name ?? 'N/A'}</td><td>{member.monthlyAmount}</td>
                                        <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button onClick={() => handleOpenPaymentModal(member)} className={`${styles.actionButton} ${styles.recordButton}`} title="Record Payment" >
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
                        {/* ... (keep existing modal content) ... */}
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
