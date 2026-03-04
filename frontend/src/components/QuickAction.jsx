import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Filter, PieChart } from "lucide-react";

const QuickActions = ({ onAddTransaction }) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Add Transaction",
      icon: Plus,
      onClick: onAddTransaction,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "Export Data",
      icon: Download,
      onClick: () => navigate("/all-transactions"), // ✅ navigate to All Transactions
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "Generate Report",
      icon: PieChart,
      onClick: () => navigate("/all-transactions"), // ✅ navigate to All Transactions
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "Advanced Filters",
      icon: Filter,
      onClick: () => navigate("/all-transactions"), // ✅ navigate to All Transactions
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`${action.color} text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 transform hover:scale-105`}
          >
            <action.icon size={20} />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
