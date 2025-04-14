// frontend/src/services/memberService.ts
import apiClient from '../utils/apiClient'; // Import the configured Axios instance

// Define the structure of Member data EXPECTED FROM THE BACKEND NOW
export interface MemberData {
  id: string;
  name: string;
  phone: string;
  address: string;
  monthlyAmount: number;
  assignedAreaAdminId: string | null;
  createdAt: string; // Dates often come as strings from JSON
  // --- Ensure this nested field is defined ---
  assignedAreaAdmin?: { // Optional (because relation might be null)
    name: string;
  } | null;
  // --- End ensure ---
}

// Define the structure for creating a new Member
export interface NewMemberData {
    name: string;
    phone: string;
    address: string;
    monthlyAmount: number | string; // Allow string input initially from forms
    assignedAreaAdminId?: string | null; // Optional on creation
}

// Define the structure for updating a Member (all fields optional)
export type UpdateMemberData = Partial<Omit<NewMemberData, 'assignedAreaAdminId'>> & {
    // Allow updating assignedAreaAdminId separately or together
    assignedAreaAdminId?: string | null;
};


// --- Function to GET all Members ---
export const getMembers = async (): Promise<MemberData[]> => {
    try {
        console.log('Service: Fetching members...');
        const response = await apiClient.get<MemberData[]>('/members'); // Use relative path
        console.log('Service: Fetched members:', response.data);
        return response.data; // API now returns the nested name if available
    } catch (error: any) {
        console.error('Service: Error fetching members:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch members.');
    }
};

// --- Function to ADD a new Member ---
export const addMember = async (data: NewMemberData): Promise<MemberData> => {
     try {
        console.log('Service: Adding member:', data);
        const payload = { ...data, monthlyAmount: Number(data.monthlyAmount) || 0 };
        const response = await apiClient.post<MemberData>('/members', payload);
         console.log('Service: Added member response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Service: Error adding member:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to add member.');
    }
};

// --- Function to UPDATE a Member ---
export const updateMember = async (id: string, data: UpdateMemberData): Promise<MemberData> => {
    const SERVICE_NAME = '[MemberService updateMember]';
    if (!id) {
        console.error(`${SERVICE_NAME} Error: Missing ID for update.`);
        throw new Error('Member ID is required for update.');
    }
    try {
        console.log(`${SERVICE_NAME} Updating ID ${id} with data:`, data);
        // Prepare payload - ensure amount is number if present
        const payload = { ...data };
        if (payload.monthlyAmount !== undefined && payload.monthlyAmount !== null) {
            const numAmount = Number(payload.monthlyAmount);
            if (isNaN(numAmount)) {
                 console.error(`${SERVICE_NAME} Error: Invalid monthly amount format:`, payload.monthlyAmount);
                 throw new Error('Invalid number format for monthly amount.');
            }
            payload.monthlyAmount = numAmount;
        } else {
            // If explicitly passed as undefined maybe remove it? Or backend handles undefined fields.
            // Let's remove it if it wasn't provided or was invalid before Number conversion
            if (data.monthlyAmount === undefined) delete payload.monthlyAmount;
        }

        console.log(`<span class="math-inline">\{SERVICE\_NAME\} Attempting PUT to /members/</span>{id} with payload:`, payload);
        // Using apiClient which includes token
        const response = await apiClient.put<MemberData>(`/members/${id}`, payload);
        console.log(`<span class="math-inline">\{SERVICE\_NAME\} Success response received\: Status\=</span>{response.status}, Data:`, response.data);
        if (!response.data?.id) {
            console.error(`${SERVICE_NAME} Error: Invalid data received after update.`);
            throw new Error("Invalid data received after updating member.");
        }
        return response.data;
    } catch (error: any) {
        // Log detailed error info and throw a clean message
        console.error(`<span class="math-inline">\{SERVICE\_NAME\} Error caught\: Status\=</span>{error.response?.status}, Data=`, error.response?.data || error.message || error);
        throw new Error(error.response?.data?.message || 'Failed to update member.'); // Always throw
    }
};



// --- Function to DELETE a Member ---
export const deleteMember = async (id: string): Promise<void> => {
    try {
        console.log(`Service: Deleting member with ID: ${id}`);
        await apiClient.delete(`/members/${id}`);
        console.log('Service: Deleted member successfully');
    } catch (error: any) {
         console.error('Service: Error deleting member:', error.response?.data || error.message);
         throw new Error(error.response?.data?.message || 'Failed to delete member.');
    }
};