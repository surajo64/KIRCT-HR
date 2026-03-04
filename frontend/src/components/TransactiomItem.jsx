import React from "react";
import { Home, Tv, ShoppingBag, DollarSign, Receipt } from "lucide-react";

const TransactionItem = ({ transaction }) => {
  const getIcon = (category) => {
    switch (category) {
      case "rental":
        return { icon: <Home className="w-5 h-5 text-red-500" /> };
      case "entertainment":
        return { icon: <Tv className="w-5 h-5 text-purple-500" /> };
      case "shopping":
        return { icon: <ShoppingBag className="w-5 h-5 text-blue-500" /> };
      case "salary":
        return { icon: <DollarSign className="w-5 h-5 text-green-500" /> };
      default:
        return { icon: <Receipt className="w-5 h-5 text-gray-500" /> };
    }
  };

  const { icon } = getIcon(transaction.category);

  return (
    <div className="flex justify-between items-center bg-white shadow-sm rounded-lg p-3 hover:shadow-md transition">
      {/* Left side: icon + info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
          {icon}
        </div>
        <div>
          <p className="font-medium text-gray-800">{transaction.description}</p>
          <p className="text-xs text-gray-500">
            {transaction.recurring && "Recurring • "} {transaction.date}
          </p>
        </div>
      </div>

      {/* Right side: amount + category */}
      <div className="text-right">
        <p
          className={`font-semibold ${
            transaction.type === "income"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {transaction.type === "income" ? "+" : "-"}$
          {transaction.amount.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 capitalize">
          {transaction.category}
        </p>
      </div>
    </div>
  );
};

export default TransactionItem;
