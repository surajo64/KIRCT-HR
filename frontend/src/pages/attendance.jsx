import { useState } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useEffect } from 'react';
import { toast } from "react-toastify";
import LoadingOverlay from '../components/loadingOverlay.jsx';

const Attendance = () => {
  const { token, getAllDepartment, setDepartment, department, backendUrl } = useContext(AppContext);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [month, setMonth] = useState('');
  const [report, setReport] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start with true to show loading initially
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch attendance data on component mount
  useEffect(() => {
    const fetchGrouped = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(`${backendUrl}/api/admin/get-Attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          setAttendance(data.groupedAttendance);
          setFilteredAttendance(data.groupedAttendance);
          console.log("Grouped Attendance:", data.groupedAttendance);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
        toast.error("Failed to load attendance data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrouped();
  }, [token, backendUrl]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post(backendUrl + '/api/admin/add-attendance', formData,
        { headers: { Authorization: `Bearer ${token}` }, });

      if (data.success) {
        toast.success(data.message || "Attendance data uploaded successfully");
        setShowForm(false);
        setFile(null);
        
        // Refetch attendance data after upload
        const { newData } = await axios.get(`${backendUrl}/api/admin/get-Attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (newData.success) {
          setAttendance(newData.groupedAttendance);
          setFilteredAttendance(newData.groupedAttendance);
        }
      } else {
        toast.error(data.message || "Upload failed.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setShowForm(true);
  };

  const handleView = () => {
    setShowDetailModal(true);
  };

  const handleClose = () => {
    setShowDetailModal(false);
    setMonth("");
    setReport([]);
    setSelectedEmployee(null);
    setEmployeeDetails([]);
  };

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/report/${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setReport(data.report);
        console.log("Attendances:", data.report);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter attendance based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAttendance(attendance);
    } else {
      const filtered = attendance.filter(item => 
        item._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAttendance(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, attendance]);

  // Pagination logic
  const totalItems = filteredAttendance.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedAttendance = filteredAttendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <LoadingOverlay />;
  
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center">
      {/* Page Title */}
      <p className="text-2xl font-bold text-gray-800">ATTENDANCE MANAGEMENT</p>

      {/* Search & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 sm:gap-0">
        <input
          type="text"
          placeholder="Search by month name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <button
          onClick={handleAddNew}
          className="bg-green-500 text-white py-2 px-6 rounded-md text-sm hover:bg-green-600 transition w-full sm:w-auto"
        >
          Add Attendance
        </button>
      </div>
      <br />
      <div className='bg-white border-rounded text-sm max-h-[80vh] min-h-[60vh] overflow-scroll'>
        <div className='bg-gray-200 hidden sm:grid grid-cols-[0.5fr_1fr_1fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_1fr] py-3 px-6 rounded-xl border-b-4 border-green-500'>
          <p>#</p>
          <p>Month</p>
          <p>Year</p>
          <p>present</p>
          <p>Absent</p>
          <p>on Leave</p>
          <p>Over Time</p>
          <p>off Duty</p>
          <p>Actions</p>
        </div>
        {filteredAttendance.length > 0 ? (
          paginatedAttendance.map((monthGroup, index) => {
            const presentCount = monthGroup.records.filter(r => r.status === 'Present').length;
            const absentCount = monthGroup.records.filter(r => r.status === 'Absent').length;
            const leaveCount = monthGroup.records.filter(r => r.status === 'Leave').length;
            const overTimeCount = monthGroup.records.filter(r => r.status === 'overTime').length;
            const offCount = monthGroup.records.filter(r => r.status === 'offDuty').length;

            const [year, month] = monthGroup._id.split("-");

            return (
              <div
                key={index}
                className="flex flex-wrap justify-between sm:grid sm:grid-cols-[0.5fr_1fr_1fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-blue-50"
              >
                <p>{(currentPage - 1) * itemsPerPage + index + 1}</p>
                <p>{month}</p>
                <p>{year}</p>

                <p className="text-green-700">{presentCount}</p>
                <p className="text-red-700">{absentCount}</p>
                <p className="text-yellow-700">{leaveCount}</p>
                <p className="text-blue-700">{overTimeCount}</p>
                <p className="text-gray-700">{offCount}</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleView()}
                    className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full"
                  >
                    View Detail
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center py-5 text-gray-500">No attendance data found.</p>
        )}

        {totalPages > 1 && (
          <>
            {/* Pagination controls */}
            <div className="flex justify-center items-center mt-2 gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50">
                Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50">
                Next
              </button>
            </div>
            <div className="flex justify-end mt-2 text-sm  text-gray-800">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md relative">
            <button onClick={() => setShowForm(false)} className="font-bold text-3xl absolute top-2 right-4 text-red-700 hover:text-red-800">✕</button>
            <h2 className="text-xl font-bold mb-2">Upload Monthly Attendance</h2>
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
              Upload Attendance
            </h2>
            <form onSubmit={handleUpload} className="p-4 bg-white rounded shadow">
              <input type="file" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files[0])} className="mb-2" />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Upload Excel</button>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-auto max-h-[90vh] relative p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-4 text-red-600 text-2xl font-bold hover:text-red-800"
            >
              ✕
            </button>

            {!selectedEmployee && (
              <>
                <div className="flex justify-center items-center gap-2 mb-4">
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="border px-3 py-1 rounded"
                  />
                  <button
                    onClick={fetchReport}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  >
                    View
                  </button>
                </div>
              </>
            )}

            {/* Attendance Table Wrapper */}
            <div id="print-salary-table" className="overflow-x-auto">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-center sm:text-left">
                {selectedEmployee
                  ? `Details for ${selectedEmployee.name} (${selectedEmployee.staffId})`
                  : 'Monthly Attendance Report'}{" "}
                {month && (
                  <span className="text-green-700">
                    for{" "}
                    {new Date(month + "-01").toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </h2>

              {/* Table for Monthly Summary */}
              {!selectedEmployee ? (
                report.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border mt-2 text-sm text-gray-800 min-w-[700px]">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">#</th>
                          <th className="border p-2">Staff ID</th>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Present</th>
                          <th className="border p-2">Absent</th>
                          <th className="border p-2">On Leave</th>
                          <th className="border p-2">Over Time</th>
                          <th className="border p-2">Off Duty</th>
                          <th className="border p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(
                          report.reduce((acc, rec) => {
                            const id = rec.employeeId._id;
                            if (!acc[id]) {
                              acc[id] = {
                                employeeId: rec.employeeId,
                                present: 0,
                                absent: 0,
                                leave: 0,
                                overTime: 0,
                                offDuty: 0,
                                records: [],
                              };
                            }
                            acc[id].records.push(rec);
                            if (rec.status === 'Present') acc[id].present++;
                            if (rec.status === 'Absent') acc[id].absent++;
                            if (rec.status === 'Leave') acc[id].leave++;
                            if (rec.status === 'overTime') acc[id].overTime++;
                            if (rec.status === 'offDuty') acc[id].offDuty++;
                            return acc;
                          }, {})
                        ).map((emp, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border p-2">{idx + 1}</td>
                            <td className="border p-2">{emp.employeeId.staffId}</td>
                            <td className="border p-2">{emp.employeeId.name}</td>
                            <td className="border p-2 text-green-700">{emp.present}</td>
                            <td className="border p-2 text-red-700">{emp.absent}</td>
                            <td className="border p-2 text-yellow-700">{emp.leave}</td>
                            <td className="border p-2 text-blue-700">{emp.overTime}</td>
                            <td className="border p-2 text-gray-700">{emp.offDuty}</td>
                            <td className="border p-2">
                              <button
                                onClick={() => {
                                  setSelectedEmployee(emp.employeeId);
                                  setEmployeeDetails(emp.records);
                                }}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No attendance found for this month.
                  </p>
                )
              ) : (
                <>
                  {/* Table for Single Employee Detail */}
                  <div className="overflow-x-auto">
                    <table className="w-full border mt-2 text-sm text-gray-800 min-w-[300px]">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">Date</th>
                          <th className="border p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeDetails.map((rec, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border p-2">
                              {new Date(rec.date).toLocaleDateString()}
                            </td>
                            <td className={`border p-2 font-bold text-center ${rec.status === "Present" ? "text-green-600" :
                                rec.status === "Absent" ? "text-red-600" :
                                  rec.status === "Leave" ? "text-yellow-600" :
                                    rec.status === "overTime" ? "text-blue-600" :
                                      rec.status === "offDuty" ? "text-gray-700" : "text-black"
                              }`}>
                              {rec.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Back Button */}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => {
                        setSelectedEmployee(null);
                      }}
                      className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400"
                    >
                      ← Back
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Print Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  const content = document.getElementById('print-salary-table').innerHTML;
                  const printWindow = window.open('', '', 'height=800,width=1000');
                  printWindow.document.write(
                    "<html><head><title>Attendance Report</title>"
                  );
                  printWindow.document.write(
                    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css">'
                  );
                  printWindow.document.write('</head><body>');
                  printWindow.document.write(content);
                  printWindow.document.write('</body></html>');
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 text-sm"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default Attendance;