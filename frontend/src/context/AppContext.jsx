import React, { createContext, useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import axios from 'axios'
// Create the context
export const AppContext = createContext();

// Provider component
const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [kpi, setKpi] = useState(null);
   const [messages, setMessages] = useState([]);
   const [emplMessages, setEmplMessages] = useState([]);
    const [departmentKpi, setDepartmentKpi] = useState(null);
  const [salaryGroups, setSalaryGroups] = useState([]);
  const [hodLeaves, setHodLeaves] = useState(null);
  const [department, setDepartment] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [evaluations, setEvaluations] = useState(null);
  const [employeeLeaves, setEmployeeLeaves] = useState(null)
   const [sameDeptEmployees, setSameDeptEmployees] = useState([]);
   const [leaveBalanceInfo, setLeaveBalanceInfo] = useState({
       initialLeaveDays: 0,
       leaveBalance: 0,
       usedLeaveDays: 0,
       pendingLeavesCount: 0
     });

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // get all Patient list
  const getAllDepartment = async () => {

    try {

      const { data } = await axios.get(backendUrl + '/api/admin/department-list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
      );
      if (data.success) {
        setDepartment(data.department)


      } else {
        toast.error("Failed to fetch Employee.")
      }

    } catch (error) {
      toast.error(error.message)
    }

  }

  
  // get all Patient list
  const getAllEmployees = async () => {

      try {

    const { data } = await axios.get(backendUrl + '/api/admin/get-all-employees', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
    );
    if (data.success) {
      
      setEmployees(data.employees)
      console.log("API Response for Employess",data.employees)

    } else {
      toast.error("Failed to fetch Employee.")
    }

     } catch (error) {
          toast.error(error.message)
        }

  }

  // get all Patient list
  const getAllLeaves = async () => {

    try {

      const { data } = await axios.get(backendUrl + '/api/admin/leave-list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
      );
      if (data.success) {
        setLeaves(data.leaves)
        console.log("API Response for Leaves",data.leaves)

      } else {
        toast.error("Failed to fetch Leaves.")
      }

    } catch (error) {
      console.log(error.message)
     
    }

  }


  const fetchLeaves = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/employee-leave`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setLeaves(data.leaves);
        console.log("employee leaves:", data.leaves)
         // Update leave balance info
        
        return data.leaves || [];
        
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to load leave history");
    }
  };



const fetchHodLeaves = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/hod-leave`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setHodLeaves(data.hodLeaves);
        console.log("employee leaves:", data.hodLeaves)
      } else {
        toast.error(data.message);
      }
   } catch (error) {
      toast.error("Failed to load leave history");
    }
  };

  // get all Patient list
  const getAllEvaluations = async () => {

    try {

      const { data } = await axios.get(backendUrl + '/api/admin/evaluation-list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
      );
      if (data.success) {
        setEvaluations(data.results)
        console.log("API Response for Evaluations",data.results)

      } else {
        toast.error("Failed to fetch Leaves.")
      }

    } catch (error) {
      console.log(error.message)
     
    }

  }

  
  const fetchKpi = async () => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/admin/get-kpi`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data.success) {
      setKpi(data.records); // <-- FIXED
      console.log("response:", data.records);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error("Failed to load KPI records");
  }
};


const fetchDepartmentKpi = async () => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/admin/get-departmentkpi`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data.success) {
      setDepartmentKpi(data.departmentKpi);
      console.log("Response:",data.departmentKpi)
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error("Failed to load KPI records");
  }
};

// API o fetch Messages
const fetchMessages = async () => {
      try {
   
          const {data} = await axios.get(backendUrl+"/api/auth/get-all-message", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data.success) {
            setMessages(data.messages);
          }
          

      } catch (err) {
        console.error("Error fetching messages:", err);
      }

    }

    // API o fetch Messages
const fetchEmployeeMessage = async () => {
      try {
   
          const {data} = await axios.get(backendUrl+"/api/auth/get-message", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data.success) {
            setEmplMessages(data.emplMessages);
          }
          

      } catch (err) {
        console.error("Error fetching messages:", err);
      }

    }

  const value = {
    backendUrl,fetchKpi, kpi,setKpi,
    token,fetchHodLeaves,hodLeaves,
    setToken,getAllEvaluations,evaluations,
    user, getAllLeaves,setEvaluations,fetchEmployeeMessage,emplMessages,setEmplMessages,
    login,salaryGroups, setSalaryGroups,
    logout, employeeLeaves, setEmployeeLeaves, fetchLeaves,
    setUser, leaves, setLeaves,fetchMessages,
    getAllDepartment,fetchDepartmentKpi,setDepartmentKpi,departmentKpi,
    setDepartment, department,messages,setMessages,
    employees, setEmployees, getAllEmployees,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAuth = () => useContext(AppContext);

export default AppContextProvider;
