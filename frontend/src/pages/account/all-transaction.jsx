import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AllTransactions = () => {
  const { backendUrl, token } = useContext(AppContext);
const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, net: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [natureFilter, setNatureFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Reference for PDF export
  const tableRef = useRef();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/account/get-all-transaction`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success && Array.isArray(data.data.transactions)) {
          const transactions = data.data.transactions;
          setTransactions(transactions);

          // Group for chart + totals
          const grouped = {};
          let income = 0, expenses = 0;

          transactions.forEach((tx) => {
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
          setTotals({ income, expenses, net: income - expenses });
        } else {
          console.warn("No transactions found in response");
          setTransactions([]);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [backendUrl, token]);

  // ✅ Filtering logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.accountName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === "All" || tx.type === typeFilter.toLowerCase();

      const matchesNature =
        natureFilter === "All" ||
        (natureFilter === "Recurring" && tx.recurring) ||
        (natureFilter === "One-Time" && !tx.recurring);

      return matchesSearch && matchesType && matchesNature;
    });
  }, [transactions, searchQuery, typeFilter, natureFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + transactionsPerPage
  );
  console.log("current transaction:", currentTransactions)
  // 📄 Export PDF
  const exportPDF = async () => {
    const input = tableRef.current;
    const pdf = new jsPDF("p", "mm", "a4");

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("transactions_report.pdf");
  };

  // 📊 Export Excel
  const exportExcel = () => {
    const worksheetData = filteredTransactions.map((tx) => ({
      Date: new Date(tx.date).toLocaleDateString(),
      Description: tx.description,
      Account: tx.accountName,
      Category: tx.category,
      Amount: tx.amount,
      Type: tx.type,
      Nature: tx.recurring ? "Recurring" : "One-Time",
      CreatedBy: tx.userId.name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "transactions_report.xlsx");
  };

  // 📑 Export CSV
  const exportCSV = () => {
    const csvRows = [
      ["Date", "Description", "Account", "Category", "Amount", "Type", "Nature"],
      ...filteredTransactions.map((tx) => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        tx.account.name,
        tx.category,
        tx.amount,
        tx.type,
        tx.recurring ? "Recurring" : "One-Time",
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((row) => row.join(",")).join("\n");

    const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, "transactions_report.csv");
  };

  return (
    <main className="p-6 w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-purple-700 mb-6">
          All Transactions
        </h1>
        <button
          onClick={() => navigate("/account")}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Summary + Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
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

          {/* Export buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition-all"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md transition-all"
            >
              <Download size={16} /> Excel
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-all"
            >
              <Download size={16} /> CSV
            </button>
          </div>
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

      {/* Filters + Table */}
      <div className="bg-white rounded-2xl shadow-lg p-6" ref={tableRef}>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <input
            type="text"
            placeholder="Search by description, category, or account..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-md p-2 w-1/3 min-w-[250px]"
          />

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

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Date</th>
              <th>Description</th>
              <th>Account</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Nature</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((tx) => (
              <tr key={tx._id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td>{tx.description}</td>
                <td>{tx.account.name}</td>
                <td>
                  <span
                    className="px-2 py-1 rounded-md text-white text-xs font-medium"
                    style={{ backgroundColor: tx.categoryColor || "#6b7280" }}
                  >
                    {tx.category}
                  </span>
                </td>
                <td
                  className={`font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {tx.type === "income" ? "+" : "-"}₦
                  {tx.amount.toLocaleString()}
                </td>
                <td>{tx.recurring ? "Recurring" : "One-Time"}</td>
                <td>{tx.userId.name}</td>
              </tr>
            ))}

            {currentTransactions.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
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
              className={`flex items-center gap-1 px-3 py-1 border rounded-md ${currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100 text-gray-600"
                }`}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`flex items-center gap-1 px-3 py-1 border rounded-md ${currentPage === totalPages
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

export default AllTransactions;
