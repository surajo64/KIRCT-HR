// components/AICard.js
import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const AICard = ({ insights = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate insights every 5s
  useEffect(() => {
    if (insights.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [insights]);

  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl shadow-lg p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-bold">AI Insights</h3>
          <p className="text-sm text-purple-100">Powered by Gemini AI</p>
        </div>
        <Sparkles className="w-6 h-6 text-yellow-300" />
      </div>

      {/* Content */}
      <div className="flex-1">
        {insights.length > 0 ? (
          <p className="text-base font-medium animate-fade-in">
            {insights[currentIndex]}
          </p>
        ) : (
          <p className="text-sm italic text-purple-100">
            No insights available right now. Keep tracking your spending.
          </p>
        )}
      </div>

      {/* Button */}
      <button className="mt-4 w-full bg-white text-indigo-600 hover:bg-gray-100 py-2 px-3 rounded-xl text-sm font-semibold transition">
        View Details
      </button>
    </div>
  );
};

export default AICard;
