// frontend/src/services/areaAdminService.ts
import apiClient from '../utils/apiClient';

// Interfaces (keep as before)
export interface AreaAdminData { /* ... */ }
export interface NewAreaAdminData { /* ... */ }

// --- GET all (Existing) ---
export const getAreaAdmins = async (): Promise<AreaAdminData[]> => {
    try {
        const response = await apiClient.get<AreaAdminData[]>('/area-admins');
        return response.data;
    } catch (error: any) {
        console.error('Service: Error fetching area admins:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch area admins.');
    }
};

// --- ADD new (Existing) ---
export const addAreaAdmin = async (data: NewAreaAdminData): Promise<AreaAdminData> => {
     try {
        const response = await apiClient.post<AreaAdminData>('/area-admins', data);
        return response.data;
    } catch (error: any) {
        console.error('Service: Error adding area admin:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to add area admin.');
    }
};

// --- **NEW** DELETE Area Admin ---
export const deleteAreaAdmin = async (id: string): Promise<void> => {
    try {
        console.log(`Service: Deleting area admin with ID: ${id}`);
        await apiClient.delete(`/area-admins/${id}`); // Send DELETE request
        console.log('Service: Deleted area admin successfully');
        // DELETE often returns 204 No Content, so no response data needed
    } catch (error: any) {
         console.error('Service: Error deleting area admin:', error.response?.data || error.message);
         throw new Error(error.response?.data?.message || 'Failed to delete area admin.');
    }
};

// --- **NEW** UPDATE Area Admin ---
// Data type for updating (Partial means all fields optional, exclude ID/passwordHash/createdAt)
export type UpdateAreaAdminData = Partial<Omit<NewAreaAdminData, 'password'>>;

export const updateAreaAdmin = async (id: string, data: UpdateAreaAdminData): Promise<AreaAdminData> => {
    try {
        console.log(`Service: Updating area admin ID ${id} with data:`, data);
        // Send PUT request with updated data
        const response = await apiClient.put<AreaAdminData>(`/area-admins/${id}`, data);
        console.log('Service: Updated area admin successfully:', response.data);
        return response.data; // Return updated admin data
    } catch (error: any) {
        console.error('Service: Error updating area admin:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update area admin.');
    }
};