import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import LoadingOverlay from '../components/loadingOverlay.jsx';
import { Calendar, CheckCircle2, Clock, XCircle, Check, DollarSign, AlertCircle } from "lucide-react";

const loan = () => {
    const [hasPendingLoan, setHasPendingLoan] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingLoan, setEditingLoan] = useState(null);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [approvedAmount, setApprovedAmount] = useState('');
    const [deductionStartMonth, setDeductionStartMonth] = useState('');
    const [loans, setLoans] = useState([]);
    const [amount, setAmount] = useState('');
    const [durationInMonths, setDurationInMonths] = useState('');
    const [monthDeduction, setMonthDeduction] = useState('');
    const [reason, setReason] = useState('');
    const { token, user, backendUrl } = useContext(AppContext);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().toISOString().slice(0, 7));
    const [filteredLoans, setFilteredLoan] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Approval Modal State
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalLoan, setApprovalLoan] = useState(null);
    const [approvalAmount, setApprovalAmount] = useState('');
    const [approvalStartMonth, setApprovalStartMonth] = useState('');

    // Helper: calculate default next month "YYYY-MM"
    const getNextMonth = (date = new Date()) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().slice(0, 7);
    };

    // Open Approval Modal for a specific loan
    const handleOpenApprovalModal = (loanItem) => {
        setApprovalLoan(loanItem);
        setApprovalAmount(loanItem.approvedAmount || loanItem.amount);
        setApprovalStartMonth(loanItem.deductionStartMonth || getNextMonth(loanItem.approvedAt || new Date()));
        setShowApprovalModal(true);
    };

    // Confirm Approval with Selected Start Month & Year
    const handleConfirmApproval = async (e) => {
        e.preventDefault();
        if (!approvalLoan) return;

        setIsLoading(true);
        try {
            const startMonth = approvalStartMonth || getNextMonth();
            const { data } = await axios.post(
                backendUrl + "/api/admin/approve-loan",
                {
                    loanId: approvalLoan._id,
                    status: "Approved",
                    approvedAmount: Number(approvalAmount),
                    deductionStartMonth: startMonth,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(`Loan approved! Deduction will start in ${startMonth}.`);
                setShowApprovalModal(false);
                setApprovalLoan(null);
                await fetchLoans();
                if (selectedLoan && selectedLoan._id === approvalLoan._id) {
                    setSelectedLoan(data.loan);
                }
            } else {
                toast.error(data.message || "Approval failed");
            }
        } catch (error) {
            console.error("Approval error:", error);
            toast.error(error.response?.data?.message || "Failed to approve loan");
        } finally {
            setIsLoading(false);
        }
    };

    // When editing a loan (e.g. on Edit button click)
    const handleEdit = (loanItem) => {
        setIsLoading(true);
        setTimeout(() => {
            setEditingLoan(loanItem);
            setAmount(loanItem.amount);
            setReason(loanItem.reason);
            setApprovedAmount(loanItem.approvedAmount || loanItem.amount);
            setDurationInMonths(loanItem.durationInMonths);
            setDeductionStartMonth(loanItem.deductionStartMonth || getNextMonth(loanItem.approvedAt || new Date()));
            setMonthDeduction(
                loanItem.monthDeduction || 
                Math.ceil((loanItem.approvedAmount || loanItem.amount) / loanItem.durationInMonths)
            );
            setShowForm(true);
            setIsLoading(false);
        }, 300);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const loanPayload = {
            amount: Number(amount),
            durationInMonths: Number(durationInMonths),
            reason,
            approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
            deductionStartMonth: deductionStartMonth || getNextMonth()
        };

        try {
            let data;
            if (editingLoan) {
                const response = await axios.post(
                    backendUrl + "/api/admin/update-loan",
                    {
                        loanId: editingLoan._id,
                        ...loanPayload,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                data = response.data;
                if (data.success) {
                    await updateStatus(editingLoan._id, "Approved", loanPayload.approvedAmount, loanPayload.deductionStartMonth);
                }
            } else {
                const response = await axios.post(
                    backendUrl + "/api/admin/apply-loan",
                    loanPayload,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                data = response.data;
            }

            if (data.success) {
                toast.success(data.message);
                setAmount("");
                setReason("");
                setDurationInMonths("");
                setMonthDeduction("");
                setApprovedAmount("");
                setDeductionStartMonth("");
                setShowForm(false);
                setEditingLoan(null);
                fetchLoans();
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (error) {
            console.error("Loan apply/update error:", error);
            toast.error(error.response?.data?.message || "Loan request failed");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLoans = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/admin/get-all-loan", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) {
                setLoans(data.loans || []);
            }
        } catch (error) {
            console.error("Failed to fetch loans:", error);
        }
    };

    const updateStatus = async (id, status, approvedAmt = null, startMonth = null) => {
        setIsLoading(true);
        try {
            const payload = { loanId: id, status };
            if (status === "Approved") {
                if (approvedAmt) payload.approvedAmount = Number(approvedAmt);
                if (startMonth) payload.deductionStartMonth = startMonth;
            }

            const { data } = await axios.post(
                backendUrl + "/api/admin/approve-loan",
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success(data.message || `Loan ${status.toLowerCase()}`);
                await fetchLoans();
                if (selectedLoan && selectedLoan._id === id) {
                    setSelectedLoan(data.loan);
                }
            } else {
                toast.error(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Status update error:", error);
            toast.error(error.response?.data?.message || "Failed to update loan status");
        } finally {
            setIsLoading(false);
        }
    };

    // Process automatic monthly deductions for all approved loans
    const handleProcessMonthlyDeductions = async () => {
        const confirmMsg = `Process monthly deductions for active approved loans for ${selectedMonthYear}?\n(Deduction will only apply to loans whose start month has arrived and haven't been deducted for this month.)`;
        if (!window.confirm(confirmMsg)) return;

        setIsLoading(true);
        try {
            const { data } = await axios.post(
                backendUrl + "/api/admin/process-monthly-deductions",
                { monthYear: selectedMonthYear },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success(data.message);
                await fetchLoans();
            } else {
                toast.error(data.message || "Failed to process deductions");
            }
        } catch (error) {
            console.error("Deduction error:", error);
            toast.error(error.response?.data?.message || "Failed to process monthly deductions");
        } finally {
            setIsLoading(false);
        }
    };

    // Apply single deduction for the currently viewed loan
    const handleApplySingleDeduction = async (loanId) => {
        if (!selectedLoan) return;

        // Check start month
        if (selectedLoan.deductionStartMonth && selectedMonthYear < selectedLoan.deductionStartMonth) {
            toast.warning(`Deduction cannot be applied yet. Deduction starts in ${selectedLoan.deductionStartMonth}.`);
            return;
        }

        // Check if already deducted
        const alreadyDeducted = (selectedLoan.repaymentHistory || []).some(
            (r) => r.monthYear === selectedMonthYear
        );
        if (alreadyDeducted) {
            toast.warning(`This loan has already been deducted for ${selectedMonthYear}. Deductions can only happen once per month.`);
            return;
        }

        if (!window.confirm(`Apply 1 month deduction for this loan for ${selectedMonthYear}?`)) return;

        setIsLoading(true);
        try {
            const { data } = await axios.post(
                backendUrl + "/api/admin/apply-single-deduction",
                { loanId, monthYear: selectedMonthYear },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success(data.message);
                await fetchLoans();
                setSelectedLoan(data.loan);
            } else {
                toast.error(data.message || "Failed to apply deduction");
            }
        } catch (error) {
            console.error("Single deduction error:", error);
            toast.error(error.response?.data?.message || "Failed to apply deduction");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const closeForm = () => {
        setIsLoading(true);
        setTimeout(() => {
            setShowForm(false);
            setEditingLoan(null);
            setAmount("");
            setReason("");
            setDurationInMonths("");
            setMonthDeduction("");
            setApprovedAmount("");
            setDeductionStartMonth("");
            setIsLoading(false);
        }, 300);
    };

    const handleAddNew = () => {
        setIsLoading(true);
        setTimeout(() => {
            setAmount("");
            setReason("");
            setDurationInMonths("");
            setApprovedAmount("");
            setDeductionStartMonth(getNextMonth());
            setShowForm(true);
            setIsLoading(false);
        }, 300);
    };

    // Automatically calculate monthly deduction
    useEffect(() => {
        if (amount && durationInMonths) {
            const monthly = parseFloat(amount) / parseInt(durationInMonths);
            setMonthDeduction(monthly.toFixed(2));
        } else {
            setMonthDeduction('');
        }
    }, [amount, durationInMonths]);

    useEffect(() => {
        if (editingLoan && approvedAmount && durationInMonths) {
            const deduction = Number(approvedAmount) / Number(durationInMonths);
            setMonthDeduction(deduction.toFixed(2));
        }
    }, [approvedAmount, durationInMonths, editingLoan]);

    const handleView = (loanItem) => {
        setIsLoading(true);
        setTimeout(() => {
            setSelectedLoan(loanItem);
            setIsLoading(false);
        }, 200);
    };

    // Filter loans based on search and status
    useEffect(() => {
        const filtered = (loans || []).filter((item) => {
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

            const s = searchTerm.trim().toLowerCase();
            if (!s) return matchesStatus;

            const name = item.userId?.name ? item.userId.name.toLowerCase() : '';
            const email = item.userId?.email ? item.userId.email.toLowerCase() : '';
            const reasonText = item.reason ? item.reason.toLowerCase() : '';
            const amountStr = item.amount ? item.amount.toString() : '';
            const approvedStr = item.approvedAmount ? item.approvedAmount.toString() : '';
            const startMonthStr = item.deductionStartMonth ? item.deductionStartMonth.toLowerCase() : '';

            const matchesSearch =
                name.includes(s) ||
                email.includes(s) ||
                reasonText.includes(s) ||
                amountStr.includes(s) ||
                approvedStr.includes(s) ||
                startMonthStr.includes(s);

            return matchesStatus && matchesSearch;
        });

        setFilteredLoan(filtered);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, loans]);

    // Status counts
    const countAll = loans.length;
    const countApproved = loans.filter((l) => l.status === "Approved").length;
    const countPending = loans.filter((l) => l.status === "Pending").length;
    const countRejected = loans.filter((l) => l.status === "Rejected").length;
    const countCompleted = loans.filter((l) => l.status === "Completed").length;

    // Pagination logic
    const totalItems = filteredLoans.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedLoans = filteredLoans.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrint = () => {
        const printContents = document.getElementById("print-Loan-table").innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    useEffect(() => {
        const checkLoanStatus = async () => {
            try {
                const { data } = await axios.get(
                    backendUrl + "/api/admin/get-employee-loan",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const pending = data.loans?.some(
                    (l) => l.status !== "Completed" && l.status !== "Rejected"
                );
                setHasPendingLoan(pending);
            } catch (error) {
                console.error("Failed to fetch loan status:", error);
            }
        };

        if (user?.role === "admin") {
            checkLoanStatus();
        }
    }, [user]);

    // Helper for status badge
    const renderStatusBadge = (status) => {
        switch (status) {
            case "Approved":
                return (
                    <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                );
            case "Pending":
                return (
                    <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                );
            case "Rejected":
                return (
                    <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800 border border-rose-300">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                );
            case "Completed":
                return (
                    <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-300">
                        <Check className="w-3 h-3" /> Completed
                    </span>
                );
            default:
                return (
                    <span className="font-semibold px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    return loans && (
        <div className='w-full max-w-7xl mx-auto px-4 text-center'>
            <div className="flex flex-col items-center justify-center mt-5 mb-2">
                <p className="text-xl sm:text-2xl font-bold text-gray-800">MANAGE LOAN</p>
                <p className="text-sm text-gray-500 mt-1">
                    Track loan applications, scheduled start dates, automatic monthly deductions, and balances
                </p>
            </div>

            {/* Top Toolbar: Search, Deduction Month & Actions */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4'>
                    {/* Search Input */}
                    <div className="relative w-full lg:w-1/3">
                        <input
                            type='text'
                            placeholder='Search by Employee, Amount, Reason...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full px-4 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm'
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        {/* Month Selector for Automatic Deductions */}
                        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-1.5 text-xs text-gray-700">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="font-medium hidden sm:inline">Deduction Month:</span>
                            <input
                                type="month"
                                value={selectedMonthYear}
                                onChange={(e) => setSelectedMonthYear(e.target.value)}
                                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
                            />
                        </div>

                        {/* Process Monthly Deductions Button */}
                        <button
                            onClick={handleProcessMonthlyDeductions}
                            title="Process automatic monthly deduction once per month for loans whose start month has arrived"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5"
                        >
                            <DollarSign className="w-4 h-4" />
                            <span>Process Monthly Deductions</span>
                        </button>

                        {/* Apply Loan Button */}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={handleAddNew}
                                disabled={hasPendingLoan}
                                className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm ${
                                    hasPendingLoan
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                            >
                                Apply Loan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs: All, Approved, Pending, Rejected, Completed */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase mr-1">Filter by:</span>

                    <button
                        onClick={() => setStatusFilter("All")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            statusFilter === "All"
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        <span>All Loans</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            statusFilter === "All" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"
                        }`}>
                            {countAll}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("Approved")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            statusFilter === "Approved"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                    >
                        <span>Approved</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            statusFilter === "Approved" ? "bg-emerald-800 text-white" : "bg-emerald-200 text-emerald-800"
                        }`}>
                            {countApproved}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("Pending")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            statusFilter === "Pending"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        }`}
                    >
                        <span>Pending</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            statusFilter === "Pending" ? "bg-amber-800 text-white" : "bg-amber-200 text-amber-800"
                        }`}>
                            {countPending}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("Rejected")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            statusFilter === "Rejected"
                                ? "bg-rose-600 text-white shadow-sm"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                        }`}
                    >
                        <span>Rejected</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            statusFilter === "Rejected" ? "bg-rose-800 text-white" : "bg-rose-200 text-rose-800"
                        }`}>
                            {countRejected}
                        </span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("Completed")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            statusFilter === "Completed"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        }`}
                    >
                        <span>Completed</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            statusFilter === "Completed" ? "bg-blue-800 text-white" : "bg-blue-200 text-blue-800"
                        }`}>
                            {countCompleted}
                        </span>
                    </button>
                </div>
            </div>

            {hasPendingLoan && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm px-4 py-2 rounded-lg mt-3 text-left">
                    ⚠️ Notice: You currently have an active or pending loan application.
                </div>
            )}

            {/* Table container */}
            <div className='bg-white mt-4 rounded-xl shadow-sm border border-gray-200 overflow-x-auto text-sm min-h-[50vh]'>
                {/* Header */}
                <div className='bg-gray-100 hidden sm:grid grid-cols-[0.4fr_1.5fr_1.8fr_1fr_1fr_0.8fr_1.2fr_1fr_1fr_1fr_1.4fr] py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200'>
                    <p>#</p>
                    <p className="text-left">Employee</p>
                    <p className="text-left">Reason</p>
                    <p className="text-right">Requested</p>
                    <p className="text-right">Approved</p>
                    <p className="text-center">Duration</p>
                    <p className="text-right">Monthly Ded.</p>
                    <p className="text-right">Total Repaid</p>
                    <p className="text-right">Outstanding</p>
                    <p className="text-center">Status</p>
                    <p className="text-center">Actions</p>
                </div>

                {/* Table Rows */}
                {paginatedLoans.length > 0 ? (
                    paginatedLoans.map((item, index) => {
                        const targetAmt = item.status === "Approved" || item.status === "Completed"
                            ? (item.approvedAmount || item.amount)
                            : item.amount;
                        const repaidAmt = item.totalRepaid || 0;
                        const outstandingAmt = Math.max(0, targetAmt - repaidAmt);
                        const effectiveMonthly = item.monthDeduction || Math.ceil(targetAmt / (item.durationInMonths || 1));

                        return (
                            <div
                                key={item._id || index}
                                className="flex flex-col sm:grid sm:grid-cols-[0.4fr_1.5fr_1.8fr_1fr_1fr_0.8fr_1.2fr_1fr_1fr_1fr_1.4fr] items-start sm:items-center text-gray-600 py-3.5 px-4 border-b hover:bg-slate-50 gap-2 transition text-xs"
                            >
                                <p className="hidden sm:block font-medium text-gray-400">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                </p>
                                <div className="text-left font-semibold text-gray-800 truncate w-full" title={item.userId?.name}>
                                    {item.userId?.name || "N/A"}
                                </div>
                                <div className="text-left text-gray-600 truncate w-full" title={item.reason}>
                                    {item.reason || "N/A"}
                                </div>
                                <p className="sm:text-right font-medium text-gray-700">
                                    ₦{item.amount.toLocaleString()}
                                </p>
                                <p className="sm:text-right font-semibold text-gray-800">
                                    {item.status === "Approved" || item.status === "Completed"
                                        ? `₦${(item.approvedAmount || item.amount).toLocaleString()}`
                                        : item.status === "Rejected"
                                            ? "₦0"
                                            : "Pending"}
                                </p>
                                <p className="sm:text-center text-gray-600 font-medium">
                                    {item.durationInMonths} mos
                                </p>
                                <div className="sm:text-right w-full">
                                    <p className="font-semibold text-emerald-700">
                                        ₦{effectiveMonthly.toLocaleString()}
                                    </p>
                                    {item.deductionStartMonth && (
                                        <p className="text-[10px] text-gray-400 font-medium">
                                            Start: {item.deductionStartMonth}
                                        </p>
                                    )}
                                </div>
                                <p className="sm:text-right font-semibold text-blue-700">
                                    ₦{repaidAmt.toLocaleString()}
                                </p>
                                <p className="sm:text-right font-bold text-gray-900">
                                    {item.status === "Approved" || item.status === "Completed"
                                        ? `₦${outstandingAmt.toLocaleString()}`
                                        : "-"}
                                </p>
                                <div className="sm:text-center">
                                    {renderStatusBadge(item.status)}
                                </div>
                                <div className="flex sm:justify-center items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button
                                        onClick={() => handleView(item)}
                                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2.5 py-1 rounded-md transition font-medium shadow-sm"
                                    >
                                        View
                                    </button>

                                    {item.status === "Pending" && (
                                        <>
                                            <button
                                                onClick={() => handleOpenApprovalModal(item)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-md transition font-medium shadow-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2.5 py-1 rounded-md transition font-medium shadow-sm"
                                            >
                                                Edit
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-12 text-center text-gray-500">
                        <p className="text-base font-medium">No loans found</p>
                        <p className="text-xs text-gray-400 mt-1">Try changing the status filter or search keywords.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-gray-500">
                            Showing {(currentPage - 1) * itemsPerPage + 1}–
                            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} loans
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                            >
                                Prev
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded ${
                                        currentPage === i + 1
                                            ? 'bg-emerald-600 text-white font-semibold'
                                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal 1: Dedicated Approval Modal with Start Month & Year Selection */}
            {showApprovalModal && approvalLoan && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
                    <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative text-left">
                        <button
                            onClick={() => { setShowApprovalModal(false); setApprovalLoan(null); }}
                            className="font-bold text-2xl absolute top-3 right-4 text-gray-400 hover:text-red-600"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-2 mb-4 text-emerald-700">
                            <CheckCircle2 className="w-6 h-6" />
                            <h2 className="text-xl font-bold text-gray-800">Approve Loan Application</h2>
                        </div>

                        <p className="text-xs text-gray-500 mb-4">
                            Set the approved loan amount and specify which month & year deductions will commence.
                        </p>

                        <form onSubmit={handleConfirmApproval} className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border text-xs text-gray-700 space-y-1">
                                <p><span className="font-semibold text-gray-600">Employee:</span> {approvalLoan.userId?.name || "N/A"}</p>
                                <p><span className="font-semibold text-gray-600">Requested Amount:</span> ₦{approvalLoan.amount?.toLocaleString()}</p>
                                <p><span className="font-semibold text-gray-600">Duration:</span> {approvalLoan.durationInMonths} months</p>
                                <p><span className="font-semibold text-gray-600">Reason:</span> {approvalLoan.reason}</p>
                            </div>

                            {/* Approved Amount */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Amount (₦)</label>
                                <input
                                    type="number"
                                    min="1000"
                                    step="100"
                                    value={approvalAmount}
                                    onChange={(e) => setApprovalAmount(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                                    required
                                />
                            </div>

                            {/* Deduction Start Month & Year */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Deduction Start Month & Year
                                </label>
                                <input
                                    type="month"
                                    value={approvalStartMonth}
                                    onChange={(e) => setApprovalStartMonth(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold cursor-pointer"
                                    required
                                />
                                <p className="text-[11px] text-gray-500 mt-1 flex items-start gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>The system will not deduct until this month is reached. Defaults to the month after approval ({getNextMonth()}).</span>
                                </p>
                            </div>

                            {/* Calculated Monthly Deduction */}
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs">
                                <span className="text-gray-600">Calculated Monthly Deduction: </span>
                                <strong className="text-emerald-800 text-sm">
                                    ₦{(approvalAmount && approvalLoan.durationInMonths ? Math.ceil(Number(approvalAmount) / approvalLoan.durationInMonths) : 0).toLocaleString()} / month
                                </strong>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowApprovalModal(false); setApprovalLoan(null); }}
                                    className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-xs transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold text-xs transition shadow-sm"
                                >
                                    Confirm Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Apply / Update Loan Form */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl relative text-left">
                        <button
                            onClick={closeForm}
                            className="font-bold text-2xl absolute top-3 right-4 text-gray-400 hover:text-red-600"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-bold text-center mb-5 text-gray-800">
                            {editingLoan ? "Review & Update Loan Application" : "New Loan Application"}
                        </h2>

                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Requested Amount (₦)</label>
                                <input
                                    type="number"
                                    min="1000"
                                    step="100"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                        editingLoan ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                                    }`}
                                    required
                                    readOnly={Boolean(editingLoan)}
                                />
                            </div>

                            {editingLoan && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Amount (₦)</label>
                                        <input
                                            type="number"
                                            min="1000"
                                            step="100"
                                            value={approvedAmount}
                                            onChange={(e) => setApprovedAmount(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Deduction Start Month & Year</label>
                                        <input
                                            type="month"
                                            value={deductionStartMonth}
                                            onChange={(e) => setDeductionStartMonth(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            If not specified, defaults to the next month ({getNextMonth()}).
                                        </p>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Months)</label>
                                <select
                                    value={durationInMonths}
                                    onChange={(e) => setDurationInMonths(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">-- Select Duration --</option>
                                    {[3, 6, 9, 12, 18, 24, 36, 48, 60].map((m) => (
                                        <option key={m} value={m}>
                                            {m} months
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Calculated Monthly Deduction (₦)</label>
                                <input
                                    type="number"
                                    value={monthDeduction}
                                    disabled
                                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-700 cursor-not-allowed font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Loan</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="State reason for loan request..."
                                    rows="3"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition shadow-sm text-sm"
                            >
                                {editingLoan ? "Save & Approve Loan" : "Submit Application"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: View Details Modal with Deduction History */}
            {selectedLoan && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 relative overflow-y-auto max-h-[92vh] text-left">
                        <button
                            onClick={() => setSelectedLoan(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
                        >
                            &times;
                        </button>

                        <div id="print-Loan-table">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {selectedLoan.userId?.name?.toUpperCase() || "LOAN DETAILS"}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {selectedLoan.userId?.email || ""}
                                    </p>
                                </div>
                                <div>
                                    {renderStatusBadge(selectedLoan.status)}
                                </div>
                            </div>

                            {/* Repayment Progress (if Approved or Completed) */}
                            {(selectedLoan.status === "Approved" || selectedLoan.status === "Completed") && (() => {
                                const target = selectedLoan.approvedAmount > 0 ? selectedLoan.approvedAmount : selectedLoan.amount;
                                const repaid = selectedLoan.totalRepaid || 0;
                                const pct = Math.min(100, Math.round((repaid / target) * 100));
                                return (
                                    <div className="my-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                                            <span>Repayment Progress</span>
                                            <span>{pct}% Repaid (₦{repaid.toLocaleString()} / ₦{target.toLocaleString()})</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                                    pct >= 100 ? "bg-blue-600" : "bg-emerald-600"
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-2">
                                            Outstanding Balance: <span className="font-bold text-gray-800">₦{Math.max(0, target - repaid).toLocaleString()}</span>
                                        </p>
                                    </div>
                                );
                            })()}

                            {/* Details Table */}
                            <div className="overflow-x-auto mt-4">
                                <table className="w-full text-xs text-left text-gray-700 border border-gray-200 rounded-lg">
                                    <tbody>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50 w-44">Requested Amount</th>
                                            <td className="px-4 py-2.5 font-medium">₦{selectedLoan.amount?.toLocaleString() || "N/A"}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Approved Amount</th>
                                            <td className="px-4 py-2.5 font-semibold text-emerald-800">
                                                {selectedLoan.status === "Approved" || selectedLoan.status === "Completed"
                                                    ? `₦${(selectedLoan.approvedAmount || selectedLoan.amount)?.toLocaleString()}`
                                                    : "Pending Approval"}
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Duration</th>
                                            <td className="px-4 py-2.5">{selectedLoan.durationInMonths} months</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Monthly Deduction</th>
                                            <td className="px-4 py-2.5 font-semibold text-emerald-700">
                                                ₦{(selectedLoan.monthDeduction || Math.ceil((selectedLoan.approvedAmount || selectedLoan.amount) / selectedLoan.durationInMonths))?.toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Deduction Starts</th>
                                            <td className="px-4 py-2.5 font-semibold text-gray-800">
                                                {selectedLoan.deductionStartMonth || "Next month after approval"}
                                                {selectedLoan.deductionStartMonth && selectedMonthYear < selectedLoan.deductionStartMonth && (
                                                    <span className="ml-2 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        Starts in {selectedLoan.deductionStartMonth}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Total Repaid</th>
                                            <td className="px-4 py-2.5 font-semibold text-blue-700">
                                                ₦{(selectedLoan.totalRepaid || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Outstanding Balance</th>
                                            <td className="px-4 py-2.5 font-bold text-gray-900">
                                                {selectedLoan.status === "Approved" || selectedLoan.status === "Completed"
                                                    ? `₦${Math.max(0, (selectedLoan.approvedAmount || selectedLoan.amount) - (selectedLoan.totalRepaid || 0)).toLocaleString()}`
                                                    : "-"}
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Reason</th>
                                            <td className="px-4 py-2.5">{selectedLoan.reason || "N/A"}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Application Date</th>
                                            <td className="px-4 py-2.5">
                                                {selectedLoan.createdAt ? new Date(selectedLoan.createdAt).toLocaleDateString() : "N/A"}
                                            </td>
                                        </tr>
                                        {selectedLoan.approvedAt && (
                                            <tr className="border-b">
                                                <th className="px-4 py-2.5 font-medium bg-gray-50">Approved On</th>
                                                <td className="px-4 py-2.5">
                                                    {new Date(selectedLoan.approvedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Repayment History Section */}
                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-gray-800 mb-2">Monthly Deduction History (Once Per Month)</h3>
                                {selectedLoan.repaymentHistory && selectedLoan.repaymentHistory.length > 0 ? (
                                    <div className="border border-gray-200 rounded-lg overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 border-b text-gray-600">
                                                <tr>
                                                    <th className="px-3 py-2">#</th>
                                                    <th className="px-3 py-2">Date</th>
                                                    <th className="px-3 py-2">Month</th>
                                                    <th className="px-3 py-2 text-right">Amount Deducted</th>
                                                    <th className="px-3 py-2 text-right">Balance After</th>
                                                    <th className="px-3 py-2">Method</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y text-gray-700">
                                                {selectedLoan.repaymentHistory.map((rep, rIndex) => (
                                                    <tr key={rIndex} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-gray-400">{rIndex + 1}</td>
                                                        <td className="px-3 py-2 font-medium">
                                                            {rep.deductionDate ? new Date(rep.deductionDate).toLocaleDateString() : "N/A"}
                                                        </td>
                                                        <td className="px-3 py-2">{rep.monthYear || "-"}</td>
                                                        <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                                                            ₦{rep.amount?.toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-medium">
                                                            ₦{rep.balanceAfter?.toLocaleString() ?? "-"}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500 text-[11px]">{rep.method || "Automatic"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border rounded-lg p-4 text-center text-xs text-gray-500">
                                        No monthly deductions have been recorded yet. Automatic deductions apply once per month starting from {selectedLoan.deductionStartMonth || "next month"}.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Action Controls */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-2 rounded-lg font-medium transition"
                                >
                                    Print Summary
                                </button>

                                {selectedLoan.status === "Approved" && (
                                    <button
                                        onClick={() => handleApplySingleDeduction(selectedLoan._id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition flex items-center gap-1"
                                    >
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span>Apply 1 Month Deduction ({selectedMonthYear})</span>
                                    </button>
                                )}
                            </div>

                            {selectedLoan.status === "Pending" ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatus(selectedLoan._id, "Rejected")}
                                        className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleOpenApprovalModal(selectedLoan)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Approve Loan...</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSelectedLoan(null)}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs px-4 py-2 rounded-lg font-medium transition"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <LoadingOverlay />}
        </div>
    );
};

export default loan;
