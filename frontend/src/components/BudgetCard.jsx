import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Pencil, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const BudgetCard = ({ spent: dashboardSpent, budget: dashboardBudget }) => {
  const [budget, setBudget] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ account: "", amount: "", category: "general" });

  const { token, backendUrl } = useContext(AppContext);
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  // ✅ Fetch accounts (for form dropdown)
  useEffect(() => {
    if (!token) return;
    const fetchAccounts = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/account/get-all-account`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setAccounts(res.data.data);
      } catch (error) {
        toast.error("Failed to load accounts");
      }
    };
    fetchAccounts();
  }, [backendUrl, token]);

  // ✅ Load monthly budget (only if not from dashboard)
  useEffect(() => {
    if (!token || dashboardBudget) return;
    const fetchBudget = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/api/account/get-Budget?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success && res.data.data.length > 0) {
          setBudget(res.data.data[0]);
        }
      } catch (err) {
        console.error("Error fetching budget:", err);
      }
    };
    fetchBudget();
  }, [backendUrl, token, dashboardBudget]);

  // ✅ Add or update budget
  const handleSave = async () => {
    if (!form.account || !form.amount || !form.category)
      return toast.error("Please fill all fields");

    try {
      const res = await axios.post(
        `${backendUrl}/api/account/add-Budget`,
        { account: form.account, category: form.category, amount: form.amount, month, year },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setBudget(res.data.data);
        setShowForm(false);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error("Error saving budget");
      console.error(error);
    }
  };

  // ✅ Decide what to show
  const total = dashboardBudget || budget?.amount || 0;
  const spent = dashboardSpent || budget?.spent || 0;
  const category = budget?.category || "Organization Budget";
  const progress = total > 0 ? Math.min((spent / total) * 100, 100) : 0;

  return (
    <div className="bg-white shadow-md rounded-xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Budget Overview</h3>
          <p className="text-sm text-gray-500">{category}</p>
        </div>

        {!dashboardBudget && (
          <button
            className={`p-2 rounded-full ${
              budget ? "bg-blue-100 text-blue-600 hover:bg-blue-200" : "bg-green-100 text-green-600 hover:bg-green-200"
            }`}
            onClick={() => {
              setShowForm(true);
              if (budget) {
                setForm({
                  amount: budget.amount,
                  category: budget.category,
                  account: budget.account?._id || "",
                });
              }
            }}
          >
            {budget ? <Pencil size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-800">
        ₦{spent.toLocaleString()}{" "}
        <span className="text-sm text-gray-500 font-normal">
          of ₦{total.toLocaleString()} spent
        </span>
      </p>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="h-3 bg-blue-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="text-sm text-gray-600">
        {total > 0 ? (
          <>
            You have{" "}
            <span className="font-medium">
              {Math.max(0, 100 - progress).toFixed(0)}%
            </span>{" "}
            remaining
          </>
        ) : (
          "No budget set for this period"
        )}
      </p>

      {/* ✅ Show form only in standalone usage */}
      {showForm && !dashboardBudget && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <select
            className="border rounded-lg p-2 w-full"
            value={form.account}
            onChange={(e) => setForm({ ...form, account: e.target.value })}
          >
            <option value="">Select Account</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg p-2 w-full"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="general">General</option>
            <option value="operations">Operations</option>
            <option value="maintenance">Maintenance</option>
            <option value="project">Project</option>
            <option value="other">Other</option>
          </select>

          <input
            type="number"
            placeholder="Budget amount"
            className="border rounded-lg p-2 w-full"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCard;
