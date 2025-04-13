// frontend/src/pages/admin/AdminAreaAdmins.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import {
  getAreaAdmins,
  addAreaAdmin,
  deleteAreaAdmin, // <-- Import delete service
  updateAreaAdmin, // <-- Import update service
  AreaAdminData,
  NewAreaAdminData,
  UpdateAreaAdminData // <-- Import update type
} from '../../services/areaAdminService';
import styles from './AdminAreaAdmins.module.css';
// Optional: Import a modal component or use inline styling
// import Modal from '../../components/common/Modal';

const AdminAreaAdmins: React.FC = () => {
  // Existing state...
  const [areaAdminsList, setAreaAdminsList] = useState<AreaAdminData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form state...
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // --- **NEW** State for Edit Modal ---
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<AreaAdminData | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateAreaAdminData>({
      name: '', email: '', phone: '', areaName: ''
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  // --- End Edit Modal State ---

  // Fetch function (no change needed)
  const fetchAreaAdmins = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getAreaAdmins();
      setAreaAdminsList(data);
    } catch (error: any) {
      setFetchError(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAreaAdmins();
  }, []);

  // Add Submit handler (no change needed)
  const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
     // ... (keep existing logic) ...
      event.preventDefault();
      setFormError(null);
      setFormSuccess(null);
      setIsSubmitting(true);
      const newAdminData: NewAreaAdminData = { name: newName, email: newEmail, phone: newPhone, areaName: newAreaName, password: newPassword };
      try {
        await addAreaAdmin(newAdminData);
        setFormSuccess('Area Admin added successfully!');
        setNewName(''); setNewEmail(''); setNewPhone(''); setNewAreaName(''); setNewPassword(''); // Clear form
        fetchAreaAdmins(); // Refresh list
      } catch (error: any) {
        setFormError(error.message || 'Failed to add admin.');
      } finally {
        setIsSubmitting(false);
      }
  };

  // --- **NEW** Delete Handler ---
  const handleDelete = async (adminId: string) => {
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete Area Admin ${adminId}? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteAreaAdmin(adminId);
      // Refresh list after successful deletion
      fetchAreaAdmins();
      // Optional: Show a success message
      alert('Area Admin deleted successfully.');
    } catch (error: any) {
      console.error('Delete error:', error);
      // Show error message
      alert(`Failed to delete Area Admin: ${error.message}`);
      setFetchError(error.message); // Also maybe set fetchError to display prominently
    }
  };

  // --- **NEW** Edit Modal Handlers ---
  const handleEditClick = (admin: AreaAdminData) => {
      setEditingAdmin(admin); // Store the admin being edited
      // Pre-fill edit form data
      setEditFormData({
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          areaName: admin.areaName,
      });
      setEditError(null); // Clear previous errors
      setEditSuccess(null);
      setIsEditModalOpen(true); // Open the modal
  };

  const handleEditModalClose = () => {
      setIsEditModalOpen(false);
      setEditingAdmin(null); // Clear editing state
  };

  const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editingAdmin) return; // Should not happen if modal is open

      setEditError(null);
      setEditSuccess(null);
      setIsUpdating(true);

      try {
          await updateAreaAdmin(editingAdmin.id, editFormData);
          setEditSuccess('Area Admin updated successfully!');
          fetchAreaAdmins(); // Refresh the list
          handleEditModalClose(); // Close modal on success
      } catch (error: any) {
          setEditError(error.message || 'Failed to update admin.');
      } finally {
          setIsUpdating(false);
      }
  };
  // --- End Edit Handlers ---

  return (
    <div className={styles.container}>
      <h2>Manage Area Admins</h2>

      {/* Add Form (existing) */}
      <div className={styles.addForm}>
        {/* ... form JSX ... */}
         <h3>Add New Area Admin</h3>
         <form onSubmit={handleAddSubmit}>
             {/* ... form groups ... */}
             <div className={styles.formGrid}>
                 <div className={styles.formGroup}>
                     <label htmlFor="name">Name</label>
                     <input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                 </div>
                 <div className={styles.formGroup}>
                     <label htmlFor="email">Email</label>
                     <input type="email" id="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                 </div>
                 <div className={styles.formGroup}>
                     <label htmlFor="phone">Phone</label>
                     <input type="tel" id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
                 </div>
                 <div className={styles.formGroup}>
                     <label htmlFor="areaName">Area Name</label>
                     <input type="text" id="areaName" value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} required />
                 </div>
                 <div className={styles.formGroup}>
                     <label htmlFor="password">Initial Password</label>
                     <input type="password" id="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
                 </div>
             </div>
             {formError && <p className={styles.errorMessage}>{formError}</p>}
             {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}
             <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                 {isSubmitting ? 'Adding...' : 'Add Area Admin'}
             </button>
         </form>
      </div>

      {/* List Section (modified table) */}
      <div className={styles.listSection}>
        <h3>Current Area Admins</h3>
        {/* ... loading/error messages ... */}
         {isLoading && <p>Loading area admins...</p>}
         {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
         {!isLoading && !fetchError && areaAdminsList.length === 0 && <p>No Area Admins found.</p>}
        {!isLoading && !fetchError && areaAdminsList.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Area Name</th>
                <th>Created At</th>
                <th>Actions</th> {/* <-- New Column */}
              </tr>
            </thead>
            <tbody>
              {areaAdminsList.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.id}</td>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.phone}</td>
                  <td>{admin.areaName}</td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td>
                    {/* --- Add Edit/Delete Buttons --- */}
                    <button
                        onClick={() => handleEditClick(admin)}
                        className={`${styles.actionButton} ${styles.editButton}`}
                        title="Edit">
                        Edit {/* Replace with icon later if desired */}
                    </button>
                    <button
                        onClick={() => handleDelete(admin.id)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Delete">
                        Delete {/* Replace with icon later */}
                    </button>
                    {/* --- End Edit/Delete Buttons --- */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- **NEW** Edit Modal --- */}
      {isEditModalOpen && editingAdmin && (
        <div className={styles.modalBackdrop}> {/* Basic modal backdrop */}
          <div className={styles.modalContent}>
            <h3>Edit Area Admin (ID: {editingAdmin.id})</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="editName">Name</label>
                  <input type="text" id="editName" name="name" value={editFormData.name} onChange={handleEditFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="editEmail">Email</label>
                  <input type="email" id="editEmail" name="email" value={editFormData.email} onChange={handleEditFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="editPhone">Phone</label>
                  <input type="tel" id="editPhone" name="phone" value={editFormData.phone} onChange={handleEditFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="editAreaName">Area Name</label>
                  <input type="text" id="editAreaName" name="areaName" value={editFormData.areaName} onChange={handleEditFormChange} required />
                </div>
                {/* Note: Password change is not included here for simplicity */}
              </div>
               {editError && <p className={styles.errorMessage}>{editError}</p>}
               {editSuccess && <p className={styles.successMessage}>{editSuccess}</p>}
               <div className={styles.modalActions}>
                  <button type="submit" className={styles.submitButton} disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className={styles.cancelButton} onClick={handleEditModalClose}>
                    Cancel
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
      {/* --- End Edit Modal --- */}

    </div>
  );
};

export default AdminAreaAdmins;