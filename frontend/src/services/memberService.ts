// frontend/src/services/memberService.ts (UPDATED for Area Relation)
import apiClient from '../utils/apiClient'; // Import the configured Axios instance

// --- Interfaces Updated ---

// Structure of Member data RECEIVED FROM BACKEND (includes Area name)
export interface MemberData {
  id: string;
  name: string;
  phone: string;
  // address: string; // REMOVED
  monthlyAmount: number;
  assignedAreaAdminId: string | null;
  createdAt: string;
  updatedAt?: string; // Optional based on backend selection
  areaId: string; // Foreign key for the Area
  // Include the related Area object with its name
  area?: {
    name: string;
  } | null;
  // Include assigned Area Admin name (keep as before)
  assignedAreaAdmin?: {
    name: string;
  } | null;
}

// Structure for CREATING a new Member (requires areaId)
export interface NewMemberData {
    name: string;
    phone: string;
    // address: string; // REMOVED
    monthlyAmount: number | string;
    areaId: string; // <-- ADDED: ID of the Area to assign
    assignedAreaAdminId?: string | null;
}

// Structure for UPDATING a Member (all fields optional, use areaId)
export type UpdateMemberData = Partial<Omit<NewMemberData, 'assignedAreaAdminId' | 'areaId'>> & {
    // Explicitly list optional fields that can be updated
    name?: string;
    phone?: string;
    monthlyAmount?: number | string;
    areaId?: string; // <-- ADDED: Allow updating Area assignment
    assignedAreaAdminId?: string | null; // Allow updating Area Admin assignment
};


// --- Service Functions ---

// GET all Members (Expects Area name included from backend)
export const getMembers = async (): Promise<MemberData[]> => {
    const SERVICE_NAME = '[MemberService getMembers]';
    try {
        console.log(`${SERVICE_NAME} Fetching...`);
        const response = await apiClient.get<MemberData[]>('/members'); // Backend includes area.name now
        console.log(`${SERVICE_NAME} Fetched ${response.data?.length} members.`);
        return response.data ?? [];
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch members.');
    }
};

// ADD a new Member (Sends areaId instead of address)
export const addMember = async (data: NewMemberData): Promise<MemberData> => {
     const SERVICE_NAME = '[MemberService addMember]';
     // ** CHANGED: Remove address, ensure areaId is present **
     const { address, ...restOfData } = data as any; // Remove address if accidentally passed
     if (!restOfData.areaId) {
         throw new Error('Area ID is required to create a member.');
     }

     try {
        console.log(`${SERVICE_NAME} Sending data:`, restOfData);
        const payload = { ...restOfData, monthlyAmount: Number(restOfData.monthlyAmount) || 0 };
        const response = await apiClient.post<MemberData>('/members', payload);
        console.log(`${SERVICE_NAME} Success response received:`, response.data);
        if (!response.data?.id) throw new Error("Invalid data received after adding member.");
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to add member.');
    }
};

// UPDATE a Member (Sends areaId instead of address if provided)
export const updateMember = async (id: string, data: UpdateMemberData): Promise<MemberData> => {
     const SERVICE_NAME = '[MemberService updateMember]';
     if (!id) { throw new Error('Member ID is required for update.'); }
     try {
        console.log(`${SERVICE_NAME} Updating ID ${id} with data:`, data);
        // ** CHANGED: Prepare payload removing address, potentially adding areaId **
        const { address, ...payload } = data as any; // Remove address if present
        if (payload.monthlyAmount !== undefined) { payload.monthlyAmount = Number(payload.monthlyAmount) || 0; }
        if (payload.assignedAreaAdminId === '') { payload.assignedAreaAdminId = null; } // Handle empty string for unassigning admin
        if (payload.areaId === '') { delete payload.areaId; } // Don't send empty areaId, backend requires it

        console.log(`${SERVICE_NAME} Attempting PUT to /members/${id} with payload:`, payload);
        const response = await apiClient.put<MemberData>(`/members/${id}`, payload);
        console.log(`${SERVICE_NAME} Success response received:`, response.data);
        if (!response.data?.id) { throw new Error("Invalid data received after updating member."); }
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update member.');
    }
};

// DELETE a Member (No changes needed)
export const deleteMember = async (id: string): Promise<void> => { /* ... keep as is ... */ };