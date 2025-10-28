import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import LoadingOverlay from "../../components/loadingOverlay.jsx";

const YearEndPayroll = () => {
    const { token, backendUrl } = useContext(AppContext);
    const [year, setYear] = useState(new Date().getFullYear());
    const [calculations, setCalculations] = useState([]);
    const [totalBonusAmount, setTotalBonusAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [processDialog, setProcessDialog] = useState(false);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [payrollReference, setPayrollReference] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [selectedBonuses, setSelectedBonuses] = useState([]);

    const calculateBonuses = async () => {
        if (!year) return toast.warning("Please enter a valid year.");
        setIsLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/account/calculate`,
                { year },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setCalculations(data.data || []); // notice: backend sends data.data
                const total = (data.data || []).reduce(
                    (acc, calc) => acc + (calc.bonusCalculation?.totalBonus || 0),
                    0
                );
                setTotalBonusAmount(total);
                toast.success("Bonus calculations generated successfully!");
            } else {
                toast.error(data.message || "Failed to calculate bonuses.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while calculating bonuses.");
        } finally {
            setIsLoading(false);
        }
    };


    // ✅ Process bonuses
    // Process bonuses
    const handleProcessBonuses = async () => {
        setIsLoading(true);
        try {
            const formattedCalculations = calculations.map(b => ({
                employee: b.employee?._id || b.employee,
                staffId: b.staffId,
                name: b.name,
                year,
                basicSalary: b.basicSalary,
                annualSalary: b.annualSalary || b.basicSalary * 12,
                bonusCalculation: b.bonusCalculation || {
                    oneMonthBasic: b.basicSalary,
                    tenPercentAnnual: b.basicSalary * 12 * 0.1,
                    totalBonus: b.basicSalary + b.basicSalary * 12 * 0.1
                },
                status: "processed"
            }));

            const { data } = await axios.post(
                `${backendUrl}/api/account/process`,
                { calculations: formattedCalculations, year },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success("Bonuses processed successfully!");
                setProcessDialog(false);
                calculateBonuses(); // Refresh data
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to process bonuses.");
        } finally {
            setIsLoading(false);
        }
    };



    // Mark as paid
    const handleMarkAsPaid = async () => {
        if (!payrollReference || !paymentDate)
            return toast.warning("Please fill in both reference and date.");

        if (!calculations || calculations.length === 0)
            return toast.warning("No bonus records available to mark as paid.");

        // Get all IDs from fetched bonuses
        const bonusIds = calculations.map((b) => b._id);

        setIsLoading(true);
        try {
            const { data } = await axios.put(
                `${backendUrl}/api/account/mark-paid`,
                { bonusIds, paymentDate, payrollReference },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message || "Bonuses marked as paid!");
                setPaymentDialog(false);
                setPayrollReference("");
                setPaymentDate("");

                // Refresh bonus list
                handleSearchBonuses();
            } else {
                toast.error(data.message || "Failed to mark bonuses as paid.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error marking bonuses as paid.");
        } finally {
            setIsLoading(false);
        }
    };

    // to download
    const handleDownloadExcel = async () => {
        
        try {
            const { data } = await axios.get(`${backendUrl}/api/account/export-bonuses/${year}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Annual_Bonuses_${year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            toast.success("Excel file downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download Excel file.");
        }
    };

    // 🔹 Search Existing Bonuses by Year
    const handleSearchBonuses = async () => {
        if (!year) return toast.warning("Please enter a year to search.");
        setIsLoading(true);
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/account/history`,
                {
                    params: { year }, // ✅ send year as query param
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (data.success && data.data.length > 0) {
                const fetched = data.data.map((item) => ({
                    _id: item._id,
                    staffId: item.staffId || item.employee?.staffId,
                    name: item.name || item.employee?.name,
                    basicSalary: item.basicSalary || item.employee?.basicSalary,
                    bonusCalculation: item.bonusCalculation,
                    status: item.status,
                }));

                setCalculations(fetched);

                const total = fetched.reduce(
                    (acc, calc) => acc + (calc.bonusCalculation?.totalBonus || 0),
                    0
                );
                setTotalBonusAmount(total);

                toast.success(`Found ${fetched.length} processed bonuses for ${year}.`);
            } else {
                setCalculations([]);
                toast.info("No processed bonuses found for that year.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch bonuses.");
        } finally {
            setIsLoading(false);
        }
    };




    // Status color
    const getStatusColor = (status) => {
        switch (status) {
            case "Processed":
                return "text-blue-600";
            case "Paid":
                return "text-green-600";
            default:
                return "text-gray-500";
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-5">
                ANNUAL BONUS CALCULATOR
            </p>

            {/* Input & Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-4 mt-5">
                <input
                    type="number"
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-40"
                />

                <button
                    onClick={calculateBonuses}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition w-full sm:w-auto"
                >
                    {isLoading ? "Calculating..." : "Calculate Bonuses"}
                </button>

                <button
                    onClick={handleSearchBonuses}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition w-full sm:w-auto"
                >
                    {isLoading ? "Searching..." : "Search Bonus"}
                </button>
            </div>

            {/* Results Table */}
            {calculations.length > 0 && (
                <div className="bg-white mt-6 rounded-lg shadow overflow-x-auto text-sm max-h-[80vh] min-h-[60vh]">
                    <div className="flex justify-between items-center bg-gray-200 py-3 px-6 border-b-4 border-green-500">
                        <p className="font-semibold text-gray-800">
                            {calculations.length} Employees
                        </p>
                        <p className="font-bold text-green-600">
                            Total: ₦{totalBonusAmount.toLocaleString()}
                        </p>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 border">Staff ID</th>
                                <th className="p-3 border">Name</th>
                                <th className="p-3 border">Basic Salary</th>
                                <th className="p-3 border">1 Month Basic</th>
                                <th className="p-3 border">10% Annual</th>
                                <th className="p-3 border">Total Bonus</th>
                                <th className="p-3 border">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculations.map((calc) => (
                                <tr
                                    key={calc._id || calc.staffId}
                                    className={`hover:bg-blue-50 cursor-pointer ${selectedBonuses.includes(calc._id)
                                            ? "bg-gray-100"
                                            : ""
                                        }`}
                                    onClick={() => {
                                        if (calc._id) {
                                            setSelectedBonuses((prev) =>
                                                prev.includes(calc._id)
                                                    ? prev.filter((id) => id !== calc._id)
                                                    : [...prev, calc._id]
                                            );
                                        }
                                    }}
                                >
                                    <td className="p-3 border">{calc.staffId}</td>
                                    <td className="p-3 border">{calc.name}</td>
                                    <td className="p-3 border">
                                        ₦{calc.basicSalary?.toLocaleString()}
                                    </td>
                                    <td className="p-3 border">
                                        ₦{calc.bonusCalculation?.oneMonthBasic?.toLocaleString()}
                                    </td>
                                    <td className="p-3 border">
                                        ₦{calc.bonusCalculation?.tenPercentAnnual?.toLocaleString()}
                                    </td>
                                    <td className="p-3 border font-semibold">
                                        ₦{calc.bonusCalculation?.totalBonus?.toLocaleString()}
                                    </td>
                                    <td className={`p-3 border font-medium ${getStatusColor(calc.status)}`}>
                                        {calc.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Action Buttons */}
                    <div className="flex justify-center flex-wrap gap-3 py-4">
                        {/* 🔹 Process Bonuses — disable if ALL are processed or paid */}
                        <button
                            onClick={() => setProcessDialog(true)}
                            disabled={calculations.length === 0 || calculations.every(calc => calc.status !== "pending")}
                            className={`px-4 py-2 rounded-md transition text-white ${calculations.length === 0 || calculations.every(calc => calc.status !== "pending")
                                    ? "bg-blue-300 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                        >
                            Process Bonuses
                        </button>

                        {/* 🔹 Mark as Paid — disable if ALL are paid or no processed bonuses */}
                        <button
                            onClick={() => setPaymentDialog(true)}
                            disabled={
                                calculations.length === 0 ||
                                calculations.every(calc => calc.status !== "processed")
                            }
                            className={`px-4 py-2 rounded-md transition text-white ${calculations.length === 0 ||
                                    calculations.every(calc => calc.status !== "processed")
                                    ? "bg-green-300 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                        >
                            Mark as Paid
                        </button>

                        {/* 🔹 Download Excel — enable ONLY if all are paid */}
                        <button
                            onClick={handleDownloadExcel}
                            disabled={
                                calculations.length === 0 ||
                                calculations.some(calc => calc.status !== "processed")
                            }
                            className={`px-4 py-2 rounded-md transition text-white ${calculations.length === 0 ||
                                    calculations.some(calc => calc.status !== "processed")
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-gray-500 hover:bg-gray-600"
                                }`}
                        >
                            Download Excel
                        </button>

                    </div>
                </div>
            )}

            {/* Process Dialog */}
            {processDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-700 mb-4">
                            Process Annual Bonuses
                        </h2>
                        <p className="mb-6 text-gray-600">
                            Are you sure you want to process{" "}
                            <strong>
                                {calculations.filter((calc) => !calc.isExisting).length}
                            </strong>{" "}
                            bonus calculations?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setProcessDialog(false)}
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessBonuses}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                            >
                                {isLoading ? "Processing..." : "Process"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Dialog */}
            {paymentDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-700 mb-4">
                            Mark Bonuses as Paid
                        </h2>
                        <input
                            type="text"
                            placeholder="Payroll Reference"
                            value={payrollReference}
                            onChange={(e) => setPayrollReference(e.target.value)}
                            className="w-full mb-3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setPaymentDialog(false)}
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkAsPaid}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                            >
                                {isLoading ? "Marking..." : "Mark as Paid"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <LoadingOverlay />}
        </div>
    );
};

export default YearEndPayroll;
