import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from "react-toastify";

import LoadingOverlay from '../components/loadingOverlay.jsx';

const employeeProfile = () => {
  const { token, user, backendUrl, department } = useContext(AppContext);

  const [dashboardData, setDashboardData] = useState({
    profile: null,
    leaves: [],
    currentMonthSalary: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [selectedCVFile, setSelectedCVFile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffId, setStaffId] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [type, setType] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [state, setState] = useState("");
   const [basicSalary, setBasicSalary] = useState('');
   const [taxIdentificationNumber, setTaxIdentificationNumber] = useState('');
   const [overtimeRate, setOvertimeRate] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
     const [accountName, setAccountName] = useState('');
      const [bankName, setBankName] = useState('');
  
  const states = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate CV file
    if (
      selectedImageFile &&
      selectedImageFile.type &&
      !['image/jpeg', 'image/png', 'image/jpg'].includes(selectedImageFile.type)
    ) {
      toast.error("Profile image must be JPG, JPEG, or PNG format.");
      setIsLoading(false);
      return;
    }

    const normalizedId = staffId.trim().toUpperCase();
    setStaffId(normalizedId);

    const staffIdPattern = /^KIRCT\d{3}$/;
    if (!staffIdPattern.test(normalizedId)) {
      toast.error("Staff ID must be in the format KIRCT followed by 3 digits (e.g., KIRCT001)");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('staffId', staffId);
    formData.append('dob', dob);
    formData.append('joinDate', joinDate);
    formData.append('gender', gender);
    formData.append('maritalStatus', maritalStatus);
    formData.append('department', selectedDepartment);
    formData.append('designation', designation);
    formData.append('salary', salary);
    formData.append('password', password);
    formData.append('role', role);
    formData.append('address', address);
    formData.append('phone', phone);
    formData.append('state', state);
    formData.append('type', type);
    formData.append('qualification', qualification);
    formData.append('experience', experience);
    formData.append("cv", selectedCVFile);
    formData.append("image", selectedImageFile);

    try {
      if (!editingAdmin || !editingAdmin._id) {
        toast.error("No employee selected for update.");
        setIsLoading(false);
        return;
      }

      formData.append("employeeId", editingAdmin._id);

      const { data } = await axios.post(
        backendUrl + '/api/admin/update-employee',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast.success("Employee updated successfully!");
        // Reset form
        setName(""); setEmail(""); setStaffId(""); setDob(""); setGender("");
        setMaritalStatus(""); setSelectedDepartment(""); setDesignation("");
        setSalary(""); setPassword(""); setRole(""); setAddress(""); setPhone("");
        setSelectedImageFile(null); setState(""); setQualification(""); setExperience("");
        setSelectedCVFile(""); setJoinDate("");
        setShowForm(false);
        fetchDashboardData();
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.error('Employee Update failed', error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };


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




  const handleClose = () => {
    setIsLoading(true);

    setTimeout(() => {
      setShowForm(false)
      fetchDashboardData();
      // Reset form
      setName(""); setEmail(""); setStaffId(""); setDob(""); setGender("");
      setMaritalStatus(""); setSelectedDepartment(""); setDesignation("");
      setSalary(""); setPassword(""); setRole(""); setAddress(""); setPhone("");
      setSelectedImageFile(null); setState(""); setQualification(""); setExperience("");
      setSelectedCVFile(""); setSelectedImageFile(""); setJoinDate("");
      setShowForm(false); setType(""),
        fetchDashboardData();
      setIsLoading(false);
    }, 300);
  }

  const handleUpdate = (employee) => {
  setIsLoading(true);

  setTimeout(() => {
    setEditingAdmin(employee);

    // 🧑‍💼 Basic user info
    setName(employee.userId?.name || "");
    setEmail(employee.userId?.email || "");
    setStaffId(employee.staffId || "");
    setRole(employee.userId?.role || "");
    setType(employee.type || "");

    // 📅 Dates
    const formattedJoinDate = employee.joinDate
      ? new Date(employee.joinDate).toISOString().split("T")[0]
      : "";
    const formattedDob = employee.dob
      ? new Date(employee.dob).toISOString().split("T")[0]
      : "";
    setJoinDate(formattedJoinDate);
    setDob(formattedDob);

    // 👩‍💼 Personal info
    setGender(employee.gender || "");
    setMaritalStatus(employee.maritalStatus || "");
    setState(employee.state || "");
    setAddress(employee.address || "");
    setPhone(employee.phone || "");
    setQualification(employee.qualification || "");
    setExperience(employee.experience || "");

    // 🏢 Work info
    setSelectedDepartment(employee.department?._id || "");
    setDesignation(employee.designation || "");

    // 💰 Payroll info
    setBasicSalary(employee.basicSalary || 0);
    setOvertimeRate(employee.overtimeRate || 0);
    setTaxIdentificationNumber(employee.taxIdentificationNumber || "");

    // 🏦 Bank info
    setBankName(employee.bankAccount?.bankName || "");
    setAccountNumber(employee.bankAccount?.accountNumber || "");
    setAccountName(employee.bankAccount?.accountName || "");

    // 📎 File uploads
    setSelectedCVFile(employee.cv || null);
    setSelectedImageFile(employee.userId?.profileImage || null);

    // 🔄 UI
    setShowForm(true);
    setIsLoading(false);
  }, 300);
};


  const employee = dashboardData.profile;

  if (!employee) return <LoadingOverlay />;

  return (
   <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
  <div className="w-full max-w-6xl bg-white p-6 sm:p-10 rounded-xl shadow mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      
      {/* Left Column: Image and Name */}
      <div className="flex flex-col items-center text-center col-span-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-green-700 mb-6">
          {employee.userId?.name?.toUpperCase()}
        </h2>
        <img
          src={employee.userId?.profileImage}
          alt="Profile"
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-full object-cover border-4 border-gray-300"
        />
      </div>

      {/* Right Column: Employee Details */}
      <div className="col-span-1 md:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm text-gray-700">
          {[
            { label: "Name", value: employee.userId?.name },
            { label: "Email", value: employee.userId?.email },
            { label: "Staff ID", value: employee.staffId },
            { label: "Department", value: employee.department?.name },
            { label: "Designation", value: employee.designation },
            { label: "Gender", value: employee.gender },
            { label: "DOB", value: new Date(employee.dob).toLocaleDateString() },
            { label: "Marital Status", value: employee.maritalStatus },
            { label: "Phone", value: employee.phone },
            { label: "Address", value: employee.address },
            { label: "State", value: employee.state },
            { label: "Join Date", value: new Date(employee.joinDate).toLocaleDateString() },
            { label: "Experience", value: employee.experience },
            { label: "Qualification", value: employee.qualification },
            { label: "Employee Type", value: employee.type },
            { label: "Basic Salary", value: `₦${employee.basicSalary?.toLocaleString()}` },
            { label: "Tax ID", value: employee.taxIdentificationNumber || "N/A" },
            {
              label: "Bank Info",
              value: employee.bankAccount?.bankName
                ? `${employee.bankAccount.bankName} - ${employee.bankAccount.accountNumber} (${employee.bankAccount.accountName})`
                : "No bank details"
            },
            {
              label: "Overtime Rate",
              value: `₦${employee.overtimeRate?.toLocaleString() || 0}`
            },
            {
              label: "CV", value: employee.cv ? (
                <a
                  href={employee.cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline block mb-2"
                >
                  View Uploaded CV
                </a>
              ) : (
                <span className="text-red-500">No CV uploaded</span>
              )
            },
            {
              label: "Status",
              value: (
                <span className={employee.status ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {employee.status ? "Active" : "Inactive"}
                </span>
              ),
            },
          ].map((item, index) => (
            <div key={index} className="flex border-b py-2">
              <div className="font-semibold w-40">{item.label}:</div>
              <div className="text-gray-800">{item.value}</div>
            </div>
          ))}
          <button
            onClick={() => handleUpdate(employee)}
            className="bg-green-500 text-white text-sm px-3 py-1 rounded-full mt-4"
          >
            Update Profile
          </button>
        </div>
      </div>
    </div>
  </div>

 {/* Update Form Modal */}
{editingAdmin && showForm && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md relative max-h-[90vh] overflow-y-auto">
      <button
        onClick={handleClose}
        className="font-bold text-3xl absolute top-2 right-4 text-red-700 hover:text-red-800"
      >
        ✕
      </button>

      <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
        Update Employee
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left Column */}
          <div className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Full Name"
              className="w-full p-2 border border-green-300 rounded"
            />

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full p-2 border border-green-300 rounded"
            />

            <input
              type="text"
              value={staffId}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100"
            />

            <label className="block font-medium">Date of Birth</label>
            <input
              type="date"
              value={dob}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100 cursor-not-allowed"
            />

            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full p-2 border border-green-300 rounded"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <select
              value={maritalStatus}
              onChange={e => setMaritalStatus(e.target.value)}
              className="w-full p-2 border border-green-300 rounded"
            >
              <option value="">Marital Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>

            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full p-2 border border-green-300 rounded"
            />

            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Address"
              rows={3}
              className="w-full p-2 border border-green-300 rounded"
            />

            <select
              value={experience}
              onChange={e => setExperience(e.target.value)}
              className="w-full p-2 border border-green-300 rounded"
            >
              <option value="">Working Experience</option>
              <option value="1-5">1-5 Years</option>
              <option value="6-10">6-10 Years</option>
              <option value="11-15">11-15 Years</option>
              <option value="16-20">16-20 Years</option>
              <option value="21-25">21-25 Years</option>
              <option value="26-30">26-30 Years</option>
            </select>

            <select
              value={qualification}
              onChange={e => setQualification(e.target.value)}
              className="w-full p-2 border border-green-300 rounded"
            >
              <option value="">Highest Qualification</option>
              <option value="SSCE">SSCE</option>
              <option value="ND">National Diploma</option>
              <option value="NCE">NCE</option>
              <option value="HND">HND</option>
              <option value="B.Sc">B.Sc</option>
              <option value="M.Sc">M.Sc</option>
              <option value="Ph.D">Ph.D</option>
            </select>

            <select
              value={type}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100 cursor-not-allowed"
            >
              <option value="">Employee Type</option>
              <option value="permanent">Permanent</option>
              <option value="locum">Locum/Contract</option>
              <option value="consultant">Consultant</option>
            </select>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <label className="block font-medium">Basic Salary (₦)</label>
            <input
              type="number"
              value={basicSalary}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100 cursor-not-allowed"
            />

            <label className="block font-medium">Tax Identification Number</label>
            <input
              type="text"
              value={taxIdentificationNumber}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100 cursor-not-allowed"
            />

            <label className="block font-medium">Overtime Rate (₦/hr)</label>
            <input
              type="number"
              value={overtimeRate}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100 cursor-not-allowed"
            />

            {/* Bank Info */}
            <label className="block font-medium mt-4">Bank Information</label>
            <input
              type="text"
              value={bankName}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100 cursor-not-allowed"
            />
            <input
              type="text"
              value={accountNumber}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100 cursor-not-allowed"
            />
            <input
              type="text"
              value={accountName}
              disabled
              className="w-full p-2 border border-green-300 rounded bg-gray-100 cursor-not-allowed"
            />

            {/* CV Upload */}
            <label className="block font-medium mt-4">Upload CV (PDF)</label>
            {typeof selectedCVFile === 'string' && (
              <a
                href={selectedCVFile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline block mb-2"
              >
                View Uploaded CV
              </a>
            )}
            <input
              type="file"
              name="cv"
              onChange={e => setSelectedCVFile(e.target.files[0])}
              accept=".pdf"
              className="w-full p-2 border border-green-300 rounded"
            />

            {/* Profile Image Upload */}
            <label className="block font-medium mt-4">Profile Image</label>
            {typeof selectedImageFile === 'string' && (
              <img
                src={selectedImageFile}
                alt="Profile Preview"
                className="w-24 h-24 object-cover rounded-full mb-2"
              />
            )}
            <input
              type="file"
              name="image"
              onChange={e => setSelectedImageFile(e.target.files[0])}
              accept="image/*"
              className="w-full p-2 border border-green-300 rounded"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition duration-300"
          >
            Update Employee
          </button>
        </div>
      </form>
    </div>
  </div>
)}

  
  {isLoading && <LoadingOverlay />}
</div>


  );
};

export default employeeProfile;
