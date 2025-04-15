// frontend/src/services/paymentService.ts (ADDED GET/UPDATE/DELETE)
import apiClient from '../utils/apiClient'; // Use our authenticated client

// --- Interfaces ---

// For RECORDING a new payment
export interface RecordPaymentData {
    memberId: string;
    amountPaid: number | string; // Allow string from form
    paymentMethod: 'Cash' | 'Online';
    paymentMonth: number | string; // Allow string from form
    paymentYear: number | string; // Allow string from form
    paymentDate?: string; // Optional date string (YYYY-MM-DD)
}

// For data returned by backend AFTER CREATING/UPDATING a payment
export interface PaymentData {
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

// For data returned by backend when GETTING payment list (includes member name)
export interface PaymentDataWithMember extends Omit<PaymentData, 'memberId'> {
    member: { // Nested member object with name
        name: string;
    } | null; // Handle potential null if member deleted/relation issue
    memberId: string; // Still include memberId for reference
}

// For UPDATING an existing payment (all fields optional)
export interface UpdatePaymentData {
    amountPaid?: number | string;
    paymentMethod?: 'Cash' | 'Online';
    paymentMonth?: number | string;
    paymentYear?: number | string;
    paymentDate?: string; // YYYY-MM-DD
}


// --- Service Functions ---

// RECORD Payment (Keep as is)
export const recordPayment = async (data: RecordPaymentData): Promise<PaymentData> => {
    const SERVICE_NAME = '[PaymentService recordPayment]';
    try {
        console.log(`${SERVICE_NAME} Recording payment:`, data);
        const payload = { ...data, amountPaid: Number(data.amountPaid) || 0, paymentMonth: Number(data.paymentMonth) || 0, paymentYear: Number(data.paymentYear) || 0, };
        if (!payload.paymentDate) { delete payload.paymentDate; }
        if (payload.amountPaid <=0 || payload.paymentMonth <= 0 || payload.paymentYear <= 0) { throw new Error("Invalid amount, month, or year provided."); }
        const response = await apiClient.post<PaymentData>('/payments', payload);
        console.log(`${SERVICE_NAME} Payment recorded response:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error recording payment:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to record payment.');
    }
};

// **NEW** GET Payments recorded by Area Admin
export const getMyAreaPayments = async (): Promise<PaymentDataWithMember[]> => {
    const SERVICE_NAME = '[PaymentService getMyAreaPayments]';
    try {
        console.log(`${SERVICE_NAME} Fetching payments...`);
        // Uses apiClient (sends token), calls GET /api/payments/my-area
        const response = await apiClient.get<PaymentDataWithMember[]>('/payments/my-area');
        console.log(`${SERVICE_NAME} Fetched ${response.data?.length} payments.`);
        return response.data ?? []; // Return data or empty array
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment history.');
    }
};

// **NEW** UPDATE a specific Payment record
export const updatePayment = async (paymentId: string, data: UpdatePaymentData): Promise<PaymentData> => {
     const SERVICE_NAME = '[PaymentService updatePayment]';
     if (!paymentId) throw new Error('Payment ID is required for update.');
     try {
        console.log(`${SERVICE_NAME} Updating payment ID ${paymentId} with data:`, data);
        // Prepare payload, ensure amount is number if present
        const payload = { ...data };
        if (payload.amountPaid !== undefined) {
            const numAmount = Number(payload.amountPaid);
            if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid amount provided for update.');
            payload.amountPaid = numAmount;
        }
        // Remove date if empty string was somehow passed
        if (payload.paymentDate === '') delete payload.paymentDate;

        console.log(`${SERVICE_NAME} Attempting PUT to /payments/${paymentId} with payload:`, payload);
        // Uses apiClient (sends token)
        const response = await apiClient.put<PaymentData>(`/payments/${paymentId}`, payload);
        console.log(`${SERVICE_NAME} Update successful: Status=${response.status}, Data:`, response.data);
        if (!response.data?.id) throw new Error("Invalid data received after update.");
        return response.data;
    } catch (error: any) {
        console.error(`${SERVICE_NAME} Error caught: Status=${error.response?.status}, Data=`, error.response?.data || error.message || error);
        throw new Error(error.response?.data?.message || 'Failed to update payment.');
    }
};

// **NEW** DELETE a specific Payment record
export const deletePayment = async (paymentId: string): Promise<void> => {
     const SERVICE_NAME = '[PaymentService deletePayment]';
     if (!paymentId) throw new Error('Payment ID is required for deletion.');
    try {
        console.log(`${SERVICE_NAME} Deleting payment ID: ${paymentId}`);
        console.log(`${SERVICE_NAME} Attempting DELETE to /payments/${paymentId}...`);
        // Uses apiClient (sends token)
        const response = await apiClient.delete(`/payments/${paymentId}`);
        console.log(`${SERVICE_NAME} DELETE request successful (Status: ${response.status})`);
        // No return needed for success (usually 204 No Content)
    } catch (error: any) {
         console.error(`${SERVICE_NAME} Error caught: Status=${error.response?.status}, Data=`, error.response?.data || error.message || error);
         throw new Error(error.response?.data?.message || 'Failed to delete payment.');
    }
};