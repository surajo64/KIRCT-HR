// components/TransactionsList.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const categoryColors = {
  Food: "bg-red-500 text-white",
  Entertainment: "bg-purple-500 text-white",
  Housing: "bg-red-600 text-white",
  Utilities: "bg-teal-400 text-white",
  Freelance: "bg-teal-500 text-white",
  "Other-Income": "bg-gray-600 text-white",
  Healthcare: "bg-teal-600 text-white",
  Shopping: "bg-pink-500 text-white",
  Travel: "bg-indigo-400 text-white",
  Transportation: "bg-yellow-500 text-white",
  Other: "bg-gray-400 text-white",
};

const TransactionsList = ({ transactions = [], onAddTransaction }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 5;
  const navigate = useNavigate();
  const indexOfLast = currentPage * transactionsPerPage;
  const indexOfFirst = indexOfLast - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
         <button
          onClick={() => navigate("/all-transactions")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
        >
          View All Transactions
        </button>
        <button
          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
          onClick={onAddTransaction}
        >
          <i className="fas fa-plus"></i> Add Transaction
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-2 font-semibold border-b pb-2">
        <div>Date</div>
        <div>Description</div>
        <div>Category</div>
        <div className="text-right">Amount</div>
        <div>Recurring</div>
        <div></div>
      </div>

      {/* Transactions */}
      <div>
        {currentTransactions.map((t) => (
          <div
            key={t.id}
            className="grid grid-cols-6 gap-2 py-2 border-b items-center hover:bg-gray-50"
          >
            <div>{new Date(t.date).toLocaleDateString()}</div>
            <div>{t.description}</div>
            <div>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  categoryColors[t.category] || "bg-gray-300 text-black"
                }`}
              >
                {t.category}
              </span>
            </div>
            <div
              className={`text-right font-medium ${
                t.type === "income" ? "text-green-600" : "text-red-600"
              }`}
            >
              {t.type === "income"
                ? `+₦${t.amount.toFixed(2)}`
                : `-₦${t.amount.toFixed(2)}`}
            </div>
            <div>{t.recurring ? "Recurring" : "One-Time"}</div>
            <div className="text-right">
              <button className="text-gray-400 hover:text-gray-700">
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          &lt; Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
};

export default TransactionsList;
