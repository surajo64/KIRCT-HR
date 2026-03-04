import React from "react";
import { TrendingDown, PieChart } from "lucide-react";

const ExpenseBreakdown = ({ expenses = [] }) => {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getColor = (index) => {
    const colors = [
      "bg-gradient-to-r from-purple-500 to-indigo-500",
      "bg-gradient-to-r from-blue-500 to-cyan-500",
      "bg-gradient-to-r from-red-500 to-pink-500",
      "bg-gradient-to-r from-yellow-400 to-orange-400",
      "bg-gradient-to-r from-green-500 to-emerald-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <PieChart className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">
            Monthly Expense Breakdown
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TrendingDown size={16} className="text-red-500" />
          <span>Total: </span>
          <span className="font-semibold text-gray-900">
            ${total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="space-y-5">
        {expenses.length === 0 ? (
          <p className="text-center text-gray-400 text-sm">
            No expenses recorded this month.
          </p>
        ) : (
          expenses.map((expense, index) => {
            const percentage = total
              ? ((expense.amount / total) * 100).toFixed(1)
              : 0;
            return (
              <div key={expense.category} className="space-y-1">
                {/* Category and Amount */}
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700 capitalize flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${getColor(index)}`}
                    ></span>
                    {expense.category}
                  </span>
                  <span className="text-gray-900">
                    ${expense.amount.toLocaleString()}{" "}
                    <span className="text-gray-500 text-xs ml-1">
                      ({percentage}%)
                    </span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 ${getColor(index)} transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpenseBreakdown;
