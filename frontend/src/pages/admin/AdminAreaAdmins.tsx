// frontend/src/pages/admin/AdminAreaAdmins.tsx (Working CRUD + Search Bar ONLY)
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react'; // <-- Added useMemo, ChangeEvent
import {
    getAreaAdmins,
    addAreaAdmin,
    deleteAreaAdmin,
    updateAreaAdmin,
    AreaAdminData,
    NewAreaAdminData,
    UpdateAreaAdminData
} from '../../services/areaAdminService'; // Verify path
import styles from './AdminAreaAdmins.module.css'; // Verify path & existence
import { FaEdit, FaTrashAlt, FaSearch } from 'react-icons/fa'; // <-- Added FaSearch


const AdminAreaAdmins: React.FC = () => {
    // --- State Variables ---
    const [areaAdminsList, setAreaAdminsList] = useState<AreaAdminData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Keep true initially
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>(''); // <-- ADDED: Search State
    // Add Form state
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newAreaName, setNewAreaName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingAdmin, setEditingAdmin] = useState<AreaAdminData | null>(null);
    const [editFormData, setEditFormData] = useState<UpdateAreaAdminData>({
        name: '', email: '', phone: '', areaName: ''
    });
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);


    // --- Functions (Copied from your working version) ---
    const fetchAreaAdmins = async () => {
        setIsLoading(true); setFetchError(null);
        try { const data = await getAreaAdmins(); setAreaAdminsList(data ?? []); } // Ensure array
        catch (error: any) { setFetchError(error.message || 'Failed to load data'); }
        finally { setIsLoading(false); }
    };
    useEffect(() => { fetchAreaAdmins(); }, []);

    const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setFormError(null); setFormSuccess(null); setIsSubmitting(true);
        const newAdminData: NewAreaAdminData = { name: newName, email: newEmail, phone: newPhone, areaName: newAreaName, password: newPassword };
        try {
            await addAreaAdmin(newAdminData); setFormSuccess('Area Admin added successfully!');
            setNewName(''); setNewEmail(''); setNewPhone(''); setNewAreaName(''); setNewPassword(''); fetchAreaAdmins();
        } catch (error: any) { setFormError(error.message || 'Failed to add admin.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (adminId: string) => { // Simplified signature based on your code
        if (!window.confirm(`Are you sure you want to delete Area Admin ${adminId}? This cannot be undone.`)) return;
        try {
            await deleteAreaAdmin(adminId); alert('Area Admin deleted successfully.'); fetchAreaAdmins();
        } catch (error: any) { console.error('Delete error:', error); alert(`Failed to delete Area Admin: ${error.message}`); setFetchError(error.message); }
        // Removed name param based on your pasted code's usage
    };

    const handleEditClick = (admin: AreaAdminData) => {
        setEditingAdmin(admin);
        setEditFormData({ name: admin.name, email: admin.email, phone: admin.phone ?? '', areaName: admin.areaName ?? '' }); // Added nullish coalescing
        setEditError(null); setEditSuccess(null); setIsEditModalOpen(true);
    };
    const handleEditModalClose = () => { setIsEditModalOpen(false); setEditingAdmin(null); };
    const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target; setEditFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); if (!editingAdmin) return;
        setEditError(null); setEditSuccess(null); setIsUpdating(true);
        try {
            await updateAreaAdmin(editingAdmin.id, editFormData);
            setEditSuccess('Area Admin updated successfully!'); fetchAreaAdmins(); handleEditModalClose();
        } catch (error: any) { setEditError(error.message || 'Failed to update admin.'); }
        finally { setIsUpdating(false); }
    };


    // --- Filter area admins based on search query ---
    const filteredAreaAdmins = useMemo(() => {
        let admins = areaAdminsList;
        if (searchQuery && searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            admins = admins.filter(admin =>
                admin.name.toLowerCase().includes(lowerCaseQuery) ||
                admin.email.toLowerCase().includes(lowerCaseQuery) ||
                (admin.areaName && admin.areaName.toLowerCase().includes(lowerCaseQuery))
            );
        }
        return admins;
    }, [areaAdminsList, searchQuery]); // Depends on list and query


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>Manage Area Admins</h2>

            {/* Add Form (As provided by user) */}
            <div className={styles.addForm}>
                <h3>Add New Area Admin</h3>
                <form onSubmit={handleAddSubmit}>
                     <div className={styles.formGrid}>
                        <div className={styles.formGroup}><label htmlFor="name">Name</label><input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                        <div className={styles.formGroup}><label htmlFor="email">Email</label><input type="email" id="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
                        <div className={styles.formGroup}><label htmlFor="phone">Phone</label><input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required /></div>
                        <div className={styles.formGroup}><label htmlFor="areaName">Area Name</label><input type="text" id="areaName" value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} required /></div>
                        <div className={styles.formGroup}><label htmlFor="password">Initial Password</label><input type="password" id="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" /></div>
                     </div>
                     {formError && <p className={styles.errorMessage}>{formError}</p>}
                     {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}
                     <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                         {isSubmitting ? 'Adding...' : 'Add Area Admin'}
                     </button>
                 </form>
            </div>

            {/* --- ADDED Search Bar --- */}
            <div className={styles.searchContainer}>
                 <FaSearch className={styles.searchIcon} />
                 <input
                     type="search"
                     placeholder="Search by name, email, area..."
                     value={searchQuery}
                     onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                     className={styles.searchInput}
                 />
             </div>
            {/* --- End Search Bar --- */}

            {/* Display List - Uses filteredAreaAdmins */}
            <div className={styles.listSection}>
                <h3>Current Area Admins</h3>
                 {isLoading && <p className={styles.loadingText}>Loading area admins...</p>}
                 {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                 {/* Update condition checks */}
                 {!isLoading && !fetchError && filteredAreaAdmins.length === 0 && (
                     <p className={styles.noDataText}>
                         {searchQuery ? 'No area admins found matching your search.' : 'No Area Admins found.'}
                     </p>
                 )}
                 {!isLoading && !fetchError && filteredAreaAdmins.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Area Name</th><th>Created At</th><th>Actions</th></tr></thead>
                            <tbody>
                                {/* *** MAP OVER filteredAreaAdmins *** */}
                                {filteredAreaAdmins.map((admin) => (
                                    <tr key={admin.id}>
                                        <td>{admin.id}</td><td>{admin.name}</td><td>{admin.email}</td><td>{admin.phone}</td><td>{admin.areaName}</td>
                                        <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                                        <td>
                                             <button onClick={() => handleEditClick(admin)} className={`${styles.actionButton} ${styles.editButton}`} title="Edit"><FaEdit /></button>
                                             {/* Pass name to delete handler if needed by confirmation */}
                                             <button onClick={() => handleDelete(admin.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Delete"><FaTrashAlt /></button>
                                         </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>

            {/* Edit Modal (Keep as is) */}
             {isEditModalOpen && editingAdmin && (
                <div className={styles.modalBackdrop}>
                      <div className={styles.modalContent}>
                           <h3>Edit Area Admin (ID: {editingAdmin.id})</h3>
                           <form onSubmit={handleUpdateSubmit}>
                                <div className={styles.formGrid}>
                                     <div className={styles.formGroup}><label htmlFor="editName">Name</label><input type="text" id="editName" name="name" value={editFormData.name ?? ''} onChange={handleEditFormChange} required /></div>
                                     <div className={styles.formGroup}><label htmlFor="editEmail">Email</label><input type="email" id="editEmail" name="email" value={editFormData.email ?? ''} onChange={handleEditFormChange} required /></div>
                                     <div className={styles.formGroup}><label htmlFor="editPhone">Phone</label><input type="tel" id="editPhone" name="phone" value={editFormData.phone ?? ''} onChange={handleEditFormChange} required /></div>
                                     <div className={styles.formGroup}><label htmlFor="editAreaName">Area Name</label><input type="text" id="editAreaName" name="areaName" value={editFormData.areaName ?? ''} onChange={handleEditFormChange} required /></div>
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
        </div>
    );
};

export default AdminAreaAdmins;