

import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  CalendarCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import axios from 'axios';

const hodDashboard = () => {
  const { token, user, backendUrl } = useContext(AppContext);

  const [dashboardData, setDashboardData] = useState({
    profile: null,
    leaves: [],
    latestSalary: null
  });

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/employee-dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (data.success) {
        setDashboardData(data.data);
        console.log("Response:", data.data);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const totalLeaves = dashboardData.leaves.length;


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Greeting */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">
          KIRCT {token && user?.role === 'admin' ? 'Admin' : user?.role === 'HOD' ? 'HOD' : 'EMPLOYEE'} DASHBOARD
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Here's your dashboard overview</p>
      </div>

      {/* Top Summary Cards */}
      <div className="flex justify-center mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 w-full max-w-6xl">

          <Card
            title="Departments"
            value={dashboardData.profile?.department?.name || 'N/A'}
            icon={<Building2 className="text-blue-500 w-12 h-12" />}
            bg="bg-blue-100"
            textColor="text-blue-600"
          />

          <Card
             title={`${dashboardData.latestSalary?.month} ${dashboardData.latestSalary?.year} Payment`}
            value={`₦${dashboardData.latestSalary?.netSalary?.toLocaleString() || '0'}`}
            icon={<DollarSign className="text-purple-500 w-12 h-12" />}
            bg="bg-purple-100"
            textColor="text-purple-600"
          />


          <Card
            title="Leave Applied"
            value={`${totalLeaves} Applied`}
            icon={<CalendarCheck className="text-yellow-500 w-12 h-12" />}
            bg="bg-yellow-100"
            textColor="text-yellow-600"
          />
        </div>
      </div>
    </div>
  );
};

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

export default hodDashboard;
