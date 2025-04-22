// frontend/src/pages/admin/AdminPayments.tsx
// ** FINAL CODE - Added Eye Icon Button to View Ledger **

import React, { useState, useEffect, useMemo } from 'react';
// Removed Link import as it's not needed for this component's primary function now
import {
    Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Select, MenuItem, FormControl, InputLabel, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Button, Grid, Chip,
    InputAdornment, List, ListItem, ListItemText, Divider
} from '@mui/material';
// Import Icons
import {
    Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon,
    Visibility as VisibilityIcon // <-- Import Eye icon
} from '@mui/icons-material';
import { format, getMonth, getYear, isValid, startOfMonth, isAfter } from 'date-fns';

// Import Services - ** Ensure paths/functions are correct **
import { getMembers } from '../../services/memberService';
import { getAllAreas, AreaData } from '../../services/areaService';
import {
    getAllPaymentsAdmin, deletePayment, AdminPaymentData, UpdatePaymentData, updatePayment,
    getPaymentsByMember // <-- ASSUME this service function exists
} from '../../services/paymentService';
import { getAreaAdmins } from '../../services/areaAdminService';

// Import CSS Module (Optional)
import styles from './AdminOverview.module.css'; // Assuming CSS module exists

// --- TODO: Replace mock with ACTUAL Confirmation Dialog component ---
interface MockConfirmationDialogProps { open: boolean; onClose: () => void; onConfirm: () => void; title?: string; message?: string; }
const MockConfirmationDialog: React.FC<MockConfirmationDialogProps> = ({ open, onClose, onConfirm, title, message }) => { /* Mock Dialog JSX */ if (!open) return null; return ( <Dialog open={open} onClose={onClose}> <DialogTitle>{title || "Confirm Action"}</DialogTitle> <DialogContent><DialogContentText>{message || "Are you sure?"}</DialogContentText></DialogContent> <DialogActions> <Button onClick={onClose} color="primary">Cancel</Button> <Button onClick={onConfirm} variant="contained" color="error" autoFocus>Confirm</Button> </DialogActions> </Dialog> ); };

// --- Month Options Type ---
type MonthOption = { value: string; label: string };

