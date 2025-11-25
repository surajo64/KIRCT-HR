import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import LoadingOverlay from '../components/loadingOverlay.jsx';


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
    const [filteredLoans, setFilteredLoan] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5


    const handleApply = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const loanPayload = {
            amount,
            durationInMonths,
            reason,
        };

        try {
            let data;

            if (editingLoan) {
                const response = await axios.post(
                    backendUrl + "/api/admin/update-loan",
                    {
                        loanId: editingLoan._id, // or editingState._id
                        ...loanPayload,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                data = response.data;
            } else {
                // ✅ Create new loan
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
                setEditingLoan(null); // Clear edit state
                fetchLoans(); // Refresh loan list
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (error) {
            console.error("Loan apply/update error:", error);
            toast.error("Loan request failed");
        }
        finally {
            setIsLoading(false);
        }
    };


    // When editing a loan (e.g. on Edit button click)
    const handleEdit = (loan) => {
        setIsLoading(true);
        setTimeout(() => {
            setEditingLoan(loan);
            setAmount(loan.amount);
            setReason(loan.reason);
            setDurationInMonths(loan.durationInMonths);
            setMonthDeduction(Math.ceil(loan.amount / loan.durationInMonths)); // Optional
            setShowForm(true);
            setIsLoading(false);
        }, 300);
    };

    const fetchLoans = async () => {
        const { data } = await axios.get(backendUrl + "/api/admin/get-employee-loan", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success)
            setLoans(data.loans);
        console.log("Employee Loans", data.loans);
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
            setDurationInMonths("")
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

    const handleView = (loans) => {
        setIsLoading(true);
        setTimeout(() => {
            setSelectedLoan(loans);
            fetchLoans();
            setIsLoading(false);
        }, 300);
    };

    // Filter departments based on search
    useEffect(() => {
        const filtered = (loans || []).filter((d) =>
            d.amount.toString().includes(searchTerm.toLowerCase()) ||
            d.userId.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredLoan(filtered);
        setCurrentPage(1); // Reset to first page on new search
    }, [searchTerm, loans]);

    // Pagination logic
    const totalItems = loans?.length;
    const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
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
        window.location.reload(); // Optional: reload to restore event bindings
    };

    return (


        <div className='w-full max-w-6xl mx-auto px-4 text-center'>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-5">MANAGE LOAN</p>

            {/* Search and Add Button */}
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-4'>
                <input
                    type='text'
                    placeholder='Search by Loan Amount Year...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-1/3'
                />

                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleAddNew}
                        disabled={
                            loans.length > 0 &&
                            loans.some(
                                loan =>
                                    loan.status !== "Completed" && loan.status !== "Rejected"
                            )
                        }
                        className={`py-2 px-4 rounded-md text-sm w-full sm:w-auto transition ${loans.length > 0 &&
                                loans.some(
                                    loan =>
                                        loan.status !== "Completed" && loan.status !== "Rejected"
                                )
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                    >
                        Apply Loan
                    </button>

                    {loans.length > 0 &&
                        loans.some(
                            loan =>
                                loan.status !== "Completed" && loan.status !== "Rejected"
                        ) && (
                            <p className="text-sm text-red-600 font-medium">
                                You have an outstanding loan to pay
                            </p>
                        )}

                </div>
            </div>

            {/* Table container */}
            <div className='bg-white mt-6 rounded-lg shadow overflow-x-auto text-sm max-h-[80vh] min-h-[60vh]'>
                {/* Header */}
                <div className='bg-gray-200 hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] py-3 px-6 rounded-t-xl border-b-4 border-green-500'>
                    <p className="hidden sm:block">#</p>
                    <p>Reason</p>
                    <p>Requested Amount</p>
                    <p>Approved Amount</p>
                    <p>Duration (Months)</p>
                    <p>Monthly Deductions</p>
                    <p>Total Repaid</p>
                    <p>Outstanding Balance</p>
                    <p>Application Date</p>
                    <p>Loan Status</p>
                    <p>Actions</p>
                </div>

                {/* Table Rows */}
                {paginatedLoans.length > 0 ? (
                    paginatedLoans.map((item, index) => (
                        <div
                            key={index}
                            className="flex flex-col sm:grid sm:grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr] items-start sm:items-center text-gray-500 py-3 px-6 border-b hover:bg-blue-50 gap-2"
                        >
                            <p className="hidden sm:block">{(currentPage - 1) * itemsPerPage + index + 1}</p>
                            <p>{item.reason}</p>
                            <p>₦{item.amount.toLocaleString()}</p>
                            <p>
                                ₦ {item.status === "Approved" ? (item.approvedAmount || item.amount)?.toLocaleString() : "Pending"}
                            </p>
                            <p>{item.durationInMonths}</p>
                            <p>{item.monthDeduction}</p>
                            <p>₦{item.totalRepaid.toLocaleString()}</p>
                            <p>₦{(item.approvedAmount - item.totalRepaid).toLocaleString()}</p>
                            <p>{new Date(item.createdAt).toISOString().split('T')[0]}</p>
                            <p>{item.status}</p>
                            <div className="flex sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">

                                {item.status === "Completed" && (
                                    <p className="text-green-600 font-semibold">Loan Payment Completed</p>
                                )}

                                <button
                                    onClick={() => handleView(item)}
                                    className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full"
                                >
                                    View
                                </button>

                                {item.status === "Pending" && (
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="bg-green-500 text-white text-sm px-3 py-1 rounded-full"
                                    >
                                        Update
                                    </button>)}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-5 text-gray-500">No Loan found.</p>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <>
                        <div className="flex justify-center items-center flex-wrap gap-2 mt-4 px-4 pb-4">
                            <button
                                onClick={() => {
                                    setIsLoading(true);
                                    setTimeout(() => {
                                        setCurrentPage(prev => Math.max(prev - 1, 1))
                                        setIsLoading(false);
                                    }, 300);
                                }}
                                disabled={currentPage === 1}
                                className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50"
                            >
                                Prev
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 rounded ${currentPage === i + 1
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => {
                                    setIsLoading(true);
                                    setTimeout(() => {
                                        setCurrentPage(prev => Math.min(prev + 1, totalPages))
                                        setIsLoading(false);
                                    }, 300);
                                }}
                                disabled={currentPage === totalPages}
                                className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>

                        <div className="flex justify-end mt-2 text-sm text-gray-800 px-4 pb-2">
                            Showing {(currentPage - 1) * itemsPerPage + 1}–
                            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                        </div>
                    </>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md relative">
                        {/* Close Button */}
                        <button
                            onClick={closeForm}
                            className="font-bold text-3xl absolute top-2 right-4 text-red-700 hover:text-red-800"
                        >
                            ✕
                        </button>

                        {/* Dynamic Title */}
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
                            {editingLoan ? "Update Loan Application" : "New Loan Application"}
                        </h2>

                        <form onSubmit={handleApply} className="space-y-4 max-w-md mx-auto">
                            <div>
                                <label className="block font-semibold mb-1">Loan Amount Min(₦1,000)</label>
                                <input
                                    type="number"
                                    min="1000"
                                    step="100"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border rounded px-4 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-semibold mb-1">Duration (Months)</label>
                                <select
                                    value={durationInMonths}
                                    onChange={(e) => setDurationInMonths(e.target.value)}
                                    className="w-full border rounded px-4 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                                    required
                                >
                                    <option value="">-- Select Duration --</option>
                                    {[3, 6, 9, 12, 18, 24, 36].map((m) => (
                                        <option key={m} value={m}>
                                            {m} month{m > 1 && 's'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1">Monthly Deduction (₦)</label>
                                <input
                                    type="number"
                                    value={monthDeduction}
                                    disabled
                                    className="w-full border rounded px-4 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold mb-1">Reason for Loan</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="State your reason..."
                                    className="w-full border px-4 py-2 rounded"
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition"
                            >
                                {editingLoan ? "Update Loan" : "Apply"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {selectedLoan && fetchLoans && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 px-2 sm:px-4">
                    <div id="print-salary-table" className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-4 sm:p-8 relative overflow-y-auto max-h-[95vh]">

                        {/* Close button */}
                        <button
                            onClick={() => setSelectedLoan(null)}
                            className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
                        >
                            &times;
                        </button>
                        <div id="print-Loan-table">
                            {/* Header */}
                            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                                {selectedLoan.userId?.name?.toUpperCase() || "N/A"}
                            </h2>

                            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-8 mb-6 text-center sm:text-left">
                                <p className="text-sm text-gray-800 break-words">
                                    <span className="font-semibold text-green-800">Email: </span>
                                    {selectedLoan.userId?.email || "N/A"}
                                </p>

                            </div>

                            {/* Table-like Layout */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-700 border border-gray-200 rounded-md">
                                    <tbody>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50 w-40">Requested Amount</th>
                                            <td className="px-4 py-2">₦{selectedLoan.amount?.toLocaleString() || "N/A"}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50 w-40">Approved Amount</th>
                                            <td className="px-4 py-2">₦ {selectedLoan.approvedAmount?.toLocaleString() || "Pending"}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50 w-40">Payment Duration</th>
                                            <td className="px-4 py-2">{selectedLoan.durationInMonths?.toLocaleString() || "N/A"}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50 w-40">Monthly Deductions</th>
                                            <td className="px-4 py-2">₦{selectedLoan.monthDeduction?.toLocaleString() || "N/A"}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50">Reason</th>
                                            <td className="px-4 py-2">{selectedLoan.reason || "N/A"}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50">Total Repaid</th>
                                            <td className="px-4 py-2">₦{selectedLoan.totalRepaid?.toLocaleString() || "0"}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50">Outstanding Balance</th>
                                            <td className="px-4 py-2">
                                                ₦{(selectedLoan.approvedAmount - selectedLoan.totalRepaid)?.toLocaleString() || "N/A"}
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50">Applied On</th>
                                            <td className="px-4 py-2">
                                                {selectedLoan.createdAt
                                                    ? new Date(selectedLoan.createdAt).toISOString().split("T")[0]
                                                    : "N/A"}
                                            </td>
                                        </tr>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 font-medium bg-gray-50">Loan Status</th>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`font-semibold px-2 py-1 rounded 
                    ${selectedLoan.status === 'Approved' ? 'text-green-600 bg-green-100' :
                                                            selectedLoan.status === 'Rejected' ? 'text-red-600 bg-red-100' :
                                                                'text-yellow-600 bg-yellow-100'}`}
                                                >
                                                    {selectedLoan.status}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>


                            </div>
                        </div>
                        {selectedLoan.status != "Pending" && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={handlePrint}
                                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                                >
                                    Print
                                </button>
                            </div>
                        )}
                    </div>

                </div>

            )}
            {isLoading && <LoadingOverlay />}

        </div>
    );
};

export default employeeLoan;
