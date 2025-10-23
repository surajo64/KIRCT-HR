// components/AddAccountCard.js
import React from "react";
import { PlusCircle } from "lucide-react";

const AddAccountCard = ({ onAddAccount }) => {
  return (
    <div
      onClick={onAddAccount}
      className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50 hover:bg-gray-100 transition"
    >
      <PlusCircle className="w-10 h-10 text-gray-400" />
      <p className="mt-2 text-sm font-medium text-gray-600">Add Account</p>
    </div>
  );
};

export default AddAccountCard;
