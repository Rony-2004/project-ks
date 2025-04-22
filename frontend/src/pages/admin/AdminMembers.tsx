// frontend/src/pages/admin/AdminMembers.tsx
// ** Added Payment Status Filter and Button Styling (Paid/Due) **

import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import {
    // ** IMPORTANT: Ensure MemberData includes isCurrentMonthPaid?: boolean; **
    getMembers, addMember, deleteMember, updateMember,
    MemberData // <-- Make sure MemberData includes isCurrentMonthPaid
} from '../../services/memberService';
// Import Area service and interface
import { getAllAreas, Area } from '../../services/areaService';
// Import Payment services and types
import {
    recordPaymentByAdmin, // For the modal
    RecordPaymentData,
    PaymentData
} from '../../services/paymentService';
import styles from './AdminMembers.module.css'; // Import the CSS Module
import { FaEdit, FaTrashAlt, FaSearch, FaMoneyCheckAlt } from 'react-icons/fa';

// Interface definitions
interface Area { id: string; name: string; }

// Ensure MemberData interface includes needed fields from backend
// interface MemberData {
//   id: string; name: string; phone: string; monthlyAmount: number; createdAt: string;
//   areaId?: string; area?: Area | null;
//   assignedAreaAdminId?: string | null; assignedAreaAdmin?: { name: string; } | null;
//   isCurrentMonthPaid?: boolean; // <-- Need this from backend
// }


