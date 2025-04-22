// frontend/src/services/paymentService.ts
// ** Added getPaymentsByMember function **

import apiClient from '../utils/apiClient'; // Use our authenticated client

// --- Interfaces ---

// For RECORDING a new payment (Area Admin Form)
export interface RecordPaymentData {
    memberId: string;
    amountPaid: number | string; // Allow string from form
    paymentMethod: 'Cash' | 'Online';
    paymentMonth: number | string; // Allow string from form
    paymentYear: number | string; // Allow string from form
    paymentDate?: string; // Optional date string (YYYY-MM-DD)
}

// Base Payment data from DB
export interface PaymentBaseData {
    id: string;
    amountPaid: number;
    paymentDate: string; // ISO String date from DB
    paymentMonth: number;
    paymentYear: number;
    paymentMethod: 'Cash' | 'Online';
    createdAt: string; // ISO String date from DB
    memberId: string;
    recordedById: string;
}

// Payment data with basic Member details (Name, Area) - Used by Area Admin History
export interface PaymentDataForAreaAdmin extends PaymentBaseData {
    member: {
        name: string;
        areaId: string;
        area: {
            id: string;
            name: string;
        } | null;
    } | null;
}


// *** NEW *** Payment data structure for the MAIN ADMIN dashboard
// Includes Member (with Area) and RecordedBy (with Role) details
export interface AdminPaymentData extends PaymentBaseData {
    member: {
        id: string;
        name: string;
        // Ensure monthlyAmount is included if needed for other features (like green dot)
        monthlyAmount?: number | null; // Make sure this matches backend if using green dot logic
        areaId: string;
        area: {
            id: string;
            name: string;
        } | null; // Area might be null if deleted? Handle defensively.
    } | null; // Member might be null if deleted? Handle defensively.
    recordedBy: {
        id: string;
        name: string | null; // Admin might not have a name field, adjust if needed
        role: string;        // e.g., 'admin', 'areaAdmin'
    } | null; // Recorder might be null? Handle defensively.
}


// For UPDATING an existing payment (all fields optional)
// This interface is used by both Admin and Area Admin forms/modals
export interface UpdatePaymentData {
    amountPaid?: number | string;
    paymentMethod?: 'Cash' | 'Online';
    paymentMonth?: number | string;
    paymentYear?: number | string;
    paymentDate?: string | null; // Allow YYYY-MM-DD or null/empty to potentially clear date? Check backend logic.
}


// --- Service Functions ---

// RECORD Payment (Area Admin only)
export const recordPayment = async (data: RecordPaymentData): Promise<PaymentBaseData> => {
    const SERVICE_NAME = '[PaymentService recordPayment]';
    try {
        console.log(`${SERVICE_NAME} Recording payment:`, data);
        const payload = {
            ...data,
            amountPaid: Number(data.amountPaid) || 0,
            paymentMonth: Number(data.paymentMonth) || 0,
            paymentYear: Number(data.paymentYear) || 0,
        };
        if (!payload.paymentDate || payload.paymentDate.trim() === '') {
             delete payload.paymentDate;
        }
        if (payload.amountPaid <=0 || payload.paymentMonth <= 0 || payload.paymentYear <= 0) { throw new Error("Invalid amount, month, or year provided."); }
        const response = await apiClient.post<PaymentBaseData>('/payments', payload);
        console.log(`${SERVICE_NAME} Payment recorded response:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error recording payment:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to record payment.');
    }
};

// GET Payments recorded BY the logged-in Area Admin
export const getMyAreaPayments = async (): Promise<PaymentDataForAreaAdmin[]> => {
    const SERVICE_NAME = '[PaymentService getMyAreaPayments]';
    try {
        console.log(`${SERVICE_NAME} Fetching payments for Area Admin...`);
        const response = await apiClient.get<PaymentDataForAreaAdmin[]>('/payments/my-area');
        console.log(`${SERVICE_NAME} Fetched ${response.data?.length} payments.`);
        return response.data ?? [];
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment history.');
    }
};

// GET ALL Payments (For Admin Dashboard)
export const getAllPaymentsAdmin = async (): Promise<AdminPaymentData[]> => {
    const SERVICE_NAME = '[PaymentService getAllPaymentsAdmin]';
    try {
        console.log(`${SERVICE_NAME} Fetching ALL payments for Admin...`);
        const response = await apiClient.get<AdminPaymentData[]>('/payments/all');
        console.log(`${SERVICE_NAME} Fetched ${response.data?.length} total payments.`);
        return response.data ?? [];
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        console.error(`${SERVICE_NAME} Full error object:`, error);
        if (error.response) {
            console.error(`${SERVICE_NAME} Error Response Status:`, error.response.status);
            console.error(`${SERVICE_NAME} Error Response Data:`, error.response.data);
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch all payment history.');
    }
};


// UPDATE a specific Payment record (Used by Admin and Area Admin)
export const updatePayment = async (paymentId: string, data: UpdatePaymentData): Promise<PaymentBaseData> => { // Return PaymentBaseData
     const SERVICE_NAME = '[PaymentService updatePayment]';
     if (!paymentId) throw new Error('Payment ID is required for update.');
     try {
        console.log(`${SERVICE_NAME} Updating payment ID ${paymentId} with data:`, data);
        const payload: UpdatePaymentData = { ...data };
        if (payload.amountPaid !== undefined) { const numAmount = Number(payload.amountPaid); if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid amount provided for update.'); payload.amountPaid = numAmount; } else { delete payload.amountPaid; }
        if (payload.paymentMonth !== undefined) { payload.paymentMonth = Number(payload.paymentMonth); } else { delete payload.paymentMonth; }
        if (payload.paymentYear !== undefined) { payload.paymentYear = Number(payload.paymentYear); } else { delete payload.paymentYear; }
        if (payload.paymentDate === undefined || payload.paymentDate === null || payload.paymentDate.trim() === '') { delete payload.paymentDate; } else { if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.paymentDate)) { console.warn(`${SERVICE_NAME} Potentially invalid date format: ${payload.paymentDate}`); } }
        if (payload.paymentMethod === undefined) { delete payload.paymentMethod; }

        console.log(`${SERVICE_NAME} Attempting PUT to /payments/${paymentId} with payload:`, payload);
        const response = await apiClient.put<PaymentBaseData>(`/payments/${paymentId}`, payload); // Expect PaymentBaseData
        console.log(`${SERVICE_NAME} Update successful: Status=${response.status}, Data:`, response.data);
        if (!response.data?.id) throw new Error("Invalid data received after update.");
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught: Status=${error.response?.status}, Data=`, error.response?.data || error.message || error);
        throw new Error(error.response?.data?.message || 'Failed to update payment.');
    }
};

