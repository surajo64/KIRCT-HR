import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { token, user, backendUrl } = useContext(AppContext);

  const [dashboardData, setDashboardData] = useState({
    profile: null,
    leaves: [],
    currentMonthSalary: null,
    attendance: null,
    bonuses: [],
    loans: [],
    kpis: [],
    unreadNotifications: 0,
    relievingLeaves: []
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/employee-dashboard`, {
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

      {/* Relieving Officer Notifications */}
      {dashboardData.relievingLeaves && dashboardData.relievingLeaves.length > 0 && (
        <div className="mb-8 space-y-4">
          {dashboardData.relievingLeaves.map((relieving, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-xl shadow border-l-4 flex items-center justify-between ${
                relieving.resumeStatus 
                  ? "bg-green-50 border-green-500" 
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${
                  relieving.resumeStatus ? "bg-green-100" : "bg-blue-100"
                }`}>
                  <Briefcase className={relieving.resumeStatus ? "text-green-600" : "text-blue-600"} size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800"> Relieving Duty</h4>
                  <p className="text-gray-600">
                    {relieving.resumeStatus 
                      ? `You have covered ${relieving.userId?.name || 'Staff'} for the period ${new Date(relieving.from).toLocaleDateString()} to ${new Date(relieving.to).toLocaleDateString()}.`
                      : `You are to cover for ${relieving.userId?.name || 'Staff'} for the period ${new Date(relieving.from).toLocaleDateString()} to ${new Date(relieving.to).toLocaleDateString()}.`
                    }
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  relieving.resumeStatus ? "bg-green-200 text-green-800" : "bg-blue-200 text-blue-800"
                }`}>
                  {relieving.resumeStatus ? "Completed" : "Active Coverage"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <InfoItem label="Unread Msgs" value={dashboardData.unreadNotifications?.toString() || '0'} />
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
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
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

      {/* Recent Loans */}
      <div className="mt-6 bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Loan Status & Summary</h3>
          <button 
            onClick={() => navigate('/employee-loan')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            View All Loans →
          </button>
        </div>
        {dashboardData.loans?.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.loans.slice(0, 3).map((loanItem, index) => {
              const target = loanItem.status === 'Approved' || loanItem.status === 'Completed'
                ? (loanItem.approvedAmount || loanItem.amount)
                : loanItem.amount;
              const repaid = loanItem.totalRepaid || 0;
              const outstanding = Math.max(0, target - repaid);
              const pct = target > 0 ? Math.min(100, Math.round((repaid / target) * 100)) : 0;

              return (
                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Requested: ₦{loanItem.amount?.toLocaleString()}
                        {loanItem.approvedAmount > 0 && loanItem.status === 'Approved' && (
                          <span className="ml-2 text-emerald-700 font-semibold">(Approved: ₦{loanItem.approvedAmount.toLocaleString()})</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Reason: {loanItem.reason}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      loanItem.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      loanItem.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      loanItem.status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {loanItem.status}
                    </span>
                  </div>

                  {(loanItem.status === 'Approved' || loanItem.status === 'Completed') && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Repaid: <strong className="text-blue-700">₦{repaid.toLocaleString()}</strong></span>
                        <span>Outstanding: <strong className="text-gray-900">₦{outstanding.toLocaleString()}</strong></span>
                        <span>Monthly Ded: <strong className="text-emerald-700">₦{(loanItem.monthDeduction || Math.ceil(target / (loanItem.durationInMonths || 1))).toLocaleString()}</strong></span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${pct >= 100 ? 'bg-blue-600' : 'bg-emerald-600'}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active loans found</p>
        )}
      </div>

      {/* Performance/KPIs */}
      <div className="mt-6 bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Performance (KPIs)</h3>
        {dashboardData.kpis?.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.kpis.slice(0, 3).map((kpi, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{kpi.month} {kpi.year}</p>
                  <p className="text-xs text-gray-500">Score: {kpi.total}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{kpi.grade}</p>
                  <p className="text-xs text-gray-500">{kpi.comments?.substring(0, 30)}...</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No performance records found</p>
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