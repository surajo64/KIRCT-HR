// components/AccountDetailModal.jsx
import React, { useRef, useState, useMemo } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(ArcElement, Tooltip, Legend);

const AccountDetailModal = ({ isOpen, onClose, account, transactions }) => {
  const chartRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "all",
  });

  if (!isOpen || !account) return null;

  // 📌 Apply Filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;

      const inDateRange =
        (!start || txDate >= start) && (!end || txDate <= end);
      const inCategory =
        filters.category === "all" || tx.category === filters.category;

      return inDateRange && inCategory;
    });
  }, [transactions, filters]);

  // 📊 Summary
  const income = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const chartData = {
    labels: ["Income", "Expense"],
    datasets: [
      {
        data: [income, expense],
        backgroundColor: ["#4ade80", "#f87171"],
      },
    ],
  };

  // 📄 Generate PDF
  const handleDownloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(18);
    pdf.text("Account Report", pageWidth / 2, 20, { align: "center" });
    pdf.setFontSize(12);
    pdf.text(
      `${account.name} | ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      30,
      { align: "center" }
    );

    // Show filters in PDF
    pdf.setFontSize(10);
    pdf.text(
      `Filters: ${filters.startDate || "Any"} → ${
        filters.endDate || "Any"
      }, Category: ${filters.category}`,
      14,
      40
    );

    // Summary
    pdf.setFontSize(14);
    pdf.text("Summary", 14, 55);
    pdf.setFontSize(12);
    pdf.text(`Balance: $${account.balance}`, 14, 65);
    pdf.text(`Total Income: $${income}`, 14, 75);
    pdf.text(`Total Expense: $${expense}`, 14, 85);

    // Chart
    const chartCanvas = chartRef.current.canvas;
    const chartImg = await html2canvas(chartCanvas, { scale: 2 });
    pdf.addImage(chartImg.toDataURL("image/png"), "PNG", 14, 95, 90, 90);

    // Transactions
    pdf.text("Transactions", 14, 200);
    pdf.setFontSize(10);

    let yPos = 210;
    filteredTransactions.forEach((tx, i) => {
      if (yPos > 280) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(
        `${i + 1}. ${tx.date} | ${tx.description} | ${
          tx.category
        } | ${tx.type === "income" ? "+" : "-"}$${tx.amount}`,
        14,
        yPos
      );
      yPos += 8;
    });

    pdf.save(`${account.name}_Report.pdf`);
  };

  // 📌 Quick Filter Handlers
  const applyQuickFilter = (range) => {
    const today = new Date();
    let start, end;

    if (range === "thisMonth") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (range === "lastMonth") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (range === "last3Months") {
      start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      end = today;
    } else {
      start = "";
      end = "";
    }

    setFilters((f) => ({
      ...f,
      startDate: start ? start.toISOString().split("T")[0] : "",
      endDate: end ? end.toISOString().split("T")[0] : "",
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {account.icon} {account.name} – Details
          </h3>
          <button
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600">Start Date</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">End Date</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Category</label>
            <select
              className="w-full border rounded p-2"
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option value="all">All</option>
              <option value="housing">Housing</option>
              <option value="entertainment">Entertainment</option>
              <option value="shopping">Shopping</option>
              <option value="travel">Travel</option>
              <option value="food">Food</option>
              <option value="transportation">Transportation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => applyQuickFilter("thisMonth")}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
          >
            This Month
          </button>
          <button
            onClick={() => applyQuickFilter("lastMonth")}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
          >
            Last Month
          </button>
          <button
            onClick={() => applyQuickFilter("last3Months")}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
          >
            Last 3 Months
          </button>
          <button
            onClick={() => applyQuickFilter("all")}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Reset
          </button>
        </div>

        {/* Chart */}
        <div className="mb-6">
          <Pie ref={chartRef} data={chartData} />
        </div>

        {/* Transactions */}
        <h4 className="font-medium mb-2">Transactions</h4>
        <ul className="space-y-2">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <li
                key={tx.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-gray-500">
                    {tx.date} • {tx.category}
                  </p>
                </div>
                <span
                  className={`font-semibold ${
                    tx.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}${tx.amount}
                </span>
              </li>
            ))
          ) : (
            <p className="text-gray-500">
              No transactions for selected filters.
            </p>
          )}
        </ul>

        {/* Download PDF */}
        <div className="mt-6 text-right">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <i className="fas fa-file-pdf mr-2"></i>
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailModal;