// DELETE a specific Payment record (Used by Admin and Area Admin)
export const deletePayment = async (paymentId: string): Promise<void> => {
     const SERVICE_NAME = '[PaymentService deletePayment]';
     if (!paymentId) throw new Error('Payment ID is required for deletion.');
    try {
        console.log(`${SERVICE_NAME} Deleting payment ID: ${paymentId}`);
        console.log(`${SERVICE_NAME} Attempting DELETE to /payments/${paymentId}...`);
        const response = await apiClient.delete(`/payments/${paymentId}`);
        console.log(`${SERVICE_NAME} DELETE request successful (Status: ${response.status})`);
    } catch (error: any) {
         console.error(`${SERVICE_NAME} Error caught: Status=${error.response?.status}, Data=`, error.response?.data || error.message || error);
         throw new Error(error.response?.data?.message || 'Failed to delete payment.');
    }
};


// *** ADDED FUNCTION TO GET PAYMENTS FOR A SPECIFIC MEMBER ***
export const getPaymentsByMember = async (memberId: string): Promise<AdminPaymentData[]> => {
    const SERVICE_NAME = '[PaymentService getPaymentsByMember]';
    if (!memberId) {
        console.error(`${SERVICE_NAME} Member ID is required.`);
        return []; // Return empty array if no ID provided
    }
    try {
        console.log(`${SERVICE_NAME} Fetching payments for Member ID: ${memberId}`);

        // --- IMPORTANT ---
        // Assumes backend endpoint is: GET /api/payments?memberId=some_id
        // Adjust '/payments' and params:{memberId} if your backend route is different
        // e.g., if it's '/members/${memberId}/payments', change the URL and remove params
        const response = await apiClient.get<AdminPaymentData[]>('/payments', {
            params: { memberId: memberId } // Sending memberId as a query parameter
        });
        // --- END IMPORTANT ---

        console.log(`${SERVICE_NAME} Fetched ${response.data?.length} payments for member ${memberId}.`);
        return response.data ?? []; // Return data or empty array
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught fetching payments for member ${memberId}:`, error.response?.data || error.message);
        // Log the full error for debugging backend issues
        console.error(`${SERVICE_NAME} Full error object:`, error);
         if (error.response) {
            console.error(`${SERVICE_NAME} Error Response Status:`, error.response.status);
            console.error(`${SERVICE_NAME} Error Response Data:`, error.response.data);
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch member payment history.');
    }
};
// *** END ADDED FUNCTION ***