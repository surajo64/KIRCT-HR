import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  CalendarCheck,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MessageCircle,
  Award,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';

const HodDashboard = () => {
  const { token, user, backendUrl } = useContext(AppContext);

  const [dashboardData, setDashboardData] = useState({
    profile: null,
    leaves: [],
    latestSalary: null,
    departmentStats: null,
    pendingRequests: null,
    recentMessages: [],
    performance: null
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/hod-dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (data.success) {
        setDashboardData(data.data);
        console.log("Dashboard Response:", data.data);
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

  // Calculate statistics
  const totalLeaves = dashboardData.leaves?.length || 0;
  const pendingLeaves = dashboardData.leaves?.filter(l => l.status === 'pending').length || 0;
  const approvedLeaves = dashboardData.leaves?.filter(l => l.status === 'approved').length || 0;
  const rejectedLeaves = dashboardData.leaves?.filter(l => l.status === 'rejected').length || 0;

  const departmentEmployees = dashboardData.departmentStats?.totalEmployees || 0;
  const onLeaveToday = dashboardData.departmentStats?.onLeaveToday || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome Back: {dashboardData.profile?.name || 'Surajo Umar Danja'}
        </h1>
        <p className="text-gray-600 mt-2">KIRCT HOD DASHBOARD - Here's your dashboard overview</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Departments"
          value={dashboardData.profile?.department?.name || 'IT Department'}
          icon={<Building2 className="text-blue-600" size={28} />}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
        
        <MetricCard
          title={`${dashboardData.latestSalary?.month || 'Current'} Payment`}
          value={`₦${dashboardData.latestSalary?.netSalary?.toLocaleString() || '0'}`}
          subtitle="Net Salary"
          icon={<DollarSign className="text-purple-600" size={28} />}
          bgColor="bg-purple-50"
          textColor="text-purple-700"
        />
        
        <MetricCard
          title="Leave Applied"
          value={totalLeaves}
          subtitle="Total applications"
          icon={<CalendarCheck className="text-yellow-600" size={28} />}
          bgColor="bg-yellow-50"
          textColor="text-yellow-700"
        />
        
        <MetricCard
          title="Team Members"
          value={departmentEmployees}
          subtitle={`${onLeaveToday} on leave today`}
          icon={<Users className="text-green-600" size={28} />}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
      </div>

      {/* Second Row - Leave Statistics and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Leave Statistics */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <StatBox
              label="Pending"
              value={pendingLeaves}
              icon={<Clock size={24} />}
              color="text-yellow-600"
              bgColor="bg-yellow-100"
            />
            <StatBox
              label="Approved"
              value={approvedLeaves}
              icon={<CheckCircle size={24} />}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatBox
              label="Rejected"
              value={rejectedLeaves}
              icon={<XCircle size={24} />}
              color="text-red-600"
              bgColor="bg-red-100"
            />
          </div>
          
          {/* Leave Balance */}
          {dashboardData.profile?.leaveBalance && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Leave Balance</h4>
              <div className="grid grid-cols-3 gap-3">
                <BalanceItem label="Annual" days={dashboardData.profile.leaveBalance.annual || 0} />
                <BalanceItem label="Sick" days={dashboardData.profile.leaveBalance.sick || 0} />
                <BalanceItem label="Casual" days={dashboardData.profile.leaveBalance.casual || 0} />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <QuickActionButton 
              label="Pending Approvals" 
              count={pendingLeaves}
              icon={<Clock size={18} />}
              color="yellow"
            />
            <QuickActionButton 
              label="New Messages" 
              count={dashboardData.recentMessages?.length || 0}
              icon={<MessageCircle size={18} />}
              color="blue"
            />
            <QuickActionButton 
              label="Loan Requests" 
              count={dashboardData.pendingRequests?.loans || 0}
              icon={<DollarSign size={18} />}
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Leave Requests</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
          </div>
          <div className="space-y-3">
            {dashboardData.leaves?.slice(0, 3).map((leave, index) => (
              <ActivityItem
                key={index}
                title={leave.reason || 'Leave Request'}
                subtitle={`${leave.startDate} - ${leave.endDate}`}
                status={leave.status}
              />
            ))}
            {(!dashboardData.leaves || dashboardData.leaves.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recent leave requests</p>
            )}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Overview</h3>
          {dashboardData.performance ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Overall Rating</span>
                  <span className="font-semibold">{dashboardData.performance.rating}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 rounded-full h-2" 
                    style={{ width: `${(dashboardData.performance.rating / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <PerformanceMetric 
                  label="Projects Completed" 
                  value={dashboardData.performance.projectsCompleted || 0} 
                />
                <PerformanceMetric 
                  label="Tasks Completed" 
                  value={dashboardData.performance.tasksCompleted || 0} 
                />
                <PerformanceMetric 
                  label="Attendance" 
                  value={`${dashboardData.performance.attendance || 0}%`} 
                />
                <PerformanceMetric 
                  label="Team Rating" 
                  value={`${dashboardData.performance.teamRating || 0}/5`} 
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No performance data available</p>
          )}
        </div>
      </div>

      {/* Department Overview Section */}
      <div className="mt-8 bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DepartmentMetric 
            label="Total Employees"
            value={dashboardData.departmentStats?.totalEmployees || 0}
            icon={<Users className="text-blue-600" size={24} />}
          />
          <DepartmentMetric 
            label="Present Today"
            value={(dashboardData.departmentStats?.totalEmployees || 0) - onLeaveToday}
            icon={<CheckCircle className="text-green-600" size={24} />}
          />
          <DepartmentMetric 
            label="On Leave"
            value={onLeaveToday}
            icon={<CalendarCheck className="text-orange-600" size={24} />}
          />
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon, bgColor, textColor }) => (
  <div className={`${bgColor} p-6 rounded-2xl shadow hover:shadow-lg transition`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${textColor}`}>{value}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full ${bgColor}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Stat Box Component
const StatBox = ({ label, value, icon, color, bgColor }) => (
  <div className={`${bgColor} p-4 rounded-xl text-center`}>
    <div className={`${color} flex justify-center mb-2`}>{icon}</div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
  </div>
);

// Balance Item Component
const BalanceItem = ({ label, days }) => (
  <div className="text-center">
    <p className="text-lg font-semibold text-gray-800">{days}</p>
    <p className="text-xs text-gray-600">{label} Days</p>
  </div>
);

// Quick Action Button Component
const QuickActionButton = ({ label, count, icon, color }) => {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100'
  };
  
  return (
    <button className={`w-full flex items-center justify-between px-4 py-3 rounded-lg ${colors[color]} transition`}>
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {count > 0 && (
        <span className="bg-white px-2 py-1 rounded-full text-sm font-semibold">
          {count}
        </span>
      )}
    </button>
  );
};

// Activity Item Component
const ActivityItem = ({ title, subtitle, status }) => {
  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-100',
    approved: 'text-green-600 bg-green-100',
    rejected: 'text-red-600 bg-red-100'
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    </div>
  );
};

// Performance Metric Component
const PerformanceMetric = ({ label, value }) => (
  <div className="bg-gray-50 p-3 rounded-lg">
    <p className="text-xs text-gray-600">{label}</p>
    <p className="text-lg font-semibold text-gray-800">{value}</p>
  </div>
);

// Department Metric Component
const DepartmentMetric = ({ label, value, icon }) => (
  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
    <div className="p-2 bg-white rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default HodDashboard;