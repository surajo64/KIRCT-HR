import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Sidebar = () => {
  const { logout, user, token } = useContext(AppContext);

const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const SidebarLink = ({ to, label, icon }) => (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-3 md:px-6 md:min-w-60 rounded-xl cursor-pointer ${isActive ? "bg-gray-200 border-l-4 border-green-500" : ""
          }`
        }
        onClick={() => setSidebarOpen(false)} // auto-close on link click
      >
        <img src={icon} alt={label} className="w-6 h-6 mr-2" />
        <p>{label}</p>
      </NavLink>
    </li>
  );

  return (
     <>
      {/* Toggle Button - visible only on small screens */}
      <div className="md:hidden p-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-700 focus:outline-none"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar Container */}
      <div
        className={`fixed z-50 inset-y-0 left-0 w-64 transform bg-white border-r p-4 transition-transform duration-200 ease-in-out md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar Content */}
        <nav>
          <ul className="space-y-4">
            {token && user?.role === 'admin' && (
              <>
                <SidebarLink to="/admin-dashboard" label="Dashboard" icon={assets.Home} />
                <SidebarLink to="/employee" label="Employee" icon={assets.Emplyees} />
                <SidebarLink to="/department" label="Department" icon={assets.Department} />
                <SidebarLink to="/account" label="Account" icon={assets.Salary} />
                <SidebarLink to="/payroll" label="Payroll" icon={assets.Salary} />
                <SidebarLink to="/leave" label="Leave" icon={assets.Leave} />
                <SidebarLink to="/loan" label="Loan" icon={assets.Salary} />
                <SidebarLink to="/salary" label="Salary" icon={assets.Salary} />
                <SidebarLink to="/attendence" label="Attendance" icon={assets.Attend} />
                <SidebarLink to="/admin-evaluation" label="Performance" icon={assets.Evaluation} />
                <SidebarLink to="/messages" label="Message" icon={assets.Department} />
                <SidebarLink to="/setting" label="Setting" icon={assets.Setting} />
              </>
            )}

            {token && user?.role === "employee" && (
              <>
                <SidebarLink to="/employee-dashboard" label="Dashboard" icon={assets.Home} />
                <SidebarLink to="/profile" label="My Profile" icon={assets.Emplyees} />
                <SidebarLink to="/messages" label="Message" icon={assets.Department} />
                <SidebarLink to="/employee-leave" label="Leave" icon={assets.Leave} />
                <SidebarLink to="/employee-loan" label="Loan" icon={assets.Salary} />
                <SidebarLink to="/employee-salary" label="Salary" icon={assets.Salary} />
                <SidebarLink to="/employee-kpi" label="KPI" icon={assets.Evaluation} />
                <SidebarLink to="/setting" label="Change Password" icon={assets.Setting} />
               
              </>
            )}

            {token && user?.role === "HOD" && (
              <>
                <SidebarLink to="/hod-dashboard" label="Dashboard" icon={assets.Home} />
                <SidebarLink to="/profile" label="My Profile" icon={assets.Emplyees} />
                 <SidebarLink to="/messages" label="Message" icon={assets.Department} />
                <SidebarLink to="/hod-leave" label="Leave" icon={assets.Leave} />
                <SidebarLink to="/employee-loan" label="Loan" icon={assets.Salary} />
                <SidebarLink to="/employee-salary" label="Salary" icon={assets.Salary} />
                <SidebarLink to="/attendence" label="Attendance" icon={assets.Attend} />
                <SidebarLink to="/evaluation" label="Performance" icon={assets.Evaluation} />
                <SidebarLink to="/setting" label="Change Password" icon={assets.Setting} />
              </>
            )}



          </ul>
        </nav>
      </div>

      {/* Overlay for small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};
export default Sidebar;
