// frontend/src/services/areaAdminService.ts (UPDATED for Area Relations)
import apiClient from '../utils/apiClient'; // Use our authenticated client

// --- Interfaces ---

// Interface for Area data (as returned by backend)
interface BasicArea {
  id: string;
  name: string;
}

// Interface for Area Admin data RECEIVED FROM BACKEND (GET requests)
export interface AreaAdminData {
  id: string;
  name: string;
  email: string;
  phone: string | null; // Use correct type from schema
  createdAt: string;
  updatedAt: string;
  // areaName?: string; // REMOVED
  // This array holds the areas assigned to this admin
  assignedAreas?: BasicArea[]; // <-- ADDED: Expect an array of assigned areas
}

// Interface for CREATING a new Area Admin (data SENT TO backend)
export interface NewAreaAdminData {
    name: string;
    email: string;
    phone?: string | null; // Optional
    password?: string; // Required for creation
    // areaName?: string; // REMOVED
    assignedAreaIds?: string[]; // <-- ADDED: Array of Area IDs to assign
}

// Interface for UPDATING an Area Admin (data SENT TO backend)
export interface UpdateAreaAdminData {
    name?: string;
    email?: string;
    phone?: string | null;
    // areaName?: string; // REMOVED
    assignedAreaIds?: string[]; // <-- ADDED: Full array of IDs to set for update
    // Password updates should be handled separately
}


// --- Service Functions ---

// GET all Area Admins
export const getAreaAdmins = async (): Promise<AreaAdminData[]> => {
    const SERVICE_NAME = '[AreaAdminService getAreaAdmins]';
    try {
        console.log(`${SERVICE_NAME} Fetching...`);
        // Backend now includes assignedAreas if select/include is used in controller
        const response = await apiClient.get<AreaAdminData[]>('/area-admins');
        console.log(`${SERVICE_NAME} Fetched ${response.data?.length} area admins.`);
        return response.data ?? [];
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch area admins.');
    }
};

// ADD a new Area Admin
export const addAreaAdmin = async (data: NewAreaAdminData): Promise<AreaAdminData> => {
     const SERVICE_NAME = '[AreaAdminService addAreaAdmin]';
     try {
        console.log(`${SERVICE_NAME} Sending data:`, data);
        // Prepare payload - include assignedAreaIds, remove areaName if present
        const { areaName, ...payload } = { // Destructure to easily remove areaName if it was accidentally passed
            ...data,
            assignedAreaIds: data.assignedAreaIds || [] // Ensure it's at least an empty array
        };

        console.log(`${SERVICE_NAME} Attempting POST to /area-admins with payload:`, payload);
        const response = await apiClient.post<AreaAdminData>('/area-admins', payload);
        console.log(`${SERVICE_NAME} Success response received:`, response.data);
        if (!response.data?.id) { throw new Error("Invalid data received after adding area admin."); }
        return response.data; // Return data including assignedAreas sent by backend
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to add area admin.');
    }
};

// DELETE an Area Admin (No change needed)
export const deleteAreaAdmin = async (id: string): Promise<void> => {
     const SERVICE_NAME = '[AreaAdminService deleteAreaAdmin]';
    try {
        console.log(`${SERVICE_NAME} Deleting ID: ${id}`);
        await apiClient.delete(`/area-admins/${id}`);
        console.log(`${SERVICE_NAME} DELETE request successful`);
    } catch (error: any) {
         console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
         throw new Error(error.response?.data?.message || 'Failed to delete area admin.');
    }
};

// UPDATE an Area Admin
export const updateAreaAdmin = async (id: string, data: UpdateAreaAdminData): Promise<AreaAdminData> => {
     const SERVICE_NAME = '[AreaAdminService updateAreaAdmin]';
     if (!id) { throw new Error('Area Admin ID is required for update.'); }
     try {
        console.log(`${SERVICE_NAME} Updating ID ${id} with data:`, data);
         // Prepare payload - include assignedAreaIds if provided, ensure areaName is not sent
        const { areaName, ...payload } = {
             ...data,
             // Ensure assignedAreaIds is included if it was passed in data
             assignedAreaIds: data.assignedAreaIds !== undefined ? data.assignedAreaIds : undefined
         };
         // Remove fields with undefined value before sending if necessary (axios usually handles this)
         Object.keys(payload).forEach(key => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);

        console.log(`${SERVICE_NAME} Attempting PUT to /area-admins/${id} with payload:`, payload);
        const response = await apiClient.put<AreaAdminData>(`/area-admins/${id}`, payload);
        console.log(`${SERVICE_NAME} Update successful: Status=${response.status}, Data:`, response.data);
        if (!response.data?.id) { throw new Error("Invalid data received after updating area admin."); }
        return response.data; // Return updated data including assignedAreas
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update area admin.');
    }
};

// Add getAreaAdminById service function later if needed for Edit modal prefill with areas
// export const getAreaAdminById = async (id: string): Promise<AreaAdminData> => { ... }