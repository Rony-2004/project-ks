// frontend/src/services/paymentService.ts
import apiClient from '../utils/apiClient'; // Use our authenticated client

// Interface for the data needed to record a payment
export interface RecordPaymentData {
    memberId: string;
    amountPaid: number | string; // Allow string from form, convert later
    paymentMethod: 'Cash' | 'Online'; // Use specific types
    paymentMonth: number | string; // Allow string from form
    paymentYear: number | string; // Allow string from form
    paymentDate?: string; // Optional date string (YYYY-MM-DD), backend defaults to now if missing
}

// Interface for the data returned by the backend after creating a payment
export interface PaymentData {
    id: string;
    amountPaid: number;
    paymentDate: string; // ISO String date
    paymentMonth: number;
    paymentYear: number;
    paymentMethod: 'Cash' | 'Online';
    createdAt: string;
    memberId: string;
    recordedById: string;
}

// Function to call the backend POST /api/payments endpoint
export const recordPayment = async (data: RecordPaymentData): Promise<PaymentData> => {
    try {
        console.log('[PaymentService] Recording payment:', data);
        // Ensure numeric fields are numbers before sending
        const payload = {
            ...data,
            amountPaid: Number(data.amountPaid) || 0,
            paymentMonth: Number(data.paymentMonth) || 0,
            paymentYear: Number(data.paymentYear) || 0,
        };
        // Remove paymentDate if it's empty, so backend uses default
        if (!payload.paymentDate) {
            delete payload.paymentDate;
        }

        if (payload.amountPaid <=0 || payload.paymentMonth <= 0 || payload.paymentYear <= 0) {
            throw new Error("Invalid amount, month, or year provided.");
        }

        const response = await apiClient.post<PaymentData>('/payments', payload); // Use relative path
        console.log('[PaymentService] Payment recorded response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('[PaymentService] Error recording payment:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to record payment.');
    }
};

// Add functions later to GET payments if needed
// export const getPaymentsForMember = async (memberId: string): Promise<PaymentData[]> => { ... };