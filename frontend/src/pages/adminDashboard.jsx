import React from 'react';
import { AppContext, useAuth } from '../context/AppContext';
import {
  UserCircle,
  CalendarCheck,
  Building2,
  DollarSign,
  Users,
  Briefcase,
  Clock,
  UserPlus,
  GraduationCap,
  Heart,
  FlaskConical,
  BookOpen
} from 'lucide-react';
import { useContext } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';

const AdminDashboard = () => {
  const { token, user, backendUrl, getAllLeaves, leaves, setLeaves, getAllDepartment, department,
    employees, setEmployees, getAllEmployees } = useContext(AppContext)
  const [totalSalary, setTotalSalary] = useState(0);
  const [latestMonth, setLatestMonth] = useState("");
  const [latestYear, setLatestYear] = useState("");
  const [salaryGroups, setSalaryGroups] = useState([]);
  
  // Employee status counters
  const [employeeStatusCounts, setEmployeeStatusCounts] = useState({
    active: 0,
    inactive: 0,
    permanent: 0,
    locum: 0,
    contract: 0,
    secondment: 0,
    internship: 0,
    siwes: 0,
    voluntary: 0,
    postDoctoral: 0,
    sabbatical: 0,
    sabbaticalLeave: 0
  });

  // Defensive fallback if leaves is undefined
  const pendingLeaves = leaves?.filter(leave => leave.status === "Pending") || [];
  const approvedLeaves = leaves?.filter(leave => leave.status === "Approved") || [];
  const rejectedLeaves = leaves?.filter(leave => leave.status === "Rejected") || [];

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/admin/get-salaries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        const salaryGroups = result.data || [];
        setSalaryGroups(salaryGroups);

        // ✅ Get the latest group (already sorted in backend)
        const latestGroup = salaryGroups[0]; // first one is latest

        if (latestGroup) {
          setTotalSalary(latestGroup.totalAmount || 0);
          setLatestMonth(latestGroup.month);
          setLatestYear(latestGroup.year);
        } else {
          setTotalSalary(0); // fallback if no data
        }
      } catch (error) {
        console.error("Error loading salaries:", error);
      }
    };

    fetchSalaries();
  }, []);

  // Calculate employee status counts (always fetch fresh data to avoid showing only filtered subset)
  useEffect(() => {
    const computeCounts = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/admin/get-all-employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.employees)) {
          const all = data.employees;
          const counts = {
            active: all.filter(emp => emp.status === true).length,
            inactive: all.filter(emp => emp.status === false).length,
            permanent: all.filter(emp => emp.type === 'permanent').length,
            locum: all.filter(emp => emp.type === 'locum').length,
            contract: all.filter(emp => emp.type === 'consultant').length,
            secondment: all.filter(emp => emp.type === 'secondment').length,
            internship: all.filter(emp => emp.type === 'internship').length,
            siwes: all.filter(emp => emp.type === 'siwes').length,
            voluntary: all.filter(emp => emp.type === 'voluntary').length,
            postDoctoral: all.filter(emp => emp.type === 'post-doctoral-fellow').length,
            sabbatical: all.filter(emp => emp.type === 'sabbatical').length,
            sabbaticalLeave: all.filter(emp => emp.type === 'sabbatical leave').length,
          };
          setEmployeeStatusCounts(counts);
        }
      } catch (err) {
        console.error('Error fetching employees for dashboard counts:', err);
      }
    };
    if (token) computeCounts();
  }, [token, backendUrl]);

  // Fetch data on component mount
  useEffect(() => {
    getAllEmployees();
    getAllDepartment();
    getAllLeaves();
  }, [token]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Greeting */}
      <div className="text-center mb-6 sm:mb-10 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
          KIRCT {token && user?.role === 'admin' ? 'ADMIN' : 'EMPLOYEE'} DASHBOARD
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-2">
          Here's your dashboard overview
        </p>
      </div>

      {/* Top Summary Cards */}
      <div className="flex justify-center mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 w-full max-w-6xl">
          <Card
            title="Total Employees"
            value={`${employees?.filter(emp => emp.status === true).length ?? 0} Active`}
            icon={<UserCircle className="text-green-500 w-12 h-12" />}
            bg="bg-green-100"
            textColor="text-green-600"
          />

          <Card
            title="Departments"
            value={`${department?.length ?? 0} Active`}
            icon={<Building2 className="text-blue-500 w-12 h-12" />}
            bg="bg-blue-100"
            textColor="text-blue-600"
          />

          <Card
            title={`${latestMonth} ${latestYear} Payment`}
            value={`₦${totalSalary.toLocaleString()}`}
            icon={<DollarSign className="text-purple-500 w-12 h-12" />}
            bg="bg-purple-100"
            textColor="text-purple-600"
          />

          <Card
            title="Leave Applied"
            value={`${leaves?.length ?? 0} Applied`}
            icon={<CalendarCheck className="text-yellow-500 w-12 h-12" />}
            bg="bg-yellow-100"
            textColor="text-yellow-600"
          />
        </div>
      </div>

      {/* Employee Status Details Section */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-blue-600">Employee Status Details</h2>
        <p className="text-gray-600 text-md">Breakdown by employment type and status</p>
      </div>

      <div className="flex justify-center mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-6xl">
          <StatusCard
            title="Active Employees"
            value={employeeStatusCounts.active}
            icon={<UserCircle className="text-green-500 w-6 h-6" />}
            bg="bg-green-50"
            textColor="text-green-700"
            borderColor="border-green-200"
          />
          
          <StatusCard
            title="Inactive Employees"
            value={employeeStatusCounts.inactive}
            icon={<UserCircle className="text-gray-500 w-6 h-6" />}
            bg="bg-gray-50"
            textColor="text-gray-700"
            borderColor="border-gray-200"
          />
          
          <StatusCard
            title="Permanent"
            value={employeeStatusCounts.permanent}
            icon={<Briefcase className="text-blue-600 w-6 h-6" />}
            bg="bg-blue-50"
            textColor="text-blue-700"
            borderColor="border-blue-200"
          />
          
          <StatusCard
            title="Locum"
            value={employeeStatusCounts.locum}
            icon={<Clock className="text-orange-500 w-6 h-6" />}
            bg="bg-orange-50"
            textColor="text-orange-700"
            borderColor="border-orange-200"
          />
          
          <StatusCard
            title="Contract"
            value={employeeStatusCounts.contract}
            icon={<Briefcase className="text-purple-500 w-6 h-6" />}
            bg="bg-purple-50"
            textColor="text-purple-700"
            borderColor="border-purple-200"
          />
          
          <StatusCard
            title="Secondment"
            value={employeeStatusCounts.secondment}
            icon={<UserPlus className="text-indigo-500 w-6 h-6" />}
            bg="bg-indigo-50"
            textColor="text-indigo-700"
            borderColor="border-indigo-200"
          />
          
          <StatusCard
            title="Internship"
            value={employeeStatusCounts.internship}
            icon={<GraduationCap className="text-teal-500 w-6 h-6" />}
            bg="bg-teal-50"
            textColor="text-teal-700"
            borderColor="border-teal-200"
          />
          
          <StatusCard
            title="SIWES"
            value={employeeStatusCounts.siwes}
            icon={<BookOpen className="text-cyan-500 w-6 h-6" />}
            bg="bg-cyan-50"
            textColor="text-cyan-700"
            borderColor="border-cyan-200"
          />
          
          <StatusCard
            title="Voluntary"
            value={employeeStatusCounts.voluntary}
            icon={<Heart className="text-pink-500 w-6 h-6" />}
            bg="bg-pink-50"
            textColor="text-pink-700"
            borderColor="border-pink-200"
          />
          
          <StatusCard
            title="Post-Doctoral Fellow"
            value={employeeStatusCounts.postDoctoral}
            icon={<FlaskConical className="text-violet-500 w-6 h-6" />}
            bg="bg-violet-50"
            textColor="text-violet-700"
            borderColor="border-violet-200"
          />
          
          <StatusCard
            title="Sabbatical"
            value={employeeStatusCounts.sabbatical}
            icon={<BookOpen className="text-amber-500 w-6 h-6" />}
            bg="bg-amber-50"
            textColor="text-amber-700"
            borderColor="border-amber-200"
          />
          
          <StatusCard
            title="Sabbatical Leave"
            value={employeeStatusCounts.sabbaticalLeave}
            icon={<CalendarCheck className="text-rose-500 w-6 h-6" />}
            bg="bg-rose-50"
            textColor="text-rose-700"
            borderColor="border-rose-200"
          />
        </div>
      </div>

      {/* Leave Section */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-green-500">Leave Details</h2>
        <p className="text-gray-600 text-md">Overview of employee leave statuses</p>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          <SmallCard
            title="Pending Requests"
            value={`${pendingLeaves.length} Pending`}
            icon={<CalendarCheck className="text-orange-500 w-8 h-8" />}
            bg="bg-orange-100"
            textColor="text-orange-600"
          />

          <SmallCard
            title="Approved Leaves"
            value={`${approvedLeaves.length} Approved`}
            icon={<CalendarCheck className="text-green-500 w-8 h-8" />}
            bg="bg-green-100"
            textColor="text-green-600"
          />

          <SmallCard
            title="Rejected Leaves"
            value={`${rejectedLeaves.length} Rejected`}
            icon={<CalendarCheck className="text-red-500 w-8 h-8" />}
            bg="bg-red-100"
            textColor="text-red-600"
          />

          <SmallCard
            title="Total Leaves"
            value={`${leaves?.length ?? 0} All Leaves`}
            icon={<CalendarCheck className="text-indigo-500 w-8 h-8" />}
            bg="bg-indigo-100"
            textColor="text-indigo-600"
          />
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ title, value, icon, bg, textColor, borderColor }) => (
  <div className={`${bg} p-4 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-all duration-200`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-xs font-medium">{title}</p>
        <h3 className={`text-xl font-bold ${textColor}`}>{value}</h3>
      </div>
      <div className={`p-2 rounded-full ${bg}`}>
        {icon}
      </div>
    </div>
  </div>
);

const SmallCard = ({ title, value, icon, bg, textColor }) => (
  <div className={`${bg} p-6 rounded-xl shadow hover:shadow-md transition w-full`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className={`text-xl font-semibold ${textColor}`}>{value}</h2>
      </div>
      {icon}
    </div>
  </div>
);

// Card Component for Reuse
const Card = ({ title, value, icon, bg, textColor }) => (
  <div className={`${bg} p-8 rounded-2xl shadow hover:shadow-lg transition w-full`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className={`text-3xl font-bold ${textColor}`}>{value}</h2>
      </div>
      {icon}
    </div>
  </div>
);

export default AdminDashboard;