// --- MUI Dialog based Edit Modal (with Month Dropdown) ---
interface PaymentEditModalProps { open: boolean; onClose: () => void; payment: AdminPaymentData | null; onSave: (id: string, data: UpdatePaymentData) => Promise<void>; monthOptions: MonthOption[];}
const PaymentEditModal: React.FC<PaymentEditModalProps> = ({ open, onClose, payment, onSave, monthOptions }) => { /* Edit Modal JSX (no changes) */ const [formData, setFormData] = useState<UpdatePaymentData>({}); const [isSaving, setIsSaving] = useState(false); const [error, setError] = useState<string | null>(null); useEffect(() => { if (payment) { setFormData({ amountPaid: payment.amountPaid || '', paymentMethod: payment.paymentMethod || 'Cash', paymentMonth: payment.paymentMonth ? String(payment.paymentMonth) : '', paymentYear: payment.paymentYear || '', paymentDate: payment.paymentDate ? format(new Date(payment.paymentDate), 'yyyy-MM-dd') : '', }); } else { setFormData({}); } setIsSaving(false); setError(null); }, [payment, open]); const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => { const target = e.target as (HTMLInputElement & { name?: string }); const name = target.name; const value = target.value; if (name) { setFormData(prev => ({ ...prev, [name]: value })); } }; const handleSave = async () => { if (!payment) return; setError(null); setIsSaving(true); const dataToSave: UpdatePaymentData = { amountPaid: formData.amountPaid ? Number(formData.amountPaid) : undefined, paymentMethod: formData.paymentMethod, paymentMonth: formData.paymentMonth ? parseInt(String(formData.paymentMonth), 10) : undefined, paymentYear: formData.paymentYear ? Number(formData.paymentYear) : undefined, paymentDate: formData.paymentDate || undefined, }; Object.keys(dataToSave).forEach(key => { const typedKey = key as keyof UpdatePaymentData; if (dataToSave[typedKey] === undefined || dataToSave[typedKey] === '') { delete dataToSave[typedKey]; } }); try { await onSave(payment.id, dataToSave); onClose(); } catch (err: any) { setError(err.message || "Failed."); } finally { setIsSaving(false); } }; if (!open || !payment) return null; return ( <Dialog open={open} onClose={onClose} aria-labelledby="edit-payment-dialog-title"> <DialogTitle id="edit-payment-dialog-title">Edit Payment for {payment?.member?.name || 'Member'}</DialogTitle> <DialogContent> <DialogContentText sx={{ mb: 2 }}>Modify details below.</DialogContentText> {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} <Box component="form" noValidate autoComplete="off"> <TextField autoFocus margin="dense" name="amountPaid" label="Amount Paid" type="number" fullWidth variant="outlined" value={formData.amountPaid || ''} onChange={handleChange} error={!!formData.amountPaid && Number(formData.amountPaid) <= 0} helperText={!!formData.amountPaid && Number(formData.amountPaid) <= 0 ? "Must be positive" : ""}/> <FormControl fullWidth margin="dense" variant="outlined"> <InputLabel id="paymentMethod-label">Payment Method</InputLabel> <Select labelId="paymentMethod-label" name="paymentMethod" value={formData.paymentMethod || 'Cash'} onChange={handleChange} label="Payment Method"> <MenuItem value="Cash">Cash</MenuItem> <MenuItem value="Online">Online</MenuItem> </Select> </FormControl> <FormControl fullWidth margin="dense" variant="outlined"> <InputLabel id="paymentMonth-edit-label">Payment Month</InputLabel> <Select labelId="paymentMonth-edit-label" name="paymentMonth" value={formData.paymentMonth || ''} onChange={handleChange} label="Payment Month" error={!formData.paymentMonth}> {monthOptions.map((month) => ( <MenuItem key={month.value} value={month.value}> {month.label} </MenuItem> ))} </Select> {!formData.paymentMonth && <Typography color="error" variant="caption">Month is required</Typography>} </FormControl> <TextField margin="dense" name="paymentYear" label="Payment Year (e.g., 2024)" type="number" fullWidth variant="outlined" value={formData.paymentYear || ''} onChange={handleChange} inputProps={{ min: 2000, max: 2100 }} error={!!formData.paymentYear && (Number(formData.paymentYear) < 2000 || Number(formData.paymentYear) > 2100)} helperText={(!!formData.paymentYear && (Number(formData.paymentYear) < 2000 || Number(formData.paymentYear) > 2100)) ? "Valid year" : ""}/> <TextField margin="dense" name="paymentDate" label="Payment Date" type="date" fullWidth variant="outlined" value={formData.paymentDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }}/> </Box> </DialogContent> <DialogActions> <Button onClick={onClose} disabled={isSaving}>Cancel</Button> <Button onClick={handleSave} variant="contained" color="primary" disabled={isSaving}> {isSaving ? <CircularProgress size={24} /> : 'Save Changes'} </Button> </DialogActions> </Dialog> );};

