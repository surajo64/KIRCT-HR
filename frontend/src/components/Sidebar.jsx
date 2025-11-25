import React, { useContext, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";

const Sidebar = () => {
  const { logout, user, token } = useContext(AppContext);
  const [openPayrollMenu, setOpenPayrollMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Check if payroll menu should be open based on current route
  const isPayrollActive = location.pathname.includes("/payroll") ||
    location.pathname.includes("/13-Months") ||
    location.pathname.includes("/other-Months");

  const SidebarLink = ({ to, label, icon, isSubmenu = false }) => (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 py-3.5 px-4 rounded-xl cursor-pointer transition-all duration-200 group
          ${isActive
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-700 font-semibold shadow-sm"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-l-4 hover:border-gray-300"
          }
          ${isSubmenu ? "ml-2 text-sm" : ""}`
        }
        onClick={closeSidebar}
      >
        <img
          src={icon}
          alt={label}
          className={`transition-transform duration-200 group-hover:scale-110 ${isSubmenu ? "w-4 h-4" : "w-5 h-5"
            }`}
        />
        <span className={`${isSubmenu ? "text-sm" : ""}`}>{label}</span>
      </NavLink>
    </li>
  );

  const SidebarSection = ({ title, children }) => (
    <div className="mb-6">
      {title && (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
          {title}
        </h3>
      )}
      <ul className="space-y-1">{children}</ul>
    </div>
  );

  return (
    <>
      {/* Mobile Header with Toggle Button */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {user?.role === "admin" ? "Admin Panel" :
              user?.role === "employee" ? "Employee Portal" :
                user?.role === "HOD" ? "HOD Dashboard" : "Dashboard"}
          </h1>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Container */}
      <div
        className={`fixed z-50 inset-y-0 left-0 w-72 bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:shadow-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >


        {/* Navigation Content */}
        <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
          <nav>
            {token && user?.role === "admin" && (
              <>
                <SidebarSection title="Main">
                  <SidebarLink to="/admin-dashboard" label="Dashboard" icon={assets.Home} />
                </SidebarSection>

                <SidebarSection title="Management">
                  <SidebarLink to="/employee" label="Employees" icon={assets.Emplyees} />
                  <SidebarLink to="/department" label="Departments" icon={assets.Department} />
                  <SidebarLink to="/leave" label="Leave Management" icon={assets.Leave} />
                  <SidebarLink to="/attendence" label="Attendance" icon={assets.Attend} />
                </SidebarSection>

                <SidebarSection title="Finance">
                  <SidebarLink to="/loan" label="Loans" icon={assets.Salary} />
                  <SidebarLink to="/salary" label="Salaries" icon={assets.Salary} />

                  {/* Payroll & Bonus Dropdown */}
                  <li className="relative">
                    <button
                      onClick={() => setOpenPayrollMenu(!openPayrollMenu)}
                      onMouseEnter={() => setOpenPayrollMenu(true)}
                      className={`flex items-center justify-between w-full px-4 py-3.5 text-left rounded-xl cursor-pointer transition-all duration-200 group
                        ${isPayrollActive || openPayrollMenu
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-l-4 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={assets.Salary}
                          alt="Payroll"
                          className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                        />
                        <span>Payroll & Bonus</span>
                      </div>
                      {openPayrollMenu || isPayrollActive ? (
                        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                      )}
                    </button>

                    {/* Dropdown Content */}
                    {(openPayrollMenu || isPayrollActive) && (
                      <ul className="ml-6 mt-1 flex flex-col space-y-1 border-l-2 border-gray-100 pl-4 transition-all duration-300">
                        <SidebarLink to="/payroll" label="Monthly Payroll" icon={assets.Salary} isSubmenu={true} />
                        <SidebarLink to="/13-Months" label="13th Month Payroll" icon={assets.Salary} isSubmenu={true} />
                        <SidebarLink to="/other-Months" label="Leave Allowance" icon={assets.Salary} isSubmenu={true} />
                      </ul>
                    )}
                  </li>
                </SidebarSection>

                <SidebarSection title="Performance">
                  <SidebarLink to="/admin-evaluation" label="Performance Reviews" icon={assets.Evaluation} />
                </SidebarSection>

                <SidebarSection title="Communication">
                  <SidebarLink to="/messages" label="Messages" icon={assets.Department} />
                </SidebarSection>

                <SidebarSection title="Settings">
                  <SidebarLink to="/setting" label="Settings" icon={assets.Setting} />
                </SidebarSection>
              </>
            )}



            {/* HOD Sidebar */}
            {token && user?.role === "HOD" && (
              <>
                <SidebarSection>
                  <SidebarLink to="/hod-dashboard" label="Dashboard" icon={assets.Home} />
                  <SidebarLink to="/profile" label="My Profile" icon={assets.Emplyees} />
                  <SidebarLink to="/employee-leave" label="Leave Requests" icon={assets.Leave} />
                  <SidebarLink to="/hod-leave" label="Leave Approval" icon={assets.Leave} />
                  <SidebarLink to="/employee-loan" label="Loan Requests" icon={assets.Salary} />
                  <SidebarLink to="/employee-salary" label="Salary Overview" icon={assets.Salary} />
                  <SidebarLink to="/employee-bonus" label="Bonus Overview" icon={assets.Salary} />
                  <SidebarLink to="/evaluation" label="Performance" icon={assets.Evaluation} />
                  <SidebarLink to="/messages" label="Messages" icon={assets.Department} />
                  <SidebarLink to="/setting" label="Change Password" icon={assets.Setting} />
                </SidebarSection>
              </>
            )}

            {/* HR Employee Sidebar */}
            {token && user?.role === "HREmployee" && (
              <>
                <SidebarSection>
                  
                  <SidebarLink to="/employee-dashboard" label="Dashboard" icon={assets.Home} />
                  <SidebarLink to="/profile" label="My Profile" icon={assets.Emplyees} />
                  <SidebarLink to="/employee" label="Employees" icon={assets.Emplyees} />
                  <SidebarLink to="/department" label="Departments" icon={assets.Department} />
                  <SidebarLink to="/attendence" label="Attendance" icon={assets.Attend} />
                  <SidebarLink to="/employee-leave" label="Leave Requests" icon={assets.Leave} />
                  <SidebarLink to="/employee-loan" label="Loan Applications" icon={assets.Salary} />
                  <SidebarLink to="/employee-salary" label="Salary Overview" icon={assets.Salary} />
                  <SidebarLink to="/employee-bonus" label="Bonus Overview" icon={assets.Salary} />
                  <SidebarLink to="/employee-kpi" label="My KPI" icon={assets.Evaluation} />
                  <SidebarLink to="/messages" label="Messages" icon={assets.Department} />
                  <SidebarLink to="/setting" label="Change Password" icon={assets.Setting} />
                </SidebarSection>
              </>
            )}

            {/* Employee Sidebar */}
            {token && user?.role === "employee" && (
              <>
                <SidebarSection>
                  <SidebarLink to="/employee-dashboard" label="Dashboard" icon={assets.Home} />
                  <SidebarLink to="/profile" label="My Profile" icon={assets.Emplyees} />
                  <SidebarLink to="/employee-leave" label="Leave Requests" icon={assets.Leave} />
                  <SidebarLink to="/employee-loan" label="Loan Applications" icon={assets.Salary} />
                  <SidebarLink to="/employee-salary" label="Salary Overview" icon={assets.Salary} />
                  <SidebarLink to="/employee-bonus" label="Bonus Overview" icon={assets.Salary} />
                  <SidebarLink to="/employee-kpi" label="My KPI" icon={assets.Evaluation} />
                  <SidebarLink to="/messages" label="Messages" icon={assets.Department} />
                  <SidebarLink to="/setting" label="Change Password" icon={assets.Setting} />
                </SidebarSection>
              </>
            )}

          </nav>

          {/* Logout Button */}
          {token && (
            <div className="mt-auto pt-6 border-t border-gray-200">
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:border-red-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;