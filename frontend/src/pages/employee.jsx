import React, { useState } from 'react'
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useEffect } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";
import LoadingOverlay from '../components/loadingOverlay.jsx';

const employee = () => {
  const { token, backendUrl, getAllDepartment, department,
    employees, setEmployees, getAllEmployees } = useContext(AppContext)
  const [isLoading, setIsLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [report, setReport] = useState([]);
  const [viewClicked, setViewClicked] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployess, setFilteredEmployess] = useState([]);
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

  // Payroll specific fields
  const [basicSalary, setBasicSalary] = useState('');
  const [overtimeRate, setOvertimeRate] = useState('');
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const states = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe"
  ];

  // Nigerian Banks List
  const nigerianBanks = [
    "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank", "First Bank of Nigeria",
    "First City Monument Bank (FCMB)", "Globus Bank", "Guaranty Trust Bank (GTBank)", "Heritage Bank",
    "Jaiz Bank", "Keystone Bank", "Polaris Bank", "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered Bank",
    "Sterling Bank", "Suntrust Bank", "Union Bank of Nigeria", "United Bank for Africa (UBA)", "Unity Bank",
    "Wema Bank", "Zenith Bank"
  ];

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);

    const selectedDept = department.find(dep => dep._id === deptId);
    setDesignationOptions(selectedDept?.designations || []);
    setDesignation(''); // Reset designation when department changes
  };

  const handleViewDetail = () => {
    setIsLoading(true);
    setTimeout(() => {
      setShowDetailModal(true);
      setIsLoading(false);
    }, 300);
  };

  const handleView = (employee) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedEmployee(employee);
      setIsLoading(false);
    }, 300);
  };

  const handleClose = () => {
    setIsLoading(true);
    setTimeout(() => {
      setShowForm(false)
      getAllEmployees();
      // Reset form
      setName(""); setEmail(""); setStaffId(""); setDob(""); setGender("");
      setMaritalStatus(""); setSelectedDepartment(""); setDesignation("");
      setSalary(""); setPassword(""); setRole(""); setAddress(""); setPhone("");
      setSelectedImageFile(null); setState(""); setQualification(""); setExperience("");
      setSelectedCVFile(""); setSelectedImageFile(""); setJoinDate("");
      setShowForm(false); setType("");
      // Reset payroll fields
      setBasicSalary(""); setOvertimeRate(""); setTaxIdentificationNumber("");
      setBankName(""); setAccountNumber(""); setAccountName("");
      getAllEmployees();
      setIsLoading(false);
    }, 300);
  }

  const handleAddNew = () => {
    setIsLoading(true);
    setTimeout(() => {
      setEditingAdmin(null);
      setShowForm(true);
      setIsLoading(false);
    }, 300);
  };

  const handleCloseDetail = () => {
    setIsLoading(true);
    setTimeout(() => {
      setShowDetailModal(false)
      setSelectedEmployee(null);
      setEmployeeDetails([]);
      setFilterStatus('')
      setFilterType('')
      getAllEmployees();
      setIsLoading(false);
    }, 300);
  }

  const handleUpdate = (item) => {
    setIsLoading(true);
    setTimeout(() => {
      setEditingAdmin(item);
      setName(item.userId.name);
      setEmail(item.userId.email);
      setStaffId(item.staffId);
      setType(item.type);
      setRole(item.userId.role)
      const formattedjoinDate = new Date(item.joinDate).toISOString().split('T')[0];
      setJoinDate(formattedjoinDate)
      const formattedDob = new Date(item.dob).toISOString().split('T')[0];
      setDob(formattedDob);
      setGender(item.gender);
      setMaritalStatus(item.maritalStatus);
      setSelectedDepartment(item.department?._id || item.department?.name);
      if (item.department?._id) {
        setSelectedDepartment(item.department._id);
        handleDepartmentChange({ target: { value: item.department._id } });
      }
      setDesignation(item.designation || '');
      setSelectedCVFile(item.cv || null);
      setSelectedImageFile(item.userId?.profileImage || null);
      setAddress(item.address);
      setPhone(item.phone);
      setQualification(item.qualification)
      setExperience(item.experience)
      setState(item.state);

      // Set payroll fields
      setBasicSalary(item.basicSalary || '');
      setOvertimeRate(item.overtimeRate || '');
      setTaxIdentificationNumber(item.taxIdentificationNumber || '');
      setBankName(item.bankAccount?.bankName || '');
      setAccountNumber(item.bankAccount?.accountNumber || '');
      setAccountName(item.bankAccount?.accountName || '');

      setShowForm(true);
      setIsLoading(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate profile image file
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


    // Append payroll fields
    formData.append('basicSalary', basicSalary);
    formData.append('overtimeRate', overtimeRate);
    formData.append('taxIdentificationNumber', taxIdentificationNumber);
    formData.append('bankName', bankName);
    formData.append('accountNumber', accountNumber);
    formData.append('accountName', accountName);

    try {
      if (editingAdmin && editingAdmin._id) {
        formData.append("employeeId", editingAdmin._id);

        const { data } = await axios.post(
          backendUrl + '/api/admin/update-employee',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );

        if (data.success) {
          toast.success("Employee updated successfully!");
          handleClose();
        }
      } else {
        const { data } = await axios.post(
          backendUrl + "/api/admin/add-employee",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );

        if (data.success) {
          toast.success("Employee added successfully!");
          handleClose();
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error('Employee Add/Update failed', error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    const { data } = await axios.post(`${backendUrl}/api/admin/deactivate-employee`, {
      employeeId: confirmDeleteId,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (data.success) {
      toast.success(data.message);
      setConfirmDeleteId(null);
      getAllEmployees();
    } else {
      toast.error("Failed to Deactivate Employee");
    }
  };

  // Filter employees based on search
  useEffect(() => {
    const filtered = (employees || []).filter((emp) => {
      const statusString = emp.status ? "active" : "inactive";

      return (
        emp.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.userId.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        statusString.includes(searchTerm.toLowerCase())
      );
    });

    setFilteredEmployess(filtered);
    setCurrentPage(1);
  }, [searchTerm, employees]);

  // Use filteredEmployees directly:
  const totalItems = employees?.length;
  const totalPages = Math.ceil(filteredEmployess.length / itemsPerPage);
  const paginatedEmployees = filteredEmployess.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (token) {
      getAllDepartment();
      getAllEmployees();
    }
  }, [token, searchTerm]);

  const fetchEmployeesByStatus = async (status, type) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/employees?status=${status}&type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  if (!employees) return <LoadingOverlay />;

  // ✅ Handle basic salary change
const handleBasicSalaryChange = (e) => {
  const value = e.target.value;
  setBasicSalary(value);

  // ✅ Auto-calculate overtime rate (Basic Salary ÷ 176)
  if (value && !isNaN(value)) {
    const rate = (parseFloat(value) / 176).toFixed(2);
    setOvertimeRate(rate);
  } else {
    setOvertimeRate('');
  }
};

  return (
    <div className='w-full max-w-6xl mx-auto px-4 text-center'>
      <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-5">MANAGE EMPLOYEE</p>

      {/* Search and Add Button */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-4'>
        <input
          type='text'
          placeholder='Search by Employee Name or ID...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-1/3'
        />
        <button className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full" onClick={handleViewDetail}>Generate Report</button>
        <button
          onClick={handleAddNew}
          className="bg-green-500 text-white py-2 px-4 rounded-md text-sm hover:bg-green-600 transition w-full sm:w-auto"
        >
          Add Employee
        </button>
      </div>

      <div className='bg-white mt-6 rounded-lg shadow overflow-x-auto text-sm max-h-[80vh] min-h-[60vh]'>
        {/* Table Header */}
        <div className='bg-gray-200 hidden sm:grid grid-cols-[0.5fr_3fr_2fr_2fr_1fr_1fr_3fr] py-3 px-6 rounded-t-xl border-b-4 border-green-500'>
          <p>#</p>
          <p>Full Name</p>
          <p className="hidden md:block">Email</p>
          <p className="hidden lg:block">Department</p>
          <p className="hidden lg:block">DOB</p>
          <p className="hidden lg:block">Status</p>
          <p>Actions</p>
        </div>

        {/* Table Body */}
        {paginatedEmployees.length > 0 ? (
          paginatedEmployees.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:grid sm:grid-cols-[0.5fr_3fr_2fr_2fr_1fr_1fr_3fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-blue-50 gap-4 sm:gap-0"
            >
              <p>{index + 1}</p>

              <div className="flex items-center gap-2">
                <img
                  className="w-10 h-10 rounded-full object-cover"
                  src={item.userId?.profileImage || '/default-avatar.png'}
                  alt="profile"
                />
                <p className="text-sm">{item.userId?.name}</p>
              </div>

              <p className="hidden md:block text-sm text-center sm:text-left">
                {item.userId?.email}
              </p>

              <p className="hidden lg:block text-sm">{item.department?.name}</p>

              <p className="hidden lg:block text-sm">
                {new Date(item.dob).toLocaleDateString()}
              </p>

              <p className={`hidden lg:block text-sm font-semibold ${item.status ? 'text-green-600' : 'text-red-600'
                }`}>
                {item.status ? 'Active' : 'Inactive'}
              </p>

              <div className="flex justify-end gap-2 flex-wrap">
                <button
                  onClick={() => handleView(item)}
                  className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full"
                >
                  View
                </button>
                <button
                  onClick={() => handleUpdate(item)}
                  className="bg-green-500 text-white text-sm px-3 py-1 rounded-full"
                >
                  Update
                </button>
                <button
                  onClick={() => setConfirmDeleteId(item._id)}
                  className={`text-white text-sm px-3 py-1 rounded-full ${item.status ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                    }`}
                >
                  {item.status ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-5 text-gray-500">No employees found.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-2 flex-wrap px-4 pb-4">
            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1))
                  setIsLoading(false);
                }, 300);
              }}
              disabled={currentPage === 1}
              className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages))
                  setIsLoading(false);
                }, 300);
              }}
              disabled={currentPage === totalPages}
              className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Footer showing count */}
      <div className="flex justify-end mt-2 text-sm text-gray-800 px-2">
        Showing {(currentPage - 1) * itemsPerPage + 1}–
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </div>

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="w-full max-w-6xl bg-white p-6 rounded-lg shadow-md relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className=" font-bold text-3xl absolute top-2 right-4  text-red-700 hover:text-red-800"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
              {editingAdmin ? "Update Employee" : "Add New Employee"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>

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
                    onChange={e => setStaffId(e.target.value)}
                    required
                    placeholder="Staff ID"
                    className="w-full p-2 border border-green-300 rounded"
                  />

                  <label className="block font-medium">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    required
                    className="w-full p-2 border border-green-300 rounded"
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

                  <select
                    onChange={(e) => setState(e.target.value)}
                    value={state}
                    className="w-full p-2 border border-green-300 rounded"
                    required
                  >
                    <option value="" disabled>State of Residence</option>
                    {states.map((state, index) => (
                      <option key={index} value={state}>{state}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required placeholder='Phone Number'
                    className="w-full p-2 border border-green-300 rounded"
                  />

                  {!editingAdmin && (
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Password"
                      className="w-full p-2 border border-green-300 rounded"
                    />
                  )}

                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Address"
                    rows={3}
                    className="w-full p-2 border border-green-300 rounded"
                  ></textarea>
                </div>

                {/* Employment Information Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Employment Information</h3>

                  <select
                    value={qualification}
                    onChange={e => setQualification(e.target.value)}
                    className="w-full p-2 border border-green-300 rounded"
                  >
                    <option value="">Highest Qualification</option>
                    <option value="SSCE">SSCE</option>
                    <option value="ND">National Diploma</option>
                    <option value="NCE">Nigerian Certificate in Education</option>
                    <option value="HND">Higher National Diploma</option>
                    <option value="B.sc">Bachelor's Degree</option>
                    <option value="M.Sc">Master's Degrees</option>
                    <option value="Ph.D">Doctorate Degrees</option>
                  </select>

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

                  <div className='flex flex-col gap-4'>
                    <select
                      value={selectedDepartment}
                      onChange={handleDepartmentChange}
                      className="w-full p-2 border border-green-300 rounded"
                    >
                      <option value="">Select Department</option>
                      {department?.map(dep => (
                        <option key={dep._id} value={dep._id}>{dep.name}</option>
                      ))}
                    </select>

                    <select
                      value={type}
                      onChange={e => setType(e.target.value)}
                      className="w-full p-2 border border-green-300 rounded"
                    >
                      <option value="">Employee Type</option>
                      <option value="permanent">Permanent</option>
                      <option value="locum">Locum/Contract</option>
                      <option value="consultant">Consultant</option>
                    </select>
                  </div>

                  {/* Designation Dropdown */}
                  <select
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    required
                    className="w-full p-2 border border-green-300 rounded"
                    disabled={!selectedDepartment}
                  >
                    <option value="">Select Designation</option>
                    {designationOptions.map((desig, idx) => (
                      <option key={idx} value={desig}>{desig}</option>
                    ))}
                  </select>

                  <label className="block font-medium">Join Date</label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={e => setJoinDate(e.target.value)}
                    required
                    className="w-full p-2 border border-green-300 rounded"
                  />

                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full p-2 border border-green-300 rounded"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                    <option value="HOD">HOD</option>
                  </select>

                  {/* CV Upload */}
                  <label className="block font-medium">Upload CV (PDF)</label>
                  {editingAdmin && typeof selectedCVFile === 'string' && (
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
                  <label className="block font-medium">Profile Image</label>
                  {editingAdmin && typeof selectedImageFile === 'string' && (
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

                {/* Payroll Information Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Payroll Information</h3>

                  <input
                    type="number"
                    value={basicSalary}
                    onChange={handleBasicSalaryChange}
                    placeholder="Basic Salary (₦)"
                    className="w-full p-2 border border-green-300 rounded"
                  />

                  <input
                    type="number"
                    value={overtimeRate}
                    readOnly   // ✅ make it readonly so it's auto-filled
                    placeholder="Overtime Rate per Hour (₦)"
                    className="w-full p-2 border border-green-300 rounded bg-gray-100"
                  />

                  <input
                    type="text"
                    value={taxIdentificationNumber}
                    onChange={e => setTaxIdentificationNumber(e.target.value)}
                    placeholder="Tax Identification Number"
                    className="w-full p-2 border border-green-300 rounded"
                  />

                  <select
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full p-2 border border-green-300 rounded"
                  >
                    <option value="">Select Bank</option>
                    {nigerianBanks.map((bank, index) => (
                      <option key={index} value={bank}>{bank}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full p-2 border border-green-300 rounded"
                  />

                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="Account Name"
                    className="w-full p-2 border border-green-300 rounded"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition duration-300"
                >
                  {editingAdmin ? "Update Employee" : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* The rest of your modal components remain the same */}
      {selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-2">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full shadow-xl relative max-h-[95vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-2 right-4 text-red-600 text-2xl font-bold"
            >
              ✕
            </button>

            {/* Employee Name */}
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center text-gray-700">
              {selectedEmployee.userId?.name?.toUpperCase()}
            </h2>

            {/* Profile Image */}
            <div className="mt-4 sm:mt-6 text-center">
              <img
                src={selectedEmployee.userId?.profileImage}
                alt="Profile"
                className="w-28 h-28 sm:w-44 sm:h-44 rounded-full object-cover inline-block border border-gray-300 mb-6"
              />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 text-start">
              {[
                { label: "Name", value: selectedEmployee.userId?.name },
                { label: "Email", value: selectedEmployee.userId?.email },
                { label: "Staff ID", value: selectedEmployee.staffId },
                { label: "Department", value: selectedEmployee.department?.name },
                { label: "Designation", value: selectedEmployee.designation },
                { label: "DOB", value: new Date(selectedEmployee.dob).toLocaleDateString() },
                { label: "Phone", value: selectedEmployee.phone },
                { label: "Gender", value: selectedEmployee.gender },
                { label: "Marital Status", value: selectedEmployee.maritalStatus },
                { label: "State", value: selectedEmployee.state },
                { label: "Address", value: selectedEmployee.address },
                { label: "Join Date", value: new Date(selectedEmployee.joinDate).toLocaleDateString() },
                { label: "Experience", value: selectedEmployee.experience },
                { label: "Qualification", value: selectedEmployee.qualification },
                { label: "Role", value: selectedEmployee.userId?.role },
                { label: "Employee Type", value: selectedEmployee.type },
                { label: "Basic Salary", value: selectedEmployee.basicSalary ? `₦${selectedEmployee.basicSalary.toLocaleString()}` : 'Not set' },
                { label: "Overtime Rate", value: selectedEmployee.overtimeRate ? `₦${selectedEmployee.overtimeRate.toLocaleString()}/hr` : 'Not set' },
                { label: "Tax ID", value: selectedEmployee.taxIdentificationNumber || 'Not provided' },
                { label: "Bank Name", value: selectedEmployee.bankAccount?.bankName || 'Not provided' },
                { label: "Account Number", value: selectedEmployee.bankAccount?.accountNumber || 'Not provided' },
                { label: "Account Name", value: selectedEmployee.bankAccount?.accountName || 'Not provided' },
                {
                  label: "Employee Status",
                  value: (
                    <span className={selectedEmployee.status ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {selectedEmployee.status ? "Active" : "Inactive"}
                    </span>
                  ),
                },
                {
                  label: "CV",
                  value: selectedEmployee.cv ? (
                    <a
                      href={selectedEmployee.cv}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline block"
                    >
                      View Uploaded CV
                    </a>
                  ) : (
                    <span className="text-red-500">No CV uploaded</span>
                  ),
                }
              ].map((item, index) => (
                <div key={index} className="flex border-b py-2">
                  <div className="font-semibold w-32 sm:w-40">{item.label}:</div>
                  <div className="text-gray-800 break-words">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal and other modals remain the same */}
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <p className={`mb-4 text-center font-semibold ${employees.find(emp => emp._id === confirmDeleteId)?.status ? "text-red-500" : "text-green-600"
              }`}>
              {employees.find(emp => emp._id === confirmDeleteId)?.status
                ? "Are you sure you want to deactivate this employee?"
                : "Are you sure you want to activate this employee?"}
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="bg-gray-300 px-8 py-2 rounded-full hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeactivate(confirmDeleteId)}
                className={`px-8 py-2 rounded-full text-white ${employees.find(emp => emp._id === confirmDeleteId)?.status
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
                  }`}
              >
                {employees.find(emp => emp._id === confirmDeleteId)?.status ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-auto max-h-[95vh] relative p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseDetail}
              className="absolute top-2 right-4 text-red-600 text-2xl font-bold hover:text-red-800"
            >
              ✕
            </button>

            {!selectedEmployee ? (
              <>
                {/* Filter Dropdown with View Button */}
                <div className="flex justify-center items-center gap-2 mb-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border border-green-300 rounded"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>

                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="p-2 border border-green-300 rounded"
                  >
                    <option value="all">All Types</option>
                    <option value="permanent">Permanent</option>
                    <option value="locum">Locum/Contract</option>
                    <option value="consultant">Consultant</option>
                  </select>

                  <button
                    onClick={() => {
                      setIsLoading(true);

                      setTimeout(() => {
                        fetchEmployeesByStatus(filterStatus, filterType);
                        setViewClicked(true); // Set to true after clicking
                        setIsLoading(false);
                      }, 300);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    View
                  </button>

                </div>

                <div id="print-salary-table" className="overflow-x-auto">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 text-green-700 text-center sm:text-center">
                    List of&nbsp;
                    <span className="text-green-700">
                      {filterStatus === "all" && filterType === "all"
                        ? "All"
                        : [
                          filterStatus !== "all" ? filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1) : null,
                          filterType !== "all" ? filterType.charAt(0).toUpperCase() + filterType.slice(1) : null
                        ]
                          .filter(Boolean)
                          .join(" and ")
                      }
                    </span> Staff
                  </h2>



                  {employees.length > 0 ? (
                    <table className="w-full border text-sm text-gray-800">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">#</th>
                          <th className="border p-2">Staff ID</th>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Email</th>
                          <th className="border p-2">Status</th>
                          <th className="border p-2">Type</th>
                          <th className="border p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp, idx) => (
                          <tr key={emp._id} className="hover:bg-gray-50">
                            <td className="border p-2">{idx + 1}</td>
                            <td className="border p-2">{emp.staffId}</td>
                            <td className="border p-2">{emp.userId?.name}</td>
                            <td className="border p-2">{emp.userId?.email}</td>
                            <td className="border p-2">
                              {emp.status ? (
                                <span className="text-green-600 font-semibold">Active</span>
                              ) : (
                                <span className="text-red-600 font-semibold">Inactive</span>
                              )}
                            </td>
                            <td className="border p-2">{emp.type}</td>
                            <td className="border p-2">
                              <button
                                onClick={() => {

                                  setIsLoading(true);
                                  setTimeout(() => {
                                    setSelectedEmployee(emp);
                                    setIsLoading(false);
                                  }, 300);
                                }

                                }
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No employees found.</p>
                  )}

                </div>
              </>
            ) : (
              <>
                {/* Selected Employee Detail */}
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center text-gray-700">
                  {selectedEmployee.userId?.name?.toUpperCase()}
                </h2>

                {/* Profile Image */}
                <div className="mt-4 sm:mt-6 text-center">
                  <img
                    src={backendUrl + `/upload/${selectedEmployee.userId?.profileImage}`}
                    alt="Profile"
                    className="w-28 h-28 sm:w-44 sm:h-44 rounded-full object-cover inline-block border border-gray-300 mb-6"
                  />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 text-start">
                  {[
                    { label: "Name", value: selectedEmployee.userId?.name },
                    { label: "Email", value: selectedEmployee.userId?.email },
                    { label: "Staff ID", value: selectedEmployee.staffId },
                    { label: "Department", value: selectedEmployee.department?.name },
                    { label: "Designation", value: selectedEmployee.designation },
                    { label: "DOB", value: new Date(selectedEmployee.dob).toLocaleDateString() },
                    { label: "Phone", value: selectedEmployee.phone },
                    { label: "Gender", value: selectedEmployee.gender },
                    { label: "Marital Status", value: selectedEmployee.maritalStatus },
                    { label: "State", value: selectedEmployee.state },
                    { label: "Address", value: selectedEmployee.address },
                    { label: "Join Date", value: new Date(selectedEmployee.joinDate).toLocaleDateString() },
                    { label: "Experience", value: selectedEmployee.experience },
                    { label: "Qualification", value: selectedEmployee.qualification },
                    { label: "Employee Type", value: selectedEmployee.type },
                    {
                      label: "Employee Status",
                      value: (
                        <span className={selectedEmployee.status ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                          {selectedEmployee.status ? "Active" : "Inactive"}
                        </span>
                      ),
                    },

                    { label: "Role", value: selectedEmployee.userId?.role },
                    {
                      label: "CV",
                      value: selectedEmployee.cv ? (
                        <a
                          href={`${backendUrl}/upload/${selectedEmployee.cv}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline block"
                        >
                          View Uploaded CV
                        </a>
                      ) : (
                        <span className="text-red-500">No CV uploaded</span>
                      ),
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex border-b py-2">
                      <div className="font-semibold w-32 sm:w-40">{item.label}:</div>
                      <div className="text-gray-800 break-words">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Back Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400"
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}

            {/* Print Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  const content = document.getElementById('print-salary-table').innerHTML;
                  const printWindow = window.open('', '', 'height=800,width=1000');
                  printWindow.document.write("<html><head><title>Employee Report</title>");
                  printWindow.document.write(
                    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css">'
                  );
                  printWindow.document.write("</head><body>");
                  printWindow.document.write(content);
                  printWindow.document.write("</body></html>");
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 text-sm"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )
      }
      {isLoading && <LoadingOverlay />}

    </div >
  );
};
export default employee