const AdminMembers: React.FC = () => {
    // --- State Variables ---
    const [membersList, setMembersList] = useState<MemberData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [areasList, setAreasList] = useState<Area[]>([]);
    const [areasLoading, setAreasLoading] = useState<boolean>(true);
    const [areasError, setAreasError] = useState<string | null>(null);
    const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('');
    // *** ADDED State for Payment Status Filter ***
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'due'>('all');


    // Add Form state (Keep existing)
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newAssignedId, setNewAssignedId] = useState('');
    const [newAreaId, setNewAreaId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Edit Modal State (Keep existing)
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingMember, setEditingMember] = useState<MemberData | null>(null);
    const [editFormData, setEditFormData] = useState<UpdateMemberData>({ name: '', phone: '', monthlyAmount: '', areaId: '', assignedAreaAdminId: null });
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // Admin Payment Modal State (Keep existing)
    const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
    const [payingMember, setPayingMember] = useState<MemberData | null>(null);
    const [payAmount, setPayAmount] = useState<string>('');
    const [payMethod, setPayMethod] = useState<'Cash' | 'Online'>('Cash');
    const [payMonth, setPayMonth] = useState<string>('');
    const [payYear, setPayYear] = useState<string>('');
    const [payDate, setPayDate] = useState<string>('');
    const [isSubmittingPay, setIsSubmittingPay] = useState<boolean>(false);
    const [payError, setPayError] = useState<string | null>(null);
    const [paySuccess, setPaySuccess] = useState<string | null>(null);


    // --- Fetching Data ---
    const fetchMembers = async () => {
        setIsLoading(true); setFetchError(null);
        try {
            // ** Assumes getMembers fetches members including isCurrentMonthPaid **
            const data = await getMembers();
            setMembersList(data ?? []);
        } catch (error: any) { setFetchError(error.message || 'Failed.'); }
        finally { setIsLoading(false); }
    };
    const fetchAreas = async () => { /* Keep existing */ setAreasLoading(true); setAreasError(null); try { const data = await getAllAreas(); setAreasList(data ?? []); } catch (error: any) { setAreasError(error.message || 'Failed.'); } finally { setAreasLoading(false); } };
    useEffect(() => { fetchMembers(); fetchAreas(); }, []);

    // --- Handlers (Keep Existing Add/Edit/Delete/Payment Modal) ---
    const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => { /* Keep existing */ event.preventDefault(); if (!newAreaId) { setFormError('Select Area.'); return; } setFormError(null); setFormSuccess(null); setIsSubmitting(true); const newMemberData: NewMemberData = { name: newName, phone: newPhone, monthlyAmount: newAmount, areaId: newAreaId, assignedAreaAdminId: newAssignedId || null }; try { await addMember(newMemberData); setFormSuccess('Added!'); setNewName(''); setNewPhone(''); setNewAmount(''); setNewAssignedId(''); setNewAreaId(''); fetchMembers(); } catch (error: any) { setFormError(error.message || 'Failed.'); } finally { setIsSubmitting(false); } };
    const handleDelete = async (memberId: string, memberName: string) => { /* Keep existing */ if (!window.confirm(`Delete ${memberName}?`)) return; try { await deleteMember(memberId); alert('Deleted.'); fetchMembers(); } catch (error: any) { alert(`Failed: ${error.message}`); setFetchError(error.message); } };
    const handleEditClick = (member: MemberData) => { /* Keep existing */ setEditingMember(member); setEditFormData({ name: member.name, phone: member.phone, monthlyAmount: member.monthlyAmount.toString(), areaId: member.areaId, assignedAreaAdminId: member.assignedAreaAdminId ?? '' }); setEditError(null); setEditSuccess(null); setIsEditModalOpen(true); };
    const handleEditModalClose = () => { /* Keep existing */ setIsEditModalOpen(false); setEditingMember(null); };
    const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { /* Keep existing */ const { name, value } = event.target; setEditFormData(prev => ({ ...prev, [name]: value })); };
    const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => { /* Keep existing */ event.preventDefault(); if (!editingMember || !editFormData.areaId) { setEditError('Area required.'); return; } setEditError(null); setEditSuccess(null); setIsUpdating(true); const updateData: UpdateMemberData = { name: editFormData.name, phone: editFormData.phone, monthlyAmount: editFormData.monthlyAmount !== undefined ? (Number(editFormData.monthlyAmount) || 0) : undefined, areaId: editFormData.areaId, assignedAreaAdminId: editFormData.assignedAreaAdminId === '' ? null : editFormData.assignedAreaAdminId }; if (updateData.monthlyAmount !== undefined && isNaN(updateData.monthlyAmount)) { setEditError("Amount number."); setIsUpdating(false); return; } Object.keys(updateData).forEach(key => updateData[key as keyof UpdateMemberData] === undefined && delete updateData[key as keyof UpdateMemberData]); try { await updateMember(editingMember.id, updateData); setEditSuccess('Updated!'); fetchMembers(); handleEditModalClose(); } catch (error: any) { setEditError(error.message || 'Failed.'); } finally { setIsUpdating(false); } };
    const handleOpenPayModal = (member: MemberData) => { /* Keep existing */ if (!member) return; const currentDate = new Date(); setPayingMember(member); setPayAmount(member.monthlyAmount?.toString() || ''); setPayMethod('Cash'); setPayDate(currentDate.toISOString().split('T')[0]); setPayMonth((currentDate.getMonth() + 1).toString()); setPayYear(currentDate.getFullYear().toString()); setPayError(null); setPaySuccess(null); setIsSubmittingPay(false); setIsPayModalOpen(true); };
    const handleClosePayModal = () => { /* Keep existing */ setIsPayModalOpen(false); setPayingMember(null); };
    const handlePaySubmit = async (event: FormEvent<HTMLFormElement>) => { /* Keep existing */ event.preventDefault(); if (!payingMember) return; setPayError(null); setPaySuccess(null); setIsSubmittingPay(true); const amount = Number(payAmount); const month = parseInt(payMonth, 10); const year = parseInt(payYear, 10); let validationError = null; if (isNaN(amount) || amount <= 0) { validationError = "Invalid Amount."; } else if (isNaN(month) || month < 1 || month > 12) { validationError = "Invalid Month."; } else if (isNaN(year) || year < 2020 || year > 2099) { validationError = "Invalid Year."; } else if (!payDate) { validationError = "Invalid Date."; } if (validationError) { setPayError(validationError); setIsSubmittingPay(false); return; } const paymentData: RecordPaymentData = { memberId: payingMember.id, amountPaid: amount, paymentMethod: payMethod, paymentMonth: month, paymentYear: year, paymentDate: payDate }; try { await recordPaymentByAdmin(paymentData); setPaySuccess(`Payment recorded!`); fetchMembers(); setTimeout(() => { handleClosePayModal(); }, 2500); } catch (error: any) { setPayError(error.message || `Failed.`); } finally { setIsSubmittingPay(false); } };


    // --- *** UPDATED Filter members (Includes Payment Status) *** ---
    const filteredMembers = useMemo(() => {
        let members = membersList;

        // 1. Filter by Payment Status FIRST
        if (paymentStatusFilter === 'paid') {
            members = members.filter(member => member.isCurrentMonthPaid === true);
        } else if (paymentStatusFilter === 'due') {
            // Include members where status is false OR undefined/null
            members = members.filter(member => !member.isCurrentMonthPaid);
        }
        // 'all' status requires no filtering here

        // 2. Filter by Search Query
        if (searchQuery && searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            members = members.filter(member =>
                member.name.toLowerCase().includes(lowerCaseQuery) ||
                member.phone.includes(searchQuery) ||
                (member.area?.name ?? '').toLowerCase().includes(lowerCaseQuery)
            );
        }

        // 3. Filter by Selected Area
        if (selectedAreaFilter !== '') {
            members = members.filter(member => member.areaId === selectedAreaFilter);
        }

        return members;
    // Add paymentStatusFilter to dependency array
    }, [membersList, searchQuery, selectedAreaFilter, paymentStatusFilter]);


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>Manage Members</h2>

            {/* Add New Member Form (Keep existing) */}
            <div className={styles.addForm}>
                {/* ... existing add form JSX ... */}
                 <h3>Add New Member</h3>
                 {areasLoading && <p>Loading areas...</p>}
                 {areasError && <p className={styles.errorMessage}>Error: {areasError}</p>}
                 <form onSubmit={handleAddSubmit}>
                     <div className={styles.formGrid}>
                         <div className={styles.formGroup}><label htmlFor="name">Name</label><input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="phone">Phone</label><input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="areaId">Area</label><select id="areaId" name="areaId" value={newAreaId} onChange={(e) => setNewAreaId(e.target.value)} required disabled={areasLoading || !!areasError} ><option value="" disabled>-- Select --</option>{areasList.map(area => ( <option key={area.id} value={area.id}> {area.name} </option> ))}</select></div>
                         <div className={styles.formGroup}><label htmlFor="amount">Monthly Amount</label><input type="number" step="any" min="0" id="amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="assignId">Assign Area Admin ID (Optional)</label><input type="text" id="assignId" value={newAssignedId} onChange={(e) => setNewAssignedId(e.target.value)} placeholder="Enter ID" /></div>
                     </div>
                     {formError && <p className={styles.errorMessage}>{formError}</p>}
                     {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}
                     <button type="submit" className={styles.submitButton} disabled={isSubmitting || areasLoading || !!areasError}> {isSubmitting ? 'Adding...' : 'Add Member'} </button>
                 </form>
            </div>

            {/* Controls Container Wrapper - MODIFIED to include Payment Status filter */}
            <div className={styles.controlsWrapper}> {/* Use this if needed for column layout */}
                 <div className={styles.controlsContainer}> {/* Top row */}
                     <div className={styles.searchContainer}> <label htmlFor="memberSearch" className={styles.filterLabel}>Search:</label> <div style={{ position: 'relative', width: '100%' }}> <FaSearch className={styles.searchIcon} /> <input id="memberSearch" type="search" placeholder="Name, Phone, Area..." value={searchQuery} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className={styles.searchInput}/> </div> </div>
                     <div className={styles.filterContainer}> <label htmlFor="areaFilter" className={styles.filterLabel}>Area:</label> <select id="areaFilter" name="areaFilter" value={selectedAreaFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAreaFilter(e.target.value)} className={styles.filterSelect} disabled={areasLoading||!!areasError||areasList.length===0} title="Filter by area"> <option value="">-- All Areas --</option> {areasList.map(area => ( <option key={area.id} value={area.id}> {area.name} </option> ))} </select> {areasLoading&&<span className={styles.loadingTextSmall}>...</span>} {areasError&&<span className={styles.errorMessageSmall}> Err</span>} </div>
                 </div>
                 {/* Added Payment Status Filter to a new row or alongside */}
                 <div className={styles.controlsContainer} style={{ marginTop: '0.5rem' }}>
                     <div className={styles.filterContainer}>
                         <label htmlFor="paymentStatusFilter" className={styles.filterLabel}>Pay Status (Current Month):</label>
                         <select
                             id="paymentStatusFilter"
                             name="paymentStatusFilter"
                             value={paymentStatusFilter}
                             onChange={(e: ChangeEvent<HTMLSelectElement>) => setPaymentStatusFilter(e.target.value as 'all' | 'paid' | 'due')}
                             className={styles.filterSelect}
                             disabled={isLoading} // Disable while loading members
                             title="Filter members by current month payment status"
                         >
                             <option value="all">Show All</option>
                             <option value="paid">Paid</option>
                             <option value="due">Due</option>
                         </select>
                     </div>
                     {/* Add spacer if needed */}
                     {/* <div style={{ flex: 1 }}></div> */}
                 </div>
            </div>


            {/* Display Members List */}
            <div className={styles.listSection}>
                <h3> Current Members {/* Status indicators */}
                    {selectedAreaFilter && areasList.find(a=>a.id === selectedAreaFilter) ? ` (Area: ${areasList.find(a=>a.id===selectedAreaFilter)?.name})` : ''}
                    {paymentStatusFilter !== 'all' ? ` (Status: ${paymentStatusFilter === 'paid' ? 'Paid' : 'Due'})`: ''}
                </h3>
                 {isLoading && <p className={styles.loadingText}>Loading members...</p>}
                 {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                 {!isLoading && !fetchError && filteredMembers.length === 0 && ( <p className={styles.noDataText}> {searchQuery || selectedAreaFilter || paymentStatusFilter!=='all' ? 'No members matching filters.' : 'No members found.'} </p> )}
                 {!isLoading && !fetchError && filteredMembers.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead> <tr><th>ID</th><th>Name</th><th>Phone</th><th>Area</th><th>Amount</th><th>Assigned Admin</th><th>Created At</th><th>Actions</th></tr> </thead>
                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.id}</td><td>{member.name}</td><td>{member.phone}</td>
                                        <td>{member.area?.name ?? 'N/A'}</td>
                                        <td className={styles.amountCell}>{member.monthlyAmount}</td>
                                        <td>{member.assignedAreaAdmin?.name ?? 'N/A'}</td>
                                        <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                                        {/* === MODIFIED Actions Cell === */}
                                        <td className={styles.actionCell}>
                                            <button onClick={() => handleEditClick(member)} className={`${styles.actionButton} ${styles.editButton}`} title="Edit Member"><FaEdit /></button>
                                            <button onClick={() => handleDelete(member.id, member.name)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Delete Member"><FaTrashAlt /></button>
                                            {/* Record Payment Button with Conditional Styling */}
                                            <button
                                                 onClick={() => handleOpenPayModal(member)}
                                                 className={`
                                                     ${styles.actionButton} ${styles.recordButton}
                                                     ${/* Apply paid or due style based on flag */''}
                                                     ${member.isCurrentMonthPaid ? styles.paidButton : styles.dueButton}
                                                 `}
                                                 title={member.isCurrentMonthPaid ? `Paid (${new Date().toLocaleString('default', { month: 'long' })})` : `Record Payment for ${member.name}`}
                                             >
                                                 <FaMoneyCheckAlt />
                                             </button>
                                        </td>
                                         {/* === END MODIFIED Actions Cell === */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Member Modal (Keep existing) */}
            {isEditModalOpen && editingMember && ( <div className={styles.modalBackdrop}> <div className={styles.modalContent}> <h3>Edit Member (ID: {editingMember.id})</h3> {areasLoading && <p>Loading areas...</p>} {areasError && <p className={styles.errorMessage}>Error: {areasError}</p>} <form onSubmit={handleUpdateSubmit}> <div className={styles.formGrid}> <div className={styles.formGroup}><label htmlFor="editName">Name</label><input type="text" id="editName" name="name" value={editFormData.name ?? ''} onChange={handleEditFormChange} required /></div> <div className={styles.formGroup}><label htmlFor="editPhone">Phone</label><input type="tel" id="editPhone" name="phone" value={editFormData.phone ?? ''} onChange={handleEditFormChange} required /></div> <div className={styles.formGroup}><label htmlFor="editAreaId">Area</label><select id="editAreaId" name="areaId" value={editFormData.areaId ?? ''} onChange={handleEditFormChange} required disabled={areasLoading || !!areasError} ><option value="" disabled>-- Select --</option>{areasList.map(area => ( <option key={area.id} value={area.id}> {area.name} </option> ))}</select></div> <div className={styles.formGroup}><label htmlFor="editAmount">Monthly Amount</label><input type="number" step="any" min="0" id="editAmount" name="monthlyAmount" value={editFormData.monthlyAmount ?? ''} onChange={handleEditFormChange} required /></div> <div className={styles.formGroup}><label htmlFor="editAssignId">Assign Area Admin ID (empty to unassign)</label><input type="text" id="editAssignId" name="assignedAreaAdminId" value={editFormData.assignedAreaAdminId ?? ''} onChange={handleEditFormChange} placeholder="Enter ID" /></div> </div> {editError && <p className={styles.errorMessage}>{editError}</p>} {editSuccess && <p className={styles.successMessage}>{editSuccess}</p>} <div className={styles.modalActions}> <button type="submit" className={styles.submitButton} disabled={isUpdating || areasLoading || !!areasError}> {isUpdating ? 'Saving...' : 'Save Changes'} </button> <button type="button" className={styles.cancelButton} onClick={handleEditModalClose} disabled={isUpdating}> Cancel </button> </div> </form> </div> </div> )}

            {/* Admin Payment Recording Modal (Keep existing) */}
            {isPayModalOpen && payingMember && ( <div className={styles.modalBackdrop}> <div className={styles.modalContent}> <h3>Record Payment for {payingMember.name}</h3> <p>Default Monthly Amount: <strong>{payingMember.monthlyAmount != null ? payingMember.monthlyAmount : 'Not Set'}</strong></p> <form onSubmit={handlePaySubmit} className={styles.paymentForm}> <div className={styles.formGrid}> <div className={styles.formGroup}><label htmlFor="payAmount">Amount Paid *</label><input type="number" step="any" min="0.01" id="payAmount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required /></div> <div className={styles.formGroup}><label htmlFor="payMethodModal">Payment Method *</label><select id="payMethodModal" name="paymentMethod" value={payMethod} onChange={(e) => setPayMethod(e.target.value as 'Cash' | 'Online')} required ><option value="Cash">Cash</option><option value="Online">Online</option></select></div> <div className={styles.formGroup}><label htmlFor="payMonthModal">Payment For Month *</label><select id="payMonthModal" name="startMonth" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} required ><option value="" disabled>-- Select Month --</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })} ({m})</option>))}</select></div> <div className={styles.formGroup}><label htmlFor="payYearModal">Payment For Year *</label><input type="number" id="payYearModal" name="startYear" min="2020" max="2099" value={payYear} onChange={(e) => setPayYear(e.target.value)} required /></div> <div className={styles.formGroup}><label htmlFor="payDateModal">Payment Date Received *</label><input type="date" id="payDateModal" name="paymentDate" value={payDate} onChange={(e) => setPayDate(e.target.value)} required /></div> </div> {payError && <p className={styles.errorMessage}>{payError}</p>} {paySuccess && <p className={styles.successMessage}>{paySuccess}</p>} <div className={styles.modalActions}> <button type="submit" className={styles.submitButton} disabled={isSubmittingPay}>{isSubmittingPay ? 'Saving...' : 'Record Payment'}</button> <button type="button" className={styles.cancelButton} onClick={handleClosePayModal} disabled={isSubmittingPay}>Cancel</button> </div> </form> </div> </div> )}

        </div> // End container div
    );
};

export default AdminMembers; // Ensure component name matches file namea