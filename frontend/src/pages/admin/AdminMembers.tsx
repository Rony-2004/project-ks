// frontend/src/pages/admin/AdminMembers.tsx (UPDATED for Area Relation)
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import {
    getMembers, addMember, deleteMember, updateMember,
    MemberData, NewMemberData, UpdateMemberData // Interfaces now include areaId
} from '../../services/memberService';
// --- ** NEW **: Import Area service and interface ---
import { getAllAreas, Area } from '../../services/areaService'; // Create this service file next
import styles from './AdminMembers.module.css';
import { FaEdit, FaTrashAlt, FaSearch } from 'react-icons/fa';

const AdminMembers: React.FC = () => {
    // --- State Variables ---
    const [membersList, setMembersList] = useState<MemberData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    // --- ** NEW **: State for Areas list ---
    const [areasList, setAreasList] = useState<Area[]>([]);
    const [areasLoading, setAreasLoading] = useState<boolean>(true);
    const [areasError, setAreasError] = useState<string | null>(null);

    // Add Form state
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    // const [newAddress, setNewAddress] = useState(''); // REMOVED
    const [newAmount, setNewAmount] = useState('');
    const [newAssignedId, setNewAssignedId] = useState(''); // Area Admin ID
    const [newAreaId, setNewAreaId] = useState(''); // <-- ADDED: State for selected Area ID
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingMember, setEditingMember] = useState<MemberData | null>(null);
    const [editFormData, setEditFormData] = useState<UpdateMemberData>({ // Interfaces updated in service file
        name: '', phone: '', monthlyAmount: '',
        areaId: '', // <-- CHANGED: Use areaId
        assignedAreaAdminId: null
    });
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // --- Fetching Data ---
    const fetchMembers = async () => {
        setIsLoading(true); setFetchError(null);
        try {
            const data = await getMembers();
            setMembersList(data ?? []);
        } catch (error: any) { setFetchError(error.message || 'Failed to load members'); }
        finally { setIsLoading(false); }
    };

    // --- ** NEW **: Fetch Areas ---
    const fetchAreas = async () => {
        setAreasLoading(true); setAreasError(null);
        try {
            const data = await getAllAreas(); // Use the new service function
            setAreasList(data ?? []);
        } catch (error: any) {
            console.error("Failed to fetch areas:", error);
            setAreasError(error.message || 'Failed to load areas. Members cannot be added/edited.');
        } finally {
            setAreasLoading(false);
        }
    };

    // Fetch both members and areas on component mount
    useEffect(() => {
        fetchMembers();
        fetchAreas();
    }, []);

    // --- Handlers ---
    const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // ** Validate Area ID selection **
        if (!newAreaId) {
            setFormError('Please select an Area.');
            return;
        }
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);

        // ** CHANGED: Use newAreaId, remove newAddress **
        const newMemberData: NewMemberData = {
            name: newName,
            phone: newPhone,
            monthlyAmount: newAmount,
            areaId: newAreaId, // Send the selected Area ID
            assignedAreaAdminId: newAssignedId || null
        };

        try {
            await addMember(newMemberData);
            setFormSuccess('Member added successfully!');
            // Reset form fields including newAreaId
            setNewName(''); setNewPhone(''); setNewAmount(''); setNewAssignedId(''); setNewAreaId('');
            fetchMembers(); // Refresh list
        } catch (error: any) { setFormError(error.message || 'Failed to add member.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (memberId: string, memberName: string) => {
        if (!window.confirm(`Delete Member '${memberName}' (ID: ${memberId})?`)) return;
        try {
            await deleteMember(memberId);
            alert('Member deleted successfully.');
            fetchMembers(); // Refresh list
        } catch (error: any) {
            console.error('Delete error:', error);
            alert(`Failed to delete Member: ${error.message}`);
            setFetchError(error.message);
        }
    };

    const handleEditClick = (member: MemberData) => {
        setEditingMember(member);
        setEditFormData({ // Prefill edit form
            name: member.name,
            phone: member.phone,
            monthlyAmount: member.monthlyAmount.toString(),
            areaId: member.areaId, // <-- Set areaId from member data
            assignedAreaAdminId: member.assignedAreaAdminId ?? ''
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
        if (!editingMember || !editFormData.areaId) { // Also check if areaId is selected in edit form
             setEditError('Please select an Area.');
             return;
        }
        setEditError(null); setEditSuccess(null); setIsUpdating(true);

        // Prepare data using areaId
        const updateData: UpdateMemberData = {
            name: editFormData.name,
            phone: editFormData.phone,
            monthlyAmount: editFormData.monthlyAmount !== undefined ? (Number(editFormData.monthlyAmount) || 0) : undefined,
            areaId: editFormData.areaId, // <-- Send areaId
            assignedAreaAdminId: editFormData.assignedAreaAdminId === '' ? null : editFormData.assignedAreaAdminId
        };
        // Clean undefined/NaN before sending (optional, Axios might handle undefined)
        if (updateData.monthlyAmount !== undefined && isNaN(updateData.monthlyAmount)) { setEditError("Amount must be a number."); setIsUpdating(false); return; }
        Object.keys(updateData).forEach(key => updateData[key as keyof UpdateMemberData] === undefined && delete updateData[key as keyof UpdateMemberData]);


        try {
            await updateMember(editingMember.id, updateData);
            setEditSuccess('Member updated successfully!');
            fetchMembers(); // Refresh list
            handleEditModalClose(); // Close modal on success
        } catch (error: any) { setEditError(error.message || 'Failed to update member.'); }
        finally { setIsUpdating(false); }
    };

    // Filter members based on search query (Keep as is)
    const filteredMembers = useMemo(() => {
        // ... filtering logic remains the same ...
         let members = membersList; // Start with the full list state
         if (searchQuery && searchQuery.trim() !== '') {
             const lowerCaseQuery = searchQuery.toLowerCase();
             members = members.filter(member =>
                 member.name.toLowerCase().includes(lowerCaseQuery) ||
                 member.phone.includes(searchQuery) || // Maybe search phone too
                 (member.area?.name ?? '').toLowerCase().includes(lowerCaseQuery) // Search Area Name
             );
         }
         return members;
    }, [membersList, searchQuery]);

    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>Manage Members</h2>

            {/* Add New Member Form */}
            <div className={styles.addForm}>
                <h3>Add New Member</h3>
                {/* Display area loading/error status */}
                 {areasLoading && <p>Loading areas...</p>}
                 {areasError && <p className={styles.errorMessage}>Error loading areas: {areasError}</p>}

                <form onSubmit={handleAddSubmit}>
                    <div className={styles.formGrid}>
                        {/* Name, Phone, Amount inputs remain the same */}
                        <div className={styles.formGroup}><label htmlFor="name">Name</label><input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                        <div className={styles.formGroup}><label htmlFor="phone">Phone</label><input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required /></div>

                        {/* --- ** CHANGED: Address Input to Area Dropdown ** --- */}
                        <div className={styles.formGroup}>
                            <label htmlFor="areaId">Area</label>
                            <select
                                id="areaId"
                                name="areaId"
                                value={newAreaId}
                                onChange={(e) => setNewAreaId(e.target.value)}
                                required
                                disabled={areasLoading || !!areasError} // Disable if areas haven't loaded
                            >
                                <option value="" disabled>-- Select Area --</option>
                                {areasList.map(area => (
                                    <option key={area.id} value={area.id}>
                                        {area.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* --- End Area Dropdown --- */}

                        <div className={styles.formGroup}><label htmlFor="amount">Monthly Amount</label><input type="number" step="any" min="0" id="amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required /></div>
                        <div className={styles.formGroup}><label htmlFor="assignId">Assign Area Admin ID (Optional)</label><input type="text" id="assignId" value={newAssignedId} onChange={(e) => setNewAssignedId(e.target.value)} placeholder="Enter ID or leave blank" /></div>
                    </div>
                    {formError && <p className={styles.errorMessage}>{formError}</p>}
                    {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}
                    <button type="submit" className={styles.submitButton} disabled={isSubmitting || areasLoading || !!areasError}>
                        {isSubmitting ? 'Adding...' : 'Add Member'}
                    </button>
                </form>
            </div>

            {/* Search Bar (Keep as is) */}
             <div className={styles.searchContainer}>
                 <FaSearch className={styles.searchIcon} />
                 <input
                     type="search"
                     placeholder="Search members by name, phone, area..." // Updated placeholder
                     value={searchQuery}
                     onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                     className={styles.searchInput}
                 />
             </div>


            {/* Display Members List */}
            <div className={styles.listSection}>
                <h3>Current Members</h3>
                {isLoading && <p className={styles.loadingText}>Loading members...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {!isLoading && !fetchError && filteredMembers.length === 0 && (
                    <p className={styles.noDataText}>
                        {searchQuery ? 'No members found matching your search.' : 'No members found.'}
                    </p>
                )}
                {!isLoading && !fetchError && filteredMembers.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th><th>Name</th><th>Phone</th>
                                    {/* --- ** CHANGED: Header from Address to Area ** --- */}
                                    <th>Area</th>
                                    <th>Amount</th><th>Assigned Area Admin</th><th>Created At</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td>{member.id}</td><td>{member.name}</td><td>{member.phone}</td>
                                        {/* --- ** CHANGED: Display Area Name ** --- */}
                                        <td>{member.area?.name ?? 'N/A'}</td>
                                        <td>{member.monthlyAmount}</td>
                                        <td>{member.assignedAreaAdmin?.name ?? 'N/A'}</td>
                                        <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button onClick={() => handleEditClick(member)} className={`${styles.actionButton} ${styles.editButton}`} title="Edit Member"><FaEdit /></button>
                                            <button onClick={() => handleDelete(member.id, member.name)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Delete Member"><FaTrashAlt /></button>
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
                           {/* Add area loading/error check for modal */}
                           {areasLoading && <p>Loading areas...</p>}
                           {areasError && <p className={styles.errorMessage}>Error loading areas: {areasError}</p>}
                         <form onSubmit={handleUpdateSubmit}>
                             <div className={styles.formGrid}>
                                 {/* Name, Phone, Amount inputs remain the same */}
                                  <div className={styles.formGroup}><label htmlFor="editName">Name</label><input type="text" id="editName" name="name" value={editFormData.name ?? ''} onChange={handleEditFormChange} required /></div>
                                  <div className={styles.formGroup}><label htmlFor="editPhone">Phone</label><input type="tel" id="editPhone" name="phone" value={editFormData.phone ?? ''} onChange={handleEditFormChange} required /></div>

                                 {/* --- ** CHANGED: Address Input to Area Dropdown ** --- */}
                                  <div className={styles.formGroup}>
                                     <label htmlFor="editAreaId">Area</label>
                                     <select
                                         id="editAreaId"
                                         name="areaId" // Should match state property name
                                         value={editFormData.areaId ?? ''} // Use areaId from state
                                         onChange={handleEditFormChange}
                                         required
                                         disabled={areasLoading || !!areasError}
                                     >
                                         <option value="" disabled>-- Select Area --</option>
                                         {areasList.map(area => (
                                             <option key={area.id} value={area.id}>
                                                 {area.name}
                                             </option>
                                         ))}
                                     </select>
                                 </div>
                                  {/* --- End Area Dropdown --- */}

                                 <div className={styles.formGroup}><label htmlFor="editAmount">Monthly Amount</label><input type="number" step="any" min="0" id="editAmount" name="monthlyAmount" value={editFormData.monthlyAmount ?? ''} onChange={handleEditFormChange} required /></div>
                                 <div className={styles.formGroup}><label htmlFor="editAssignId">Assign Area Admin ID (empty to unassign)</label><input type="text" id="editAssignId" name="assignedAreaAdminId" value={editFormData.assignedAreaAdminId ?? ''} onChange={handleEditFormChange} placeholder="Enter Area Admin ID" /></div>
                               </div>
                             {editError && <p className={styles.errorMessage}>{editError}</p>}
                             {editSuccess && <p className={styles.successMessage}>{editSuccess}</p>}
                             <div className={styles.modalActions}>
                                 <button type="submit" className={styles.submitButton} disabled={isUpdating || areasLoading || !!areasError}> {isUpdating ? 'Saving...' : 'Save Changes'} </button>
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