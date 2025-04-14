// frontend/src/pages/admin/AdminMembers.tsx (With Search Bar Added)
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import {
    getMembers, addMember, deleteMember, updateMember,
    MemberData, NewMemberData, UpdateMemberData
} from '../../services/memberService'; // Verify path
import styles from './AdminMembers.module.css'; // Verify path & existence
import { FaEdit, FaTrashAlt, FaSearch } from 'react-icons/fa'; // Added Search Icon

const AdminMembers: React.FC = () => {
    // --- State Variables ---
    const [membersList, setMembersList] = useState<MemberData[]>([]); // Full list from API
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>(''); // <-- ADDED: Search State
    // Add Form state
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newAssignedId, setNewAssignedId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingMember, setEditingMember] = useState<MemberData | null>(null);
    const [editFormData, setEditFormData] = useState<UpdateMemberData>({
        name: '', phone: '', address: '', monthlyAmount: '', assignedAreaAdminId: null
    });
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);


    // --- Functions (Keep fetchMembers, Add/Edit/Delete handlers as they were when working) ---
    const fetchMembers = async () => {
        setIsLoading(true); setFetchError(null);
        try {
            const data = await getMembers(); setMembersList(data ?? []); // Ensure array
        } catch (error: any) { setFetchError(error.message || 'Failed to load members'); }
        finally { setIsLoading(false); }
    };
    useEffect(() => { fetchMembers(); }, []);

    const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
         event.preventDefault(); setFormError(null); setFormSuccess(null); setIsSubmitting(true);
         const newMemberData: NewMemberData = { name: newName, phone: newPhone, address: newAddress, monthlyAmount: newAmount, assignedAreaAdminId: newAssignedId || null };
         try {
             await addMember(newMemberData); setFormSuccess('Member added successfully!');
             setNewName(''); setNewPhone(''); setNewAddress(''); setNewAmount(''); setNewAssignedId('');
             fetchMembers();
         } catch (error: any) { setFormError(error.message || 'Failed to add member.'); }
         finally { setIsSubmitting(false); } // Ensure finally resets state
    };

    const handleDelete = async (memberId: string, memberName: string) => { // Pass name for confirm dialog
        if (!window.confirm(`Delete Member '${memberName}' (ID: ${memberId})?`)) return;
        try {
            await deleteMember(memberId); alert('Member deleted successfully.'); fetchMembers();
        } catch (error: any) { console.error('Delete error:', error); alert(`Failed to delete Member: ${error.message}`); setFetchError(error.message); }
        finally { /* Add finally logic if needed, e.g., for row loading */ }
    };

    const handleEditClick = (member: MemberData) => {
         setEditingMember(member);
         setEditFormData({
             name: member.name, phone: member.phone, address: member.address,
             monthlyAmount: member.monthlyAmount.toString(), assignedAreaAdminId: member.assignedAreaAdminId ?? ''
         });
         setEditError(null); setEditSuccess(null); setIsEditModalOpen(true);
    };
    const handleEditModalClose = () => { setIsEditModalOpen(false); setEditingMember(null); };
    const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
         const { name, value } = event.target; setEditFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); if (!editingMember) return;
        setEditError(null); setEditSuccess(null); setIsUpdating(true);
        const updateData: UpdateMemberData = {
             name: editFormData.name, phone: editFormData.phone, address: editFormData.address,
             monthlyAmount: editFormData.monthlyAmount !== undefined ? (Number(editFormData.monthlyAmount) || 0) : undefined,
             assignedAreaAdminId: editFormData.assignedAreaAdminId === '' ? null : editFormData.assignedAreaAdminId
        };
        Object.keys(updateData).forEach(key => updateData[key as keyof UpdateMemberData] === undefined && delete updateData[key as keyof UpdateMemberData]);
        if (updateData.monthlyAmount !== undefined && isNaN(updateData.monthlyAmount)) { setEditError("Amount must be a number."); setIsUpdating(false); return; }
        try {
            await updateMember(editingMember.id, updateData);
            setEditSuccess('Member updated successfully!'); fetchMembers(); handleEditModalClose();
        } catch (error: any) { setEditError(error.message || 'Failed to update member.'); }
        finally { setIsUpdating(false); } // Ensure finally resets state
    };


    // --- **NEW**: Filter members based on search query ---
    const filteredMembers = useMemo(() => {
        let members = membersList; // Start with the full list state
        if (searchQuery && searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            members = members.filter(member =>
                member.name.toLowerCase().includes(lowerCaseQuery)
            );
        }
        return members;
    }, [membersList, searchQuery]);


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>Manage Members</h2>

            {/* Add New Member Form (Keep as is) */}
            <div className={styles.addForm}>
                 <h3>Add New Member</h3>
                 <form onSubmit={handleAddSubmit}>
                      <div className={styles.formGrid}>
                         <div className={styles.formGroup}><label htmlFor="name">Name</label><input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="phone">Phone</label><input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="address">Address</label><input type="text" id="address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="amount">Monthly Amount</label><input type="number" step="any" min="0" id="amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="assignId">Assign Area Admin ID (Optional)</label><input type="text" id="assignId" value={newAssignedId} onChange={(e) => setNewAssignedId(e.target.value)} placeholder="Enter ID or leave blank" /></div>
                      </div>
                      {formError && <p className={styles.errorMessage}>{formError}</p>}
                      {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}
                      <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                          {isSubmitting ? 'Adding...' : 'Add Member'}
                      </button>
                  </form>
            </div>

             {/* --- ADDED Search Bar --- */}
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
             {/* --- End Search Bar --- */}


            {/* Display Members List - Uses filteredMembers */}
            <div className={styles.listSection}>
                <h3>Current Members</h3>
                {isLoading && <p className={styles.loadingText}>Loading members...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {/* Update condition checks to use filteredMembers */}
                {!isLoading && !fetchError && filteredMembers.length === 0 && (
                    <p className={styles.noDataText}>
                        {searchQuery ? 'No members found matching your search.' : 'No members found.'}
                    </p>
                )}
                {!isLoading && !fetchError && filteredMembers.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Address</th><th>Amount</th><th>Assigned Area Admin</th><th>Created At</th><th>Actions</th></tr></thead>
                            <tbody>
                                {/* *** MAP OVER filteredMembers *** */}
                                {filteredMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.id}</td><td>{member.name}</td><td>{member.phone}</td><td>{member.address}</td><td>{member.monthlyAmount}</td>
                                        <td>{member.assignedAreaAdmin?.name ?? 'N/A'}</td> {/* Shows Name */}
                                        <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button onClick={() => handleEditClick(member)} className={`${styles.actionButton} ${styles.editButton}`} title="Edit Member"><FaEdit /></button>
                                            {/* Pass name to delete handler */}
                                            <button onClick={() => handleDelete(member.id, member.name)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Delete Member"><FaTrashAlt /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Member Modal (Keep as is - simple ID assignment) */}
             {isEditModalOpen && editingMember && (
                 <div className={styles.modalBackdrop}>
                      <div className={styles.modalContent}>
                           <h3>Edit Member (ID: {editingMember.id})</h3>
                           <form onSubmit={handleUpdateSubmit}>
                                <div className={styles.formGrid}>
                                     <div className={styles.formGroup}><label htmlFor="editName">Name</label><input type="text" id="editName" name="name" value={editFormData.name ?? ''} onChange={handleEditFormChange} required /></div>
                                     <div className={styles.formGroup}><label htmlFor="editPhone">Phone</label><input type="tel" id="editPhone" name="phone" value={editFormData.phone ?? ''} onChange={handleEditFormChange} required /></div>
                                     <div className={styles.formGroup}><label htmlFor="editAddress">Address</label><input type="text" id="editAddress" name="address" value={editFormData.address ?? ''} onChange={handleEditFormChange} required /></div>
                                     <div className={styles.formGroup}><label htmlFor="editAmount">Monthly Amount</label><input type="number" step="any" min="0" id="editAmount" name="monthlyAmount" value={editFormData.monthlyAmount ?? ''} onChange={handleEditFormChange} required /></div>
                                     <div className={styles.formGroup}><label htmlFor="editAssignId">Assign Area Admin ID (empty to unassign)</label><input type="text" id="editAssignId" name="assignedAreaAdminId" value={editFormData.assignedAreaAdminId ?? ''} onChange={handleEditFormChange} placeholder="Enter Area Admin ID" /></div>
                                 </div>
                                {editError && <p className={styles.errorMessage}>{editError}</p>}
                                {editSuccess && <p className={styles.successMessage}>{editSuccess}</p>}
                                <div className={styles.modalActions}>
                                     <button type="submit" className={styles.submitButton} disabled={isUpdating}> {isUpdating ? 'Saving...' : 'Save Changes'} </button>
                                     <button type="button" className={styles.cancelButton} onClick={handleEditModalClose} disabled={isUpdating}> Cancel </button>
                                 </div>
                           </form>
                      </div>
                   </div>
              )}
             {/* End Edit Modal */}

        </div> // End container div
    );
};
export default AdminMembers;