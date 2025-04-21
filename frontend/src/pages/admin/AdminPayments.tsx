// frontend/src/pages/admin/AdminPayments.tsx
// ** FINAL CODE - Incorporating Total Amount & Edit Modal Month Dropdown **

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Select, MenuItem, FormControl, InputLabel, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Button, Grid, Chip // Added Chip
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { format } from 'date-fns';

// Import Services
import {
    getAllPaymentsAdmin, deletePayment, AdminPaymentData, UpdatePaymentData, updatePayment
} from '../../services/paymentService';
import { getAllAreas, AreaData } from '../../services/areaService';

// --- TODO: Replace mock with ACTUAL Confirmation Dialog component ---
interface MockConfirmationDialogProps { open: boolean; onClose: () => void; onConfirm: () => void; title?: string; message?: string; }
const MockConfirmationDialog: React.FC<MockConfirmationDialogProps> = ({ open, onClose, onConfirm, title, message }) => {
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

// --- Month Options Type (Needed for Edit Modal props) ---
type MonthOption = { value: string; label: string };

// --- MUI Dialog based Edit Modal ---
// Modified props to accept monthOptions
interface PaymentEditModalProps {
    open: boolean;
    onClose: () => void;
    payment: AdminPaymentData | null;
    onSave: (id: string, data: UpdatePaymentData) => Promise<void>;
    monthOptions: MonthOption[]; // <-- Added prop
}
// Modified Component definition to accept props correctly
const PaymentEditModal: React.FC<PaymentEditModalProps> = ({ open, onClose, payment, onSave, monthOptions }) => {
    const [formData, setFormData] = useState<UpdatePaymentData>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { /* Effect to set form data */
        if (payment) {
            setFormData({
                amountPaid: payment.amountPaid || '',
                paymentMethod: payment.paymentMethod || 'Cash',
                // Modified: Store month as string for Select value
                paymentMonth: payment.paymentMonth ? String(payment.paymentMonth) : '',
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
           // Modified: Parse month string back to number
           paymentMonth: formData.paymentMonth ? parseInt(String(formData.paymentMonth), 10) : undefined,
           paymentYear: formData.paymentYear ? Number(formData.paymentYear) : undefined,
           paymentDate: formData.paymentDate || undefined,
        };
        Object.keys(dataToSave).forEach(key => { /* Clean undefined keys */ const typedKey = key as keyof UpdatePaymentData; if (dataToSave[typedKey] === undefined || dataToSave[typedKey] === '') { delete dataToSave[typedKey]; } });
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
                     <FormControl fullWidth margin="dense" variant="outlined"> <InputLabel id="paymentMethod-label">Payment Method</InputLabel> <Select labelId="paymentMethod-label" name="paymentMethod" value={formData.paymentMethod || 'Cash'} onChange={handleChange} label="Payment Method"> <MenuItem value="Cash">Cash</MenuItem> <MenuItem value="Online">Online</MenuItem> </Select> </FormControl>

                     {/* --- MODIFIED: Month Selection Dropdown --- */}
                     <FormControl fullWidth margin="dense" variant="outlined">
                         <InputLabel id="paymentMonth-edit-label">Payment Month</InputLabel>
                         <Select
                             labelId="paymentMonth-edit-label"
                             name="paymentMonth" // Matches state key
                             value={formData.paymentMonth || ''} // Ensure value is string '1'-'12'
                             onChange={handleChange}
                             label="Payment Month"
                             error={!formData.paymentMonth} // Basic validation: ensure a month is selected
                         >
                             {/* Map over monthOptions passed as prop */}
                             {monthOptions.map((month) => (
                                 <MenuItem key={month.value} value={month.value}>
                                     {month.label} {/* Display Jan, Feb, etc. */}
                                 </MenuItem>
                             ))}
                         </Select>
                         {!formData.paymentMonth && <Typography color="error" variant="caption">Month is required</Typography>}
                     </FormControl>
                     {/* --- END MODIFIED: Month Selection Dropdown --- */}

                     <TextField margin="dense" name="paymentYear" label="Payment Year (e.g., 2024)" type="number" fullWidth variant="outlined" value={formData.paymentYear || ''} onChange={handleChange} inputProps={{ min: 2000, max: 2100 }} error={!!formData.paymentYear && (Number(formData.paymentYear) < 2000 || Number(formData.paymentYear) > 2100)} helperText={(!!formData.paymentYear && (Number(formData.paymentYear) < 2000 || Number(formData.paymentYear) > 2100)) ? "Valid year" : ""}/>
                     <TextField margin="dense" name="paymentDate" label="Payment Date" type="date" fullWidth variant="outlined" value={formData.paymentDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }}/>
                 </Box>
            </DialogContent>
            <DialogActions> <Button onClick={onClose} disabled={isSaving}>Cancel</Button> <Button onClick={handleSave} variant="contained" color="primary" disabled={isSaving}> {isSaving ? <CircularProgress size={24} /> : 'Save Changes'} </Button> </DialogActions>
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
    const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
    const [selectedRecorderId, setSelectedRecorderId] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
    const [paymentToEdit, setPaymentToEdit] = useState<AdminPaymentData | null>(null);

    const COMPONENT_NAME = '[AdminPaymentDashboard]';

    // --- Helper Function for Month Name ---
    const getMonthName = (monthNumber: number): string => { const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; if (monthNumber >= 1 && monthNumber <= 12) { return monthNames[monthNumber - 1]; } return 'N/A'; };

    // --- Static Month Options (Used for filter AND passed to modal) ---
    const monthOptions: MonthOption[] = useMemo(() => [ { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' }, { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' }, { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' }, { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' } ], []);

    // --- Fetch Data ---
    const loadData = async () => { setLoading(true); setError(null); try { const [paymentsData, areasData] = await Promise.all([getAllPaymentsAdmin(), getAllAreas()]); setPayments(paymentsData); setAreas(areasData); } catch (err: any) { setError(err.message || 'Failed.'); } finally { setLoading(false); } };
    useEffect(() => { loadData(); }, []);

    // --- Generate Unique Lists for Filters ---
    const recorderList = useMemo(() => { const recorders = new Map(); payments.forEach(p => { if (p.recordedBy && !recorders.has(p.recordedBy.id)) { recorders.set(p.recordedBy.id, { id: p.recordedBy.id, name: p.recordedBy.name || `User (${p.recordedBy.id.substring(0,6)}...)`, role: p.recordedBy.role }); } }); return Array.from(recorders.values()).sort((a,b) => (a.name ?? '').localeCompare(b.name ?? '')); }, [payments]);
    const yearList = useMemo(() => { const years = new Set<number>(); payments.forEach(p => years.add(p.paymentYear)); return Array.from(years).sort((a, b) => b - a); }, [payments]);

    // --- Filter Payments based on ALL selected filters ---
    const filteredPayments = useMemo(() => {
        return payments.filter(p =>
            (selectedAreaId === 'all' || p.member?.area?.id === selectedAreaId) &&
            (selectedRecorderId === 'all' || p.recordedBy?.id === selectedRecorderId) &&
            (selectedMonth === 'all' || p.paymentMonth === parseInt(selectedMonth)) &&
            (selectedYear === 'all' || p.paymentYear === parseInt(selectedYear))
        );
    }, [payments, selectedAreaId, selectedRecorderId, selectedMonth, selectedYear]);

    // --- Calculate Total for Filtered Payments ---
    // Uses .reduce() to sum 'amountPaid' from the 'filteredPayments' array.
    const totalFilteredAmount = useMemo(() => {
        return filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    }, [filteredPayments]);
    // --- END Calculate Total ---

    // --- Delete Handling ---
    const handleDeleteClick = (paymentId: string) => { setPaymentToDelete(paymentId); setConfirmOpen(true); };
    const handleConfirmDelete = async () => { if (!paymentToDelete) return; try { await deletePayment(paymentToDelete); setPayments(prev => prev.filter(p => p.id !== paymentToDelete)); } catch (err: any) { setError(`Delete failed: ${err.message}`); } finally { setConfirmOpen(false); setPaymentToDelete(null); } };

     // --- Edit Handling ---
     const handleEditClick = (payment: AdminPaymentData) => { setPaymentToEdit(payment); setEditModalOpen(true); };
     const handleSaveChanges = async (paymentId: string, updatedData: UpdatePaymentData) => { console.log(`${COMPONENT_NAME} Saving changes for payment ${paymentId}`, updatedData); try { const updatedResult = await updatePayment(paymentId, updatedData); setPayments(prev => prev.map(p => { if (p.id === paymentId) { return { ...p, ...updatedResult }; } return p; })); } catch (error: any) { console.error(`${COMPONENT_NAME} Error saving (parent):`, error); throw error; } };

    // --- Rendering ---
    if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>; }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Payment History (Admin View)</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

             {/* Filter Controls & Total Amount Display */}
             <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
                 {/* Filters */}
                 <Grid item xs={12} sm={6} md={2.5}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel id="area-filter-label">Area</InputLabel> <Select labelId="area-filter-label" value={selectedAreaId} label="Area" onChange={(e) => setSelectedAreaId(e.target.value)}> <MenuItem value="all">All Areas</MenuItem> {areas.map((area) => (<MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>))} </Select> </FormControl> </Grid>
                 <Grid item xs={12} sm={6} md={2.5}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel id="recorder-filter-label">Recorder</InputLabel> <Select labelId="recorder-filter-label" value={selectedRecorderId} label="Recorder" onChange={(e) => setSelectedRecorderId(e.target.value)}> <MenuItem value="all">All Recorders</MenuItem> {recorderList.map((recorder) => (<MenuItem key={recorder.id} value={recorder.id}>{`${recorder.name} (${recorder.role})`}</MenuItem>))} </Select> </FormControl> </Grid>
                 <Grid item xs={12} sm={6} md={2.5}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel id="month-filter-label">Month</InputLabel> <Select labelId="month-filter-label" value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}> <MenuItem value="all">All Months</MenuItem> {monthOptions.map((month) => (<MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>))} </Select> </FormControl> </Grid>
                 <Grid item xs={12} sm={6} md={2.5}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel id="year-filter-label">Year</InputLabel> <Select labelId="year-filter-label" value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}> <MenuItem value="all">All Years</MenuItem> {yearList.map((year) => (<MenuItem key={year} value={String(year)}>{year}</MenuItem>))} </Select> </FormControl> </Grid>
                 {/* Total Display */}
                 <Grid item xs={12} md={2} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 1, md: 0 }}}> <Chip label={`Total: ${totalFilteredAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}`} color="primary" sx={{ fontWeight: 'bold', fontSize: '1rem', height: 'auto', '& .MuiChip-label': { p: '8px 12px' } }}/> </Grid>
            </Grid>

            {/* Payments Table */}
            <Paper>
                <TableContainer sx={{ maxHeight: 600 }}> <Table stickyHeader aria-label="payments table">
                        <TableHead> <TableRow> <TableCell>Member</TableCell> <TableCell>Area</TableCell> <TableCell align="center">Amount Paid</TableCell> <TableCell>Date</TableCell> <TableCell>Month/Yr</TableCell> <TableCell>Method</TableCell> <TableCell>Recorded By</TableCell> <TableCell sx={{textAlign: 'center'}}>Actions</TableCell> </TableRow> </TableHead>
                        <TableBody>
                            {filteredPayments.length === 0 && !loading ? ( <TableRow><TableCell colSpan={8} align="center">No payment records found matching filters.</TableCell></TableRow> ) : (
                                filteredPayments.map((payment) => (
                                    <TableRow key={payment.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>{payment.member?.name || 'N/A'}</TableCell>
                                        <TableCell>{payment.member?.area?.name || 'N/A'}</TableCell>
                                        <TableCell align="center">{payment.amountPaid.toLocaleString('en-IN')}</TableCell> {/* Using Center Alignment */}
                                        <TableCell>{payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yy') : 'N/A'}</TableCell>
                                        <TableCell>{getMonthName(payment.paymentMonth)}/{payment.paymentYear}</TableCell>
                                        <TableCell>{payment.paymentMethod}</TableCell>
                                        <TableCell>{payment.recordedBy?.name || 'N/A'} {payment.recordedBy?.role && `(${payment.recordedBy.role})`}</TableCell>
                                        <TableCell sx={{whiteSpace: 'nowrap', textAlign: 'center'}}>
                                            <Tooltip title="Edit Payment"><IconButton size="small" onClick={() => handleEditClick(payment)} color="primary"><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                                            <Tooltip title="Delete Payment"><IconButton size="small" onClick={() => handleDeleteClick(payment.id)} color="error"><DeleteIcon fontSize="inherit"/></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                </Table> </TableContainer>
            </Paper>

             {/* Dialogs */}
             <MockConfirmationDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Confirm Deletion" message="Delete this payment record?" />
             <PaymentEditModal open={editModalOpen} onClose={() => { setEditModalOpen(false); setPaymentToEdit(null); }} payment={paymentToEdit} onSave={handleSaveChanges} monthOptions={monthOptions}/>

        </Box>
    );
}

export default AdminPayments;