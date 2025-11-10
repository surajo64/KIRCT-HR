import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
import LoadingOverlay from "../../components/loadingOverlay.jsx";

const OtherBonus = () => {
  const { token, backendUrl } = useContext(AppContext);
  const [year, setYear] = useState(new Date().getFullYear());
  const [bonusType, setBonusType] = useState("");
  const [calculations, setCalculations] = useState([]);
  const [totalBonusAmount, setTotalBonusAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [processDialog, setProcessDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [payrollReference, setPayrollReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [selectedBonuses, setSelectedBonuses] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [leaveBonusExists, setLeaveBonusExists] = useState(false);

  // ✅ Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/admin/get-all-employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setEmployees(data.employees);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch employees.");
      }
    };
    fetchEmployees();
  }, [backendUrl, token]);

  // ✅ Check if selected staff already has Leave Allowance for the year
  const checkLeaveAllowance = async () => {
    if (!staffId || !year) {
      setLeaveBonusExists(false);
      return;
    }

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/account/other-bonus-history`,
        {
          params: { year, type: "Leave Allowance", staffId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success && data.data && data.data.length > 0) {
        setLeaveBonusExists(true);
      } else {
        setLeaveBonusExists(false);
      }
    } catch (error) {
      console.error("Error checking Leave Allowance:", error);
      setLeaveBonusExists(false);
    }
  };



  // ✅ Run check whenever staff or year changes
  useEffect(() => {
    if (bonusType === "Leave Allowance") checkLeaveAllowance();
  }, [staffId, year, bonusType]);

  // ✅ Generate new bonus
  const calculateBonuses = async () => {
    if (!year) return toast.warning("Please enter a valid year.");
    if (!bonusType) return toast.warning("Please select a bonus type.");
    if (!staffId) return toast.warning("Please select a staff.");

    // Prevent generating duplicate Leave Allowance
    if (bonusType === "Leave Allowance" && leaveBonusExists) {
      return toast.error(`Leave Allowance for ${year} already exists for this staff.`);
    }

    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/account/calculate-other-bonus`,
        { year, type: bonusType, staffId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.data.length > 0) {
        setCalculations(data.data);
        const total = data.data.reduce(
          (acc, calc) => acc + (calc.bonusCalculation?.totalBonus || 0),
          0
        );
        setTotalBonusAmount(total);
        const staff = data.data[0];
        toast.success(`${bonusType} bonus calculated for ${staff.name} (${year})!`);
      } else {
        setCalculations([]);
        toast.info("No bonus found for the selected staff.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error calculating bonus.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Search existing bonuses
  const handleSearchBonuses = async () => {
    if (!year) return toast.warning("Enter a year to search.");
    if (!bonusType) return toast.warning("Select a bonus type to search.");
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/account/other-bonus-history`,
        {
          params: { year, type: bonusType },
          headers: { Authorization: `Bearer ${token}` },
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

        toast.success("Bonus Search successfully")
      } else {
        setCalculations([]);
        toast.info("No bonuses found for that type/year.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch bonuses.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Process bonuses
  const handleProcessBonuses = async () => {
    setIsLoading(true);
    try {
      const formatted = calculations.map((b) => ({
        employee: b.employee?._id || b.employee,
        staffId: b.staffId,
        name: b.name,
        year,
        basicSalary: b.basicSalary,
        annualSalary: b.annualSalary || b.basicSalary * 12,
        bonusCalculation: b.bonusCalculation,
        status: "processed",
        type: bonusType,
      }));

      const { data } = await axios.post(
        `${backendUrl}/api/account/process-other-bonus`,
        { calculations: formatted, year, type: bonusType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Bonuses processed successfully!");
        setProcessDialog(false);
        handleSearchBonuses();
      } else toast.error(data.message);
    } catch (error) {
      console.error(error);
      toast.error("Failed to process bonuses.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Mark as Paid
  const handleMarkAsPaid = async () => {
    if (!payrollReference || !paymentDate)
      return toast.warning("Fill both reference and payment date.");

    if (calculations.length === 0)
      return toast.warning("No bonus records to mark as paid.");

    const bonusIds = calculations.map((b) => b._id);
    setIsLoading(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/account/mark-other-bonus-paid`,
        { bonusIds, paymentDate, payrollReference, type: bonusType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Bonuses marked as paid!");
        setPaymentDialog(false);
        setPayrollReference("");
        setPaymentDate("");
        handleSearchBonuses();
      } else toast.error(data.message);
    } catch (error) {
      console.error(error);
      toast.error("Error marking bonuses as paid.");
    } finally {
      setIsLoading(false);
    }
  };

  // Status color
  const getStatusColor = (status) => {
    switch (status) {
      case "processed":
        return "text-blue-600";
      case "paid":
        return "text-green-600";
      default:
        return "text-gray-500";
    }
  };

  return (

    <div className="w-full max-w-6xl mx-auto px-4 text-center">
      <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-5">
        OTHER BONUS GENERATOR
      </p>

      {/* Inputs */}
      <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-4 mt-5">
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="px-4 py-2 border rounded-md w-full sm:w-52 focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Staff</option>
          {employees
            .filter((emp) => emp.status === true)
            .sort((a, b) => a.name.localeCompare(b.name)) // ✅ Sort alphabetically by name (A-Z)
            .map((emp) => (
              <option key={emp._id} value={emp.staffId}>
                {emp.name} ({emp.staffId})
              </option>
            ))}
        </select>


        <select
          value={bonusType}
          onChange={(e) => setBonusType(e.target.value)}
          className="px-4 py-2 border rounded-md w-full sm:w-52 focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Bonus Type</option>
          <option value="Leave Allowance">Leave Allowance</option>
          <option value="Others">Others</option>
        </select>

        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 w-full sm:w-40"
        />

        <button
          onClick={calculateBonuses}
          disabled={
            isLoading ||
            !staffId || // 🚫 disable when no staff selected
            (bonusType === "Leave Allowance" && leaveBonusExists)
          }
          className={`py-2 px-4 rounded-md w-full sm:w-auto text-white transition ${isLoading || !staffId || (bonusType === "Leave Allowance" && leaveBonusExists)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
            }`}
        >
          {isLoading ? "Generating..." : "Generate Bonus"}
        </button>


        <button
          onClick={handleSearchBonuses}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition w-full sm:w-auto"
        >
          {isLoading ? "Searching..." : "Search Bonus"}
        </button>
      </div>

      {/* Message if Leave Allowance exists */}
      {bonusType === "Leave Allowance" && leaveBonusExists && (
        <p className="text-red-600 mt-3">
          Leave Allowance already exists for this employee in {year}.
        </p>
      )}

      {/* Results Table */}
      {calculations.length > 0 && (
        <div className="bg-white mt-6 rounded-lg shadow overflow-x-auto text-sm max-h-[80vh] min-h-[60vh]">
          <div className="flex justify-between items-center bg-gray-200 py-3 px-6 border-b-4 border-green-500">
            <p className="font-semibold text-gray-800">
              {staffId
                ? `${calculations.find((c) => c.staffId === staffId)?.name || ''} — ${bonusType}`
                : `${bonusType} for All Employees`}
            </p>
            <p className="font-bold text-green-600">
              Total: ₦
              {(
                staffId
                  ? calculations
                    .filter((calc) => calc.staffId === staffId)
                    .reduce(
                      (sum, calc) => sum + (calc.bonusCalculation?.totalBonus || 0),
                      0
                    )
                  : totalBonusAmount
              ).toLocaleString()}
            </p>

          </div>

          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Staff ID</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Basic Salary</th>
                <th className="p-3 border">Total Bonus</th>
                <th className="p-3 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {(staffId
                ? calculations.filter((calc) => calc.staffId === staffId) // ✅ Show only selected staff
                : calculations
              ).map((calc) => (
                <tr
                  key={calc._id || calc.staffId}
                  className="hover:bg-blue-50 cursor-pointer"
                >
                  <td className="p-3 border">{calc.staffId}</td>
                  <td className="p-3 border">{calc.name}</td>
                  <td className="p-3 border">
                    ₦{calc.basicSalary?.toLocaleString()}
                  </td>
                  <td className="p-3 border font-semibold">
                    ₦{calc.bonusCalculation?.totalBonus?.toLocaleString()}
                  </td>
                  <td
                    className={`p-3 border font-medium ${getStatusColor(
                      calc.status
                    )}`}
                  >
                    {calc.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Action Buttons */}
          <div className="flex justify-center flex-wrap gap-3 py-4">
            <button
              onClick={() => setProcessDialog(true)}
              disabled={
                calculations.length === 0 ||
                calculations.every((calc) => calc.status !== "pending")
              }
              className={`px-4 py-2 rounded-md text-white ${calculations.length === 0 ||
                calculations.every((calc) => calc.status !== "pending")
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              Process Bonuses
            </button>

            <button
              onClick={() => setPaymentDialog(true)}
              disabled={
                calculations.length === 0 ||
                calculations.every((calc) => calc.status !== "processed")
              }
              className={`px-4 py-2 rounded-md text-white ${calculations.length === 0 ||
                calculations.every((calc) => calc.status !== "processed")
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
                }`}
            >
              Mark as Paid
            </button>
          </div>
        </div>
      )}

      {/* Process Dialog */}
      {processDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-700 mb-4">
              Process {bonusType} Bonuses
            </h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to process{" "}
              <strong>{calculations.length}</strong> records?
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
              Mark as Paid ({bonusType})
            </h2>
            <input
              type="text"
              placeholder="Payroll Reference"
              value={payrollReference}
              onChange={(e) => setPayrollReference(e.target.value)}
              className="w-full mb-3 px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
            />
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full mb-4 px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
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

export default OtherBonus;