// --- Member Payment Ledger Modal Component (Keep existing) ---
interface MemberPaymentLedgerModalProps { open: boolean; onClose: () => void; member: { id: string; name: string } | null; payments: AdminPaymentData[]; loading: boolean; error: string | null; getMonthName: (month: number) => string; }
const MemberPaymentLedgerModal: React.FC<MemberPaymentLedgerModalProps> = ({ open, onClose, member, payments, loading, error, getMonthName }) => { if (!open || !member) return null; const paidPeriods = useMemo(() => { if (!payments || payments.length === 0) return []; const periods = new Set<string>(); payments.forEach(p => { if (p.paymentMonth != null && p.paymentYear != null) { const monthName = getMonthName(p.paymentMonth); if (monthName !== 'N/A') { periods.add(`${monthName}/${p.paymentYear}`); } } }); return Array.from(periods).sort(); }, [payments, getMonthName]); return ( <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth> <DialogTitle>Payment Ledger for {member.name}</DialogTitle> <DialogContent dividers> {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>} {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>} {!loading && !error && ( <> {paidPeriods.length === 0 ? ( <Typography sx={{ p: 2, textAlign: 'center' }}>No payment records found.</Typography> ) : ( <> <Typography variant="subtitle1" gutterBottom sx={{ pl: 2, pt: 1}}>Months Paid For:</Typography> <List dense disablePadding> {paidPeriods.map((period, index) => ( <ListItem key={index} disableGutters sx={{ pl: 2 }}> <ListItemText primary={period} /> </ListItem> ))} </List> </> )} </> )} </DialogContent> <DialogActions> <Button onClick={onClose}>Close</Button> </DialogActions> </Dialog> ); };
// --- End Member Payment Ledger Modal Component ---


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
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchField, setSearchField] = useState<string>('memberName');
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
    const [paymentToEdit, setPaymentToEdit] = useState<AdminPaymentData | null>(null);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);
    const [selectedMemberLedger, setSelectedMemberLedger] = useState<{ id: string; name: string } | null>(null);
    const [memberPayments, setMemberPayments] = useState<AdminPaymentData[]>([]);
    const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);
    const [ledgerError, setLedgerError] = useState<string | null>(null);

    const COMPONENT_NAME = '[AdminPaymentDashboard]';

    // --- Helper Function & Static Data ---
    const getMonthName = (monthNumber: number): string => { const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; if (monthNumber >= 1 && monthNumber <= 12) { return monthNames[monthNumber - 1]; } return 'N/A'; };
    const monthOptions: MonthOption[] = useMemo(() => [ { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' }, { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' }, { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' }, { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' } ], []);
    const searchFieldOptions = useMemo(() => [ { value: 'memberName', label: 'Member Name' }, { value: 'areaName', label: 'Area Name' }, { value: 'recorderName', label: 'Recorder Name' } ], []);

    // --- Fetch Initial Data ---
    const loadData = async () => { setLoading(true); setError(null); try { const [paymentsData, areasData] = await Promise.all([getAllPaymentsAdmin(), getAllAreas()]); setPayments(paymentsData); setAreas(areasData); } catch (err: any) { setError(err.message || 'Failed.'); } finally { setLoading(false); } };
    useEffect(() => { loadData(); }, []);

    // --- Generate Unique Lists for Filters ---
    const recorderList = useMemo(() => { const recorders = new Map(); payments.forEach(p => { if (p.recordedBy && !recorders.has(p.recordedBy.id)) { recorders.set(p.recordedBy.id, { id: p.recordedBy.id, name: p.recordedBy.name || `User (${p.recordedBy.id.substring(0,6)}...)`, role: p.recordedBy.role }); } }); return Array.from(recorders.values()).sort((a,b) => (a.name ?? '').localeCompare(b.name ?? '')); }, [payments]);
    const yearList = useMemo(() => { const years = new Set<number>(); payments.forEach(p => { try { if (p.paymentDate) { const date = new Date(p.paymentDate); if(isValid(date)) years.add(getYear(date)); } } catch(e){} }); return Array.from(years).sort((a, b) => b - a); }, [payments]);

    // --- Filter Payments (Based on Actual Payment Date for Month/Year filter) ---
    const filteredPayments = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
        return payments.filter(p => {
            let paymentDateObj: Date | null = null; let paymentDateMonth: number | null = null; let paymentDateYear: number | null = null;
            try { if (p.paymentDate) { paymentDateObj = new Date(p.paymentDate); if (isValid(paymentDateObj)) { paymentDateMonth = getMonth(paymentDateObj) + 1; paymentDateYear = getYear(paymentDateObj); } } } catch (e) {}
            const monthFilterMatch = selectedMonth === 'all' || (paymentDateMonth !== null && paymentDateMonth === parseInt(selectedMonth));
            const yearFilterMatch = selectedYear === 'all' || (paymentDateYear !== null && paymentDateYear === parseInt(selectedYear));
            const areaFilterMatch = selectedAreaId === 'all' || p.member?.area?.id === selectedAreaId;
            const recorderFilterMatch = selectedRecorderId === 'all' || p.recordedBy?.id === selectedRecorderId;
            const dropdownFiltersMatch = areaFilterMatch && recorderFilterMatch && monthFilterMatch && yearFilterMatch;
            if (!dropdownFiltersMatch) return false;
            if (lowerCaseSearchTerm === '') return true;
            switch (searchField) {
                 case 'memberName': return p.member?.name?.toLowerCase().includes(lowerCaseSearchTerm) ?? false;
                 case 'areaName': return p.member?.area?.name?.toLowerCase().includes(lowerCaseSearchTerm) ?? false;
                 case 'recorderName': const recorderName = p.recordedBy?.name || ''; return recorderName.toLowerCase().includes(lowerCaseSearchTerm);
                 default: return true;
            }
        });
    }, [payments, selectedAreaId, selectedRecorderId, selectedMonth, selectedYear, searchTerm, searchField]);

    // --- Calculate Total ---
    const totalFilteredAmount = useMemo(() => { return filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0); }, [filteredPayments]);

    // --- Delete Handling ---
    const handleDeleteClick = (paymentId: string) => { setPaymentToDelete(paymentId); setConfirmOpen(true); };
    const handleConfirmDelete = async () => { if (!paymentToDelete) return; try { await deletePayment(paymentToDelete); setPayments(prev => prev.filter(p => p.id !== paymentToDelete)); } catch (err: any) { setError(`Delete failed: ${err.message}`); } finally { setConfirmOpen(false); setPaymentToDelete(null); } };

     // --- Edit Handling ---
     const handleEditClick = (payment: AdminPaymentData) => { setPaymentToEdit(payment); setEditModalOpen(true); };
     const handleSaveChanges = async (paymentId: string, updatedData: UpdatePaymentData) => { try { const updatedResult = await updatePayment(paymentId, updatedData); setPayments(prev => prev.map(p => { if (p.id === paymentId) { return { ...p, ...updatedResult }; } return p; })); } catch (error: any) { console.error(`${COMPONENT_NAME} Error saving (parent):`, error); throw error; } };

     // --- ** RENAMED Handler for Viewing Ledger ** ---
     const handleViewLedgerClick = async (memberId: string | undefined, memberName: string | undefined) => {
         if (!memberId || !memberName) {
             console.warn("Cannot view ledger: Missing member ID or Name");
             return;
         }
         console.log(`Workspaceing payment ledger for member: ${memberName} (ID: ${memberId})`);
         setSelectedMemberLedger({ id: memberId, name: memberName });
         setIsLedgerModalOpen(true);
         setLedgerLoading(true);
         setLedgerError(null);
         setMemberPayments([]);
         try {
             // *** ASSUMES getPaymentsByMember exists in paymentService ***
             const memberPaymentHistory = await getPaymentsByMember(memberId);
             setMemberPayments(memberPaymentHistory);
         } catch (err: any) {
             console.error(`Error fetching ledger for member ${memberId}:`, err);
             setLedgerError(err.message || 'Failed to fetch payment history.');
         } finally {
             setLedgerLoading(false);
         }
     };
     // --- End View Ledger Handler ---

    // --- Rendering ---
    if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>; }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Payment History (Admin View)</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

             {/* Filter Controls, Search & Total Amount */}
             <Grid container spacing={1} sx={{ mb: 2 }} alignItems="center">
                {/* Grid items for filters/search/total */}
                <Grid item xs={12} sm={6} md='auto' lg={1.5}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel>Area</InputLabel> <Select value={selectedAreaId} label="Area" onChange={(e) => setSelectedAreaId(e.target.value)}> <MenuItem value="all">All Areas</MenuItem> {areas.map((area) => (<MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>))} </Select> </FormControl> </Grid>
                <Grid item xs={12} sm={6} md='auto' lg={2}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel>Recorder</InputLabel> <Select value={selectedRecorderId} label="Recorder" onChange={(e) => setSelectedRecorderId(e.target.value)}> <MenuItem value="all">All Recorders</MenuItem> {recorderList.map((recorder) => (<MenuItem key={recorder.id} value={recorder.id}>{`${recorder.name} (${recorder.role})`}</MenuItem>))} </Select> </FormControl> </Grid>
                <Grid item xs={12} sm={6} md='auto' lg={1.5}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel>Month</InputLabel> <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}> <MenuItem value="all">All Months</MenuItem> {monthOptions.map((month) => (<MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>))} </Select> </FormControl> </Grid>
                <Grid item xs={12} sm={6} md='auto' lg={1.5}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel>Year</InputLabel> <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}> <MenuItem value="all">All Years</MenuItem> {yearList.map((year) => (<MenuItem key={year} value={String(year)}>{year}</MenuItem>))} </Select> </FormControl> </Grid>
                <Grid item xs={12} sm={6} md='auto' lg={2}> <FormControl fullWidth variant="outlined" size="small"> <InputLabel>Search By</InputLabel> <Select value={searchField} label="Search By" onChange={(e) => setSearchField(e.target.value)}> {searchFieldOptions.map((option) => ( <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem> ))} </Select> </FormControl> </Grid>
                <Grid item xs={12} sm={6} md='auto' lg={2}> <TextField fullWidth size="small" variant="outlined" label="Search Term" placeholder="Enter search term..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: ( <InputAdornment position="start"><SearchIcon /></InputAdornment> ), }} /> </Grid>
                <Grid item xs={12} lg sx={{ textAlign: { xs: 'left', lg: 'right' }, mt: { xs: 1, lg: 0 }}}> <Chip label={`Total: ${totalFilteredAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}`} color="primary" sx={{ fontWeight: 'bold', fontSize: '1rem', height: 'auto', '& .MuiChip-label': { p: '8px 12px' } }}/> </Grid>
            </Grid>

            {/* Payments Table */}
            <Paper>
                <TableContainer sx={{ maxHeight: 600 }}> <Table stickyHeader aria-label="payments table">
                        <TableHead> <TableRow> <TableCell>Member</TableCell> <TableCell>Area</TableCell> <TableCell align="center">Amount Paid</TableCell> <TableCell>Date</TableCell> <TableCell>Month/Yr</TableCell> <TableCell>Method</TableCell> <TableCell>Recorded By</TableCell> <TableCell sx={{textAlign: 'center'}}>Actions</TableCell> </TableRow> </TableHead>
                        <TableBody>
                            {filteredPayments.length === 0 && !loading ? ( <TableRow><TableCell colSpan={8} align="center">No payment records found matching filters.</TableCell></TableRow> ) : (
                                filteredPayments.map((payment) => (
                                    <TableRow key={payment.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        {/* Member Name Cell - No longer clickable */}
                                        <TableCell>{payment.member?.name || 'N/A'}</TableCell>
                                        <TableCell>{payment.member?.area?.name || 'N/A'}</TableCell>
                                        <TableCell align="center">{payment.amountPaid.toLocaleString('en-IN')}</TableCell>
                                        <TableCell>{payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yy') : 'N/A'}</TableCell>
                                        <TableCell>{getMonthName(payment.paymentMonth)}/{payment.paymentYear}</TableCell>
                                        <TableCell>{payment.paymentMethod}</TableCell>
                                        <TableCell>{payment.recordedBy?.name || 'N/A'} {payment.recordedBy?.role && `(${payment.recordedBy.role})`}</TableCell>
                                        {/* Actions Cell - MODIFIED */}
                                        <TableCell sx={{whiteSpace: 'nowrap', textAlign: 'center'}}>
                                             {/* ADDED Eye Button */}
                                            <Tooltip title="View Payment Ledger">
                                                <span> {/* Span needed for disabled state tooltip */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewLedgerClick(payment.member?.id, payment.member?.name)}
                                                        color="info"
                                                        disabled={!payment.member?.id || !payment.member?.name} // Disable if no member data
                                                    >
                                                        <VisibilityIcon fontSize="inherit" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            {/* Existing Buttons */}
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
             {/* Member Payment Ledger Modal */}
             <MemberPaymentLedgerModal
                open={isLedgerModalOpen}
                onClose={() => setIsLedgerModalOpen(false)}
                member={selectedMemberLedger}
                payments={memberPayments}
                loading={ledgerLoading}
                error={ledgerError}
                getMonthName={getMonthName}
             />

        </Box>
    );
}

export default AdminPayments;