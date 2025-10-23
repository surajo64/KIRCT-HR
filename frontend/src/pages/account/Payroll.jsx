import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from "react-toastify";

// TableHead component
const TableHead = ({ title }) => (
    <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase whitespace-nowrap">
        {title}
    </th>
);

// PayrollRow component
const PayrollRow = ({ payroll, formatCurrency, onUpdate, onViewDetail, staffType }) => {
    const [editing, setEditing] = useState(false);
    const [overtimeHours, setOvertimeHours] = useState(payroll.overtimeHours || 0);
    const [loanDeductions, setLoanDeductions] = useState(payroll.loanDeductions || 0);
    const [nonTaxPay, setNonTaxPay] = useState(payroll.nonTaxPay || 0);
    const [mealAllowance, setMealAllowance] = useState(payroll.mealAllowance || 0);
    const [transportAllowance, setTransportAllowance] = useState(payroll.transportAllowance || 0);

    const handleSave = () => {
        const updates = {
            overtimeHours: parseFloat(overtimeHours) || 0,
            nonTaxPay: parseFloat(nonTaxPay) || 0,
        };

        // Only include meal allowance and transport allowance for permanent staff
        if (staffType === 'permanent') {
            updates.loanDeductions = parseFloat(loanDeductions) || 0,
            updates.transportAllowance = parseFloat(transportAllowance) || 0;
        }

        onUpdate(payroll._id, updates);
        setEditing(false);
    };

    const handleCancel = () => {
        setOvertimeHours(payroll.overtimeHours || 0);
        setLoanDeductions(payroll.loanDeductions || 0);
        setNonTaxPay(payroll.nonTaxPay || 0);
        setMealAllowance(payroll.mealAllowance || 0);
        setTransportAllowance(payroll.transportAllowance || 0);
        setEditing(false);
    };

    const isPermanent = staffType === 'permanent';

    return (
        <tr className="text-[11px] hover:bg-gray-50">
            <td className="px-2 py-2">{payroll.employee?.staffId || 'N/A'}</td>
            <td className="px-2 py-2 truncate max-w-[100px]">{payroll.employee?.name || 'Unknown'}</td>
            <td className="px-2 py-2">{formatCurrency(payroll.basicSalary)}</td>

            {/* Transport Allowance - Show for all, editable only for permanent */}
            <td className="px-2 py-2">
                {editing && isPermanent ? (
                    <input
                        type="number"
                        value={transportAllowance}
                        onChange={(e) => setTransportAllowance(e.target.value)}
                        className="w-16 border border-gray-300 rounded px-1 py-0.5 text-[11px]"
                        min="0"
                    />
                ) : (
                    formatCurrency(payroll.transportAllowance || 0)
                )}
            </td>

            {/* Meal Allowance - Show for all, editable only for permanent */}
            <td className="px-2 py-2">{formatCurrency(payroll.mealAllowance)}</td>

            <td className="px-2 py-2">
                {editing ? (
                    <input
                        type="number"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(e.target.value)}
                        className="w-14 border border-gray-300 rounded px-1 py-0.5 text-[11px]"
                        min="0"
                    />
                ) : (
                    payroll.overtimeHours || 0
                )}
            </td>

            <td className="px-2 py-2">{formatCurrency(payroll.overtimeAmount)}</td>
            <td className="px-2 py-2">{formatCurrency(payroll.grossSalary)}</td>

            {/* Show PAYE Tax for permanent staff, Withholding Tax for non-permanent staff */}
            <td className="px-2 py-2">
                {isPermanent
                    ? formatCurrency(payroll.payeTax)
                    : formatCurrency(payroll.withholdingTax || 0)
                }
            </td>

            {/* Hide Pension, Loan, and NonTax for non-permanent staff */}
            {isPermanent && (
                <td className="px-2 py-2">{formatCurrency(payroll.pension || 0)}</td>
            )}

            {isPermanent && (
                <td className="px-2 py-2">
                    {editing ? (
                        <input
                            type="number"
                            value={loanDeductions}
                            onChange={(e) => setLoanDeductions(e.target.value)}
                            className="w-14 border border-gray-300 rounded px-1 py-0.5 text-[11px]"
                            min="0"
                        />
                    ) : (
                        formatCurrency(payroll.loanDeductions)
                    )}
                </td>
            )}

            {isPermanent && (
                <td className="px-2 py-2">
                    {editing ? (
                        <input
                            type="number"
                            value={nonTaxPay}
                            onChange={(e) => setNonTaxPay(e.target.value)}
                            className="w-14 border border-gray-300 rounded px-1 py-0.5 text-[11px]"
                            min="0"
                        />
                    ) : (
                        formatCurrency(payroll.nonTaxPay)
                    )}
                </td>
            )}

            <td className="px-2 py-2 font-semibold">{formatCurrency(payroll.netSalary)}</td>

            <td className="px-2 py-2">
                {editing ? (
                    <div className="flex gap-1">
                        <button onClick={handleSave} className="text-green-600 text-xs hover:text-green-800">✓ Save</button>
                        <button onClick={handleCancel} className="text-red-600 text-xs hover:text-red-800">✕ Cancel</button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => setEditing(true)} className="text-blue-600 text-xs hover:text-blue-800">Edit</button>
                        <button onClick={() => onViewDetail(payroll)} className="text-green-600 text-xs hover:text-green-800">View</button>
                    </div>
                )}
            </td>
        </tr>
    );
};

