// frontend/src/services/memberService.ts (VERIFIED)
import apiClient from '../utils/apiClient';

export interface MemberData {
  id: string;
  name: string;
  phone: string;
  address: string;
  monthlyAmount: number;
  assignedAreaAdminId: string | null;
  createdAt: string;
  assignedAreaAdmin?: { name: string; } | null; // Needed for name display
}
export interface NewMemberData { /* ... keep as is ... */ }
export type UpdateMemberData = Partial<Omit<NewMemberData, 'assignedAreaAdminId'>> & { assignedAreaAdminId?: string | null; };

// --- GET all Members ---
export const getMembers = async (): Promise<MemberData[]> => {
    try {
        console.log('[MemberService] Fetching members...');
        // apiClient includes token, backend filters based on token role
        const response = await apiClient.get<MemberData[]>('/members');
        console.log(`[MemberService] Fetched ${response.data?.length} members.`);
        return response.data ?? []; // Return data or empty array
    } catch (error: any) { /* ... keep error handling ... */ throw new Error( /* ... */ ); }
};

// --- ADD a new Member ---
export const addMember = async (data: NewMemberData): Promise<MemberData> => {
     try {
        console.log('[MemberService] Adding member:', data);
        const payload = { ...data, monthlyAmount: Number(data.monthlyAmount) || 0 };
        const response = await apiClient.post<MemberData>('/members', payload);
        console.log('[MemberService] Added member response:', response.data);
        return response.data;
    } catch (error: any) { /* ... keep error handling ... */ throw new Error( /* ... */ ); }
};

// --- UPDATE a Member ---
export const updateMember = async (id: string, data: UpdateMemberData): Promise<MemberData> => {
    try {
        console.log(`[MemberService] Updating member ID ${id}`);
        const payload = { ...data };
        if (payload.monthlyAmount !== undefined) { payload.monthlyAmount = Number(payload.monthlyAmount) || 0; }
        const response = await apiClient.put<MemberData>(`/members/${id}`, payload);
        console.log('[MemberService] Updated member response:', response.data);
        return response.data;
    } catch (error: any) { /* ... keep error handling ... */ throw new Error( /* ... */ ); }
};

// --- DELETE a Member ---
export const deleteMember = async (id: string): Promise<void> => {
    try {
        console.log(`[MemberService] Deleting member ID: ${id}`);
        await apiClient.delete(`/members/${id}`);
        console.log('[MemberService] Deleted member successfully.');
    } catch (error: any) { /* ... keep error handling ... */ throw new Error( /* ... */ ); }
};