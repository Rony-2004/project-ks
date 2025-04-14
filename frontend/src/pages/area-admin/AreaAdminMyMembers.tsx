// frontend/src/pages/area-admin/AreaAdminMyMembers.tsx (Combined: Search + Advance Pay v4)
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import {
    getMembers, MemberData
} from '../../services/memberService'; // Verify path
import {
    recordPayment, RecordPaymentData, PaymentData // Added PaymentData import
} from '../../services/paymentService'; // Verify path
import styles from '../admin/AdminMembers.module.css'; // Verify path & existence
import { FaMoneyCheckAlt, FaSearch } from 'react-icons/fa'; // Added Search Icon

const AreaAdminMyMembers: React.FC = () => {
    console.log('[AreaAdminMyMembers] Component Render Start');

    // --- State Variables ---
    const [myMembersList, setMyMembersList] = useState<MemberData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>(''); // State for search

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
        console.log('[AreaAdminMyMembers] fetchMyMembers: Starting fetch...'); setIsLoading(true); setFetchError(null);
        try {
            const data = await getMembers(); setMyMembersList(data ?? []);
        } catch (error: any) { setFetchError(error.message || 'Failed to load members'); }
        finally { setIsLoading(false); console.log('[AreaAdminMyMembers] fetchMyMembers: Finished.'); }
    };
    useEffect(() => { fetchMyMembers(); }, []);


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

    // Calculate total amount display
    const calculatedTotalAmount = useMemo(() => {
        if (!selectedMember) return 0;
        const numMonths = parseInt(numberOfMonths, 10);
        const monthsToCalc = isNaN(numMonths) || numMonths < 1 ? 1 : numMonths;
        return (selectedMember.monthlyAmount || 0) * monthsToCalc;
    }, [selectedMember, numberOfMonths]);

    // Handle Payment Form Submission
    const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedMember) return;
        setPaymentError(null); setPaymentSuccess(null); setIsSubmittingPayment(true);

        const numMonths = parseInt(numberOfMonths, 10);
        const initialMonth = parseInt(startMonth, 10);
        const initialYear = parseInt(startYear, 10);
        const amountPerMonth = selectedMember.monthlyAmount;

        // --- Validation ---
        let validationError = null;
        if (isNaN(numMonths) || numMonths < 1 || numMonths > 24) { validationError = "Invalid number of months (1-24)."; }
        else if (isNaN(initialMonth) || initialMonth < 1 || initialMonth > 12) { validationError = "Invalid starting month."; }
        else if (isNaN(initialYear) || initialYear < 2020 || initialYear > 2099) { validationError = "Invalid starting year."; }
        else if (!amountPerMonth || amountPerMonth <= 0) { validationError = "Member's monthly amount invalid."; }
        else if (!paymentDate) { validationError = "Invalid payment date."; }
        if(validationError) { setPaymentError(validationError); setIsSubmittingPayment(false); return; }
        // --- End Validation ---

        const paymentPromises: Promise<PaymentData>[] = [];
        console.log(`[PaymentSubmit] Recording ${numMonths} payments of ${amountPerMonth} each.`);
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
            const endMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const endYear = currentMonth === 1 ? currentYear - 1 : currentYear;
            setPaymentSuccess(`${numMonths} month(s) payment recorded successfully!`);
            // Don't necessarily need to fetch members again unless payment status is shown
            // fetchMyMembers();
            setTimeout(() => { handleClosePaymentModal(); }, 2500);
        } catch (error: any) { setPaymentError(error.message || `Failed to record one or more payments.`); }
        finally { setIsSubmittingPayment(false); }
    };


    // --- Filter members based on search query ---
    const filteredMembers = useMemo(() => {
        if (!searchQuery) return myMembersList; // No query? Return full list
        const lowerCaseQuery = searchQuery.toLowerCase();
        return myMembersList.filter(member =>
            member.name.toLowerCase().includes(lowerCaseQuery)
        );
    }, [myMembersList, searchQuery]);


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>My Assigned Members</h2>

            {/* Search Bar */}
            <div className={styles.searchContainer}>
                 <FaSearch className={styles.searchIcon} />
                 <input
                     type="search"
                     placeholder="Search members by name..."
                     value={searchQuery}
                     onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                     className={styles.searchInput}
                 />
             </div>

            {/* Display Members List */}
            <div className={styles.listSection}>
                {isLoading && <p className={styles.loadingText}>Loading members...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {!isLoading && !fetchError && filteredMembers.length === 0 && (
                    <p className={styles.noDataText}>
                        {searchQuery ? 'No members found matching your search.' : 'You currently have no members assigned to you.'}
                    </p>
                )}
                {!isLoading && !fetchError && filteredMembers.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Address</th><th>Monthly Amount</th><th>Created At</th><th>Record Payment</th></tr></thead>
                            <tbody>
                                {/* Map over FILTERED members */}
                                {filteredMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.id}</td><td>{member.name}</td><td>{member.phone}</td><td>{member.address}</td><td>{member.monthlyAmount}</td>
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