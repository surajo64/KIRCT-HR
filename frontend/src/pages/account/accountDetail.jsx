import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendUrl, token } = useContext(AppContext);

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, net: 0 });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [natureFilter, setNatureFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/account/accountDetail/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data.success) {
          setAccount(data.account);
          setTransactions(data.transactions);

          // Group transactions for chart
          const grouped = {};
          let income = 0,
            expenses = 0;

          data.transactions.forEach((tx) => {
            const date = new Date(tx.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            if (!grouped[date]) grouped[date] = { date, income: 0, expense: 0 };

            if (tx.type === "income") {
              grouped[date].income += tx.amount;
              income += tx.amount;
            } else {
              grouped[date].expense += tx.amount;
              expenses += tx.amount;
            }
          });

          setChartData(Object.values(grouped));
          setTotals({
            income,
            expenses,
            net: income - expenses,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [id, token, backendUrl]);

  // ✅ Filtered transactions (memoized)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === "All" || tx.type === typeFilter.toLowerCase();

      const matchesNature =
        natureFilter === "All" ||
        (natureFilter === "Recurring" && tx.recurring) ||
        (natureFilter === "One-Time" && !tx.recurring);

      return matchesSearch && matchesType && matchesNature;
    });
  }, [transactions, searchQuery, typeFilter, natureFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + transactionsPerPage
  );

  return (
    <main className="p-6 w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Back button */}
      <div className="flex justify-end items-center mb-6">
        
        <button
          onClick={() => navigate("/account")}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-700">
            {account?.name}
          </h1>
          <p className="text-gray-500">{account?.type} Account</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900">
            ₦{account?.balance?.toLocaleString()}
          </h2>
          <p className="text-sm text-gray-500">
            {transactions.length} Transactions
          </p>
        </div>
      </div>

      {/* Chart Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
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
          <select className="border rounded-md p-2 text-sm">
            <option>Last Month</option>
            <option>This Month</option>
            <option>Last 3 Months</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#22c55e" name="Income" />
            <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search transaction..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-md p-2 w-1/3 min-w-[250px]"
          />

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded-md p-2 text-sm"
            >
              <option>All</option>
              <option>Income</option>
              <option>Expense</option>
            </select>

            <select
              value={natureFilter}
              onChange={(e) => {
                setNatureFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded-md p-2 text-sm"
            >
              <option>All</option>
              <option>Recurring</option>
              <option>One-Time</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Recurring</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((tx) => (
              <tr key={tx._id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td>{tx.description}</td>
                <td>
                  <span
                    className="px-2 py-1 rounded-md text-white text-xs font-medium"
                    style={{ backgroundColor: tx.categoryColor || "#6b7280" }}
                  >
                    {tx.category}
                  </span>
                </td>
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

export default AccountDetail;
