import React, { useState, useContext, useEffect } from 'react';
import { toast } from "react-toastify";
import { AppContext } from '../context/AppContext';
import LoadingOverlay from '../components/loadingOverlay.jsx';
import axios from "axios";

const Bonus = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { token, backendUrl } = useContext(AppContext);
    const [bonusRecords, setBonusRecords] = useState([]);
    const [selectedBonusRecord, setSelectedBonusRecord] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ✅ Fetch bonus records for the logged-in user
useEffect(() => {
  const fetchUserBonuses = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/account/employee-bonus`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📦 API Response:", data);

      if (data.success && Array.isArray(data.bonuses)) {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const currentUserId = currentUser?._id || currentUser?.id;

        // ✅ Filter for current user and "paid" bonuses only
        const userBonuses = data.bonuses.filter(
          (bonus) =>
            (bonus.employee?._id === currentUserId ||
              bonus.employee?.userId === currentUserId ||
              bonus.staffId === currentUser?.staffId) &&
            bonus.status?.toLowerCase() === "paid"
        );

        setBonusRecords(userBonuses);
        console.log("✅ Paid user bonus records:", userBonuses);
      } else {
        toast.error(data.message || "Failed to fetch bonus records");
      }
    } catch (error) {
      console.error("❌ Error loading bonus records:", error);
      toast.error("Failed to load bonus records");
    } finally {
      setIsLoading(false);
    }
  };

  if (token) {
    fetchUserBonuses();
  }
}, [token, backendUrl]);



    const handleViewDetails = (bonus) => {
        setIsLoading(true);
        setTimeout(() => {
            setSelectedBonusRecord(bonus);
            setShowDetailModal(true);
            setIsLoading(false);
        }, 300);
    };

    const handlePrintBonusSlip = (bonus) => {
        const currentUser = JSON.parse(localStorage.getItem("user"));

        const content = `
<!DOCTYPE html>
<html>
<head>
  <title>Annual Bonus Pay Slip</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
  <style>
    @media print { 
      .no-print { display: none; } 
      body { margin: 0; padding: 20px; }
    }
    body { background: #f3f4f6; padding: 20px; font-family: 'Arial', sans-serif; }
    .bonus-breakdown { background: #f8fafc; border-radius: 8px; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body id="bonus-slip">
  <div class="max-w-2xl mx-auto bg-white border border-gray-300 p-6 rounded-lg shadow-lg">
    <div class="text-center mb-6">
      <img src="https://res.cloudinary.com/dyii5iyqq/image/upload/v1756986671/logo_arebic.png" class="w-12 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-gray-800 mb-2">KIRCT Annual Bonus Pay Slip</h2>
      <p class="text-lg text-green-600 font-semibold">Performance & Annual Incentive</p>
    </div>

    <div class="text-center mb-6">
      <p class="text-xl font-bold text-green-800 uppercase">${currentUser?.name || bonus.employee?.name || 'Employee'}</p>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-6">
      <div>
        <p><strong>Staff ID:</strong> ${bonus.staffId || currentUser?.staffId || 'N/A'}</p>
        <p><strong>Department:</strong> ${bonus.employee?.department?.name || currentUser?.department?.name || 'N/A'}</p>
        <p><strong>Designation:</strong> ${bonus.employee?.designation || currentUser?.designation || 'N/A'}</p>
      </div>
      <div>
        <p><strong>Bonus Year:</strong> ${bonus.year}</p>
        <p><strong>Payment Date:</strong> ${new Date(bonus.paymentDate || bonus.processedAt).toLocaleDateString()}</p>
        <p><strong>Status:</strong> <span class="text-green-600 font-semibold">${bonus.status}</span></p>
      </div>
    </div>

    <hr class="my-4" />

    <!-- Bonus Calculation Breakdown -->
    <div class="bonus-breakdown">
      <h3 class="font-bold text-xl text-green-700 mb-3 text-center">Bonus Calculation Breakdown</h3>
      
      <div class="grid grid-cols-1 gap-3">
        <div class="flex justify-between items-center border-b pb-2">
          <span class="text-gray-700"><strong>Basic Monthly Salary:</strong></span>
          <span class="text-green-700 font-semibold">₦${(bonus.basicSalary || 0).toLocaleString()}</span>
        </div>
        
        <div class="flex justify-between items-center border-b pb-2">
          <span class="text-gray-700"><strong>One Month Basic Salary:</strong></span>
          <span class="text-green-700 font-semibold">₦${(bonus.bonusCalculation?.oneMonthBasic || 0).toLocaleString()}</span>
        </div>
        
        <div class="flex justify-between items-center border-b pb-2">
          <span class="text-gray-700"><strong>Annual Salary (12 months):</strong></span>
          <span class="text-green-700 font-semibold">₦${(bonus.annualSalary || 0).toLocaleString()}</span>
        </div>
        
        <div class="flex justify-between items-center border-b pb-2">
          <span class="text-gray-700"><strong>10% of Annual Salary:</strong></span>
          <span class="text-green-700 font-semibold">₦${(bonus.bonusCalculation?.tenPercentAnnual || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>

    <hr class="my-4" />

    <!-- Total Bonus -->
    <div class="text-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <p class="text-2xl font-bold text-green-700">
        <strong>TOTAL BONUS PAYMENT:</strong> ₦${(bonus.bonusCalculation?.totalBonus || 0).toLocaleString()}
      </p>
      <p class="text-sm text-gray-600 mt-2">According to Company Policy: 1 Month Basic Salary + 10% of Annual Salary</p>
    </div>

    <hr class="my-6" />

    <div class="text-center text-xs text-gray-500">
      <p>© ${new Date().getFullYear()} Kano Independent Research Centre Trust. All rights reserved.</p>
      <p class="mt-1">Payment Reference: ${bonus.payrollReference || 'N/A'}</p>
    </div>

    <!-- Buttons -->
    <div class="flex justify-center gap-4 mt-6 no-print">
      <button onclick="window.print()" class="bg-blue-500 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors">
        Print Slip
      </button>
      <button onclick="downloadPDF()" class="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition-colors">
        Download PDF
      </button>
    </div>
  </div>

  <!-- PDF Libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

  <script>
    async function downloadPDF() {
      const { jsPDF } = window.jspdf;
      const element = document.getElementById("bonus-slip");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Bonus_Slip_${bonus.year}_${currentUser?.name?.replace(/\\s+/g, '_') || 'Employee'}.pdf");
    }
  </script>
</body>
</html>
`;

        const printWindow = window.open("", "_blank", "height=900,width=700");
        printWindow.document.write(content);
        printWindow.document.close();
    };

    // Filter bonus records based on search term
    const filteredBonuses = bonusRecords.filter(bonus =>
        `${bonus.year} ${bonus.staffId} ${new Date(bonus.paymentDate).toLocaleDateString()} ${bonus.bonusCalculation?.totalBonus}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // Sort bonuses by year (newest first) and payment date
    const sortedBonuses = filteredBonuses.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return new Date(b.paymentDate) - new Date(a.paymentDate);
    });

    // Pagination
    const paginatedBonuses = sortedBonuses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(sortedBonuses.length / itemsPerPage);

    return (
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
            <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">MY BONUS RECORDS</h1>
                <p className="text-gray-600">View your annual bonus payments and download pay slips</p>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by year, staff ID, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <div className="text-sm text-gray-600">
                    Showing {paginatedBonuses.length} of {sortedBonuses.length} bonus records
                </div>
            </div>

            {/* Bonus Table */}
            <div className="bg-white rounded-md shadow-sm mt-6 text-sm max-h-[80vh] min-h-[60vh] overflow-y-auto">
                {/* Table Header */}
                <div className="bg-gray-200 hidden sm:grid grid-cols-[0.5fr_1fr_1fr_1fr_1fr_1fr_2fr] py-3 px-4 rounded-t-md border-b-4 border-green-500 font-semibold">
                    <p>#</p>
                    <p>Bonus Type</p>
                    <p>Bonus Year</p>
                    <p>Payment Date</p>
                    <p>Basic Salary</p>
                    <p>Bonus Amount</p>
                    <p className="text-center">Actions</p>
                </div>

                {/* Table Rows */}
                {paginatedBonuses.length > 0 ? (
                    paginatedBonuses.map((bonus, index) => (
                        <div
                            key={bonus._id}
                            className="flex flex-wrap sm:grid sm:grid-cols-[0.5fr_1fr_1fr_1fr_1fr_1fr_2fr] items-center gap-4 sm:gap-0 py-4 px-6 border-b border-gray-100 hover:bg-green-50 transition-colors duration-200"
                        >
                            <p className="text-gray-600 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</p>
                            <p className="text-gray-800 font-semibold">{bonus.type}</p>
                            <p className="text-gray-800 font-semibold">{bonus.year}</p>
                            <p className="text-gray-600">{new Date(bonus.paymentDate).toLocaleDateString()}</p>
                            <p className="text-green-700 font-medium">₦{(bonus.basicSalary || 0).toLocaleString()}</p>
                            <p className="text-green-800 font-bold">₦{(bonus.bonusCalculation?.totalBonus || 0).toLocaleString()}</p>
                            <div className="flex gap-2 justify-start sm:justify-center flex-wrap">
                                <button
                                    onClick={() => handleViewDetails(bonus)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => {
                                        setIsLoading(true);
                                        setTimeout(() => {
                                            handlePrintBonusSlip(bonus);
                                            setIsLoading(false);
                                        }, 300);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
                                >
                                    Bonus Slip
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">💸</div>
                        <p className="text-gray-500 text-lg">No bonus records found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {searchTerm ? 'Try adjusting your search terms' : 'You have no paid bonus records yet'}
                        </p>
                    </div>
                )}

                {/* Pagination Controls */}
                {sortedBonuses.length > itemsPerPage && (
                    <div className="flex justify-center items-center py-6 gap-4 border-t border-gray-200">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => {
                                setIsLoading(true);
                                setTimeout(() => {
                                    setCurrentPage((prev) => prev - 1);
                                    setIsLoading(false);
                                }, 300);
                            }}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${currentPage === 1
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Previous
                        </button>

                        <span className="text-gray-700 font-medium">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => {
                                setIsLoading(true);
                                setTimeout(() => {
                                    setCurrentPage((prev) => prev + 1);
                                    setIsLoading(false);
                                }, 300);
                            }}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${currentPage >= totalPages
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Bonus Detail Modal */}
            {showDetailModal && selectedBonusRecord && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                    onClick={() => setShowDetailModal(false)}
                >
                    <div
                        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Bonus Payment Details</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-white hover:text-gray-200 text-2xl font-bold transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-green-100 mt-2">
                                {selectedBonusRecord.year} • {selectedBonusRecord.staffId}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Employee Information</h3>
                                    <div className="space-y-2">
                                        <p><strong>Staff ID:</strong> {selectedBonusRecord.staffId}</p>
                                        <p><strong>Name:</strong> {selectedBonusRecord.name}</p>
                                        <p><strong>Department:</strong> {selectedBonusRecord.employee?.department?.name || 'N/A'}</p>
                                        <p><strong>Designation:</strong> {selectedBonusRecord.employee?.department.designation || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Payment Information</h3>
                                    <div className="space-y-2">
                                        <p><strong>Bonus Year:</strong> {selectedBonusRecord.year}</p>
                                        <p><strong>Bonus Type:</strong> {selectedBonusRecord.type}</p>
                                        <p><strong>Payment Date:</strong> {new Date(selectedBonusRecord.paymentDate).toLocaleDateString()}</p>
                                        <p><strong>Status:</strong>
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${selectedBonusRecord.status === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {selectedBonusRecord.status?.toUpperCase()}
                                            </span>
                                        </p>
                                        <p><strong>Reference:</strong> {selectedBonusRecord.payrollReference || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bonus Calculation Breakdown */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Bonus Calculation Breakdown</h3>

                                <div className="space-y-3 max-w-md mx-auto">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-gray-700">Monthly Basic Salary:</span>
                                        <span className="text-green-700 font-semibold">₦{(selectedBonusRecord.basicSalary || 0).toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-gray-700">Annual Salary (12 months):</span>
                                        <span className="text-green-700 font-semibold">₦{(selectedBonusRecord.annualSalary || 0).toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-gray-700">10% of Annual Salary:</span>
                                        <span className="text-green-700 font-semibold">
                                            ₦{(selectedBonusRecord.bonusCalculation?.tenPercentAnnual || 0).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t-2 border-green-300">
                                        <span className="text-lg font-bold text-gray-800">Net Bonus:</span>
                                        <span className="text-xl font-bold text-green-700">
                                            ₦{(selectedBonusRecord.bonusCalculation?.totalBonus || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => {
                                    setIsLoading(true);
                                    setTimeout(() => {
                                        handlePrintBonusSlip(selectedBonusRecord);
                                        setIsLoading(false);
                                    }, 300);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                            >
                                Print Bonus Slip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <LoadingOverlay />}
        </div>
    );
};

export default Bonus;