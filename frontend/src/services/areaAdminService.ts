// frontend/src/services/areaAdminService.ts (Final Version)
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
  // This array holds the areas assigned to this admin
  assignedAreas?: BasicArea[]; // Expect an array of assigned areas
}

// Interface for CREATING a new Area Admin (data SENT TO backend)
export interface NewAreaAdminData {
    name: string;
    email: string;
    phone?: string | null; // Optional
    password?: string; // Required for creation
    assignedAreaIds?: string[]; // Array of Area IDs to assign
}

// Interface for UPDATING an Area Admin (data SENT TO backend)
export interface UpdateAreaAdminData {
    name?: string;
    email?: string;
    phone?: string | null;
    assignedAreaIds?: string[]; // Full array of IDs to set for update
    password?: string;          // <-- Field for optional password update
}


// --- Service Functions ---

// GET all Area Admins
export const getAreaAdmins = async (): Promise<AreaAdminData[]> => {
    const SERVICE_NAME = '[AreaAdminService getAreaAdmins]';
    try {
        console.log(`${SERVICE_NAME} Fetching...`);
        // Backend now includes assignedAreas if select/include is used in controller
        const response = await apiClient.get<AreaAdminData[]>('/area-admins');
        console.log(`${SERVICE_NAME} Fetched ${response.data?.length ?? 'N/A'} area admins.`); // Safe length check
        return response.data ?? []; // Return empty array if data is null/undefined
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
        // Prepare payload - ensure assignedAreaIds is an array
        const payload = {
            ...data,
            assignedAreaIds: data.assignedAreaIds || [] // Ensure it's at least an empty array
        };
        // Remove areaName if accidentally passed (though interface doesn't have it)
        // delete (payload as any).areaName;

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

// DELETE an Area Admin
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
        // Log carefully, avoid logging password if present in 'data'
        console.log(`${SERVICE_NAME} Updating ID ${id} with data:`, { ...data, password: data.password ? '******' : undefined });

        // Prepare payload - Ensure assignedAreaIds is included if passed, remove areaName just in case
         const { areaName, ...payload } = {
             ...data,
             assignedAreaIds: data.assignedAreaIds !== undefined ? data.assignedAreaIds : undefined
         };
         // Optional: Remove undefined keys before sending (axios might handle this)
         // Object.keys(payload).forEach(key => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);

        // Log the payload actually being sent (mask password)
        console.log(`${SERVICE_NAME} Attempting PUT to /area-admins/${id} with payload:`, { ...payload, password: payload.password ? '******' : undefined });
        const response = await apiClient.put<AreaAdminData>(`/area-admins/${id}`, payload); // Send payload which might include password
        console.log(`${SERVICE_NAME} Update successful: Status=${response.status}, Data:`, response.data);
        if (!response.data?.id) { throw new Error("Invalid data received after updating area admin."); }
        return response.data; // Return updated data including assignedAreas
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update area admin.');
    }
};

// Optional: Add getAreaAdminById service function if needed later
// export const getAreaAdminById = async (id: string): Promise<AreaAdminData> => { /* ... */ }