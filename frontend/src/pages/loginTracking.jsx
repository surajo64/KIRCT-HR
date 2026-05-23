import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Calendar, Users, Eye, EyeOff, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingOverlay from '../components/loadingOverlay.jsx';

const LoginTracking = () => {
  const { token, backendUrl } = useContext(AppContext);
  const [loginLogs, setLoginLogs] = useState([]);
  const [frequency, setFrequency] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('logs'); // logs or frequency
  const [viewMode, setViewMode] = useState('table'); // table or stats
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch login logs
  const fetchLoginLogs = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      let url = `${backendUrl}/api/admin/login-logs?page=${pageNum}&limit=${itemsPerPage}`;
      
      if (selectedUser) url += `&userId=${selectedUser}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (data.success) {
        setLoginLogs(data.data);
        setTotalPages(data.pages);
        setPage(data.currentPage);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching login logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch login frequency
  const fetchLoginFrequency = async () => {
    setIsLoading(true);
    try {
      let url = `${backendUrl}/api/admin/login-frequency`;
      
      if (startDate) url += `?startDate=${startDate}`;
      if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;
      
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (data.success) {
        setFrequency(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching login frequency');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch active users
  const fetchActiveUsers = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/active-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (data.success) {
        setActiveUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActiveUsers();
  }, []);

  // Fetch data when tab changes or filters change
  useEffect(() => {
    if (selectedTab === 'logs') {
      fetchLoginLogs(1);
    } else {
      fetchLoginFrequency();
    }
  }, [selectedTab, selectedUser, startDate, endDate]);

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate session duration in hours
  const formatDuration = (seconds) => {
    if (!seconds) return 'Active';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Export data to CSV
  const exportToCSV = () => {
    const data = selectedTab === 'logs' ? loginLogs : frequency;
    if (data.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = selectedTab === 'logs'
      ? ['User Name', 'Email', 'Role', 'Login Time', 'IP Address', 'User Agent']
      : ['User Name', 'Email', 'Role', 'Login Count', 'Last Login', 'First Login'];

    const rows = data.map(item => selectedTab === 'logs'
      ? [
        item.userId?.name || item.userName,
        item.userId?.email || item.email,
        item.userId?.role || item.role,
        formatDateTime(item.loginTime),
        item.ipAddress,
        item.userAgent
      ]
      : [
        item.userName,
        item.email,
        item.role,
        item.loginCount,
        formatDateTime(item.lastLogin),
        formatDateTime(item.firstLogin)
      ]
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-${selectedTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
   
      {isLoading && <LoadingOverlay />}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">LOGIN TRACKING</h1>
          <p className="text-gray-600">Monitor user login activity and frequency</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-green-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User</label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 bg-white"
              >
                <option value="">All Users</option>
                {activeUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setSelectedTab('logs');
              setPage(1);
            }}
            className={`px-6 py-3 font-semibold rounded-lg transition duration-200 ${
              selectedTab === 'logs'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-b-2 border-gray-200'
            }`}
          >
            Login Logs
          </button>
          <button
            onClick={() => {
              setSelectedTab('frequency');
            }}
            className={`px-6 py-3 font-semibold rounded-lg transition duration-200 ${
              selectedTab === 'frequency'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-b-2 border-gray-200'
            }`}
          >
            Login Frequency
          </button>
        </div>

        {/* Content */}
        {selectedTab === 'logs' ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-green-500">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">#</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">User</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">Role</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">Login Time</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loginLogs.length > 0 ? (
                    loginLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-green-50 transition duration-150">
                        <td className="px-6 py-4 font-semibold text-gray-900">{(page - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{log.userId?.name || log.userName}</td>
                        <td className="px-6 py-4 text-gray-600">{log.userId?.email || log.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            {log.userId?.role || log.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{formatDateTime(log.loginTime)}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm font-mono">{log.ipAddress || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No login records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 bg-green-50 border-t-2 border-green-200">
                <button
                  onClick={() => fetchLoginLogs(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50 hover:bg-green-600"
                >
                  Previous
                </button>
                <span className="text-gray-600 font-semibold">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchLoginLogs(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50 hover:bg-green-600"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          // Frequency Table
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-emerald-500">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">#</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">User</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">Role</th>
                    <th className="px-6 py-3 text-center font-semibold text-green-900">Login Count</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">Last Login</th>
                    <th className="px-6 py-3 text-left font-semibold text-green-900">First Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {frequency.length > 0 ? (
                    frequency.map((item, index) => (
                      <tr key={index} className="hover:bg-emerald-50 transition duration-150">
                        <td className="px-6 py-4 font-semibold text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.userName}</td>
                        <td className="px-6 py-4 text-gray-600">{item.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            {item.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold text-lg">
                            {item.loginCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{formatDateTime(item.lastLogin)}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{formatDateTime(item.firstLogin)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No frequency data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginTracking;
