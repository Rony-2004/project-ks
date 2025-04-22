// src/components/profile/EditProfileModal.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { AdminProfileData, UpdateAdminProfileData, updateAdminProfile  } from '../../services/authService'; // Adjust path
import styles from './EditProfileModal.module.css'; // Create this CSS file

interface EditProfileModalProps {
  profile: AdminProfileData | null; // Current profile data
  isOpen: boolean;
  onClose: () => void; // Function to close the modal
  onProfileUpdate: () => void; // Function to call after successful update (to refresh header)
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onProfileUpdate
}) => {
  // State for form inputs, initialized with current profile data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Add other editable fields later (e.g., profilePicUrl - but handling file upload is complex)

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update form state when profile data is available or changes
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    }
  }, [profile]); // Rerun when profile prop changes

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsUpdating(true);

    const updateData: UpdateAdminProfileData = {
      name: name,
      email: email,
      // Add other fields here if necessary
    };

    try {
      await updateMyProfile(updateData);
      setSuccess('Profile updated successfully'); // Remind user it's simulated
      onProfileUpdate(); // Tell the Header to refresh profile data
      // Optionally close modal after a short delay
      setTimeout(() => {
          onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't render anything if the modal isn't open
  if (!isOpen || !profile) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}> {/* Close on backdrop click */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Prevent close on content click */}
        <h3>Edit Admin Profile</h3>
        <form onSubmit={handleSubmit}>
          {/* Profile Picture Placeholder */}
          <div className={styles.profilePicSection}>
              <img src={profile.profilePicUrl || "/1.jpg"} alt="Profile" className={styles.profilePic}/>
              {/* File input - functionality disabled for now */}
              <input type="file" id="profilePicUpload" style={{display: 'none'}} disabled />
              <button type="button" onClick={() => alert('Profile picture upload not implemented yet.')} className={styles.changePicButton} disabled>
                  Change Picture
              </button>
          </div>

          {/* Edit Form Fields */}
          <div className={styles.formGroup}>
            <label htmlFor="profileName">Name</label>
            <input
              type="text"
              id="profileName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="profileEmail">Email</label>
            <input
              type="email"
              id="profileEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Placeholder for Password Change - DO NOT IMPLEMENT YET */}
           <div className={styles.passwordSection}>
                <h4>Change Password (Not Enabled)</h4>
                <div className={styles.formGroup}>
                    <label htmlFor="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" disabled placeholder="******"/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="newPassword">New Password</label>
                    <input type="password" id="newPassword" disabled placeholder="******"/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" disabled placeholder="******"/>
                </div>
           </div>


          {error && <p className={styles.errorMessage}>{error}</p>}
          {success && <p className={styles.successMessage}>{success}</p>}

          <div className={styles.modalActions}>
            <button type="submit" className={styles.submitButton} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isUpdating}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;