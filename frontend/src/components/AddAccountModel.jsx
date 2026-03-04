// components/AddAccountModal.js
import React, { useState, useContext } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const AddAccountModal = ({ isOpen, onClose, onAddAccount }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "Savings Account",
    balance: "",
    currency: "NGN",
  });

  const { backendUrl, token } = useContext(AppContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
   /* try {*/
      const { data } = await axios.post(
        `${backendUrl}/api/account/add-account`,
        {
          ...formData,
          balance: parseFloat(formData.balance) || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Account created successfully!");
        onAddAccount?.(data.data); // pass back to parent
        setFormData({ name: "", type: "Savings Account", balance: "", currency: "NGN" });
        onClose();
      } else {
        toast.error(data.message);
      }
  /*  } catch (error) {
      console.error(error);
      toast.error("Failed to create account");
    }*/
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold">Add New Account</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium">Account Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full mt-1 p-2 border rounded-md"
              required
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium">Account Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full mt-1 p-2 border rounded-md"
              required
            >
              <option value="Savings Account">Savings Account</option>
              <option value="Current Account">Current Account</option>
              <option value="Investment Account">Investment Account</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium">Initial Balance</label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) =>
                setFormData({ ...formData, balance: e.target.value })
              }
              className="w-full mt-1 p-2 border rounded-md"
            />
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
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;
