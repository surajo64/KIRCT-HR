import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";

const FinancialChart = ({ transactions = [], accounts = [], timeRange, onTimeRangeChange }) => {
  // 1️⃣ Prepare monthly data dynamically
  const monthlyData = useMemo(() => {
    const grouped = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const month = date.toLocaleString("default", { month: "short" }); // e.g., "Jan"

      if (!grouped[month]) {
        grouped[month] = { month, income: 0, expenses: 0 };
      }

      if (tx.type === "income") grouped[month].income += tx.amount;
      else if (tx.type === "expense") grouped[month].expenses += tx.amount;
    });

    return Object.values(grouped);
  }, [transactions]);

  // 2️⃣ Prepare category data dynamically (for expense distribution)
  const categoryData = useMemo(() => {
    const grouped = {};

    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        const cat = tx.category || "Other";
        if (!grouped[cat]) grouped[cat] = 0;
        grouped[cat] += tx.amount;
      }
    });

    // Assign random colors for categories
    const colors = ["#EF4444", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#EC4899"];
    return Object.entries(grouped).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp size={20} />
          Financial Overview
        </h3>
        <div className="flex gap-2">
          {["weekly", "monthly", "yearly"].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="h-64">
          <h4 className="text-sm font-medium text-gray-600 mb-4">Income vs Expenses</h4>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: "#10B981" }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ fill: "#EF4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Distribution */}
        <div className="h-64">
          <h4 className="text-sm font-medium text-gray-600 mb-4">Expense Distribution</h4>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
        {categoryData.map((category, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm text-gray-600">
              {category.name}: ${category.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialChart;
