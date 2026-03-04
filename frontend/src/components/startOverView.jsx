// components/StatsOverview.js
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';

const StatsOverview = ({ totalBalance, monthlyIncome, monthlyExpenses, savingsRate }) => {
  const stats = [
    {
      label: "Total Balance",
      value: `$${totalBalance.toLocaleString()}`,
      icon: Wallet,
      trend: "up",
      change: "+12.5%",
      color: "text-green-600"
    },
    {
      label: "Monthly Income",
      value: `$${monthlyIncome.toLocaleString()}`,
      icon: TrendingUp,
      trend: "up",
      change: "+8.2%",
      color: "text-blue-600"
    },
    {
      label: "Monthly Expenses",
      value: `$${monthlyExpenses.toLocaleString()}`,
      icon: TrendingDown,
      trend: "down",
      change: "-3.1%",
      color: "text-red-600"
    },
    {
      label: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      trend: savingsRate > 20 ? "up" : "down",
      change: savingsRate > 20 ? "+5.2%" : "-2.1%",
      color: savingsRate > 20 ? "text-green-600" : "text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <div className={`flex items-center gap-1 mt-2 ${stat.color}`}>
                {stat.trend === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-blue-50">
              <stat.icon className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;