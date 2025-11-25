// src/pages/EmployeeLeave.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import LoadingOverlay from "../components/loadingOverlay.jsx";

const EmployeeLeave = () => {
  const { token, backendUrl, leaves: contextLeaves, fetchLeaves, getEmployeeLeaves, user } = useContext(AppContext);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // View / delete
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // derive initialLeaveDays from user model
  const initialLeaveDays = Number(user?.leaveDays ?? 0);

  // Utility: count working days (Mon-Fri) inclusive
  const countWorkingDays = (startIso, endIso) => {
    if (!startIso || !endIso) return 0;
    const start = new Date(startIso);
    const end = new Date(endIso);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (start > end) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // compute used days from existing approved leaves (weekdays only)
  const computeUsedDays = (leavesArr = []) => {
    return leavesArr.reduce((sum, l) => {
      // only count approved leaves (and skip rejected)
      if (l.status === "Approved" && l.hodStatus !== "Rejected") {
        // if leave record already stores totalDays use it; else compute:
        if (typeof l.totalDays === "number" && l.totalDays >= 0) return sum + l.totalDays;
        return sum + countWorkingDays(l.from, l.to);
      }
      return sum;
    }, 0);
  };

  // compute pending count
  const computePendingCount = (leavesArr = []) => {
    return leavesArr.filter(l => (l.status === "Pending" && l.hodStatus === "Pending")).length;
  };

  // Leave balance info (derived)
  const usedLeaveDays = computeUsedDays(leaves);
  const pendingLeavesCount = computePendingCount(leaves);
  const leaveBalance = Math.max(0, initialLeaveDays - usedLeaveDays);

  // Fetch leaves (use context functions if provided)
  const loadLeaves = async () => {
    setIsLoading(true);
    try {
      // prefer context fetch functions if provided
      if (typeof getEmployeeLeaves === "function") {
        await getEmployeeLeaves(); // assume it will update context leaves
        // if context provides leaves as prop, use it (next effect will sync)
      } else if (typeof fetchLeaves === "function") {
        await fetchLeaves();
      } else {
        // fallback to local fetch
        const res = await axios.get(`${backendUrl}/api/employee/leaves`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          // res.data.leaves expected
          setLeaves(res.data.leaves || []);
        } else {
          toast.error(res.data?.message || "Failed to fetch leaves");
        }
      }
    } catch (err) {
      console.error("Fetch leaves error:", err);
      toast.error("Failed to fetch leaves");
    } finally {
      setIsLoading(false);
    }
  };

  // sync context leaves -> local leaves
  useEffect(() => {
    if (Array.isArray(contextLeaves) && contextLeaves.length > 0) {
      setLeaves(contextLeaves);
    }
  }, [contextLeaves]);

  // initial load
  useEffect(() => {
    if (token) loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Search filtering
  useEffect(() => {
    const normalized = (searchTerm || "").trim().toLowerCase();
    const filtered = (leaves || []).filter((l) => {
      if (!normalized) return true;
      return String(l.leave || "").toLowerCase().includes(normalized) ||
        String(l.reason || "").toLowerCase().includes(normalized) ||
        (l.userId?.name || "").toLowerCase().includes(normalized);
    });
    setFilteredLeaves(filtered);
    setCurrentPage(1);
  }, [searchTerm, leaves]);

  // Pagination helpers
  const totalItems = filteredLeaves.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Date helpers for restricted leaves
  const restrictedLeaves = ["Annual Leave", "Study Leave", "Sabbatical Leave", "Leave of Absence"];
  const todayISO = new Date().toISOString().split("T")[0];
  const getFutureDateISO = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
  };
  const minFromDate = restrictedLeaves.includes(leaveType) ? getFutureDateISO(14) : todayISO;

  // Form open/reset
  const openNewForm = () => {
    // if initial leave balance zero and user tries annual leave later they'll be blocked during submit
    setEditingLeave(null);
    setLeaveType("");
    setReason("");
    setFrom("");
    setTo("");
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingLeave(null);
    setLeaveType("");
    setReason("");
    setFrom("");
    setTo("");
  };

  const handleCloseForm = () => {
    resetForm();
    setShowForm(false);
  };

  // Validate dates and business rules (no split leave)
  const validateForm = () => {
    if (!leaveType || !reason || !from || !to) return { ok: false, msg: "Please fill all fields" };

    const fromDate = new Date(from);
    const toDate = new Date(to);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    if (fromDate >= toDate) return { ok: false, msg: "End date must be after start date" };

    // If Annual Leave then run working-days counting and balance check
    if (leaveType === "Annual Leave") {
      const requestedDays = countWorkingDays(from, to);
      if (requestedDays <= 0) return { ok: false, msg: "Requested period contains no working days" };
      if (requestedDays > leaveBalance) return { ok: false, msg: `Insufficient balance. You have ${leaveBalance} day(s)` };
    }

    return { ok: true };
  };

  // Create or update leave
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const validation = validateForm();
    if (!validation.ok) {
      toast.error(validation.msg);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        leave: leaveType,
        reason,
        from,
        to,
      };

      if (editingLeave && editingLeave._id) {
        const res = await axios.post(`${backendUrl}/api/admin/update-leave`, { leaveid: editingLeave._id, ...payload }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          toast.success("Leave updated");
        } else {
          toast.error(res.data?.message || "Failed to update");
        }
      } else {
        const res = await axios.post(`${backendUrl}/api/admin/add-leave`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          toast.success("Leave requested");
          // backend may return employeeLeaveInfo — we rely on reloading leaves
        } else {
          toast.error(res.data?.message || "Failed to submit leave");
        }
      }

      // refresh
      await loadLeaves();
      if (typeof fetchLeaves === "function") await fetchLeaves();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Error submitting leave");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete leave
  const handleDelete = async (id) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await axios.delete(`${backendUrl}/api/admin/delete-leave/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Deleted");
        await loadLeaves();
        if (typeof fetchLeaves === "function") await fetchLeaves();
        setConfirmDeleteId(null);
      } else {
        toast.error(res.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare edit
  const handleUpdate = (item) => {
    if (!item) return;
    setEditingLeave(item);
    setLeaveType(item.leave || "");
    setReason(item.reason || "");
    setFrom(item.from ? new Date(item.from).toISOString().split("T")[0] : "");
    setTo(item.to ? new Date(item.to).toISOString().split("T")[0] : "");
    setShowForm(true);
  };

  // View details
  const handleView = (item) => {
    setSelectedLeave(item);
  };

  // Small helper: human friendly working-days for a chosen range
  const chosenWorkingDays = (fromVal, toVal, forType) => {
    if (!fromVal || !toVal) return 0;
    if (forType !== "Annual Leave") return 0; // only count for annual leave
    return countWorkingDays(fromVal, toVal);
  };

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



  // Render
  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <p className="text-2xl font-bold text-gray-800 text-center">EMPLOYEE LEAVE</p>

      {/* Balance cards */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mt-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-blue-600 font-semibold">Annual Leave Days</div>
            <div className="text-2xl font-bold text-blue-800">{initialLeaveDays}</div>
            <div className="text-xs text-gray-500 mt-1">Total Allocated</div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-green-600 font-semibold">Available Balance</div>
            <div className="text-2xl font-bold text-green-800">{leaveBalance}</div>
            <div className="text-xs text-gray-500 mt-1">Current Balance</div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-orange-600 font-semibold">Used Days</div>
            <div className="text-2xl font-bold text-orange-800">{usedLeaveDays}</div>
            <div className="text-xs text-gray-500 mt-1">Total Used</div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-purple-600 font-semibold">Pending Requests</div>
            <div className="text-2xl font-bold text-purple-800">{pendingLeavesCount}</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting Approval</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
        <input
          type="text"
          placeholder="Search by leave type, reason or name..."
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="bg-blue-500 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-600" onClick={openNewForm}>
            Apply Leave
          </button>
          <button
            className="bg-gray-100 text-gray-800 py-2 px-4 rounded-md text-sm hover:bg-gray-200"
            onClick={() => { loadLeaves(); if (typeof fetchLeaves === "function") fetchLeaves(); }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table Scroll Wrapper */}
      <div className='bg-white mt-6 rounded-md overflow-x-auto max-h-[80vh] min-h-[60vh] text-sm'>
        {/* Table Header */}
        <div className='hidden sm:grid grid-cols-[0.5fr_2fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr_2fr_2fr] py-3 px-6 bg-gray-200 border-b-4 border-green-500 rounded-t-lg'>
          <p>#</p>
          <p>Leave Type</p>
          <p>Reasons</p>
          <p>From</p>
          <p>To</p>
          <p>Applied Date</p>
          <p>Approval</p>
          <p>Status</p>
          <p>Actions</p>
        </div>

        {/* Leave List */}
        {/* Leave List */}
        {paginatedLeaves.length > 0 ? (
          paginatedLeaves.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:grid sm:grid-cols-[0.5fr_2fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr_2fr_2fr] gap-2 sm:gap-0 py-3 px-4 sm:px-6 border-b hover:bg-blue-50 text-gray-700"
            >
              <p>{(currentPage - 1) * itemsPerPage + index + 1}</p>
              <p>{item.leave}</p>
              <p>{item.reason}</p>
              <p>{new Date(item.from).toISOString().split('T')[0]}</p>
              <p>{new Date(item.to).toISOString().split('T')[0]}</p>
              <p>{new Date(item.appliedAt).toISOString().split('T')[0]}</p>
              <p>
                <span className={`font-semibold ${(item.hodStatus === "Rejected" || item.status === "Rejected")
                  ? "text-red-500"
                  : item.status === "Approved"
                    ? "text-green-600"
                    : "text-yellow-600"
                  }`}>
                  {item.hodStatus === "Rejected" ? item.hodStatus : item.status}
                </span>
              </p>

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
                  const today = new Date();
                  const from = new Date(item.from);
                  const to = new Date(item.to);
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
                    return <span className="text-red-600 font-bold">Leave ended — You added {extraDays} day(s)</span>;
                  }
                })() : "0 Days"}
              </p>

              <div className="flex flex-wrap sm:justify-end gap-2 mt-2 sm:mt-0">
                <button onClick={() => handleView(item)} className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full">View</button>

                {item.hodStatus === "Pending" && (
                  <>
                    <button onClick={() => handleUpdate(item)} className="bg-green-500 text-white text-sm px-3 py-1 rounded-full">Update</button>
                    <button onClick={() => setConfirmDeleteId(item._id)} className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-5 text-gray-500">No departments found.</p>
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
      {/* Apply / Edit Form Modal (no split leave) */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 sm:p-6">
          <div className="w-full max-w-md bg-white p-4 sm:p-6 rounded-lg shadow-md relative">
            <button onClick={handleCloseForm} className="font-bold text-3xl absolute top-2 right-4 text-red-700 hover:text-red-800">✕</button>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-700">{editingLeave ? "Update Leave Request" : "Apply for Leave"}</h2>

            {/* If user picks Annual Leave, show computed days + balance */}
            {leaveType === "Annual Leave" && from && to && (
              <div className="mt-2 mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex justify-between">
                  <span>This leave will use</span>
                  <strong>{countWorkingDays(from, to)} day(s)</strong>
                </div>
                <div className="text-xs text-gray-600 mt-1">Available: {leaveBalance} day(s)</div>
                {countWorkingDays(from, to) > leaveBalance && (
                  <div className="text-red-600 text-sm mt-1">⚠️ Not enough leave days</div>
                )}
              </div>
            )}

            <form onSubmit={onSubmitHandler} className="space-y-4">
              <select className="w-full px-4 py-2 border rounded" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} required>
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

              <textarea className="w-full px-4 py-2 border rounded" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <input type="date" className="w-full px-3 py-2 border rounded" value={from} onChange={(e) => setFrom(e.target.value)} min={minFromDate} required />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <input type="date" className="w-full px-3 py-2 border rounded" value={to} onChange={(e) => setTo(e.target.value)} min={from || todayISO} required />
                </div>
              </div>

              <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600">
                {editingLeave ? "Update Leave" : "Submit Leave Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-lg shadow-md relative">
            <p className="text-red-500 mb-6 text-center font-semibold">Are you sure you want to delete this leave?</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 bg-red-500 text-white py-2 rounded">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {selectedLeave && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 sm:p-6">
          <div id="print-salary-table" className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-4 sm:p-8 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedLeave(null)} className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>

            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 sm:mb-6">{selectedLeave.userId?.name?.toUpperCase() || "N/A"}</h2>
            <div className="flex justify-center mb-4">
              <img src={selectedLeave.userId?.profileImage} alt="Profile" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700 border border-gray-200 rounded-md">
                <tbody>
                  {[
                    { label: "Leave Type", value: selectedLeave.leave },
                    { label: "Reason", value: selectedLeave.reason },
                    {
                      label: "From",
                      value: selectedLeave.from
                        ? new Date(selectedLeave.from).toISOString().split("T")[0]
                        : "N/A"
                    },
                    {
                      label: "To",
                      value: selectedLeave.to
                        ? new Date(selectedLeave.to).toISOString().split("T")[0]
                        : "N/A"
                    },
                    {
                      label: "Days",
                      value: calculateDays(selectedLeave.from, selectedLeave.to)
                    },
                    { label: "Applied On", value: selectedLeave.appliedAt ? new Date(selectedLeave.appliedAt).toISOString().split("T")[0] : "N/A" },
                    { label: "Relieving Staff", value: selectedLeave.relievingEId?.name || "Not Selected By HOD" },


                  ].map((r, idx) => (
                    <tr key={idx} className="border-b">
                      <th className="px-4 py-2 font-medium bg-gray-50 w-40">{r.label}</th>
                      <td className="px-4 py-2">{r.value || "N/A"}</td>
                    </tr>
                  ))}

                  <tr className="border-b">
                    <th className="px-4 py-2 font-medium bg-gray-50">HOD Approval</th>
                    <td className="px-4 py-2">
                      <span className={`font-semibold px-2 py-1 rounded ${selectedLeave.hodStatus === "Approved" ? "text-green-600 bg-green-100" : selectedLeave.hodStatus === "Rejected" ? "text-red-600 bg-red-100" : "text-yellow-600 bg-yellow-100"}`}>
                        {selectedLeave.hodStatus}
                      </span>
                    </td>
                  </tr>

                  <tr className="border-b">
                    <th className="px-4 py-2 font-medium bg-gray-50"> HOD Comments</th>
                    <td>
                      {selectedLeave.hodComments || "Did not Comment"}
                    </td>
                  </tr>

                  
                  <tr className="border-b">
                    <th className="px-4 py-2 font-medium bg-gray-50">HR Approval</th>
                    <td className="px-4 py-2">
                      <span className={`font-semibold ${selectedLeave.status === "Approved" ? "text-green-600" : selectedLeave.status === "Rejected" ? "text-red-600" : "text-yellow-600"}`}>
                        {selectedLeave.status}
                      </span>
                    </td>
                  </tr>

                  <tr className="border-b">
                    <th className="px-4 py-2 font-medium bg-gray-50"> HR Comments</th>
                    <td>
                      {selectedLeave.hrComments || "Did not Comment"}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            <div className="flex justify-center mt-6">
              <button onClick={() => {
                const content = document.getElementById("print-salary-table").innerHTML;
                const printWindow = window.open("", "", "height=800,width=1000");
                printWindow.document.write("<html><head><title>Leave Details</title>");
                printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css">');
                printWindow.document.write("</head><body>");
                printWindow.document.write(content);
                printWindow.document.write("</body></html>");
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
              }} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Print</button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default EmployeeLeave;
