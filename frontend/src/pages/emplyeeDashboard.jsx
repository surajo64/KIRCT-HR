import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  CalendarCheck,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Briefcase,
  Gift,
  MessageCircle,
  Key,
  TrendingUp,
  Award
} from 'lucide-react';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { token, user, backendUrl } = useContext(AppContext);

  const [dashboardData, setDashboardData] = useState({
    profile: null,
    leaves: [],
    currentMonthSalary: null,
    attendance: null,
    bonuses: []
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/employee/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (data.success) {
        setDashboardData(data.data);
        console.log("Employee Dashboard Response:", data.data);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const totalLeaves = dashboardData.leaves?.length || 0;
  const pendingLeaves = dashboardData.leaves?.filter(l => l.status === 'pending').length || 0;
  const approvedLeaves = dashboardData.leaves?.filter(l => l.status === 'approved').length || 0;
  const rejectedLeaves = dashboardData.leaves?.filter(l => l.status === 'rejected').length || 0;
  const totalBonuses = dashboardData.bonuses?.length || 0;
  const attendancePercentage = dashboardData.attendance?.percentage || 0;

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-100 min-h-screen p-4 md:p-6">

      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome Back: {dashboardData.profile?.name || 'Umar Bashir Sani'}
        </h2>
        <p className="text-gray-600 mt-1">KIRCT EMPLOYEE DASHBOARD - Welcome back, Employee!</p>
      </div>

      {/* Top Summary Cards - Exactly like HOD dashboard: 4 cards in a row */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            title="Department"
            value={dashboardData.profile?.department?.name || 'N/A'}
            bg="bg-blue-100"
            textColor="text-blue-600"
          />

          <Card
            title="Current Salary"
            value={`₦${dashboardData.currentMonthSalary?.netSalary?.toLocaleString() || '0'}`}
            bg="bg-purple-100"
            textColor="text-purple-600"
          />

          <Card
            title="Leave Applied"
            value={`${totalLeaves} Applied`}
            bg="bg-yellow-100"
            textColor="text-yellow-600"
          />

          <Card
            title="Attendance"
            value={`${attendancePercentage}%`}
            bg="bg-green-100"
            textColor="text-green-600"
          />
        </div>
      </div>

      {/* Two Column Layout - Leave Statistics and Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Statistics */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <StatBox
              label="Pending"
              value={pendingLeaves}
              bgColor="bg-yellow-100"
              textColor="text-yellow-600"
            />
            <StatBox
              label="Approved"
              value={approvedLeaves}
              bgColor="bg-green-100"
              textColor="text-green-600"
            />
            <StatBox
              label="Rejected"
              value={rejectedLeaves}
              bgColor="bg-red-100"
              textColor="text-red-600"
            />
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Employee ID" value={dashboardData.profile?.staffId || 'N/A'} />
            <InfoItem label="Position" value={dashboardData.profile?.designation || 'N/A'} />
            <InfoItem label="Join Date" value={dashboardData.profile?.joinDate || 'N/A'} />
            <InfoItem label="Total Bonuses" value={totalBonuses.toString()} />
          </div>
        </div>
      </div>

      {/* Leave Balance Section (if available) */}
      {dashboardData.profile?.leaveBalance && (
        <div className="mt-6 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Balance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BalanceItem label="Annual" days={dashboardData.profile.leaveBalance.annual || 0} />
            <BalanceItem label="Sick" days={dashboardData.profile.leaveBalance.sick || 0} />
            <BalanceItem label="Casual" days={dashboardData.profile.leaveBalance.casual || 0} />
          </div>
        </div>
      )}

      {/* Recent Leave Requests */}
      <div className="mt-6 bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Leave Requests</h3>
        {dashboardData.leaves?.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.leaves.slice(0, 3).map((leave, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{leave.type || 'Leave'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                  leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No leave requests found</p>
        )}
      </div>

      {/* Recent Bonuses */}
      <div className="mt-6 bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Bonuses</h3>
        {dashboardData.bonuses?.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.bonuses.slice(0, 3).map((bonus, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{bonus.name || bonus.type}</p>
                  <p className="text-xs text-gray-500">Year: {bonus.year}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  bonus.status === 'paid' ? 'bg-green-100 text-green-800' :
                  bonus.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {bonus.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No bonuses found</p>
        )}
      </div>

      {/* Performance Overview */}
      <div className="mt-6 bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{attendancePercentage}%</p>
            <p className="text-sm text-gray-600">Attendance Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{approvedLeaves}</p>
            <p className="text-sm text-gray-600">Approved Leaves</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{totalBonuses}</p>
            <p className="text-sm text-gray-600">Total Bonuses</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Card Component - Exactly like HOD dashboard
const Card = ({ title, value, bg, textColor }) => (
  <div className={`${bg} p-6 rounded-2xl shadow hover:shadow-lg transition w-full`}>
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <h2 className={`text-2xl font-bold ${textColor}`}>{value}</h2>
    </div>
  </div>
);

// Navigation Link Component
const NavLink = ({ icon, label }) => (
  <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
    {icon}
    <span>{label}</span>
  </button>
);

// Stat Box Component
const StatBox = ({ label, value, bgColor, textColor }) => (
  <div className={`${bgColor} p-4 rounded-xl text-center`}>
    <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    <p className="text-sm text-gray-600 mt-1">{label}</p>
  </div>
);

// Info Item Component
const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-800 mt-1">{value}</p>
  </div>
);

// Balance Item Component
const BalanceItem = ({ label, days }) => (
  <div className="text-center">
    <p className="text-xl font-bold text-gray-800">{days}</p>
    <p className="text-xs text-gray-600">{label}</p>
  </div>
);

export default EmployeeDashboard;