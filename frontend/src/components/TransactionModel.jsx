// components/TransactionModal.js
import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../context/AppContext";

const Transaction = ({ isOpen, onClose, onAddTransaction, accounts = [] }) => {
  const { backendUrl, token } = useContext(AppContext);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "shopping",
    account: accounts[0]?._id || "", // use _id consistently
    date: new Date().toISOString().split("T")[0],
    recurring: false,
  });

  const [error, setError] = useState("");

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Reset form when modal opens or accounts change
  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        category: "shopping",
        account: accounts[0]?._id || "", // consistent
        date: new Date().toISOString().split("T")[0],
        recurring: false,
      });
      setError("");
    }
  }, [isOpen, accounts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.account) {
      setError("Please fill out all required fields.");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/account/add-transaction`,
        { ...formData, amount: parseFloat(formData.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Transaction added successfully!");
        onClose();
        onAddTransaction(data.data); // send transaction back to parent
      } else {
        toast.error(data.message || "Failed to add transaction");
      }
    } catch (err) {
      toast.error("An error occurred while submitting.");
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Add New Transaction
          </h3>
          <button
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 text-sm bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Grocery shopping"
              className="w-full mt-1 p-2 border rounded-md focus:ring focus:ring-indigo-300"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className="w-full mt-1 p-2 border rounded-md focus:ring focus:ring-indigo-300"
              required
            />
          </div>

          {/* Type + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="housing">🏠 Housing</option>
                <option value="entertainment">🎬 Entertainment</option>
                <option value="shopping">🛍 Shopping</option>
                <option value="travel">✈️ Travel</option>
                <option value="food">🍔 Food</option>
                <option value="transportation">🚗 Transportation</option>
                <option value="other">❓ Other</option>
              </select>
            </div>
          </div>

          {/* Account + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Account</label>
              <select
                name="account"
                value={formData.account}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-md"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.icon ? `${acc.icon} ` : ""}
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="recurring"
              checked={formData.recurring}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
            />
            <label className="text-sm">Mark as recurring</label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-md border bg-gray-100 hover:bg-gray-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Transaction;
