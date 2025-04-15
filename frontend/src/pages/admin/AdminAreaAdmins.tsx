// frontend/src/pages/admin/AdminAreaAdmins.tsx (UPDATED: Mandatory Areas & Smaller Select)
import React, { useState, useEffect, FormEvent, useMemo, ChangeEvent } from 'react';
import Select, { MultiValue, StylesConfig } from 'react-select'; // <-- Import StylesConfig
import {
    getAreaAdmins, addAreaAdmin, deleteAreaAdmin, updateAreaAdmin,
    AreaAdminData, NewAreaAdminData, UpdateAreaAdminData
} from '../../services/areaAdminService';
import { getAllAreas, Area } from '../../services/areaService';
import styles from './AdminAreaAdmins.module.css'; // Use the CSS you provided
import { FaEdit, FaTrashAlt, FaSearch, FaPlus } from 'react-icons/fa';

interface SelectOption {
    value: string;
    label: string;
}

// --- ** Styles for react-select to make it smaller ** ---
const selectStyles: StylesConfig<SelectOption, true> = { // 'true' for isMulti
    control: (baseStyles, state) => ({
        ...baseStyles,
        minHeight: '38px', // Make control smaller (adjust as needed)
        height: '38px',
        borderColor: state.isFocused ? '#4f46e5' : '#d1d5db', // Match input border
        boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : baseStyles.boxShadow, // Match input focus
        '&:hover': {
            borderColor: state.isFocused ? '#4f46e5' : '#9ca3af',
        },
        backgroundColor: '#f9fafb', // Match input background
        fontSize: '1rem', // Match input font size
    }),
    valueContainer: (baseStyles) => ({
        ...baseStyles,
        height: '36px', // Adjust height
        padding: '0 8px', // Reduce padding
        overflow: 'auto' // Allow scrolling if many items selected
    }),
    input: (baseStyles) => ({
        ...baseStyles,
        margin: '0px', // Reset margin
        padding: '0px', // Reset padding
    }),
    indicatorsContainer: (baseStyles) => ({
        ...baseStyles,
        height: '36px', // Match value container
    }),
    placeholder: (baseStyles) => ({
      ...baseStyles,
      color: '#6b7280', // Match input placeholder color if needed
      fontSize: '0.95rem'
    }),
    option: (baseStyles, state) => ({
        ...baseStyles,
        padding: '8px 12px', // Slightly reduce option padding
        fontSize: '0.95rem',
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : baseStyles.backgroundColor,
         '&:active': {
            backgroundColor: state.isSelected ? '#4338ca' : '#c7d2fe',
        },
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: '#e0e7ff', // Lighter background for selected items
        fontSize: '0.85rem',
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: '#4338ca', // Darker text for selected items
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: '#4338ca',
        ':hover': {
            backgroundColor: '#c7d2fe',
            color: '#3730a3',
        },
    }),
    menu: (base) => ({ // Ensure menu appears above other elements
        ...base,
        zIndex: 10
    })
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
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newAssignedAreaIds, setNewAssignedAreaIds] = useState<string[]>([]);
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingAdmin, setEditingAdmin] = useState<AreaAdminData | null>(null);
    const [editFormData, setEditFormData] = useState<UpdateAreaAdminData>({
        name: '', email: '', phone: '', assignedAreaIds: []
    });
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // --- Fetching Data ---
    const fetchAreaAdmins = async () => { /* ... no changes ... */
        setIsLoading(true); setFetchError(null);
        try { const data = await getAreaAdmins(); setAreaAdminsList(data ?? []); }
        catch (error: any) { setFetchError(error.message || 'Failed to load data'); }
        finally { setIsLoading(false); }
    };
    const fetchAreas = async () => { /* ... no changes ... */
        setAreasLoading(true); setAreasError(null);
        try {
            const data = await getAllAreas();
            setAreasList(data ?? []);
            const options = data.map(area => ({ value: area.id, label: area.name.toUpperCase() }));
            setAreaOptions(options);
        } catch (error: any) {
            console.error("Failed to fetch areas:", error);
            setAreasError(error.message || 'Failed to load areas. Admins cannot be assigned areas.');
        } finally {
            setAreasLoading(false);
        }
     };
    useEffect(() => { fetchAreaAdmins(); fetchAreas(); }, []);

    // --- Handlers ---
    const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null); setFormSuccess(null); // Reset messages
        // ** ADDED: Mandatory area check **
        if (newAssignedAreaIds.length === 0) {
            setFormError('Please assign at least one area.');
            return; // Stop submission
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

    const handleDelete = async (adminId: string, adminName: string) => { /* ... no changes ... */
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

    const handleEditClick = (admin: AreaAdminData) => { /* ... no changes ... */
        setEditingAdmin(admin);
        setEditFormData({
            name: admin.name, email: admin.email, phone: admin.phone ?? '',
            assignedAreaIds: admin.assignedAreas?.map(area => area.id) ?? []
        });
        setEditError(null); setEditSuccess(null); setIsEditModalOpen(true);
     };
    const handleEditModalClose = () => { /* ... no changes ... */ setIsEditModalOpen(false); setEditingAdmin(null); };
    const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... no changes ... */
        const { name, value } = event.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
     };
    const handleNewAreaSelectChange = (selectedOptions: MultiValue<SelectOption>) => { /* ... no changes ... */
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setNewAssignedAreaIds(selectedIds);
     };
    const handleEditAreaSelectChange = (selectedOptions: MultiValue<SelectOption>) => { /* ... no changes ... */
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setEditFormData(prev => ({ ...prev, assignedAreaIds: selectedIds }));
     };

    const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setEditError(null); setEditSuccess(null); // Reset messages
        if (!editingAdmin) return;
        // ** ADDED: Mandatory area check **
        if (!editFormData.assignedAreaIds || editFormData.assignedAreaIds.length === 0) {
            setEditError('Please assign at least one area.');
            return; // Stop submission
        }

        setIsUpdating(true);
        const updateData: UpdateAreaAdminData = {
            name: editFormData.name, email: editFormData.email, phone: editFormData.phone || null,
            assignedAreaIds: editFormData.assignedAreaIds
        };
        try {
            await updateAreaAdmin(editingAdmin.id, updateData);
            setEditSuccess('Area Admin updated successfully!');
            fetchAreaAdmins();
            handleEditModalClose();
        } catch (error: any) { setEditError(error.message || 'Failed to update admin.'); }
        finally { setIsUpdating(false); }
    };

    const getSelectedOptions = (ids: string[]): SelectOption[] => { /* ... no changes ... */
        return areaOptions.filter(option => ids.includes(option.value));
    };

    // --- Filter area admins (No changes needed) ---
    const filteredAreaAdmins = useMemo(() => { /* ... no changes ... */
        let admins = areaAdminsList;
        if (searchQuery && searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            admins = admins.filter(admin =>
                admin.name.toLowerCase().includes(lowerCaseQuery) ||
                admin.email.toLowerCase().includes(lowerCaseQuery) ||
                (admin.assignedAreas && admin.assignedAreas.some(area => area.name.toLowerCase().includes(lowerCaseQuery)))
            );
        }
        return admins;
     }, [areaAdminsList, searchQuery]);


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
                        {/* Name, Email, Phone, Password */}
                        <div className={styles.formGroup}><label htmlFor="name">Name *</label><input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                        <div className={styles.formGroup}><label htmlFor="email">Email *</label><input type="email" id="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
                        <div className={styles.formGroup}><label htmlFor="phone">Phone</label><input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></div>
                        <div className={styles.formGroup}><label htmlFor="password">Initial Password *</label><input type="password" id="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" /></div>

                        {/* Area Assignment Multi-Select */}
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            {/* ** ADDED Asterisk to label ** */}
                            <label htmlFor="assignAreaIds">Assign Areas *</label>
                            <Select
                                id="assignAreaIds"
                                isMulti
                                options={areaOptions}
                                value={getSelectedOptions(newAssignedAreaIds)}
                                onChange={handleNewAreaSelectChange}
                                isLoading={areasLoading}
                                isDisabled={areasLoading || !!areasError}
                                placeholder="Select areas..."
                                closeMenuOnSelect={false}
                                styles={selectStyles} // <-- Apply the defined styles
                                // noOptionsMessage={() => areasLoading ? 'Loading...' : 'No areas found'}
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

            {/* Search Bar */}
            <div className={styles.searchContainer}> {/* ... search input ... */}
                 <FaSearch className={styles.searchIcon} />
                <input
                    type="search"
                    placeholder="Search by name, email, area..."
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Display List */}
            <div className={styles.listSection}> {/* ... table ... */}
                 <h3>Current Area Admins</h3>
                {isLoading && <p className={styles.loadingText}>Loading area admins...</p>}
                {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                {!isLoading && !fetchError && filteredAreaAdmins.length === 0 && (
                    <p className={styles.noDataText}>
                        {searchQuery ? 'No area admins found matching your search.' : 'No Area Admins found.'}
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
                                        <td><code>{admin.id}</code></td> {/* Use code tag for ID */}
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

                                {/* Area Assignment Multi-Select */}
                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    {/* ** ADDED Asterisk to label ** */}
                                    <label htmlFor="editAssignAreaIds">Assign Areas *</label>
                                    <Select
                                        id="editAssignAreaIds"
                                        isMulti
                                        options={areaOptions}
                                        value={getSelectedOptions(editFormData.assignedAreaIds ?? [])}
                                        onChange={handleEditAreaSelectChange}
                                        isLoading={areasLoading}
                                        isDisabled={areasLoading || !!areasError}
                                        placeholder="Select areas..."
                                        closeMenuOnSelect={false}
                                        styles={selectStyles} // <-- Apply the defined styles
                                        // noOptionsMessage={() => areasLoading ? 'Loading...' : 'No areas found'}
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