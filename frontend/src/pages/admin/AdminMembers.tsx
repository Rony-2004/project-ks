// frontend/src/pages/admin/AdminMembers.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import {
    getMembers, addMember, deleteMember, updateMember,
    MemberData, NewMemberData, UpdateMemberData
} from '../../services/memberService'; // Adjust path
import styles from './AdminMembers.module.css'; // Create this CSS module (can copy from AdminAreaAdmins.module.css initially)
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const AdminMembers: React.FC = () => {
  // State for list, loading, errors
  const [membersList, setMembersList] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for Add form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newAmount, setNewAmount] = useState(''); // Use string for input
  const [newAssignedId, setNewAssignedId] = useState(''); // Optional: For assigning on create
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<MemberData | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateMemberData>({
      name: '', phone: '', address: '', monthlyAmount: '', assignedAreaAdminId: null
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Fetch Members function
  const fetchMembers = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getMembers();
      setMembersList(data);
    } catch (error: any) {
      setFetchError(error.message || 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchMembers();
  }, []);

  // Handle Add Member form submission
  const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); setFormSuccess(null); setIsSubmitting(true);

    const newMemberData: NewMemberData = {
      name: newName,
      phone: newPhone,
      address: newAddress,
      monthlyAmount: newAmount, // Service will convert to number
      assignedAreaAdminId: newAssignedId || null, // Use null if empty
    };

    try {
      await addMember(newMemberData);
      setFormSuccess('Member added successfully!');
      setNewName(''); setNewPhone(''); setNewAddress(''); setNewAmount(''); setNewAssignedId(''); // Clear form
      fetchMembers(); // Refresh list
    } catch (error: any) {
      setFormError(error.message || 'Failed to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Member
  const handleDelete = async (memberId: string) => {
    if (!window.confirm(`Are you sure you want to delete Member ${memberId}?`)) return;
    try {
      await deleteMember(memberId);
      fetchMembers(); // Refresh list
      alert('Member deleted successfully.');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Failed to delete Member: ${error.message}`);
      setFetchError(error.message);
    }
  };

  // --- Edit Modal Handlers ---
  const handleEditClick = (member: MemberData) => {
    setEditingMember(member);
    setEditFormData({ // Pre-fill edit form
      name: member.name,
      phone: member.phone,
      address: member.address,
      monthlyAmount: member.monthlyAmount.toString(), // Convert number to string for input
      assignedAreaAdminId: member.assignedAreaAdminId // Keep as string or null
    });
    setEditError(null); setEditSuccess(null); setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => { setIsEditModalOpen(false); setEditingMember(null); };

  const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingMember) return;
    setEditError(null); setEditSuccess(null); setIsUpdating(true);

    // Prepare update data (ensure amount is number if changed)
    const updateData: UpdateMemberData = { ...editFormData };
    if (updateData.monthlyAmount !== undefined) {
         updateData.monthlyAmount = updateData.monthlyAmount === '' ? 0 : Number(updateData.monthlyAmount);
         if (isNaN(updateData.monthlyAmount)) {
             setEditError("Monthly amount must be a valid number.");
             setIsUpdating(false);
             return;
         }
    }
    // Handle assignedAreaAdminId (allow empty string to become null)
    if (updateData.assignedAreaAdminId === '') {
        updateData.assignedAreaAdminId = null;
    }


    try {
      await updateMember(editingMember.id, updateData);
      setEditSuccess('Member updated successfully!');
      fetchMembers(); // Refresh list
      handleEditModalClose(); // Close modal
    } catch (error: any) {
      setEditError(error.message || 'Failed to update member.');
    } finally {
      setIsUpdating(false);
    }
  };
  // --- End Edit Handlers ---


  return (
    <div className={styles.container}>
      <h2>Manage Members</h2>

      {/* Add New Member Form */}
      <div className={styles.addForm}>
        <h3>Add New Member</h3>
        <form onSubmit={handleAddSubmit}>
          <div className={styles.formGrid}>
            {/* Form Groups for Name, Phone, Address, Amount */}
            <div className={styles.formGroup}><label htmlFor="name">Name</label><input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
            <div className={styles.formGroup}><label htmlFor="phone">Phone</label><input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required /></div>
            <div className={styles.formGroup}><label htmlFor="address">Address</label><input type="text" id="address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required /></div>
            <div className={styles.formGroup}><label htmlFor="amount">Monthly Amount</label><input type="number" step="any" min="0" id="amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required /></div>
            {/* Optional: Assign Area Admin ID on creation - Simple text input for now */}
            {/* Replace with dropdown later */}
            <div className={styles.formGroup}><label htmlFor="assignId">Assign Area Admin ID (Optional)</label><input type="text" id="assignId" value={newAssignedId} onChange={(e) => setNewAssignedId(e.target.value)} /></div>
          </div>
          {formError && <p className={styles.errorMessage}>{formError}</p>}
          {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </div>

      {/* Display Members List */}
      <div className={styles.listSection}>
        <h3>Current Members</h3>
        {isLoading && <p className={styles.loadingText}>Loading members...</p>}
        {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
        {!isLoading && !fetchError && membersList.length === 0 && <p className={styles.noDataText}>No Members found.</p>}
        {!isLoading && !fetchError && membersList.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Amount</th>
                  <th>Assigned Area Admin ID</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {membersList.map((member) => (
                  <tr key={member.id}>
                    <td>{member.id}</td>
                    <td>{member.name}</td>
                    <td>{member.phone}</td>
                    <td>{member.address}</td>
                    <td>{member.monthlyAmount}</td>
                    <td>{member.assignedAreaAdminId ?? 'N/A'}</td> {/* Display N/A if null */}
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleEditClick(member)} className={`${styles.actionButton} ${styles.editButton}`} title="Edit Member"><FaEdit /></button>
                      <button onClick={() => handleDelete(member.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Delete Member"><FaTrashAlt /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Member Modal */}
      {isEditModalOpen && editingMember && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3>Edit Member (ID: {editingMember.id})</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className={styles.formGrid}>
                {/* Form Groups for Name, Phone, Address, Amount, Assigned ID */}
                 <div className={styles.formGroup}><label htmlFor="editName">Name</label><input type="text" id="editName" name="name" value={editFormData.name} onChange={handleEditFormChange} required /></div>
                 <div className={styles.formGroup}><label htmlFor="editPhone">Phone</label><input type="tel" id="editPhone" name="phone" value={editFormData.phone} onChange={handleEditFormChange} required /></div>
                 <div className={styles.formGroup}><label htmlFor="editAddress">Address</label><input type="text" id="editAddress" name="address" value={editFormData.address} onChange={handleEditFormChange} required /></div>
                 <div className={styles.formGroup}><label htmlFor="editAmount">Monthly Amount</label><input type="number" step="any" min="0" id="editAmount" name="monthlyAmount" value={editFormData.monthlyAmount} onChange={handleEditFormChange} required /></div>
                 {/* Optional: Edit Assigned Area Admin ID - Simple text input for now */}
                 {/* Replace with dropdown later */}
                 <div className={styles.formGroup}><label htmlFor="editAssignId">Assign Area Admin ID (empty to unassign)</label><input type="text" id="editAssignId" name="assignedAreaAdminId" value={editFormData.assignedAreaAdminId ?? ''} onChange={handleEditFormChange} /></div>
              </div>
               {editError && <p className={styles.errorMessage}>{editError}</p>}
               {editSuccess && <p className={styles.successMessage}>{editSuccess}</p>}
               <div className={styles.modalActions}>
                  <button type="submit" className={styles.submitButton} disabled={isUpdating}> {isUpdating ? 'Saving...' : 'Save Changes'} </button>
                  <button type="button" className={styles.cancelButton} onClick={handleEditModalClose}> Cancel </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminMembers;