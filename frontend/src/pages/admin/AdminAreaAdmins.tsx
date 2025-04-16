// frontend/src/pages/admin/AdminAreaAdmins.tsx (Inline Assign Areas)
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import Select, { MultiValue, StylesConfig } from 'react-select';
import {
    getAreaAdmins, addAreaAdmin, deleteAreaAdmin, updateAreaAdmin,
    AreaAdminData, NewAreaAdminData, UpdateAreaAdminData
} from '../../services/areaAdminService';
import { getAllAreas, Area } from '../../services/areaService';
import styles from './AdminAreaAdmins.module.css'; // Ensure this CSS file is imported
import { FaEdit, FaTrashAlt, FaSearch, FaPlus } from 'react-icons/fa';

interface SelectOption {
    value: string;
    label: string;
}

// --- Styles for react-select ---
const selectStyles: StylesConfig<SelectOption, true> = { // For MultiSelect
    control: (baseStyles, state) => ({
        ...baseStyles, minHeight: '38px', // Match input height if possible
        borderColor: state.isFocused ? '#4f46e5' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : baseStyles.boxShadow,
        '&:hover': { borderColor: state.isFocused ? '#4f46e5' : '#9ca3af', },
        backgroundColor: '#f9fafb', fontSize: '1rem',
    }),
    valueContainer: (baseStyles) => ({ ...baseStyles, padding: '1px 6px' }), // Adjust padding
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

// Styles for the single select filter dropdown
const singleSelectStyles: StylesConfig<SelectOption, false> = { // For Single Select
     control: (base, state) => ({
        ...base,
        height: '40px',
        minHeight: '40px',
        boxSizing: 'border-box',
        backgroundColor: '#f0f2f5',
        border: state.isFocused ? '1px solid #1890ff' : '1px solid #d9d9d9',
        borderRadius: '6px',
        boxShadow: state.isFocused ? '0 0 0 3px rgba(24, 144, 255, 0.2)' : 'none',
        '&:hover': { borderColor: state.isFocused ? '#1890ff' : '#a0a0a0' },
        fontSize: '0.95rem',
     }),
     valueContainer: (base) => ({ ...base, padding: '0 0.8rem', height: '40px' }),
     input: (base) => ({ ...base, margin: 0, padding: 0 }),
     indicatorsContainer: (base) => ({ ...base, height: '38px' }),
     singleValue: (base) => ({ ...base, color: '#000000' }),
     placeholder: (base) => ({ ...base, color: '#555', opacity: 0.8 }),
     menu: (base) => ({ ...base, zIndex: 5 }), // Ensure menu appears above table
     option: (base, state) => ({
         ...base,
         fontSize: '0.95rem',
         padding: '0.6rem 0.8rem',
         backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : base.backgroundColor,
         color: state.isSelected ? 'white' : '#333',
         '&:active': { backgroundColor: state.isSelected ? '#4338ca' : '#c7d2fe' },
     }),
};


const AdminAreaAdmins: React.FC = () => {
    // --- State Variables ---
    const [areaAdminsList, setAreaAdminsList] = useState<AreaAdminData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [areasList, setAreasList] = useState<Area[]>([]);
    const [areasLoading, setAreasLoading] = useState<boolean>(true);
    const [areasError, setAreasError] = useState<string | null>(null);
    const [areaOptions, setAreaOptions] = useState<SelectOption[]>([]); // For MultiSelect
    const [filterAreaOptions, setFilterAreaOptions] = useState<SelectOption[]>([]); // For SingleSelect Filter
    const [selectedAreaFilter, setSelectedAreaFilter] = useState<SelectOption | null>(null); // For SingleSelect Filter state

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
            const validAreas = data ?? [];
            setAreasList(validAreas);
            // Options for MultiSelect (Assign/Edit)
            const multiOptions = validAreas.map(area => ({ value: area.id, label: area.name.toUpperCase() }));
            setAreaOptions(multiOptions);
             // Options for SingleSelect Filter (including "All")
            const filterOptions = [{ value: '', label: 'All Assigned Areas' }, ...multiOptions];
            setFilterAreaOptions(filterOptions);
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
            fetchAreaAdmins(); // Refresh list
        } catch (error: any) { setFormError(error.message || 'Failed to add admin.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (adminId: string, adminName: string) => {
        if (!window.confirm(`Are you sure you want to delete Area Admin '${adminName}' (ID: ${adminId})?`)) return;
        setFetchError(null);
        try {
            await deleteAreaAdmin(adminId);
            alert('Area Admin deleted successfully.'); fetchAreaAdmins(); // Refresh list
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
            password: '', // Reset password fields
            confirmPassword: ''
        });
        setEditError(null); setEditSuccess(null); setIsEditModalOpen(true);
    };

    const handleEditModalClose = () => { setIsEditModalOpen(false); setEditingAdmin(null); };

    const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler for MultiSelect in forms
    const handleNewAreaSelectChange = (selectedOptions: MultiValue<SelectOption>) => {
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setNewAssignedAreaIds(selectedIds);
    };
    const handleEditAreaSelectChange = (selectedOptions: MultiValue<SelectOption>) => {
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setEditFormData(prev => ({ ...prev, assignedAreaIds: selectedIds }));
    };

     // ** NEW: Handler for SingleSelect Area Filter **
     const handleAreaFilterChange = (selectedOption: SelectOption | null) => {
        setSelectedAreaFilter(selectedOption); // Store the whole option or just the value
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
            fetchAreaAdmins(); // Refresh list
            handleEditModalClose();
        } catch (error: any) { setEditError(error.message || 'Failed to update admin.'); }
        finally { setIsUpdating(false); }
    };

    // Helper to get selected options for react-select MultiSelect
    const getSelectedOptions = (ids: string[]): SelectOption[] => {
        return areaOptions.filter(option => ids.includes(option.value));
    };

    // --- Memoized Filtering Logic ---
    const filteredAreaAdmins = useMemo(() => {
        let admins = areaAdminsList;
        const filterValue = selectedAreaFilter?.value ?? ''; // Get value from selected option

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
        if (filterValue !== '') { // Use filterValue here
            admins = admins.filter(admin =>
                admin.assignedAreas && admin.assignedAreas.some(area => area.id === filterValue)
            );
        }

        return admins;
    // Updated dependency array
    }, [areaAdminsList, searchQuery, selectedAreaFilter]);


    // --- Component Return (JSX) ---
    return (
        <div className={styles.container}>
            <h2>Manage Area Admins</h2>

            {/* Add Form */}
            <div className={styles.addForm}>
                 <h3>Add New Area Admin</h3>
                 {areasLoading && <p>Loading areas...</p>}
                 {areasError && <p className={styles.errorMessage}>Error loading areas: {areasError}</p>}
                 <form onSubmit={handleAddSubmit}>
                     <div className={styles.formGrid}>
                         <div className={styles.formGroup}><label htmlFor="name">Name *</label><input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="email">Email *</label><input type="email" id="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
                         <div className={styles.formGroup}><label htmlFor="phone">Phone</label><input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></div>
                         <div className={styles.formGroup}><label htmlFor="password">Initial Password *</label><input type="password" id="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" /></div>
                         {/* ** MODIFICATION: Removed inline style gridColumn ** */}
                         <div className={styles.formGroup}>
                             <label htmlFor="assignAreaIds">Assign Areas *</label>
                             <Select id="assignAreaIds" isMulti options={areaOptions}
                                 value={getSelectedOptions(newAssignedAreaIds)}
                                 onChange={handleNewAreaSelectChange}
                                 isLoading={areasLoading} isDisabled={areasLoading || !!areasError}
                                 placeholder="Select areas..." closeMenuOnSelect={false}
                                 styles={selectStyles} // Use multi-select styles
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
                     {/* ** Added Label for Accessibility ** */}
                     <label htmlFor="adminSearch" className={styles.filterLabel}>Search:</label>
                     <div style={{ position: 'relative', width: '100%' }}> {/* Wrapper for input+icon */}
                        <FaSearch className={styles.searchIcon} />
                        <input
                            id="adminSearch"
                            type="search"
                            placeholder="Search by name, email, area..."
                            value={searchQuery}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Area Filter Dropdown */}
                <div className={styles.filterContainer}>
                    <label htmlFor="areaFilter" className={styles.filterLabel}>Filter by Area:</label>
                    {/* Using React-Select for consistent styling */}
                    <Select
                        id="areaFilter"
                        name="areaFilter"
                        options={filterAreaOptions}
                        value={selectedAreaFilter}
                        onChange={handleAreaFilterChange}
                        isLoading={areasLoading}
                        isDisabled={areasLoading || !!areasError || areasList.length === 0}
                        placeholder="All Assigned Areas"
                        isClearable={true} // Allow clearing selection
                        styles={singleSelectStyles} // Apply single select styles
                        classNamePrefix="react-select" // Optional: for more specific CSS targeting
                    />
                     {/* Error/Loading indicators if needed */}
                     {/* {areasLoading && <span className={styles.loadingTextSmall}>...</span>} */}
                     {/* {areasError && <span className={styles.errorMessageSmall}>Error</span>} */}
                </div>
                {/* --- End Filter --- */}

            </div>
            {/* --- End Controls Bar --- */}


            {/* Display List */}
            <div className={styles.listSection}>
                 <h3>
                     Current Area Admins
                     {selectedAreaFilter?.value ? ` (Filtered by Area: ${selectedAreaFilter.label})` : ''}
                 </h3>
                {isLoading && <p className={styles.loadingText}>Loading area admins...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {!isLoading && !fetchError && filteredAreaAdmins.length === 0 && (
                    <p className={styles.noDataText}>
                        {searchQuery || selectedAreaFilter?.value ? 'No area admins found matching filters.' : 'No Area Admins found.'}
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
                                        <td><code>{admin.id}</code></td> {/* Display full ID */}
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
                                     <input type="password" id="editPassword" name="password" value={editFormData.password ?? ''} onChange={handleEditFormChange} autoComplete="new-password" />
                                 </div>
                                 <div className={styles.formGroup}>
                                     <label htmlFor="editConfirmPassword">Confirm New Password</label>
                                     <input type="password" id="editConfirmPassword" name="confirmPassword" value={editFormData.confirmPassword ?? ''} onChange={handleEditFormChange} autoComplete="new-password" />
                                 </div>

                                 {/* Area Assignment Select */}
                                 <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                     <label htmlFor="editAssignAreaIds">Assign Areas *</label>
                                     <Select id="editAssignAreaIds" isMulti options={areaOptions}
                                         value={getSelectedOptions(editFormData.assignedAreaIds ?? [])}
                                         onChange={handleEditAreaSelectChange}
                                         isLoading={areasLoading} isDisabled={areasLoading || !!areasError}
                                         placeholder="Select areas..." closeMenuOnSelect={false}
                                         styles={selectStyles} // Use multi-select styles
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

