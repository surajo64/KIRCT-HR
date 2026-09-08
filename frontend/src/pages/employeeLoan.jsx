import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import LoadingOverlay from '../components/loadingOverlay.jsx';
import { CheckCircle2, Clock, XCircle, Check } from "lucide-react";

const employeeLoan = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [editingLoan, setEditingLoan] = useState(null);
    const [loans, setLoans] = useState([]);
    const [amount, setAmount] = useState('');
    const [durationInMonths, setDurationInMonths] = useState('');
    const [monthDeduction, setMonthDeduction] = useState('');
    const [reason, setReason] = useState('');
    const { token, backendUrl } = useContext(AppContext);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [filteredLoans, setFilteredLoan] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const handleApply = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const loanPayload = {
            amount: Number(amount),
            durationInMonths: Number(durationInMonths),
            reason,
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

    const handleEdit = (loanItem) => {
        setIsLoading(true);
        setTimeout(() => {
            setEditingLoan(loanItem);
            setAmount(loanItem.amount);
            setReason(loanItem.reason);
            setDurationInMonths(loanItem.durationInMonths);
            setMonthDeduction(Math.ceil(loanItem.amount / loanItem.durationInMonths));
            setShowForm(true);
            setIsLoading(false);
        }, 300);
    };

    const fetchLoans = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/admin/get-employee-loan", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) {
                setLoans(data.loans || []);
            }
        } catch (error) {
            console.error("Failed to fetch employee loans:", error);
        }
    };

    const closeForm = () => {
        setIsLoading(true);
        setTimeout(() => {
            setShowForm(false);
            setEditingLoan(null);
            setAmount("");
            setReason("");
            setDurationInMonths("");
            setMonthDeduction("");
            setIsLoading(false);
        }, 300);
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const handleAddNew = () => {
        setIsLoading(true);
        setTimeout(() => {
            setAmount("");
            setReason("");
            setDurationInMonths("");
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

            const reasonText = item.reason ? item.reason.toLowerCase() : '';
            const amountStr = item.amount ? item.amount.toString() : '';
            const approvedStr = item.approvedAmount ? item.approvedAmount.toString() : '';

            const matchesSearch =
                reasonText.includes(s) ||
                amountStr.includes(s) ||
                approvedStr.includes(s);

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

    const hasActiveLoan = loans.some(
        (l) => l.status !== "Completed" && l.status !== "Rejected"
    );

    // Status badge renderer
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

    return (
        <div className='w-full max-w-7xl mx-auto px-4 text-center'>
            <div className="flex flex-col items-center justify-center mt-5 mb-2">
                <p className="text-xl sm:text-2xl font-bold text-gray-800">MY LOAN APPLICATIONS</p>
                <p className="text-sm text-gray-500 mt-1">
                    View your loan approval status, monthly deductions, and remaining balance
                </p>
            </div>

            {/* Toolbar: Search, Filters & Apply Button */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
                    <div className="relative w-full sm:w-1/3">
                        <input
                            type='text'
                            placeholder='Search by amount or reason...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full px-4 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm'
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <button
                            onClick={handleAddNew}
                            disabled={hasActiveLoan}
                            className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm ${
                                hasActiveLoan
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                        >
                            Apply Loan
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
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

            {hasActiveLoan && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm px-4 py-2 rounded-lg mt-3 text-left">
                    You currently have an active loan. You cannot apply for a new loan until the current one is completed.
                </div>
            )}

            {/* Table container */}
            <div className='bg-white mt-4 rounded-xl shadow-sm border border-gray-200 overflow-x-auto text-sm min-h-[50vh]'>
                {/* Header */}
                <div className='bg-gray-100 hidden sm:grid grid-cols-[0.4fr_2fr_1fr_1fr_0.8fr_1fr_1fr_1fr_1fr_1fr_1fr] py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200'>
                    <p>#</p>
                    <p className="text-left">Reason</p>
                    <p className="text-right">Requested</p>
                    <p className="text-right">Approved</p>
                    <p className="text-center">Duration</p>
                    <p className="text-right">Monthly Ded.</p>
                    <p className="text-right">Total Repaid</p>
                    <p className="text-right">Outstanding</p>
                    <p className="text-center">Applied Date</p>
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
                                className="flex flex-col sm:grid sm:grid-cols-[0.4fr_2fr_1fr_1fr_0.8fr_1fr_1fr_1fr_1fr_1fr_1fr] items-start sm:items-center text-gray-600 py-3.5 px-4 border-b hover:bg-slate-50 gap-2 transition text-xs"
                            >
                                <p className="hidden sm:block font-medium text-gray-400">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                </p>
                                <div className="text-left font-medium text-gray-800 truncate w-full" title={item.reason}>
                                    {item.reason}
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
                                <p className="sm:text-center text-gray-500">
                                    {item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : "-"}
                                </p>
                                <div className="sm:text-center">
                                    {renderStatusBadge(item.status)}
                                </div>
                                <div className="flex sm:justify-center items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button
                                        onClick={() => handleView(item)}
                                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1 rounded-md transition font-medium shadow-sm"
                                    >
                                        View
                                    </button>

                                    {item.status === "Pending" && (
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded-md transition font-medium shadow-sm"
                                        >
                                            Update
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-12 text-center text-gray-500">
                        <p className="text-base font-medium">No loans found</p>
                        <p className="text-xs text-gray-400 mt-1">Try selecting a different status filter.</p>
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

            {/* Form Modal */}
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
                            {editingLoan ? "Update Loan Application" : "New Loan Application"}
                        </h2>

                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Loan Amount Min (₦1,000)</label>
                                <input
                                    type="number"
                                    min="1000"
                                    step="100"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Months)</label>
                                <select
                                    value={durationInMonths}
                                    onChange={(e) => setDurationInMonths(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">-- Select Duration --</option>
                                    {[3, 6, 9, 12, 18, 24, 36, 48].map((m) => (
                                        <option key={m} value={m}>
                                            {m} months
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Monthly Deduction (₦)</label>
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
                                    placeholder="Explain your reason..."
                                    rows="3"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition shadow-sm text-sm"
                            >
                                {editingLoan ? "Update Application" : "Submit Application"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal with Deduction History */}
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
                                        LOAN APPLICATION DETAILS
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Status: {selectedLoan.status}
                                    </p>
                                </div>
                                <div>
                                    {renderStatusBadge(selectedLoan.status)}
                                </div>
                            </div>

                            {/* Repayment Progress bar */}
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
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Payment Duration</th>
                                            <td className="px-4 py-2.5">{selectedLoan.durationInMonths} months</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Monthly Deductions</th>
                                            <td className="px-4 py-2.5 font-semibold text-emerald-700">
                                                ₦{(selectedLoan.monthDeduction || Math.ceil((selectedLoan.approvedAmount || selectedLoan.amount) / selectedLoan.durationInMonths))?.toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Deduction Starts</th>
                                            <td className="px-4 py-2.5 font-semibold text-gray-800">
                                                {selectedLoan.deductionStartMonth || "Next month after approval"}
                                                {selectedLoan.deductionStartMonth && new Date().toISOString().slice(0, 7) < selectedLoan.deductionStartMonth && (
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
                                            <th className="px-4 py-2.5 font-medium bg-gray-50">Applied Date</th>
                                            <td className="px-4 py-2.5">
                                                {selectedLoan.createdAt ? new Date(selectedLoan.createdAt).toLocaleDateString() : "N/A"}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Monthly Deductions History */}
                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-gray-800 mb-2">Monthly Deduction History</h3>
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
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border rounded-lg p-4 text-center text-xs text-gray-500">
                                        No monthly deductions have been recorded yet. Automatic deductions occur each month once approved.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <button
                                onClick={handlePrint}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-2 rounded-lg font-medium transition"
                            >
                                Print
                            </button>

                            <button
                                onClick={() => setSelectedLoan(null)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 py-2 rounded-lg font-medium transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <LoadingOverlay />}
        </div>
    );
};

export default employeeLoan;
