// src/pages/account/Dashboard.js
import React, { useState, useEffect, useContext } from "react";
import { Plus, Search } from "lucide-react";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import BudgetCard from "../../components/BudgetCard";
import AccountCard from "../../components/AccountCard";
import TransactionsList from "../../components/TransactionList";
import ExpenseBreakdown from "../../components/ExpensBreackDown";
import AICard from "../../components/AICard";
import TransactionModal from "../../components/TransactionModel";
import AddAccountModal from "../../components/AddAccountModel";
import AccountDetailModal from "../../components/AccountDetail";
import FinancialChart from "../../components/FinancialChart";
import QuickActions from "../../components/QuickAction";
import StatsOverview from "../../components/startOverView";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { token, backendUrl, logout } = useContext(AppContext);

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [budgets, setBudgets] = useState([]); // ✅ Added budget state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState("all");
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [isAddAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [timeRange, setTimeRange] = useState("monthly");

  const navigate = useNavigate();

  // 🔹 Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      if (!token) return toast.warning("No token found!");

      // Fetch all accounts
      const { data: accountRes } = await axios.get(
        `${backendUrl}/api/account/get-all-account`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (accountRes.success) setAccounts(accountRes.data || []);

      // Fetch all transactions
      const { data: txRes } = await axios.get(
        `${backendUrl}/api/account/get-all-transaction`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (txRes.success) {
        const txData = txRes.data.transactions || [];
        setTransactions(txData);
        setFilteredTransactions(txData);

        // Compute expense breakdown
        const breakdown = txData.reduce((acc, tx) => {
          if (tx.type === "expense") {
            acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
          }
          return acc;
        }, {});
        setExpenseBreakdown(
          Object.entries(breakdown).map(([category, amount]) => ({
            category,
            amount,
            percentage: 0,
            color: "#3B82F6",
          }))
        );
      }

      // ✅ Fetch organizational budget
      const { data: budgetRes } = await axios.get(
        `${backendUrl}/api/account/getBudget`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (budgetRes.success) setBudgets(budgetRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) logout();
    }
  };

  // 🔹 Initial data load
  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token]);

  // 🔹 Filter transactions
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter((tx) =>
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((tx) => tx.category === selectedCategory);
    }

    if (selectedAccountFilter !== "all") {
      filtered = filtered.filter(
        (tx) => tx.account?._id === selectedAccountFilter
      );
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, selectedCategory, selectedAccountFilter, transactions]);

  // 🔹 Add transaction
  const handleAddTransaction = (newTransaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);
    fetchDashboardData(); // refresh
  };

  // 🔹 Add account
  const handleAddAccount = (newAccount) => {
    setAccounts((prev) => [newAccount, ...prev]);
  };

  // 🔹 Aggregates
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // ✅ Get total organization budget amount
  const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here’s your organization’s financial overview
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

          <button
            onClick={() => setTransactionModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-green-600 hover:from-green-800 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview
        totalBalance={totalBalance}
        monthlyIncome={totalIncome}
        monthlyExpenses={totalExpenses}
        savingsRate={((totalIncome - totalExpenses) / totalIncome) * 100 || 0}
      />

      {/* Quick Actions */}
      <QuickActions onAddTransaction={() => setTransactionModalOpen(true)} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <FinancialChart
            transactions={transactions}
            accounts={accounts}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* ✅ Use real organization budget */}
          <BudgetCard
            spent={totalExpenses}
            budget={totalBudget || 0}
            timeRange={timeRange}
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Accounts</h2>
            <button
              onClick={() => setAddAccountModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} />
              Add Account
            </button>
          </div>

          {/* Show first 3 accounts */}
          {accounts.slice(0, 3).map((account) => (
            <div
              key={account._id}
              onClick={() => navigate(`/account/${account._id}`)}
              className="cursor-pointer hover:scale-105 transition-transform duration-200"
            >
              <AccountCard account={account} transactions={transactions} />
            </div>
          ))}

          {/* View All Accounts */}
          {accounts.length > 2 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => navigate("/all-account")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                View All Accounts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionsList
            transactions={filteredTransactions}
            onAddTransaction={() => setTransactionModalOpen(true)}
            accounts={accounts}
          />
        </div>

        <div className="space-y-6">
          <ExpenseBreakdown expenses={expenseBreakdown} />
          <AICard />
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        accounts={accounts}
      />

      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setAddAccountModalOpen(false)}
        onAddAccount={handleAddAccount}
      />

      <AccountDetailModal
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        account={selectedAccount}
        transactions={transactions.filter(
          (tx) => tx.account?._id === selectedAccount?._id
        )}
      />
    </main>
  );
};

export default Dashboard;
