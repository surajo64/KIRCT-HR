import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import AccountCard from "../../components/AccountCard";

const AllAccount = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, net: 0 });
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 6;

  const navigate = useNavigate();
  const tableRef = useRef(null);

  // ✅ Fetch all accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/account/get-all-account`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          const list = data.data.accounts || data.data || [];
          setAccounts(list);
          if (list.length > 0) setSelectedAccount(list[0]);
        }
      } catch (err) {
        console.error("Error fetching accounts:", err);
      }
    };
    fetchAccounts();
  }, [backendUrl, token]);

  // ✅ Fetch transactions for selected account
  useEffect(() => {
    if (!selectedAccount) return;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${backendUrl}/api/account/accountDetail/${selectedAccount._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          const txs = data.transactions || [];
          setTransactions(txs);

          let income = 0,
            expenses = 0;
          txs.forEach((tx) => {
            if (tx.type === "income") income += tx.amount;
            else expenses += tx.amount;
          });
          setTotals({ income, expenses, net: income - expenses });
        }
      } catch (err) {
        console.error("Error fetching account detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedAccount, backendUrl, token]);

  // ✅ Prepare chart data (group by date)
  const chartData = transactions.reduce((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = { date, income: 0, expense: 0 };
    tx.type === "income"
      ? (acc[date].income += tx.amount)
      : (acc[date].expense += tx.amount);
    return acc;
  }, {});
  const chartArray = Object.values(chartData);

  // ✅ Pagination logic
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const indexOfLast = currentPage * transactionsPerPage;
  const indexOfFirst = indexOfLast - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirst, indexOfLast);

  return (
    <main className="p-6 w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-purple-700">
          All Accounts
        </h1>
        <button
          onClick={() => navigate("/account")}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {accounts.map((account) => (
          <div
            key={account._id}
            onClick={() => {
              setSelectedAccount(account);
              setCurrentPage(1);
            }}
            className={`cursor-pointer transition-transform transform hover:scale-105 ${
              selectedAccount?._id === account._id
                ? "ring-2 ring-blue-500"
                : "ring-1 ring-gray-200"
            }`}
          >
            <AccountCard account={account} transactions={transactions} />

          </div>
        ))}
      </div>

      {/* Summary + Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {selectedAccount
            ? `${selectedAccount.name} (${selectedAccount.type})`
            : "Select an account to view details"}
        </h2>

        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading...</div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="flex gap-10">
                <div>
                  <p className="text-sm text-gray-500">Total Income</p>
                  <p className="text-green-600 font-bold text-lg">
                    ₦{totals.income.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-red-600 font-bold text-lg">
                    ₦{totals.expenses.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Net</p>
                  <p className="text-blue-600 font-bold text-lg">
                    ₦{totals.net.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Export Buttons (placeholders for now) */}
              <div className="flex gap-2 flex-wrap">
                <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition-all">
                  <Download size={16} /> PDF
                </button>
                <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md transition-all">
                  <Download size={16} /> Excel
                </button>
                <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-all">
                  <Download size={16} /> CSV
                </button>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartArray}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-lg p-6" ref={tableRef}>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Transactions for {selectedAccount?.name || "..."}
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Nature</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((tx) => (
              <tr key={tx._id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td>{tx.description}</td>
                <td>{tx.category}</td>
                <td
                  className={`font-semibold ${
                    tx.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}₦
                  {tx.amount.toLocaleString()}
                </td>
                <td>{tx.recurring ? "Recurring" : "One-Time"}</td>
              </tr>
            ))}
            {currentTransactions.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <p className="text-gray-500">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`flex items-center gap-1 px-3 py-1 border rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`flex items-center gap-1 px-3 py-1 border rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AllAccount;
