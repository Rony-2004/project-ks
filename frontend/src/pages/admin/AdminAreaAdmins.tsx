// frontend/src/pages/admin/AdminAreaAdmins.tsx (Display Full ID)
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import Select, { MultiValue, StylesConfig } from 'react-select';
import {
    getAreaAdmins, addAreaAdmin, deleteAreaAdmin, updateAreaAdmin,
    AreaAdminData, NewAreaAdminData, UpdateAreaAdminData
} from '../../services/areaAdminService';
import { getAllAreas, Area } from '../../services/areaService';
import styles from './AdminAreaAdmins.module.css';
import { FaEdit, FaTrashAlt, FaSearch, FaPlus } from 'react-icons/fa';

interface SelectOption {
    value: string;
    label: string;
}

// --- Styles for react-select (Keep as provided) ---
const selectStyles: StylesConfig<SelectOption, true> = {
    control: (baseStyles, state) => ({
        ...baseStyles, minHeight: '38px', height: '38px',
        borderColor: state.isFocused ? '#4f46e5' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : baseStyles.boxShadow,
        '&:hover': { borderColor: state.isFocused ? '#4f46e5' : '#9ca3af', },
        backgroundColor: '#f9fafb', fontSize: '1rem',
    }),
    valueContainer: (baseStyles) => ({ ...baseStyles, height: '36px', padding: '0 8px', overflow: 'auto' }),
    input: (baseStyles) => ({ ...baseStyles, margin: '0px', padding: '0px' }),
    indicatorsContainer: (baseStyles) => ({ ...baseStyles, height: '36px' }),
    placeholder: (baseStyles) => ({ ...baseStyles, color: '#6b7280', fontSize: '0.95rem' }),
    option: (baseStyles, state) => ({
        ...baseStyles, padding: '8px 12px', fontSize: '0.95rem',
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : baseStyles.backgroundColor,
        '&:active': { backgroundColor: state.isSelected ? '#4338ca' : '#c7d2fe', },
    }),
    multiValue: (base) => ({ ...base, backgroundColor: '#e0e7ff', fontSize: '0.85rem' }),
    multiValueLabel: (base) => ({ ...base, color: '#4338ca' }),
    multiValueRemove: (base) => ({ ...base, color: '#4338ca', ':hover': { backgroundColor: '#c7d2fe', color: '#3730a3', }, }),
    menu: (base) => ({ ...base, zIndex: 10 })
};
// --- End react-select styles ---

