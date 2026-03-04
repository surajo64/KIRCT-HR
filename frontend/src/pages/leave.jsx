import React, { useState, useEffect, useContext } from 'react';
import { toast } from "react-toastify";
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import LoadingOverlay from '../components/loadingOverlay.jsx';


const leave = () => {
  const { token, backendUrl, approveLeave, rejectLeave, leaves, employeeLeaves, getAllLeaves, setEmployeeLeaves, getEmployeeLeaves } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [leave, setLeave] = useState('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
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
          { leaveid: editingLeave._id, ...formData },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success("Leave updated successfully!");
          setSelectedLeave(null);
          getAllLeaves();
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
          getAllLeaves();
          setSelectedLeave(null);
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



  // Mark Leave As Resumed
  const markLeaveResumed = async (leaveId) => {
    setIsLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/leave-resumed', { leaveId },
        {
          headers: { Authorization: `Bearer ${token}` },
        });

      if (data.success) {
        toast.success(data.message)
        getAllLeaves(); // Refresh the appointment list
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Error approving appointment:", error);
    } finally {
      setIsLoading(false);
    }
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


  const handleView = (leaves) => {
    setIsLoading(true);

    setTimeout(() => {
      setSelectedLeave(leaves);
      setIsLoading(false);
    }, 300);
  };

  const handleApproved = async (leaveId) => {
    if (!comment || comment.trim() === "") {
  toast.error("Please enter a comment before approving or rejecting.");
  return;
}
    setIsLoading(true);
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/approve-leave', { leaveId: selectedLeave._id, comment }, { headers: { Authorization: `Bearer ${token}` } })
      console.log("Leave ID:", leaveId)
      if (data.success) {
        toast.success(data.message)
        getAllLeaves();
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
    if (!comment || comment.trim() === "") {
  toast.error("Please enter a comment before approving or rejecting.");
  return;
}
    setIsLoading(true);
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/reject-leave', { leaveId: selectedLeave._id, comment }, { headers: { Authorization: `Bearer ${token}` } })
      console.log("Leave iD", leaveId)
      if (data.success) {
        toast.success(data.message)
        getAllLeaves();
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

  useEffect(() => {
    if (token) {
      getAllLeaves();
      console.log("all leaves", leaves)
    }
  }, [token, searchTerm]);


  // Filter departments based on search
  useEffect(() => {
    const filtered = (leaves || []).filter((l) => {
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
  }, [searchTerm, leaves]);


  // Pagination logic
  const totalItems = leaves?.length;
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
    <div className='w-full max-w-6xl mx-auto px-4 text-center'>
      <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-5">EMPLOYEE LEAVE MANAGEMENT</p>

      {/* Search */}
      <div className='flex flex-col sm:flex-row justify-between items-center mt-4 gap-4'>
        <input
          type='text'
          placeholder='Search by Department Name...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full sm:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
        />
      </div>

      <div className='bg-white mt-6 rounded-lg shadow overflow-x-auto text-sm max-h-[80vh] min-h-[60vh]'>
        {/* Header */}
        <div className='bg-gray-200 hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1.5fr_1.5fr_3fr_2.5fr] py-3 px-6 rounded-t-xl border-b-4 border-green-500'>
          <p >#</p>
          <p>Employee</p>
          <p className="hidden sm:block">Leave</p>
          <p>From</p>
          <p>To</p>
          <p className="hidden sm:block">Status</p>
          <p>Actions</p>
        </div>

        {/* Row List */}
        {paginatedLeaves.length > 0 ? (
          paginatedLeaves.map((item, index) => {
            const today = new Date();
            const toDate = new Date(item.to);
            const timeDiff = toDate.getTime() - today.getTime();
            const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

            return (
              <div key={index} className="flex flex-col sm:grid sm:grid-cols-[0.5fr_2fr_1fr_1.5fr_1.5fr_3fr_2.5fr] items-start sm:items-center text-gray-600 py-3 px-6 border-b hover:bg-blue-50 gap-y-2">
                <p className="hidden sm:block font-semibold">{(currentPage - 1) * itemsPerPage + index + 1}</p>
                <p>{item.userId.name}</p>

                {/* Hide Leave Type on mobile */}
                <p className="hidden sm:block">{item.leave}</p>

                <p>{new Date(item.from).toISOString().split('T')[0]}</p>
                <p>{new Date(item.to).toISOString().split('T')[0]}</p>



                {/* Countdown logic */}
                <p className="hidden sm:block">
                  {item.resumeStatus ? (() => {
                    const resumeDate = new Date(item.resumeDate);
                    const toDate = new Date(item.to);

                    // Normalize time
                    resumeDate.setHours(0, 0, 0, 0);
                    toDate.setHours(0, 0, 0, 0);

                    const addedDays = Math.max(
                      0,
                      Math.ceil((resumeDate - toDate) / (1000 * 60 * 60 * 24))
                    );

                    return (
                      <span
                        className={`text-sm font-semibold px-3 py-1 rounded-full ${addedDays > 0
                          ? "text-green-700 bg-green-100"
                          : "text-blue-700 bg-blue-100"
                          }`}
                      >
                        Resumed on {resumeDate.toLocaleDateString()} (
                        {addedDays > 0 ? `${addedDays} day(s) added` : "No days added"})
                      </span>
                    );
                  })()
                    : item.status === "Approved" ? (() => {
                      if (!item.from || !item.to) return "0 Days";

                      const today = new Date();
                      const from = new Date(item.from);
                      const to = new Date(item.to);

                      from.setHours(0, 0, 0, 0);
                      to.setHours(0, 0, 0, 0);
                      today.setHours(0, 0, 0, 0);

                      if (today < from) {
                        const diffToStart = Math.ceil((from - today) / (1000 * 60 * 60 * 24));
                        return (
                          <span style={{ color: 'goldenrod', fontWeight: 'bold' }}>
                            {diffToStart} day(s) to Go
                          </span>
                        );
                      } else if (today >= from && today < to) {
                        const daysLeft = Math.ceil((to - today) / (1000 * 60 * 60 * 24));
                        return (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>
                            {daysLeft} day(s) remaining
                          </span>
                        );
                      } else if (today.getTime() === to.getTime()) {
                        return (
                          <span style={{ color: 'blue', fontWeight: 'bold' }}>
                            Returning today
                          </span>
                        );
                      } else {
                        const extraDays = Math.ceil((today - to) / (1000 * 60 * 60 * 24));
                        return (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>
                            Leave ended — He/She added {extraDays} day(s)
                          </span>
                        );
                      }
                    })()
                      : "0 Days"}

                </p>


                {/* Actions */}
                <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
                  {!item.resumeStatus && new Date(item.to).setHours(0, 0, 0, 0) <= today.setHours(0, 0, 0, 0) && (
                    <button
                      onClick={() => markLeaveResumed(item)}
                      className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full"
                    >
                      Mark Resume
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => {
                        handleView(item)
                        setIsLoading(false);
                      }, 300);
                    }}
                    className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full"
                  >
                    View
                  </button>

                  {item.status === "Pending" && (
                    <button
                      onClick={() => handleUpdate(item)}
                      className="bg-green-500 text-white text-sm px-3 py-1 rounded-full"
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center py-5 text-gray-500">No leave requests found.</p>
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

      {
        showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-2">
            <div className="w-full max-w-md bg-white p-4 sm:p-6 rounded-lg shadow-md relative max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setShowForm(false)}
                className="font-bold text-3xl absolute top-2 right-4 text-red-700 hover:text-red-800"
              >
                ✕
              </button>

              <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 text-gray-700">
                {editingLeave ? "Update Leave Request" : "Apply for Leave"}
              </h2>

              <form onSubmit={onSubmitHandler} className="space-y-4">
                {/* Leave Type */}
                <select
                  value={leave}
                  onChange={(e) => setLeave(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Reason for leave"
                />

                {/* From / To Dates */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block mb-1 text-sm text-gray-700">From</label>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition"
                >
                  {editingLeave ? "Update Leave" : "Submit Leave Request"}
                </button>
              </form>
            </div>
          </div>
        )
      }


      {selectedLeave && getAllLeaves && (

        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
          <div id="print-salary-table"
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-4 sm:p-8 relative"
          >

            {/* Close Button */}
            <button
              onClick={() => setSelectedLeave(null)}
              className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
            >
              &times;
            </button>

            {/* Name */}
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 break-words">
              {selectedLeave.userId?.name?.toUpperCase() || "N/A"}
            </h2>

            {/* Profile Image */}
            <div className="flex justify-center mb-4">
              <img
                src={selectedLeave.userId?.profileImage}
                alt="Profile"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border"
              />
            </div>

            {/* Email & Department */}
            <div className="flex flex-col sm:flex-row justify-center sm:gap-8 gap-2 text-sm text-gray-800 mb-6 text-center">
              <div>
                <span className="font-semibold text-green-800">Email:</span>{" "}
                {selectedLeave.userId?.email || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-green-800">Department:</span>{" "}
                {selectedLeave.userId?.department?.name || "N/A"}
              </div>
            </div>

            {/* Table for Desktop */}
            <div className="hidden sm:block">
              <table className="w-full text-sm text-left text-gray-700 border border-gray-200 rounded-md">
                <tbody>
                  {[
                    { label: "Leave Type", value: selectedLeave.leave },
                    { label: "Reason", value: selectedLeave.reason },
                    { label: "From", value: new Date(selectedLeave.from).toISOString().split("T")[0] },
                    { label: "To", value: new Date(selectedLeave.to).toISOString().split("T")[0] },
                    {
                      label: "Days",
                      value: calculateDays(selectedLeave.from, selectedLeave.to)
                    },
                    { label: "Applied On", value: new Date(selectedLeave.appliedAt).toISOString().split("T")[0] },
                    { label: "Relieving Staff", value: selectedLeave.relievingEId?.name || "N/A" },
                    {
                      label: "HOD Approval",
                      value: (
                        <span className={`font-semibold px-2 py-1 rounded 
                    ${selectedLeave.hodStatus === 'Approved' ? 'text-green-600 bg-green-100' :
                            selectedLeave.hodStatus === 'Rejected' ? 'text-red-600 bg-red-100' :
                              'text-yellow-600 bg-yellow-100'}`}>
                          {selectedLeave.hodStatus}
                        </span>
                      )
                    },
                     { label: "HOD Comments", value: selectedLeave.hodComments || "N/A" },
                    {
                      label: "HR Approval",
                      value: (
                        <span className={`font-semibold px-2 py-1 rounded 
                    ${selectedLeave.status === 'Approved' ? 'text-green-600 bg-green-100' :
                            selectedLeave.status === 'Rejected' ? 'text-red-600 bg-red-100' :
                              'text-yellow-600 bg-yellow-100'}`}>
                          {selectedLeave.status}
                        </span>
                      )
                    },
                    { label: "HR Comments", value: selectedLeave.hrComments || "N/A" },
                    {
                      label: "Status",
                      value: selectedLeave.resumeStatus ? (
                        <span className="text-green-700 text-sm font-semibold bg-green-100 px-3 py-1 rounded-full">
                          Resumed on {new Date(selectedLeave.resumeDate).toLocaleDateString()} (
                          {Math.max(
                            0,
                            Math.ceil(
                              (new Date(selectedLeave.resumeDate).setHours(0, 0, 0, 0) -
                                new Date(selectedLeave.to).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
                            )
                          )} day(s) added)
                        </span>
                      ) : (() => {
                        const today = new Date();
                        const from = new Date(selectedLeave.from);
                        const to = new Date(selectedLeave.to);
                        today.setHours(0, 0, 0, 0);
                        from.setHours(0, 0, 0, 0);
                        to.setHours(0, 0, 0, 0);

                        if (today < from) {
                          const days = Math.ceil((from - today) / (1000 * 60 * 60 * 24));
                          return <span style={{ color: "goldenrod", fontWeight: "bold" }}>{days} day(s) to Go</span>;
                        } else if (today >= from && today < to) {
                          const days = Math.ceil((to - today) / (1000 * 60 * 60 * 24));
                          return <span style={{ color: "green", fontWeight: "bold" }}>{days} day(s) remaining</span>;
                        } else if (today.getTime() === to.getTime()) {
                          return <span style={{ color: "blue", fontWeight: "bold" }}>Returning today</span>;
                        } else {
                          const days = Math.ceil((today - to) / (1000 * 60 * 60 * 24));
                          return <span style={{ color: "red", fontWeight: "bold" }}>Leave ended — He/She added {days} day(s)</span>;
                        }
                      })()
                    }
                  ].map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <th className="px-4 py-2 font-medium bg-gray-50 w-40">{item.label}</th>
                      <td className="px-4 py-2">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile-Friendly Version */}
            <div className="sm:hidden space-y-4 text-sm text-gray-700 mt-4">
              {[
                { label: "Leave Type", value: selectedLeave.leave },
                { label: "Reason", value: selectedLeave.reason },
                { label: "From", value: new Date(selectedLeave.from).toISOString().split("T")[0] },
                { label: "To", value: new Date(selectedLeave.to).toISOString().split("T")[0] },
                { label: "Days", value: calculateDays(selectedLeave.from, selectedLeave.to) },
                { label: "Applied On", value: new Date(selectedLeave.appliedAt).toISOString().split("T")[0] },
                { label: "Relieving Staff", value: selectedLeave.relievingEId?.name || "N/A" },
                { label: "HOD Approval", value: selectedLeave.hodStatus },
                { label: "Admin Approval", value: selectedLeave.status },
                {
                  label: "Status",
                  value: selectedLeave.resumeStatus
                    ? `Resumed on ${new Date(selectedLeave.resumeDate).toLocaleDateString()}`
                    : "Ongoing"
                },
                { label: "HR Comments", value: selectedLeave.hrComments?.name || "N/A" },
              ].map((item, idx) => (
                <div key={idx} className="border-b pb-2">
                  <div className="text-gray-500 font-semibold">{item.label}</div>
                  <div className="text-gray-800">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Print Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  const content = document.getElementById("print-salary-table").innerHTML;
                  const printWindow = window.open("", "", "height=800,width=1000");
                  printWindow.document.write("<html><head><title>Leave Details History</title>");
                  printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css">');
                  printWindow.document.write("</head><body>");
                  printWindow.document.write(content);
                  printWindow.document.write("</body></html>");
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
              >
                Print
              </button>
            </div>

            {/* Relieving Staff Dropdown */}
            {selectedLeave.status === "Pending" && (
              <div className="mt-6">

                {/* Comment Textarea */}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="HR Remarks and comments"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mt-4"
                />
              </div>
            )}

            {/* Action Buttons */}
            {selectedLeave.status === "Pending" && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-full font-medium w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproved(selectedLeave._id, "Approved")}
                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-medium w-full sm:w-auto"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedLeave._id, "Rejected")}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full font-medium w-full sm:w-auto"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )
      }
      {isLoading && <LoadingOverlay />}
    </div >
  );
};

export default leave
