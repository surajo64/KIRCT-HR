
import React, { useState, useEffect, useContext } from 'react';
import { toast } from "react-toastify";
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import LoadingOverlay from '../components/loadingOverlay.jsx';


const hodLeave = () => {
  const { token, backendUrl, fetchHodLeaves, hodLeaves, } = useContext(AppContext);
  const [relievingStaff, setRelievingStaff] = useState('');
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userId = decodedToken?.id; // or decodedToken._id depending on your backend payload

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [employee, setEmployee] = useState([null])
  const [showForm, setShowForm] = useState(false);
  const [leave, setLeave] = useState('');
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [editingLeave, setEditingLeave] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5



  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = { leave, reason, from, to };
    try {
      if (editingLeave && editingLeave._id) {
        const { data } = await axios.post(
          backendUrl + '/api/admin/update-leave',
          { leaveId: editingLeave._id, ...formData },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success("Leave updated successfully!");
          setLeave("");
          setReason("");
          
          setFrom("");
          setTo("")
          setSelectedLeave(null);
          fetchHodLeaves();
          setShowForm(false);
        }
      } else {
        const { data } = await axios.post(
          backendUrl + "/api/admin/add-leave",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success("Leave added successfully!");
          setLeave("");
          setReason("");
          setFrom("");
          setTo("")
          fetchHodLeaves();
          setSelectedLeave(null);
          setShowForm(false);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {

      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }

  }

  const handleClose = () => {
    setIsLoading(true);
    setTimeout(() => {
      setShowForm(false);
      fetchHodLeaves();
      setIsLoading(false);
    }, 300);
  };

  const handleAddNew = () => {
    setIsLoading(true);
    setTimeout(() => {
      setShowForm(true);
      setEditingLeave(null)
      setIsLoading(false);
    }, 300);
  };

  const handleUpdate = (item) => {
    setIsLoading(true);
    setTimeout(() => {
      setEditingLeave(item);
      setLeave(item.leave);
      setReason(item.reason);
      setFrom(new Date(item.from).toISOString().split('T')[0]);
      setTo(new Date(item.to).toISOString().split('T')[0]);
      setShowForm(true);
      setIsLoading(false);
    }, 300);
  };

  const handleView = (hodLeaves) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedLeave(hodLeaves);
      fetchEmployees();
      setIsLoading(false);
    }, 300);
  };

  const handleApproved = async (leaveId) => {
    setIsLoading(true);
    try {

      if (!relievingStaff) {
        toast.error("Please select a Relieving Staff before approving.");
        return;
      }

      const { data } = await axios.post(backendUrl + '/api/admin/hod-approve', { leaveId: selectedLeave._id, relievingStaff,comment }, { headers: { Authorization: `Bearer ${token}` } })
      console.log("Relieving Staff ID:", relievingStaff,comment)
      if (data.success) {
        toast.success(data.message)
        fetchHodLeaves();
        setSelectedLeave(null);
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Error approving appointment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (leaveId) => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/hod-reject', { leaveId: selectedLeave._id, comment }, { headers: { Authorization: `Bearer ${token}` } })
      console.log("Leave iD", leaveId)
      if (data.success) {
        toast.success(data.message)
        fetchHodLeaves();
        setSelectedLeave(null);
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Error approving appointment:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchEmployees = async () => {
    try {

      const { data } = await axios.get(`${backendUrl}/api/admin/employee-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setEmployee(data.employee);
        console.log("List Of Employee", data.employee)
      } else {
        console.log(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHodLeaves();
      fetchEmployees();
      console.log("all leaves", hodLeaves)
    }
  }, [token, searchTerm]);


  // Filter departments based on search
  useEffect(() => {
    const filtered = (hodLeaves || []).filter((l) => {
      const name = l.userId?.name?.toLowerCase() || '';
      const leaveType = l.leave?.toLowerCase() || '';
      const appliedAt = l.appliedAt
        ? new Date(l.appliedAt).toISOString().split('T')[0]
        : '';
      const department = l.userId?.department?.name?.toLowerCase() || '';
      const staffId = l.userId?._id?.toLowerCase() || '';

      const term = searchTerm.toLowerCase();

      return (
        name.includes(term) ||
        leaveType.includes(term) ||
        appliedAt.includes(term) ||
        department.includes(term) ||
        staffId.includes(term)
      );
    });

    setFilteredLeaves(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, hodLeaves]);


  const restrictedLeaves = ["Annual Leave", "Study Leave", "Sabbatical Leave", "Leave of Absence"];
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  const getFutureDate = (daysAhead) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split("T")[0];
  };

  const isRestrictedLeave = restrictedLeaves.includes(leave);
  const minFromDate = isRestrictedLeave ? getFutureDate(14) : todayISO;

  // Pagination logic
  const totalItems = hodLeaves?.length;
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const paginatedLeaves = filteredLeaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const calculateDays = (from, to) => {
  if (!from || !to) return "N/A";

  const start = new Date(from);
  const end = new Date(to);

  if (end < start) return "Invalid Dates";

  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    // 0 = Sunday, 6 = Saturday → skip weekends
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};



  return (
    <div className='w-full max-w-6xl m-5'>
      <p className="text-2xl font-bold text-gray-800 text-center">EMPLOYEE LEAVE</p>


      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4'>
        <input
          type='text'
          placeholder='Search by Department Name...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-1/2'
        />

      </div>

      <div className='bg-white border rounded-md mt-4 text-sm max-h-[80vh] min-h-[60vh] overflow-y-auto'>
        {/* Header */}
        <div className='hidden sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1.5fr_1.5fr_2.5fr_2fr] bg-gray-200 py-3 px-6 border-b-4 border-green-500 rounded-t-md'>
          <p>#</p>
          <p>Name</p>
          <p>Leave Type</p>
          <p>Reasons</p>
          <p>From</p>
          <p>To</p>

          <p>Status</p>
          <p>Actions</p>
        </div>

        {paginatedLeaves.length > 0 ? (
          paginatedLeaves.map((item, index) => {
            const today = new Date();
            const toDate = new Date(item.to);
            const timeDiff = toDate - today;
            const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

            return (
              <div
                key={index}
                className="flex flex-col sm:grid sm:grid-cols-[0.5fr_2fr_2fr_2fr_1.5fr_1.5fr_2.5fr_2fr] gap-y-2 items-start sm:items-center text-gray-700 py-3 px-6 border-b hover:bg-blue-50"
              >
                <p>{(currentPage - 1) * itemsPerPage + index + 1}</p>
                <p className="truncate">{item.userId.name}</p>
                <p>{item.leave}</p>
                <p className="break-words max-w-xs">{item.reason}</p>
                <p>{new Date(item.from).toISOString().split('T')[0]}</p>
                <p>{new Date(item.to).toISOString().split('T')[0]}</p>

                {/* Admin Approval */}


                {/* Status Logic */}
                <p>
                  {item.resumeStatus ? (() => {
                    const resumeDate = new Date(item.resumeDate);
                    const toDate = new Date(item.to);
                    resumeDate.setHours(0, 0, 0, 0);
                    toDate.setHours(0, 0, 0, 0);
                    const addedDays = Math.max(0, Math.ceil((resumeDate - toDate) / (1000 * 60 * 60 * 24)));

                    return (
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${addedDays > 0
                        ? "text-green-700 bg-green-100"
                        : "text-blue-700 bg-blue-100"}`}>
                        Resumed on {resumeDate.toLocaleDateString()} ({addedDays > 0 ? `${addedDays} day(s) added` : "No days added"})
                      </span>
                    );
                  })() : item.status === "Approved" ? (() => {
                    if (!item.from || !item.to) return "0 Days";

                    const today = new Date();
                    const from = new Date(item.from);
                    const to = new Date(item.to);
                    from.setHours(0, 0, 0, 0);
                    to.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);

                    if (today < from) {
                      const diffToStart = Math.ceil((from - today) / (1000 * 60 * 60 * 24));
                      return <span className="text-yellow-600 font-semibold">{diffToStart} day(s) to Go</span>;
                    } else if (today >= from && today < to) {
                      const daysLeft = Math.ceil((to - today) / (1000 * 60 * 60 * 24));
                      return <span className="text-green-600 font-semibold">{daysLeft} day(s) remaining</span>;
                    } else if (today.getTime() === to.getTime()) {
                      return <span className="text-blue-600 font-semibold">Returning today</span>;
                    } else {
                      const extraDays = Math.ceil((today - to) / (1000 * 60 * 60 * 24));
                      return <span className="text-red-600 font-semibold">Leave ended — {extraDays} day(s) added</span>;
                    }
                  })() : "0 Days"}
                </p>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => handleView(item)}
                    className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full"
                  >
                    View
                  </button>
                  {item.hodStatus === "Pending" && (
                    <button
                      onClick={() => handleUpdate(item)}
                      className="bg-green-500 text-white text-xs px-3 py-1 rounded-full"
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center py-5 text-gray-500">No leave records found.</p>
        )}

        {totalPages > 1 && (
          <>


            {/* Pagination controls */}
            <div className="flex justify-center items-center mt-2 gap-2">
              <button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1))
                    setIsLoading(false);
                  }, 300);
                }}
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
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    setIsLoading(false);
                  }, 300);
                }}
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

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 sm:p-6">
          <div className="w-full max-w-md bg-white p-4 sm:p-6 rounded-lg shadow-md relative">

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="font-bold text-3xl absolute top-2 right-4 text-red-700 hover:text-red-800"
            >
              ✕
            </button>

            {/* Modal Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-700">
              {editingLeave ? "Update Leave Request" : "Apply for Leave"}
            </h2>

            {/* Form */}
            <form onSubmit={onSubmitHandler} className="space-y-4">

              {/* Leave Type */}
              <select
                value={leave}
                onChange={(e) => setLeave(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">-- Select Leave Type --</option>
                <option value="Annual Leave">Annual Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Compassionate Leave">Compassionate Leave</option>
                <option value="Leave of Absence">Leave of Absence</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Paternity Leave">Paternity Leave</option>
                <option value="Sabbatical Leave">Sabbatical Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Study Leave">Study Leave</option>
              </select>

              {/* Reason */}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Reason for leave"
                rows={3}
              />

              {/* Date Inputs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block mb-1 text-sm text-gray-700">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    required
                    min={minFromDate}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                <div className="flex-1">
                  <label className="block mb-1 text-sm text-gray-700">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    required
                    min={from || new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition text-sm"
              >
                {editingLeave ? "Update Leave" : "Submit Leave Request"}
              </button>
            </form>
          </div>
        </div>
      )}

   {selectedLeave && fetchHodLeaves && fetchEmployees && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 px-2 sm:px-4">
    <div
      id="print-salary-table"
      className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-4 sm:p-8 relative overflow-y-auto max-h-[95vh]"
    >
      {/* Close button */}
      <button
        onClick={() => setSelectedLeave(null)}
        className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
      >
        &times;
      </button>

      {/* Header */}
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        {selectedLeave.userId?.name?.toUpperCase() || "N/A"}
      </h2>

      {/* Employee Profile Section */}
      <div className="flex justify-center mb-4">
        <img
          src={selectedLeave.userId?.profileImage || "/default-profile.png"}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-8 mb-6 text-center sm:text-left">
        <p className="text-sm text-gray-800 break-words">
          <span className="font-semibold text-green-800">Email: </span>
          {selectedLeave.userId?.email || "N/A"}
        </p>
        <p className="text-sm text-gray-800 break-words">
          <span className="font-semibold text-green-800">Department: </span>
          {selectedLeave.userId?.department?.name || "N/A"}
        </p>
      </div>

      {/* Leave Details Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 border border-gray-200 rounded-md">
          <tbody>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50 w-40">Leave Type</th>
              <td className="px-4 py-2">{selectedLeave.leave || "N/A"}</td>
            </tr>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">Reason</th>
              <td className="px-4 py-2">{selectedLeave.reason || "N/A"}</td>
            </tr>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">From</th>
              <td className="px-4 py-2">
                {selectedLeave.from ? new Date(selectedLeave.from).toISOString().split("T")[0] : "N/A"}
              </td>
            </tr>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">To</th>
              <td className="px-4 py-2">
                {selectedLeave.to ? new Date(selectedLeave.to).toISOString().split("T")[0] : "N/A"}
              </td>
              </tr>

              <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">Days</th>
              <td className="px-4 py-2">
                {calculateDays(selectedLeave.from, selectedLeave.to)}
              </td>
            </tr>

            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">Applied On</th>
              <td className="px-4 py-2">
                {selectedLeave.appliedAt ? new Date(selectedLeave.appliedAt).toISOString().split("T")[0] : "N/A"}
              </td>
            </tr>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">Relieving Staff</th>
              <td className="px-4 py-2">{selectedLeave.relievingEId?.name || "N/A"}</td>
            </tr>
            
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">HOD Approval</th>
              <td className="px-4 py-2">
                <span
                  className={`font-semibold px-2 py-1 rounded ${
                    selectedLeave.hodStatus === "Approved"
                      ? "text-green-600 bg-green-100"
                      : selectedLeave.hodStatus === "Rejected"
                      ? "text-red-600 bg-red-100"
                      : "text-yellow-600 bg-yellow-100"
                  }`}
                >
                  {selectedLeave.hodStatus || "Pending"}
                </span>
              </td>
            </tr>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">HOD Comment</th>
              <td className="px-4 py-2">{selectedLeave.hodComments || "N/A"}</td>
            </tr>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">HR Approval</th>
              <td className="px-4 py-2">
                <span
                  className={`font-semibold px-2 py-1 rounded ${
                    selectedLeave.status === "Approved"
                      ? "text-green-600 bg-green-100"
                      : selectedLeave.status === "Rejected"
                      ? "text-red-600 bg-red-100"
                      : "text-yellow-600 bg-yellow-100"
                  }`}
                >
                  {selectedLeave.status || "Pending"}
                </span>
              </td>
            </tr>
            <tr className="border-b">
              <th className="px-4 py-2 font-medium bg-gray-50">HR Comment</th>
              <td className="px-4 py-2">{selectedLeave.hrComments || "N/A"}</td>
            </tr>
            <tr>
              <th className="px-4 py-2 font-medium bg-gray-50">Status</th>
              <td className="px-4 py-2">
                {selectedLeave.resumeStatus ? (
                  <span className="text-green-700 text-sm font-semibold bg-green-100 px-3 py-1 rounded-full">
                    Resumed on {new Date(selectedLeave.resumeDate).toLocaleDateString()} (
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(selectedLeave.resumeDate).setHours(0, 0, 0, 0) -
                          new Date(selectedLeave.to).setHours(0, 0, 0, 0)) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{" "}
                    day(s) added)
                  </span>
                ) : selectedLeave.status === "Approved" ? (
                  (() => {
                    if (!selectedLeave.from || !selectedLeave.to) return "0 Days";
                    const today = new Date();
                    const from = new Date(selectedLeave.from);
                    const to = new Date(selectedLeave.to);
                    from.setHours(0, 0, 0, 0);
                    to.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);

                    if (today < from) {
                      const diffToStart = Math.ceil((from - today) / (1000 * 60 * 60 * 24));
                      return <span className="text-yellow-700 font-bold">{diffToStart} day(s) to Go</span>;
                    } else if (today >= from && today < to) {
                      const daysLeft = Math.ceil((to - today) / (1000 * 60 * 60 * 24));
                      return <span className="text-green-700 font-bold">{daysLeft} day(s) remaining</span>;
                    } else if (today.getTime() === to.getTime()) {
                      return <span className="text-blue-700 font-bold">Returning today</span>;
                    } else {
                      const extraDays = Math.ceil((today - to) / (1000 * 60 * 60 * 24));
                      return <span className="text-red-700 font-bold">Leave ended — He/She added {extraDays} day(s)</span>;
                    }
                  })()
                ) : (
                  "0 Days"
                )}
              </td>
            </tr>
          </tbody>
        </table>


        {/* Print Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              const content = document.getElementById("print-salary-table").cloneNode(true);
              const printWindow = window.open("", "", "height=800,width=1000");
              printWindow.document.write("<html><head><title>Leave Details History</title>");
              printWindow.document.write(
                '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css">'
              );
              printWindow.document.write("</head><body>");
              printWindow.document.body.appendChild(content);
              printWindow.document.write("</body></html>");
              printWindow.document.close();
              printWindow.focus();
              printWindow.print();
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
          >
            Print
          </button>
        </div>

        {/* Relieving Staff Dropdown */}
        {selectedLeave.hodStatus === "Pending" && (
              <div className="mt-6">
                <label className="block font-semibold mb-1">Select Relieving Staff</label>
                <select
                  className={`w-full border rounded px-4 py-2 ${selectedLeave?.status === 'Approved' || selectedLeave?.status === 'Rejected'
                    ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                    : 'border-gray-300'
                    }`}
                  value={relievingStaff}
                  onChange={(e) => setRelievingStaff(e.target.value)}>
                  <option value="">-- Select Relieving Staff --</option>
                  {employee
                    ?.filter(emp => emp.userId?._id !== selectedLeave?.userId?._id)
                    .map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.userId?.name}
                      </option>
                    ))}


                </select>

                 {/* Comment Textarea */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="HOD Remarks and comments"
          rows={3}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mt-4"
        />
          </div>
        )}

        {/* HOD Action Buttons */}
        {selectedLeave.hodStatus === "Pending" && (
          <div className="flex flex-col sm:flex-row justify-end sm:gap-3 gap-2 mt-6">
            <button
              onClick={() => handleApproved(selectedLeave._id, "Approved")}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-medium w-full sm:w-auto"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(selectedLeave._id, "Rejected")}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium transition text-sm w-full sm:w-auto"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {isLoading && <LoadingOverlay />}
    </div >
  );
};

export default hodLeave
