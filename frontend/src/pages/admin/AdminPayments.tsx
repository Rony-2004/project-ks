// frontend/src/pages/admin/AdminPayments.tsx
// ** PASTE THIS ENTIRE CODE **

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Select, MenuItem, FormControl, InputLabel, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Button, Grid
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { format } from 'date-fns';

// Import Services
import {
    getAllPaymentsAdmin, deletePayment, AdminPaymentData, UpdatePaymentData, updatePayment
} from '../../services/paymentService';
import { getAllAreas, AreaData } from '../../services/areaService';

// --- Mock Confirmation Dialog (Replace with your actual implementation) ---
const MockConfirmationDialog = ({ open, onClose, onConfirm, title, message }: any) => {
    if (!open) return null;
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title || "Confirm Action"}</DialogTitle>
            <DialogContent><DialogContentText>{message || "Are you sure?"}</DialogContentText></DialogContent>
            <DialogActions>
                 <Button onClick={onClose} color="primary">Cancel</Button>
                 <Button onClick={onConfirm} variant="contained" color="error" autoFocus>Confirm</Button>
            </DialogActions>
        </Dialog>
    );
};
// --- End Mock Confirmation Dialog ---

// --- MUI Dialog based Edit Modal (Should be kept as is) ---
const PaymentEditModal = ({ open, onClose, payment, onSave }: { /* Props */ }) => {
    const [formData, setFormData] = useState<UpdatePaymentData>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { /* Effect to set form data */
        if (payment) {
            setFormData({
                amountPaid: payment.amountPaid || '',
                paymentMethod: payment.paymentMethod || 'Cash',
                paymentMonth: payment.paymentMonth || '',
                paymentYear: payment.paymentYear || '',
                paymentDate: payment.paymentDate ? format(new Date(payment.paymentDate), 'yyyy-MM-dd') : '',
            });
        } else { setFormData({}); }
        setIsSaving(false); setError(null);
    }, [payment, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => { /* Handle input change */
        const target = e.target as (HTMLInputElement & { name?: string });
        const name = target.name; const value = target.value;
        if (name) { setFormData(prev => ({ ...prev, [name]: value })); }
    };

    const handleSave = async () => { /* Handle save action */
        if (!payment) return; setError(null); setIsSaving(true);
        const dataToSave: UpdatePaymentData = {
           amountPaid: formData.amountPaid ? Number(formData.amountPaid) : undefined,
           paymentMethod: formData.paymentMethod,
           paymentMonth: formData.paymentMonth ? Number(formData.paymentMonth) : undefined,
           paymentYear: formData.paymentYear ? Number(formData.paymentYear) : undefined,
           paymentDate: formData.paymentDate || undefined,
        };
        Object.keys(dataToSave).forEach(key => { /* Clean undefined keys */
            const typedKey = key as keyof UpdatePaymentData;
            if (dataToSave[typedKey] === undefined || dataToSave[typedKey] === '') { delete dataToSave[typedKey]; }
        });
        try { await onSave(payment.id, dataToSave); onClose(); }
        catch (err: any) { console.error("Error saving:", err); setError(err.message || "Failed."); }
        finally { setIsSaving(false); }
    };

    if (!open || !payment) return null;

    return ( /* MUI Dialog JSX for editing */
        <Dialog open={open} onClose={onClose} aria-labelledby="edit-payment-dialog-title">
            <DialogTitle id="edit-payment-dialog-title">Edit Payment for {payment?.member?.name || 'Member'}</DialogTitle>
            <DialogContent>
                 <DialogContentText sx={{ mb: 2 }}>Modify details below.</DialogContentText>
                 {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                 <Box component="form" noValidate autoComplete="off">
                     <TextField autoFocus margin="dense" name="amountPaid" label="Amount Paid" type="number" fullWidth variant="outlined" value={formData.amountPaid || ''} onChange={handleChange} error={!!formData.amountPaid && Number(formData.amountPaid) <= 0} helperText={!!formData.amountPaid && Number(formData.amountPaid) <= 0 ? "Must be positive" : ""}/>
                     <FormControl fullWidth margin="dense" variant="outlined">
                         <InputLabel id="paymentMethod-label">Payment Method</InputLabel>
                         <Select labelId="paymentMethod-label" name="paymentMethod" value={formData.paymentMethod || 'Cash'} onChange={handleChange} label="Payment Method"> <MenuItem value="Cash">Cash</MenuItem> <MenuItem value="Online">Online</MenuItem> </Select>
                     </FormControl>
                     <TextField margin="dense" name="paymentMonth" label="Payment Month (1-12)" type="number" fullWidth variant="outlined" value={formData.paymentMonth || ''} onChange={handleChange} inputProps={{ min: 1, max: 12 }} error={!!formData.paymentMonth && (Number(formData.paymentMonth) < 1 || Number(formData.paymentMonth) > 12)} helperText={(!!formData.paymentMonth && (Number(formData.paymentMonth) < 1 || Number(formData.paymentMonth) > 12)) ? "1-12" : ""}/>
                     <TextField margin="dense" name="paymentYear" label="Payment Year (e.g., 2024)" type="number" fullWidth variant="outlined" value={formData.paymentYear || ''} onChange={handleChange} inputProps={{ min: 2000, max: 2100 }} error={!!formData.paymentYear && (Number(formData.paymentYear) < 2000 || Number(formData.paymentYear) > 2100)} helperText={(!!formData.paymentYear && (Number(formData.paymentYear) < 2000 || Number(formData.paymentYear) > 2100)) ? "Valid year" : ""}/>
                     <TextField margin="dense" name="paymentDate" label="Payment Date" type="date" fullWidth variant="outlined" value={formData.paymentDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }}/>
                 </Box>
            </DialogContent>
            <DialogActions>
                 <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                 <Button onClick={handleSave} variant="contained" color="primary" disabled={isSaving}> {isSaving ? <CircularProgress size={24} /> : 'Save Changes'} </Button>
            </DialogActions>
        </Dialog>
     );
};
// --- End Edit Modal ---


// ** Main Admin Payments Component **
function AdminPayments() {
    // --- State ---
    const [payments, setPayments] = useState<AdminPaymentData[]>([]);
    const [areas, setAreas] = useState<AreaData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
    const [selectedRecorderId, setSelectedRecorderId] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all'); // <-- Month filter state
    const [selectedYear, setSelectedYear] = useState<string>('all');   // <-- Year filter state

    // Dialog States
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
    const [paymentToEdit, setPaymentToEdit] = useState<AdminPaymentData | null>(null);

    const COMPONENT_NAME = '[AdminPaymentDashboard]';

    // --- Helper Function for Month Name ---
    const getMonthName = (monthNumber: number): string => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (monthNumber >= 1 && monthNumber <= 12) { return monthNames[monthNumber - 1]; }
        return 'N/A';
    };

    // Static list for Month Filter Dropdown
    const monthOptions = useMemo(() => [
        { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
        { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
        { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' },
        { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
    ], []); // Empty dependency array means it's created only once


    // --- Fetch Data ---
    const loadData = async () => { /* Fetch logic remains the same */
        setLoading(true); setError(null); console.log(`${COMPONENT_NAME} Fetching data...`);
        try {
            const [paymentsData, areasData] = await Promise.all([getAllPaymentsAdmin(), getAllAreas()]);
            setPayments(paymentsData); setAreas(areasData); console.log(`${COMPONENT_NAME} Data fetched.`);
        } catch (err: any) { console.error(`${COMPONENT_NAME} Error fetching:`, err); setError(err.message || 'Failed.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    // --- Generate Unique Lists for Filters ---
    const recorderList = useMemo(() => { /* Recorder list logic remains the same */
        const recorders = new Map<string, { id: string; name: string | null; role: string }>();
        payments.forEach(payment => {
            if (payment.recordedBy && !recorders.has(payment.recordedBy.id)) {
                recorders.set(payment.recordedBy.id, {
                    id: payment.recordedBy.id,
                    name: payment.recordedBy.name || `User (${payment.recordedBy.id.substring(0, 6)}...)`,
                    role: payment.recordedBy.role }); } });
        return Array.from(recorders.values()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }, [payments]);

    const yearList = useMemo(() => { // <-- Generate Year List
        const years = new Set<number>();
        payments.forEach(p => years.add(p.paymentYear));
        return Array.from(years).sort((a, b) => b - a); // Sort years descending
    }, [payments]);


    // --- Filter Payments based on ALL selected filters ---
    const filteredPayments = useMemo(() => {
        return payments.filter(p =>
            (selectedAreaId === 'all' || p.member?.area?.id === selectedAreaId) &&
            (selectedRecorderId === 'all' || p.recordedBy?.id === selectedRecorderId) &&
            (selectedMonth === 'all' || p.paymentMonth === parseInt(selectedMonth)) && // Filter by month
            (selectedYear === 'all' || p.paymentYear === parseInt(selectedYear))     // Filter by year
        );
    }, [payments, selectedAreaId, selectedRecorderId, selectedMonth, selectedYear]); // <-- Add month/year dependencies

    // --- Delete Handling (remains the same) ---
    const handleDeleteClick = (paymentId: string) => { setPaymentToDelete(paymentId); setConfirmOpen(true); };
    const handleConfirmDelete = async () => { /* Delete logic */
        if (!paymentToDelete) return;
        try { await deletePayment(paymentToDelete); setPayments(prev => prev.filter(p => p.id !== paymentToDelete)); }
        catch (err: any) { console.error(`${COMPONENT_NAME} Error deleting:`, err); setError(`Failed delete: ${err.message}`); }
        finally { setConfirmOpen(false); setPaymentToDelete(null); }
    };

     // --- Edit Handling (remains the same) ---
     const handleEditClick = (payment: AdminPaymentData) => { setPaymentToEdit(payment); setEditModalOpen(true); };
     const handleSaveChanges = async (paymentId: string, updatedData: UpdatePaymentData) => { /* Save logic */
         const updatedPaymentResult = await updatePayment(paymentId, updatedData);
         setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, ...updatedPaymentResult, ...updatedData } : p ));
         console.log(`${COMPONENT_NAME} Payment ${paymentId} updated state.`);
     };

    // --- Rendering ---
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Payment History (Admin View)</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

             {/* --- Filter Controls --- */}
             <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
                 {/* Area Filter */}
                 <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
                     <FormControl fullWidth variant="outlined" size="small">
                         <InputLabel id="area-filter-label">Area</InputLabel>
                         <Select labelId="area-filter-label" value={selectedAreaId} label="Area" onChange={(e) => setSelectedAreaId(e.target.value)}>
                             <MenuItem value="all">All Areas</MenuItem>
                             {areas.map((area) => (<MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>))}
                         </Select>
                     </FormControl>
                 </Grid>

                 {/* Recorder Filter */}
                 <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
                     <FormControl fullWidth variant="outlined" size="small">
                         <InputLabel id="recorder-filter-label">Recorder</InputLabel>
                         <Select labelId="recorder-filter-label" value={selectedRecorderId} label="Recorder" onChange={(e) => setSelectedRecorderId(e.target.value)}>
                             <MenuItem value="all">All Recorders</MenuItem>
                             {recorderList.map((recorder) => (<MenuItem key={recorder.id} value={recorder.id}>{`${recorder.name} (${recorder.role})`}</MenuItem>))}
                         </Select>
                     </FormControl>
                 </Grid>

                 {/* Month Filter */}
                 <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
                     <FormControl fullWidth variant="outlined" size="small">
                         <InputLabel id="month-filter-label">Month</InputLabel>
                         <Select labelId="month-filter-label" value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                             <MenuItem value="all">All Months</MenuItem>
                             {monthOptions.map((month) => (<MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>))}
                         </Select>
                     </FormControl>
                 </Grid>

                 {/* Year Filter */}
                 <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
                     <FormControl fullWidth variant="outlined" size="small">
                         <InputLabel id="year-filter-label">Year</InputLabel>
                         <Select labelId="year-filter-label" value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
                             <MenuItem value="all">All Years</MenuItem>
                             {yearList.map((year) => (<MenuItem key={year} value={String(year)}>{year}</MenuItem>))}
                         </Select>
                     </FormControl>
                 </Grid>
            </Grid>
             {/* --- End Filter Controls --- */}


            {/* Payments Table */}
            <Paper>
                <TableContainer sx={{ maxHeight: 600 }}> {/* Optional: Add max height for scroll */}
                    <Table stickyHeader aria-label="payments table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Member Name</TableCell>
                                <TableCell>Area</TableCell>
                                <TableCell>Amount Paid</TableCell>
                                <TableCell>Payment Date</TableCell>
                                <TableCell>Month/Year</TableCell>
                                <TableCell>Method</TableCell>
                                <TableCell>Recorded By</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPayments.length === 0 && !loading ? (
                                <TableRow><TableCell colSpan={8} align="center">No payment records found matching filters.</TableCell></TableRow>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <TableRow key={payment.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row">{payment.member?.name || 'N/A'}</TableCell>
                                        <TableCell>{payment.member?.area?.name || 'N/A'}</TableCell>
                                        <TableCell>{payment.amountPaid}</TableCell>
                                        <TableCell>{payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yy') : 'N/A'}</TableCell> {/* Shortened year format */}
                                        <TableCell>{getMonthName(payment.paymentMonth)}/{payment.paymentYear}</TableCell>
                                        <TableCell>{payment.paymentMethod}</TableCell>
                                        <TableCell>{payment.recordedBy?.name || `User ID: ${payment.recordedBy?.id}` || 'N/A'} {payment.recordedBy?.role && `(${payment.recordedBy.role})`}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit Payment"><IconButton size="small" onClick={() => handleEditClick(payment)} color="primary"><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                                            <Tooltip title="Delete Payment"><IconButton size="small" onClick={() => handleDeleteClick(payment.id)} color="error"><DeleteIcon fontSize="inherit"/></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Confirmation Dialog (Using Mock - Replace with yours) */}
             <MockConfirmationDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Confirm Deletion" message="Delete this payment record?" />
             {/* Edit Modal */}
             <PaymentEditModal open={editModalOpen} onClose={() => { setEditModalOpen(false); setPaymentToEdit(null); }} payment={paymentToEdit} onSave={handleSaveChanges} />

        </Box>
    );
}

export default AdminPayments;