const AdminAreaAdmins: React.FC = () => {
    // --- State Variables ---
    const [areaAdminsList, setAreaAdminsList] = useState<AreaAdminData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [areasList, setAreasList] = useState<Area[]>([]);
    const [areasLoading, setAreasLoading] = useState<boolean>(true);
    const [areasError, setAreasError] = useState<string | null>(null);
    const [areaOptions, setAreaOptions] = useState<SelectOption[]>([]);
    const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('');

    // Add Form state
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newAssignedAreaIds, setNewAssignedAreaIds] = useState<string[]>([]);
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingAdmin, setEditingAdmin] = useState<AreaAdminData | null>(null);
    const [editFormData, setEditFormData] = useState<UpdateAreaAdminData & { confirmPassword?: string }>({
        name: '', email: '', phone: '', assignedAreaIds: [],
        password: '', confirmPassword: ''
    });
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // --- Fetching Data ---
    const fetchAreaAdmins = async () => {
        setIsLoading(true); setFetchError(null);
        try { const data = await getAreaAdmins(); setAreaAdminsList(data ?? []); }
        catch (error: any) { setFetchError(error.message || 'Failed to load data'); }
        finally { setIsLoading(false); }
    };
    const fetchAreas = async () => {
        setAreasLoading(true); setAreasError(null);
        try {
            const data = await getAllAreas();
            setAreasList(data ?? []);
            const options = data.map(area => ({ value: area.id, label: area.name.toUpperCase() }));
            setAreaOptions(options);
        } catch (error: any) {
            console.error("Failed to fetch areas:", error);
            setAreasError(error.message || 'Failed to load areas.');
        } finally {
            setAreasLoading(false);
        }
    };
    useEffect(() => { fetchAreaAdmins(); fetchAreas(); }, []);

    // --- Handlers ---
    const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null); setFormSuccess(null);
        if (newAssignedAreaIds.length === 0) {
            setFormError('Please assign at least one area.'); return;
        }
        if (!newPassword) { setFormError('Password is required.'); return; }

        setIsSubmitting(true);
        const newAdminData: NewAreaAdminData = {
            name: newName, email: newEmail, phone: newPhone || null, password: newPassword,
            assignedAreaIds: newAssignedAreaIds
        };
        try {
            await addAreaAdmin(newAdminData);
            setFormSuccess('Area Admin added successfully!');
            setNewName(''); setNewEmail(''); setNewPhone(''); setNewPassword(''); setNewAssignedAreaIds([]);
            fetchAreaAdmins();
        } catch (error: any) { setFormError(error.message || 'Failed to add admin.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (adminId: string, adminName: string) => {
        if (!window.confirm(`Are you sure you want to delete Area Admin '${adminName}' (ID: ${adminId})?`)) return;
        setFetchError(null);
        try {
            await deleteAreaAdmin(adminId);
            alert('Area Admin deleted successfully.'); fetchAreaAdmins();
        } catch (error: any) {
            console.error('Delete error:', error);
            alert(`Failed to delete Area Admin: ${error.message}`);
            setFetchError(error.message);
        }
    };

    const handleEditClick = (admin: AreaAdminData) => {
        setEditingAdmin(admin);
        setEditFormData({
            name: admin.name,
            email: admin.email,
            phone: admin.phone ?? '',
            assignedAreaIds: admin.assignedAreas?.map(area => area.id) ?? [],
            password: '',
            confirmPassword: ''
        });
        setEditError(null); setEditSuccess(null); setIsEditModalOpen(true);
    };

    const handleEditModalClose = () => { setIsEditModalOpen(false); setEditingAdmin(null); };

    const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewAreaSelectChange = (selectedOptions: MultiValue<SelectOption>) => {
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setNewAssignedAreaIds(selectedIds);
    };
    const handleEditAreaSelectChange = (selectedOptions: MultiValue<SelectOption>) => {
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setEditFormData(prev => ({ ...prev, assignedAreaIds: selectedIds }));
    };

    const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setEditError(null); setEditSuccess(null);
        if (!editingAdmin) return;

        // Password Validation
        const newPassword = editFormData.password;
        const confirmPassword = editFormData.confirmPassword;
        if (newPassword && newPassword.length > 0) {
            if (newPassword.length < 6) { setEditError("New password must be at least 6 characters long."); return; }
            if (newPassword !== confirmPassword) { setEditError("New passwords do not match."); return; }
        }
        // Area Validation
        if (!editFormData.assignedAreaIds || editFormData.assignedAreaIds.length === 0) {
            setEditError('Please assign at least one area.'); return;
        }

        setIsUpdating(true);
        const updateData: UpdateAreaAdminData = {
            name: editFormData.name,
            email: editFormData.email,
            phone: editFormData.phone || null,
            assignedAreaIds: editFormData.assignedAreaIds,
            ...(newPassword && newPassword.length > 0 && newPassword === confirmPassword && { password: newPassword })
        };

        try {
            await updateAreaAdmin(editingAdmin.id, updateData);
            setEditSuccess('Area Admin updated successfully!');
            fetchAreaAdmins();
            handleEditModalClose();
        } catch (error: any) { setEditError(error.message || 'Failed to update admin.'); }
        finally { setIsUpdating(false); }
    };

    const getSelectedOptions = (ids: string[]): SelectOption[] => {
        return areaOptions.filter(option => ids.includes(option.value));
    };

    // --- Memoized Filtering Logic ---
    const filteredAreaAdmins = useMemo(() => {
        let admins = areaAdminsList;

        // 1. Filter by Search Query
        if (searchQuery && searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            admins = admins.filter(admin =>
                admin.name.toLowerCase().includes(lowerCaseQuery) ||
                admin.email.toLowerCase().includes(lowerCaseQuery) ||
                (admin.assignedAreas && admin.assignedAreas.some(area => area.name.toLowerCase().includes(lowerCaseQuery)))
            );
        }

        // 2. Filter by Selected Assigned Area
        if (selectedAreaFilter !== '') {
            admins = admins.filter(admin =>
                admin.assignedAreas && admin.assignedAreas.some(area => area.id === selectedAreaFilter)
            );
        }

        return admins;
    }, [areaAdminsList, searchQuery, selectedAreaFilter]);


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>Manage Area Admins</h2>

            {/* Add Form */}
            <div className={styles.addForm}>
                 {/* ... form content ... */}
                 <h3>Add New Area Admin</h3>
                 {areasLoading && <p>Loading areas...</p>}
                 {areasError && <p className={styles.errorMessage}>Error loading areas: {areasError}</p>}
                 <form onSubmit={handleAddSubmit}>
                     <div className={styles.formGrid}>
                         <div className={styles.formGroup}><label htmlFor="name">Name *</label><input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="email">Email *</label><input type="email" id="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="phone">Phone</label><input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></div>
                         <div className={styles.formGroup}><label htmlFor="password">Initial Password *</label><input type="password" id="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" /></div>
                         <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                             <label htmlFor="assignAreaIds">Assign Areas *</label>
                             <Select id="assignAreaIds" isMulti options={areaOptions}
                                 value={getSelectedOptions(newAssignedAreaIds)}
                                 onChange={handleNewAreaSelectChange}
                                 isLoading={areasLoading} isDisabled={areasLoading || !!areasError}
                                 placeholder="Select areas..." closeMenuOnSelect={false}
                                 styles={selectStyles}
                             />
                         </div>
                     </div>
                     {formError && <p className={styles.errorMessage}>{formError}</p>}
                     {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}
                     <button type="submit" className={styles.submitButton} disabled={isSubmitting || areasLoading || !!areasError}>
                         {isSubmitting ? 'Adding...' : 'Add Area Admin'}
                     </button>
                 </form>
            </div>

            {/* --- Controls Bar (Search Left, Filter Right) --- */}
            <div className={styles.controlsContainer}>

                {/* Search Bar */}
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

                {/* Area Filter Dropdown */}
                <div className={styles.filterContainer}>
                    <label htmlFor="areaFilter" className={styles.filterLabel}>Filter by Area:</label>
                    <select
                        id="areaFilter"
                        name="areaFilter"
                        value={selectedAreaFilter}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAreaFilter(e.target.value)}
                        className={styles.filterSelect}
                        disabled={areasLoading || !!areasError}
                        title="Filter admins by assigned area"
                    >
                        <option value="">All Assigned Areas</option>
                        {areasList.map(area => (
                            <option key={area.id} value={area.id}>
                                {area.name.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
                {/* --- End Filter --- */}

            </div>
            {/* --- End Controls Bar --- */}


            {/* Display List */}
            <div className={styles.listSection}>
                <h3>
                    Current Area Admins
                    {selectedAreaFilter && areasList.find(a => a.id === selectedAreaFilter)
                        ? ` (Filtered by Area: ${areasList.find(a => a.id === selectedAreaFilter)?.name.toUpperCase()})`
                        : ''}
                </h3>
                {isLoading && <p className={styles.loadingText}>Loading area admins...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {!isLoading && !fetchError && filteredAreaAdmins.length === 0 && (
                    <p className={styles.noDataText}>
                        {searchQuery || selectedAreaFilter ? 'No area admins found matching filters.' : 'No Area Admins found.'}
                    </p>
                )}
                {!isLoading && !fetchError && filteredAreaAdmins.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
                                    <th>Assigned Areas</th>
                                    <th>Created At</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAreaAdmins.map((admin) => (
                                    <tr key={admin.id}>
                                        {/* ** MODIFIED: Display full ID ** */}
                                        <td><code>{admin.id}</code></td>
                                        {/* End Modification */}
                                        <td>{admin.name}</td><td>{admin.email}</td><td>{admin.phone ?? 'N/A'}</td>
                                        <td>
                                            {admin.assignedAreas && admin.assignedAreas.length > 0
                                                ? admin.assignedAreas.map(area => area.name.toUpperCase()).join(', ')
                                                : 'None'}
                                        </td>
                                        <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button onClick={() => handleEditClick(admin)} className={`${styles.actionButton} ${styles.editButton}`} title="Edit"><FaEdit /></button>
                                            <button onClick={() => handleDelete(admin.id, admin.name)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Delete"><FaTrashAlt /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && editingAdmin && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                         {/* ... modal content ... */}
                         <h3>Edit Area Admin (ID: {editingAdmin.id})</h3>
                         {areasLoading && <p>Loading areas...</p>}
                         {areasError && <p className={styles.errorMessage}>Error loading areas: {areasError}</p>}
                         <form onSubmit={handleUpdateSubmit}>
                             <div className={styles.formGrid}>
                                 {/* Name, Email, Phone */}
                                 <div className={styles.formGroup}><label htmlFor="editName">Name *</label><input type="text" id="editName" name="name" value={editFormData.name ?? ''} onChange={handleEditFormChange} required /></div>
                                 <div className={styles.formGroup}><label htmlFor="editEmail">Email *</label><input type="email" id="editEmail" name="email" value={editFormData.email ?? ''} onChange={handleEditFormChange} required /></div>
                                 <div className={styles.formGroup}><label htmlFor="editPhone">Phone</label><input type="tel" id="editPhone" name="phone" value={editFormData.phone ?? ''} onChange={handleEditFormChange} /></div>

                                 {/* Password Fields */}
                                 <div className={styles.formGroup}>
                                     <label htmlFor="editPassword">New Password (leave blank to keep current)</label>
                                     <input
                                         type="password" id="editPassword" name="password"
                                         value={editFormData.password ?? ''}
                                         onChange={handleEditFormChange} autoComplete="new-password"
                                     />
                                 </div>
                                 <div className={styles.formGroup}>
                                     <label htmlFor="editConfirmPassword">Confirm New Password</label>
                                     <input
                                         type="password" id="editConfirmPassword" name="confirmPassword"
                                         value={editFormData.confirmPassword ?? ''}
                                         onChange={handleEditFormChange} autoComplete="new-password"
                                     />
                                 </div>

                                 {/* Area Assignment Select */}
                                 <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                     <label htmlFor="editAssignAreaIds">Assign Areas *</label>
                                     <Select id="editAssignAreaIds" isMulti options={areaOptions}
                                         value={getSelectedOptions(editFormData.assignedAreaIds ?? [])}
                                         onChange={handleEditAreaSelectChange}
                                         isLoading={areasLoading} isDisabled={areasLoading || !!areasError}
                                         placeholder="Select areas..." closeMenuOnSelect={false}
                                         styles={selectStyles}
                                     />
                                 </div>
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
        </div>
    );
};

export default AdminAreaAdmins;