// Main Payroll component
const Payroll = () => {
    const { token, backendUrl, logout } = useContext(AppContext);

    const [payrolls, setPayrolls] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [staffType, setStaffType] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // ✅ Fetch payroll records
    const fetchPayrolls = async () => {
        try {
            if (!staffType) {
                toast.warn('⚠️ Please select a staff type before searching.');
                return;
            }

            setLoading(true);

            const response = await axios.get(`${backendUrl}/api/account/get-payroll`, {
                params: {
                    month: selectedMonth,
                    year: selectedYear,
                    staffType
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            const payrollData = response.data?.data || [];

            if (payrollData.length === 0) {
                toast.info('ℹ️ No payroll found for the selected filters.');
            }

            setPayrolls(payrollData);
            console.log("Payroll", payrollData);

        } catch (error) {
            console.error('Error fetching payrolls:', error);
            if (error.response?.status === 401) logout();
            toast.error('❌ Error fetching payrolls.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Generate payroll
    const generatePayroll = async () => {
        if (!staffType) {
            toast.warn('⚠️ Please select a staff type before generating payroll.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${backendUrl}/api/account/add-payroll`,
                {
                    month: selectedMonth,
                    year: selectedYear,
                    staffType
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchPayrolls();
            toast.success(response.data?.message || 'Payroll generated successfully!');
        } catch (error) {
            console.error('Error generating payroll:', error);
            const message = error.response?.data?.message || error.message;
            toast.error(`❌ Error generating payroll: ${message}`);
            if (error.response?.status === 401) logout();
        } finally {
            setLoading(false);
        }
    };

    // ✅ Update payroll
    const updatePayroll = async (id, updates) => {
        try {
            await axios.post(
                `${backendUrl}/api/account/update-payroll`,
                { payrollId: id, ...updates },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPayrolls();
            toast.success('Payroll updated successfully!');
        } catch (error) {
            console.error('Error updating payroll:', error);
            toast.error('Error updating payroll: ' + (error.response?.data?.message || error.message));
            if (error.response?.status === 401) logout();
        }
    };

    // ✅ Download Excel
    const downloadExcel = async () => {
        try {
            const response = await axios.get(
                `${backendUrl}/api/account/download-excel?month=${selectedMonth}&year=${selectedYear}`,
                {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payroll-${selectedMonth}-${selectedYear}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Excel:', error);
            if (error.response?.status === 401) logout();
            else toast.error('Error downloading Excel. Please try again.');
        }
    };

    // 🔎 Filter by search
    const filteredPayrolls = payrolls.filter((p) => {
        const name = p.employee?.name?.toLowerCase() || '';
        const staffId = p.employee?.staffId?.toString().toLowerCase() || '';
        const term = searchTerm.toLowerCase();
        return name.includes(term) || staffId.includes(term);
    });

    // Calculate totals for the summary row
    const totals = filteredPayrolls.length > 0 ? {
        basicSalary: filteredPayrolls.reduce((sum, p) => sum + (p.basicSalary || 0), 0),
        transportAllowance: filteredPayrolls.reduce((sum, p) => sum + (p.transportAllowance || 0), 0),
        mealAllowance: filteredPayrolls.reduce((sum, p) => sum + (p.mealAllowance || 0), 0),
        overtimeAmount: filteredPayrolls.reduce((sum, p) => sum + (p.overtimeAmount || 0), 0),
        grossSalary: filteredPayrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
        payeTax: filteredPayrolls.reduce((sum, p) => sum + (p.payeTax || 0), 0),
        withholdingTax: filteredPayrolls.reduce((sum, p) => sum + (p.withholdingTax || 0), 0),
        pension: filteredPayrolls.reduce((sum, p) => sum + (p.pension || 0), 0),
        loanDeductions: filteredPayrolls.reduce((sum, p) => sum + (p.loanDeductions || 0), 0),
        nonTaxPay: filteredPayrolls.reduce((sum, p) => sum + (p.nonTaxPay || 0), 0),
        netSalary: filteredPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
    } : null;

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);

    const handleViewDetail = (payroll) => {
        setSelectedPayroll(payroll);
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedPayroll(null);
        setShowModal(false);
    };

    // Helper components for the modal
    const InfoRow = ({ label, value, highlight = false }) => (
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            <span className={`text-sm font-semibold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
                {value || 'N/A'}
            </span>
        </div>
    );

    const EarningCard = ({ label, amount, sub, isHighlight = false }) => (
        <div className={`text-center p-4 rounded-lg border ${isHighlight ? 'bg-green-100 border-green-300' : 'bg-white border-green-200'
            }`}>
            <p className="text-sm text-green-600 font-medium">{label}</p>
            <p className={`font-bold mt-1 ${isHighlight ? 'text-2xl text-green-800' : 'text-lg text-green-700'
                }`}>
                {formatCurrency(amount)}
            </p>
            {sub && <p className="text-xs text-green-500 mt-1">{sub}</p>}
        </div>
    );

    const DeductionCard = ({ label, amount, sub }) => (
        <div className="text-center p-4 bg-white rounded-lg border border-red-200">
            <p className="text-sm text-red-600 font-medium">{label}</p>
            <p className="text-lg font-bold text-red-700 mt-1">
                {formatCurrency(amount)}
            </p>
            {sub && <p className="text-xs text-red-500 mt-1">{sub}</p>}
        </div>
    );

    const SummaryRow = ({ label, value, isDeduction = false }) => (
        <div className="flex justify-between items-center py-2 border-b border-blue-200">
            <span className={`text-sm font-medium ${isDeduction ? 'text-red-600' : 'text-blue-700'}`}>
                {label}
            </span>
            <span className={`font-medium ${isDeduction ? 'text-red-600' : 'text-blue-800'}`}>
                {value}
            </span>
        </div>
    );

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Payroll Management</h1>

            {/* Filters & Actions */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
                {/* Top Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Month */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Year */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            {Array.from({ length: 5 }, (_, i) => (
                                <option key={i} value={new Date().getFullYear() - 2 + i}>
                                    {new Date().getFullYear() - 2 + i}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type of Staff */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type of Staff</label>
                        <select
                            value={staffType}
                            onChange={(e) => setStaffType(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">-- Select Type --</option>
                            <option value="permanent">Permanent</option>
                            <option value="locum">Locum/Contract</option>
                            <option value="consultant">Consultant</option>
                        </select>
                    </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex justify-center flex-wrap gap-2 mt-4">
                    <button
                        onClick={fetchPayrolls}
                        disabled={loading || !staffType}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>

                    <button
                        onClick={generatePayroll}
                        disabled={loading || !staffType}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate'}
                    </button>

                    <button
                        onClick={downloadExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                        Download
                    </button>
                </div>

                {/* Search Bar Row */}
                <div className="flex justify-center mt-4">
                    <div className="w-full max-w-md">
                        <label className="block text-sm font-medium text-gray-700 text-center">Search Employee</label>
                        <input
                            type="text"
                            placeholder="Search by Staff ID or Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                </div>
            </div>

            {/* ✅ Responsive Payroll Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {filteredPayrolls.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No payroll records found for the selected period.</p>
                        <button
                            onClick={generatePayroll}
                            disabled={loading}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate Payroll for this Period'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-x-auto md:overflow-x-hidden">
                        <table className="min-w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <TableHead title="Staff ID" />
                                    <TableHead title="Employee Name" />
                                    <TableHead title="Basic" />
                                    <TableHead title="Transport" />
                                    <TableHead title="Meal" />
                                    <TableHead title="OT Hours" />
                                    <TableHead title="OT Amt" />
                                    <TableHead title="Gross" />

                                    {/* Show PAYE for permanent staff, W/Tax for non-permanent staff */}
                                    {staffType === 'permanent' ? (
                                        <TableHead title="PAYE" />
                                    ) : (
                                        <TableHead title="W/Tax" />
                                    )}

                                    {/* Hide Pension, Loan, and NonTax for non-permanent staff */}
                                    {staffType === 'permanent' && <TableHead title="Pension" />}
                                    {staffType === 'permanent' && <TableHead title="Loan" />}
                                    {staffType === 'permanent' && <TableHead title="NonTax" />}
                                    <TableHead title="Net" />
                                    <TableHead title="Actions" />
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPayrolls.map((payroll) => (
                                    <PayrollRow
                                        key={payroll._id}
                                        payroll={payroll}
                                        formatCurrency={formatCurrency}
                                        onUpdate={updatePayroll}
                                        onViewDetail={handleViewDetail}
                                        staffType={staffType}
                                    />
                                ))}

                                {/* Total Row */}
                                {totals && (
                                    <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold border-t-4 border-white">
                                        <td className="px-2 py-3 text-[11px] text-center">TOTAL</td>
                                        <td className="px-2 py-3 text-[11px] text-center">-</td>
                                        <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.basicSalary)}</td>
                                        <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.transportAllowance)}</td>
                                        <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.mealAllowance)}</td>
                                        <td className="px-2 py-3 text-[11px] text-center">-</td>
                                        <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.overtimeAmount)}</td>
                                        <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.grossSalary)}</td>

                                        {/* Show PAYE total for permanent staff, Withholding Tax total for non-permanent staff */}
                                        {staffType === 'permanent' ? (
                                            <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.payeTax)}</td>
                                        ) : (
                                            <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.withholdingTax || 0)}</td>
                                        )}

                                        {/* Hide Pension, Loan, and NonTax totals for non-permanent staff */}
                                        {staffType === 'permanent' && (
                                            <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.pension)}</td>
                                        )}
                                        {staffType === 'permanent' && (
                                            <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.loanDeductions)}</td>
                                        )}
                                        {staffType === 'permanent' && (
                                            <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.nonTaxPay)}</td>
                                        )}
                                        <td className="px-2 py-3 text-[11px] text-right">{formatCurrency(totals.netSalary)}</td>
                                        <td className="px-2 py-3 text-[11px] text-center">-</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Detail Modal */}
            {showModal && selectedPayroll && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Payroll Details</h2>
                                    <p className="text-blue-100 text-sm">
                                        {selectedPayroll.employee?.userId?.name || selectedPayroll.employee?.name} • {selectedPayroll.employee?.staffId}
                                    </p>
                                    <p className="text-blue-200 text-xs">
                                        Staff Type: {selectedPayroll.employee?.type?.toUpperCase()}
                                    </p>
                                    <p className="text-blue-200 text-xs">
                                        {new Date(selectedPayroll.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-white hover:text-blue-200 text-2xl font-bold transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-6">
                            {/* Employee Information Card */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Employee Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <InfoRow label="Full Name" value={selectedPayroll.employee?.userId?.name || selectedPayroll.employee?.name} />
                                        <InfoRow label="Staff ID" value={selectedPayroll.employee?.staffId} highlight />
                                        <InfoRow label="Staff Type" value={selectedPayroll.employee?.type} />
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="Department" value={selectedPayroll.employee?.department?.name} />
                                        <InfoRow label="Pay Period" value={`${selectedPayroll.month}/${selectedPayroll.year}`} />
                                        <InfoRow label="Status" value={selectedPayroll.status} />
                                    </div>
                                </div>
                            </div>

                            {/* Earnings Section */}
                            <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
                                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Earnings
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <EarningCard label="Basic Salary" amount={selectedPayroll.basicSalary} />

                                    {/* Show transport & meal allowance for permanent staff only */}
                                    {selectedPayroll.employee?.type === 'permanent' && (
                                        <>
                                            <EarningCard label="Transport Allowance" amount={selectedPayroll.transportAllowance} />
                                            <EarningCard label="Meal Allowance" amount={selectedPayroll.mealAllowance} />
                                        </>
                                    )}

                                    <EarningCard
                                        label="Overtime"
                                        amount={selectedPayroll.overtimeAmount}
                                        sub={`${selectedPayroll.overtimeHours}h × ${formatCurrency(selectedPayroll.overtimeRate)}`}
                                    />

                                    <EarningCard label="Gross Salary" amount={selectedPayroll.grossSalary} isHighlight />
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div className="bg-red-50 rounded-xl p-6 mb-6 border border-red-200">
                                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    Deductions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Pension for permanent staff */}
                                    {selectedPayroll.employee?.type === 'permanent' && (
                                        <>
                                            <DeductionCard label="Employee Pension" amount={selectedPayroll.employeePension} sub="8% of Basic" />
                                            <DeductionCard label="Employer Pension" amount={selectedPayroll.employerPension} sub="10% of Basic" />
                                        </>
                                    )}

                                    {/* Tax */}
                                    {selectedPayroll.employee?.type === 'permanent' ? (
                                        <DeductionCard label="PAYE Tax" amount={selectedPayroll.payeTax} />
                                    ) : (
                                        <DeductionCard label="Withholding Tax" amount={selectedPayroll.withholdingTax} sub="5% of Gross" />
                                    )}

                                    {/* Loan deduction for permanent staff */}
                                    {selectedPayroll.employee?.type === 'permanent' && (
                                        <DeductionCard label="Loan Deductions" amount={selectedPayroll.loanDeductions} />
                                    )}
                                </div>

                                {/* Total Deductions */}
                                <div className="mt-4 pt-4 border-t border-red-200">
                                    <div className="text-center p-4 bg-red-100 rounded-lg border border-red-300">
                                        <p className="text-sm text-red-700 font-medium">Total Deductions</p>
                                        <p className="text-xl font-bold text-red-800 mt-1">
                                            {formatCurrency(selectedPayroll.totalDeductions || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Section */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Salary Summary
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <SummaryRow label="Gross Salary" value={formatCurrency(selectedPayroll.grossSalary)} />

                                        {/* Show deductions */}
                                        {selectedPayroll.employee?.type === 'permanent' && (
                                            <SummaryRow label="Employee Pension" value={`-${formatCurrency(selectedPayroll.employeePension)}`} isDeduction />
                                        )}
                                        {selectedPayroll.employee?.type === 'permanent' ? (
                                            <SummaryRow label="PAYE Tax" value={`-${formatCurrency(selectedPayroll.payeTax)}`} isDeduction />
                                        ) : (
                                            <SummaryRow label="Withholding Tax" value={`-${formatCurrency(selectedPayroll.withholdingTax)}`} isDeduction />
                                        )}
                                        {selectedPayroll.employee?.type === 'permanent' && (
                                            <SummaryRow label="Loan Deductions" value={`-${formatCurrency(selectedPayroll.loanDeductions)}`} isDeduction />
                                        )}

                                        <SummaryRow label="Total Deductions" value={`-${formatCurrency(selectedPayroll.totalDeductions)}`} isDeduction />

                                        <div className="flex justify-between items-center pt-4 border-t-2 border-blue-300">
                                            <span className="text-lg font-bold text-blue-900">Net Salary</span>
                                            <span className="text-2xl font-bold text-green-600">
                                                {formatCurrency(selectedPayroll.netSalary)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <p className="text-sm font-medium text-blue-700 mb-2">Additional Information</p>
                                            <div className="space-y-2 text-sm">
                                                {selectedPayroll.employee?.type === 'permanent' && (
                                                    <>
                                                        <InfoRow label="Total Pension" value={formatCurrency(selectedPayroll.pension)} />
                                                        <InfoRow label="Non-Tax Pay" value={formatCurrency(selectedPayroll.nonTaxPay)} />
                                                    </>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Status:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedPayroll.status === 'Paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {selectedPayroll.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedPayroll.employee?.bankAccount && (
                                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                                                <p className="text-sm font-medium text-blue-700 mb-2">Bank Details</p>
                                                <div className="space-y-1 text-sm">
                                                    <InfoRow label="Bank" value={selectedPayroll.employee.bankAccount.bankName} />
                                                    <InfoRow label="Account" value={selectedPayroll.employee.bankAccount.accountNumber} />
                                                    <InfoRow label="Name" value={selectedPayroll.employee.bankAccount.accountName} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-colors shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;