// components/AccountCard.jsx
import React, { useMemo } from "react";
import { User, Briefcase, Globe, Wallet } from "lucide-react";

const AccountCard = ({ account, transactions = [] }) => {
  const { income, expenses } = useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;

    transactions.forEach((tx) => {
      const accountId =
        typeof tx.account === "object" ? tx.account._id : tx.account;

      if (accountId === account._id) {
        if (tx.type === "income") incomeTotal += tx.amount;
        else if (tx.type === "expense") expenseTotal += tx.amount;
      }
    });

    return { income: incomeTotal, expenses: expenseTotal };
  }, [transactions, account._id]);

  const getIcon = (name) => {
    switch (name) {
      case "Personal":
        return <User className="w-6 h-6 text-blue-500" />;
      case "Work":
        return <Briefcase className="w-6 h-6 text-green-500" />;
      case "Worldwide":
        return <Globe className="w-6 h-6 text-purple-500" />;
      default:
        return <Wallet className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{account?.name}</h3>
          <p className="text-sm text-gray-500">{account?.type}</p>
        </div>
        {getIcon(account?.name)}
      </div>

      <div>
        <p className="text-2xl font-bold text-gray-800">
          ₦{account?.balance?.toLocaleString() || 0}
        </p>
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <span className="text-green-600 font-medium">
          Income: ₦{income.toLocaleString()}
        </span>
        <span className="text-red-600 font-medium">
          Expenses: ₦{expenses.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default AccountCard;
