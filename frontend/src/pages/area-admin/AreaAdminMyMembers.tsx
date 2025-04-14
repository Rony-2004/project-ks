// frontend/src/pages/area-admin/AreaAdminMyMembers.tsx (UPDATED)
import React, { useState, useEffect, FormEvent } from 'react';
import { getMembers, MemberData } from '../../services/memberService';
import { recordPayment, RecordPaymentData } from '../../services/paymentService'; // <-- Import payment service
// Use existing styles or create new ones
import styles from '../admin/AdminMembers.module.css'; // Reusing AdminMembers styles for now
import { FaMoneyCheckAlt } from 'react-icons/fa'; // Icon for payment button

const AreaAdminMyMembers: React.FC = () => {
    // Existing state for member list
    const [myMembersList, setMyMembersList] = useState<MemberData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // --- **NEW** State for Payment Modal ---
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
    const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
    // Form state within the modal
    const [amountPaid, setAmountPaid] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
    const [paymentDate, setPaymentDate] = useState<string>(''); // YYYY-MM-DD
    const [paymentMonth, setPaymentMonth] = useState<string>('');
    const [paymentYear, setPaymentYear] = useState<string>('');
    // Modal submission state
    const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
    // --- End Payment Modal State ---


    // Fetch members function (no change needed)
    const fetchMyMembers = async () => { /* ... Keep as is ... */ };
    useEffect(() => { fetchMyMembers(); }, []);


    // --- **NEW** Handlers for Payment Modal ---
    const handleOpenPaymentModal = (member: MemberData) => {
        const currentDate = new Date();
        setSelectedMember(member); // Set the member we're paying for
        // Pre-fill form defaults
        setAmountPaid(member.monthlyAmount.toString()); // Default to member's amount
        setPaymentMethod('Cash'); // Default method
        setPaymentDate(currentDate.toISOString().split('T')[0]); // Default to today YYYY-MM-DD
        setPaymentMonth((currentDate.getMonth() + 1).toString()); // Default to current month (1-12)
        setPaymentYear(currentDate.getFullYear().toString()); // Default to current year
        // Clear previous messages/errors
        setPaymentError(null);
        setPaymentSuccess(null);
        setIsSubmittingPayment(false);
        setIsPaymentModalOpen(true); // Open the modal
    };

    const handleClosePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setSelectedMember(null); // Clear selected member
    };

    const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedMember) return; // Safety check

        setPaymentError(null);
        setPaymentSuccess(null);
        setIsSubmittingPayment(true);

        const paymentData: RecordPaymentData = {
            memberId: selectedMember.id,
            amountPaid: amountPaid,
            paymentMethod: paymentMethod,
            paymentMonth: paymentMonth,
            paymentYear: paymentYear,
            paymentDate: paymentDate // Send date string
        };

        try {
            await recordPayment(paymentData);
            setPaymentSuccess(`Payment of ${amountPaid} for ${paymentMonth}/${paymentYear} recorded successfully!`);
            // Optionally close modal after success, maybe after a delay
            setTimeout(() => {
                handleClosePaymentModal();
            }, 2000); // Close after 2 seconds
            // Note: We are not refreshing the member list here, as payment isn't directly shown there yet.
        } catch (error: any) {
            setPaymentError(error.message || 'Failed to record payment.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };
    // --- End Payment Modal Handlers ---


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>My Assigned Members</h2>

            {/* Display Members List */}
            <div className={styles.listSection}>
                {isLoading && <p className={styles.loadingText}>Loading members...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {!isLoading && !fetchError && myMembersList.length === 0 && (
                    <p className={styles.noDataText}>You currently have no members assigned to you.</p>
                )}
                {!isLoading && !fetchError && myMembersList.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th><th>Name</th><th>Phone</th><th>Address</th><th>Monthly Amount</th><th>Created At</th>
                                    <th>Record Payment</th> {/* Changed Actions Header */}
                                </tr>
                            </thead>
                            <tbody>
                                {myMembersList.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.id}</td><td>{member.name}</td><td>{member.phone}</td><td>{member.address}</td><td>{member.monthlyAmount}</td>
                                        <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {/* --- **NEW** Record Payment Button --- */}
                                            <button
                                                onClick={() => handleOpenPaymentModal(member)}
                                                className={`${styles.actionButton} ${styles.editButton}`} // Re-use edit style or make new one
                                                title="Record Payment"
                                            >
                                                <FaMoneyCheckAlt /> {/* Payment Icon */}
                                            </button>
                                            {/* --- End Record Payment Button --- */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

             {/* --- **NEW** Payment Recording Modal --- */}
             {isPaymentModalOpen && selectedMember && (
                <div className={styles.modalBackdrop}> {/* Reuse modal styles */}
                    <div className={styles.modalContent}>
                        <h3>Record Payment for {selectedMember.name} (ID: {selectedMember.id})</h3>
                        <p>Default Amount: {selectedMember.monthlyAmount}</p>
                        <form onSubmit={handlePaymentSubmit} className={styles.paymentForm}> {/* Add specific style if needed */}
                            <div className={styles.formGrid}> {/* Reuse grid */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="payAmount">Amount Paid</label>
                                    <input type="number" step="any" min="0" id="payAmount" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="payMethod">Payment Method</label>
                                    <select id="payMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Online')} required >
                                        <option value="Cash">Cash</option>
                                        <option value="Online">Online</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="payMonth">Payment For Month</label>
                                    <select id="payMonth" value={paymentMonth} onChange={(e) => setPaymentMonth(e.target.value)} required >
                                        <option value="">--Select Month--</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })} ({m})</option>
                                        ))}
                                    </select>
                                </div>
                                 <div className={styles.formGroup}>
                                    <label htmlFor="payYear">Payment For Year</label>
                                    <input type="number" id="payYear" min="2020" max="2099" value={paymentYear} onChange={(e) => setPaymentYear(e.target.value)} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="payDate">Payment Date</label>
                                    <input type="date" id="payDate" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
                                </div>
                            </div>

                            {paymentError && <p className={styles.errorMessage}>{paymentError}</p>}
                            {paymentSuccess && <p className={styles.successMessage}>{paymentSuccess}</p>}

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.submitButton} disabled={isSubmittingPayment}>
                                    {isSubmittingPayment ? 'Saving...' : 'Confirm Payment'}
                                </button>
                                <button type="button" className={styles.cancelButton} onClick={handleClosePaymentModal} disabled={isSubmittingPayment}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
             )}
             {/* --- End Payment Modal --- */}

        </div> // End container div
    );
};

export default AreaAdminMyMembers;