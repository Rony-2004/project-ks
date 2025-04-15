// frontend/src/pages/admin/ManageAreas.tsx (UPDATED with Auto-UPPERCASE)
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import {
    getAllAreas, createArea, updateArea, deleteArea,
    Area, AreaInput
} from '../../services/areaService';
import styles from './ManageAreas.module.css';
import { FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';

// Removed the toTitleCase helper function

const ManageAreas: React.FC = () => {
    // --- State Variables (Keep as before) ---
    const [areasList, setAreasList] = useState<Area[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [newAreaName, setNewAreaName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [editAreaName, setEditAreaName] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // --- Fetch Areas (Keep as before) ---
    const fetchAreas = async () => {
        setIsLoading(true); setError(null);
        try {
            const data = await getAllAreas(); setAreasList(data ?? []);
        } catch (err: any) { setError(err.message || 'Failed to load areas.'); }
        finally { setIsLoading(false); }
    };
    useEffect(() => { fetchAreas(); }, []);

    // --- Handlers ---
    const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = newAreaName.trim();
        if (!trimmedName) {
            setFormError('Area name cannot be empty.'); return;
        }
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);

        // ** Apply UPPERCASE formatting **
        const formattedName = trimmedName.toUpperCase(); // Changed here
        const areaData: AreaInput = { name: formattedName };

        try {
            await createArea(areaData);
            setFormSuccess(`Area '${formattedName}' added successfully!`);
            setNewAreaName('');
            fetchAreas();
        } catch (err: any) { setFormError(err.message || 'Failed to add area.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (areaId: string, areaName: string) => { // Keep as before
       if (!window.confirm(`Are you sure you want to delete the area "${areaName}" (ID: ${areaId})? This might fail if members or admins are assigned to it.`)) {
           return;
       }
       setError(null);
       try {
           await deleteArea(areaId);
           setFormSuccess(`Area "${areaName}" deleted successfully!`);
           fetchAreas();
       } catch (err: any) {
           setError(err.message || `Failed to delete area "${areaName}". It might be in use.`);
       }
    };

    const handleEditClick = (area: Area) => { // Keep as before
        setEditingArea(area);
        setEditAreaName(area.name);
        setFormError(null); setFormSuccess(null);
        setIsEditModalOpen(true);
    };

    const handleModalClose = () => { // Keep as before
        setIsEditModalOpen(false);
        setEditingArea(null);
        setEditAreaName('');
    };

    const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = editAreaName.trim();
        if (!editingArea || !trimmedName) {
            setFormError('Area name cannot be empty.'); return;
        }
        setFormError(null); setFormSuccess(null); setIsUpdating(true);

        // ** Apply UPPERCASE formatting **
        const formattedName = trimmedName.toUpperCase(); // Changed here
        const areaData: AreaInput = { name: formattedName };

        try {
            await updateArea(editingArea.id, areaData);
            setFormSuccess(`Area updated to '${formattedName}' successfully!`);
            handleModalClose();
            fetchAreas();
        } catch (err: any) { setFormError(err.message || 'Failed to update area.'); }
        finally { setIsUpdating(false); }
    };


    // --- JSX (No changes needed in the render part) ---
    return (
        <div className={styles.container}>
             {/* ... rest of the JSX remains the same as the previous version ... */}
             <h2>Manage Areas</h2>

            {/* Add New Area Form */}
            <div className={styles.addForm}>
                <h3><FaPlus /> Add New Area</h3>
                <form onSubmit={handleAddSubmit}>
                     <div className={styles.formGroup}>
                        <label htmlFor="newAreaName">Area Name:</label>
                        <input
                            type="text"
                            id="newAreaName"
                            value={newAreaName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAreaName(e.target.value)}
                            placeholder="E.g., SECTOR V" // Updated placeholder
                            required
                        />
                    </div>
                    {formError && !isEditModalOpen && <p className={styles.inlineErrorMessage}>{formError}</p>}
                    {formSuccess && !isEditModalOpen && <p className={styles.inlineSuccessMessage}>{formSuccess}</p>}
                    <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Area'}
                    </button>
                </form>
            </div>

            {/* Display Areas List */}
            <div className={styles.listSection}>
                 <h3>Current Areas</h3>
                {isLoading && <p className={styles.loadingText}>Loading areas...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {!isLoading && !error && areasList.length === 0 && (
                    <p className={styles.noDataText}>No areas found. Add one above!</p>
                )}
                {!isLoading && !error && areasList.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                           {/* Table structure */}
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Created At</th>
                                    <th>Updated At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areasList.map((area) => (
                                    <tr key={area.id}>
                                        <td><code>{area.id}</code></td>
                                        <td>{area.name}</td>
                                        <td>{area.createdAt ? new Date(area.createdAt).toLocaleString() : 'N/A'}</td>
                                        <td>{area.updatedAt ? new Date(area.updatedAt).toLocaleString() : 'N/A'}</td>
                                        <td>
                                            {/* Action Buttons */}
                                             <button
                                                onClick={() => handleEditClick(area)}
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                title="Edit Area"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(area.id, area.name)}
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                title="Delete Area"
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Area Modal */}
            {isEditModalOpen && editingArea && (
                 <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                        <h3>Edit Area (ID: {editingArea.id})</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="editAreaName">New Area Name:</label>
                                <input
                                    type="text"
                                    id="editAreaName"
                                    value={editAreaName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditAreaName(e.target.value)}
                                    required
                                />
                            </div>
                            {formError && isEditModalOpen && <p className={styles.inlineErrorMessage}>{formError}</p>}
                            {formSuccess && isEditModalOpen && <p className={styles.inlineSuccessMessage}>{formSuccess}</p>}
                            <div className={styles.modalActions}>
                                 {/* Modal Buttons */}
                                 <button type="submit" className={styles.submitButton} disabled={isUpdating}>
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" className={styles.cancelButton} onClick={handleModalClose} disabled={isUpdating}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* End Edit Modal */}
        </div>
    );
};

export default ManageAreas;