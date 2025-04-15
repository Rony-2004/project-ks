// frontend/src/services/areaService.ts
import apiClient from '../utils/apiClient'; // Use our authenticated client

// Interface for Area data (matching backend model)
export interface Area {
    id: string;
    name: string;
    createdAt?: string; // Optional depending on backend selection
    updatedAt?: string; // Optional
    // Add other fields if needed/returned by backend
}

// Interface for creating/updating an Area
export interface AreaInput {
    name: string;
    // Add other fields if needed for creation/update
}


// --- Service Functions ---

// GET All Areas
export const getAllAreas = async (): Promise<Area[]> => {
    const SERVICE_NAME = '[AreaService getAllAreas]';
    try {
        console.log(`${SERVICE_NAME} Fetching...`);
        // Assuming the backend endpoint is /api/areas and requires admin auth
        const response = await apiClient.get<Area[]>('/areas');
        console.log(`${SERVICE_NAME} Fetched ${response.data?.length} areas.`);
        return response.data ?? [];
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch areas.');
    }
};

// CREATE New Area
export const createArea = async (data: AreaInput): Promise<Area> => {
    const SERVICE_NAME = '[AreaService createArea]';
    try {
        console.log(`${SERVICE_NAME} Sending data:`, data);
        const response = await apiClient.post<Area>('/areas', data);
        console.log(`${SERVICE_NAME} Success response received:`, response.data);
        if (!response.data?.id) { throw new Error("Invalid data received after creating area."); }
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create area.');
    }
};

// UPDATE Area
export const updateArea = async (id: string, data: AreaInput): Promise<Area> => {
    const SERVICE_NAME = '[AreaService updateArea]';
    if (!id) { throw new Error('Area ID is required for update.'); }
    try {
        console.log(`${SERVICE_NAME} Updating ID ${id} with data:`, data);
        const response = await apiClient.put<Area>(`/areas/${id}`, data);
        console.log(`${SERVICE_NAME} Update successful:`, response.data);
        if (!response.data?.id) { throw new Error("Invalid data received after updating area."); }
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update area.');
    }
};

// DELETE Area
export const deleteArea = async (id: string): Promise<void> => {
    const SERVICE_NAME = '[AreaService deleteArea]';
    if (!id) { throw new Error('Area ID is required for delete.'); }
    try {
        console.log(`${SERVICE_NAME} Deleting ID: ${id}`);
        await apiClient.delete(`/areas/${id}`);
        console.log(`${SERVICE_NAME} DELETE request successful`);
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        // Check for specific status codes if needed (e.g., 400 for dependencies)
        const message = error.response?.data?.message || 'Failed to delete area.';
        // Re-throw with potentially more specific message from backend
        throw new Error(message);
    }
};