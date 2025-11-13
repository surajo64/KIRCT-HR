import Department from "../models/Department.js";
import User from "../models/User.js";
import bcrypt from 'bcrypt'
import { profile } from "console";
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from "path";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import Salary from "../models/Salary.js";
import xlsx from 'xlsx';
import fs from 'fs';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import Evaluation from "../models/evaluation.js";
import Kpi from "../models/Kpi.js";
import AdminEvaluation from "../models/adminEvaluation.js";
import Attendance from "../models/attendance.js";
import Loan from "../models/loan.js";
import Payroll from "../models/Payroll.js";
import axios from 'axios';



const addEmployee = async (req, res) => {
  try {
    const {
      name, email, phone, department,rent,
      designation, role, state,
      maritalStatus, dob, joinDate,
      gender, staffId, address, password,
      experience, qualification, type,
      // Payroll fields
      basicSalary, overtimeRate, taxIdentificationNumber,
      bankName, accountNumber, accountName
    } = req.body;

    console.log('Request body received:', {
      name, email, staffId, basicSalary, overtimeRate
    });

    const normalizedStaffId = staffId.toLowerCase();

    const [existingUser, existingEmployee] = await Promise.all([
      User.findOne({ email }),
      Employee.findOne({ staffId: normalizedStaffId })
    ]);

    if (existingUser || existingEmployee) {
      return res.status(400).json({
        success: false,
        message: existingUser
          ? "Employee with this email already exists"
          : "Employee with this Staff ID already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Get Cloudinary URLs from req.files (already uploaded by multer-storage-cloudinary)
    const profileImage = req.files?.image?.[0]?.path || "";
    const cvFile = req.files?.cv?.[0]?.path || "";


    const newUser = new User({
      name,
      email,
      department,
      password: hashPassword,
      role,
      profileImage
    });

    const savedUser = await newUser.save();

    // Prepare bank account object
    const bankAccount = {
      bankName: bankName || "",
      accountNumber: accountNumber || "",
      accountName: accountName || ""
    };

    const newEmployee = new Employee({
      userId: savedUser._id,
      name,
      email,
      department,
      password: hashPassword,
      role,
      rent,
      profileImage,
      phone,
      department,
      designation,
      state,
      experience: experience || "",
      qualification: qualification || "",
      maritalStatus: maritalStatus || "",
      dob,
      type,
      joinDate,
      gender,
      staffId: normalizedStaffId,
      address,
      cv: cvFile,
      // Payroll fields
      basicSalary: basicSalary ? parseFloat(basicSalary) : 0,
      overtimeRate: overtimeRate ? parseFloat(overtimeRate) : 0,
      taxIdentificationNumber: taxIdentificationNumber || "",
      bankAccount: bankAccount,
      activeLoans: []
    });

    await newEmployee.save();

    console.log('Employee created successfully with payroll data');

    res.status(201).json({
      success: true,
      message: "Employee added successfully",
      employee: newEmployee
    });

  } catch (error) {
    console.log('✅ CLOUDINARY CONFIG TEST:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Loaded ✅' : 'Missing ❌'
});
    console.error("Register Employee Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding employee",
      error: error.message
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      name, email, phone, department,
      designation, role, state,
      maritalStatus, dob, type,rent,
      gender, staffId, address, password,
      experience, qualification,
      // Payroll fields
      basicSalary, overtimeRate, taxIdentificationNumber,
      bankName, accountNumber, accountName
    } = req.body;


    if (!staffId) {
      return res.json({ success: false, message: "Staff ID is required" });
    }

    const normalizedStaffId = staffId.toLowerCase();

    // Find the employee by ID
    const employee = await Employee.findById(employeeId).populate("userId");
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const userId = employee.userId._id;

    // Check if email is used by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.json({ success: false, message: "Email already in use by another employee" });
    }

    // Check if staffId is used by another employee
    const existingStaffId = await Employee.findOne({ staffId: normalizedStaffId, _id: { $ne: employeeId } });
    if (existingStaffId) {
      return res.json({ success: false, message: "Staff ID already in use by another employee" });
    }

    let profileImageUrl = employee.userId.profileImage;
    let cvUrl = employee.cv;

    // Get updated Cloudinary URLs if new files were uploaded
    if (req.files?.image) {
      profileImageUrl = req.files.image[0].path; // Cloudinary URL
      console.log('Updated profile image URL:', profileImageUrl);
    }

    if (req.files?.cv) {
      cvUrl = req.files.cv[0].path; // Cloudinary URL
      console.log('Updated CV URL:', cvUrl);
    }

    // Prepare user update data
    const updatedUserData = {
      name,
      email,
      role,
      department,
      profileImage: profileImageUrl
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedUserData.password = await bcrypt.hash(password, salt);
    }

    await User.findByIdAndUpdate(userId, updatedUserData, { new: true });

    // Prepare bank account object
    const bankAccount = {
      bankName: bankName || employee.bankAccount?.bankName || "",
      accountNumber: accountNumber || employee.bankAccount?.accountNumber || "",
      accountName: accountName || employee.bankAccount?.accountName || ""
    };

    // Prepare employee update data
    const updatedEmployeeData = {
      name,
      phone,
      department,
      designation,
      state,
      maritalStatus,
      dob,
      rent,
      type,
      gender,
      staffId: normalizedStaffId,
      address,
      experience: experience || employee.experience,
      qualification: qualification || employee.qualification,
      cv: cvUrl,
      // Payroll fields
      basicSalary: basicSalary ? parseFloat(basicSalary) : employee.basicSalary || 0,
      overtimeRate: overtimeRate ? parseFloat(overtimeRate) : employee.overtimeRate || 0,
      taxIdentificationNumber: taxIdentificationNumber || employee.taxIdentificationNumber || "",
      bankAccount: bankAccount
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId, 
      updatedEmployeeData, 
      { new: true }
    ).populate('userId');

    console.log('Employee updated successfully with payroll data');

    res.json({ 
      success: true, 
      message: "Employee updated successfully",
      employee: updatedEmployee
    });

  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating employee",
      error: error.message
    });
  }
};


// Update employee status to false (deactivate employee)
const deactivateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    // Get current employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Toggle status
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { status: !employee.status },
      { new: true }
    );

    res.json({
      success: true,
      message: `Employee ${updatedEmployee.status ? 'activated' : 'deactivated'} successfully`,
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error toggling employee status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating employee status",
      error: error.message,
    });
  }
};




// get all Employee
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('userId', 'name email role profileImage')
      .populate('department', 'name designation');


    console.log("response:", employees);

    res.json({ success: true, employees });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}


// GET /api/employees?status=all|active|inactive
const getEmployeesByStatus = async (req, res) => {
  try {
    const { status, type } = req.query;

    let filter = {};

    // Filter by employment status
    if (status === "active") {
      filter.status = true;
    } else if (status === "inactive") {
      filter.status = false;
    }

    // Filter by type of employee
    if (type && type !== "all") {
      filter.type = type.toLowerCase(); // e.g., "permanent", "locum"
    }

    const employees = await Employee.find(filter)
      .populate("userId")
      .populate("department");

    res.json({ success: true, employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// to fetch all users
const getAllUsers = async (req, res) => {
  try {
    const userId = req.userId; // logged-in user

    // Fetch all users except the logged-in user
    const users = await User.find({ _id: { $ne: userId } })
      .select("name email role profileImage") // fields you need
      .populate("department", "name");        // optional: include department

    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// get all employee from same department
const fetchEmployees = async (req, res) => {
  try {
    const userId = req.userId;

    const currentEmployee = await Employee.findOne({ userId }).populate('department');
    if (!currentEmployee) {

      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const departmentId = currentEmployee.department._id;


    const employee = await Employee.find({
      department: departmentId,
      userId: { $ne: userId }
    })
      .populate('userId', 'name email role profileImage')
      .populate('department', 'name');

    res.json({ success: true, employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// API to Delete Employee
const deleteEmployee = async (req, res) => {
  try {
    const id = req.params.id?.toLowerCase(); // ✅ normalize to lowercase

    if (!id) {
      return res.json({
        success: false,
        message: "Staff ID is required"
      });
    }

    console.log("Normalized StaffId:", id);

    // Find the employee by normalized staffId
    const employee = await Employee.findOne({ _id: id });
    if (!employee) {
      return res.json({ success: false, message: "Employee not found" });
    }

    // Delete associated user
    await User.findByIdAndDelete(employee.userId);

    // Delete employee
    await Employee.findByIdAndDelete(employee._id);

    return res.json({
      success: true,
      message: "Employee deleted successfully"
    });

  } catch (error) {
    console.error("Delete Employee Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting employee",
      error: error.message
    });
  }
};


// API to add Admin
const addDepartment = async (req, res) => {
  try {
    const { name, description, designations } = req.body;

    if (!name || !description || !Array.isArray(designations) || designations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and at least one designation are required!'
      });
    }

    const isValidDesignations = designations.every(d => typeof d === 'string' && d.trim() !== '');
    if (!isValidDesignations) {
      return res.status(400).json({
        success: false,
        message: 'Each designation must be a non-empty string'
      });
    }

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Department with this name already exists!" });
    }

    const newDepartment = new Department({ name, description, designations });

    await newDepartment.save();

    res.json({
      success: true,
      message: "Department added successfully",
      department: newDepartment
    });

  } catch (error) {
    console.error("Register Department Error:", error);
    res.status(500).json({ message: "Error registering Department", error: error.message });
  }
};


// get all Department

const getAllDepartment = async (req, res) => {
  try {
    const department = await Department.find({})
    res.json({ success: true, department })


  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}



// API to update department
const updateDepartment = async (req, res) => {

  const { departmentId, name, description, designations } = req.body;

  // Validate input
  if (!departmentId || !name || !description || !designations) {
    return res.status(400).json({
      success: false,
      message: "Department ID, name, and description are required!",
    });
  }

  try {
    // Check for name conflict with other departments (excluding the one being updated)
    const nameConflict = await Department.findOne({ name, _id: { $ne: departmentId } });
    if (nameConflict) {
      return res.status(400).json({
        success: false,
        message: "Another department with this name already exists!",
      });
    }

    // Update department
    const updatedDepartment = await Department.findByIdAndUpdate(
      departmentId,
      {
        name,
        description,
        designations,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found!",
      });
    }

    res.json({
      success: true,
      message: "Department updated successfully",
      department: updatedDepartment,
    });

  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE department by ID
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// API to Add Leave

const addLeave = async (req, res) => {
  try {
    const { leave, reason, from, to } = req.body;
    const userId = req.userId;

    if (!leave || !reason || !from || !to) {
      return res.json({ success: false, message: 'All fields are required!' });
    }

    const leaveData = {
      userId,
      leave,
      reason,
      from,
      to,
      appliedAt: Date.now(),
      createdAt: Date.now(),
    };

    const newLeave = new Leave(leaveData);
    await newLeave.save();

    // ✅ Populate the user info before sending back
    const populatedLeave = await Leave.findById(newLeave._id).populate('userId', 'name email department profileImage');

    res.json({
      success: true,
      message: 'Leave added successfully',
      leave: populatedLeave,
    });

  } catch (error) {
    console.error("Add Leave Error:", error);
    res.status(500).json({ message: "Error adding leave", error: error.message });
  }
};



// get all Department
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ hodStatus: 'Approved' }) // filter here
      .populate({
        path: 'userId',
        select: 'name email department profileImage',
        populate: {
          path: 'department',
          model: 'Department',
          select: 'name'
        }
      })
      .populate({
        path: 'relievingEId',
        select: 'staffId name designation', // Add any fields you want from Employee
        model: 'Employee'
      });

    res.json({ success: true, leaves });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};




// get employee Department
const getEmployeeLeaves = async (req, res) => {
  try {
    const userId = req.userId;

    const leaves = await Leave.find({ userId })
      .populate({
        path: 'userId',
        select: 'name email department profileImage',
        populate: {
          path: 'department',
          model: 'Department',
          select: 'name'
        }
      })
      .populate({
        path: 'relievingEId',
        select: 'staffId name designation', // Add any fields you want from Employee
        model: 'Employee'
      });

    res.json({
      success: true,
      leaves
    });
  } catch (err) {
    console.error('Fetch leaves error:', err);
    res.status(500).json({ message: 'Error fetching leaves', error: err.message });
  }
};



const getLeaveToHod = async (req, res) => {
  try {
    const userId = req.userId;

    // Step 1: Get the HOD's employee record including department
    const hodEmployee = await Employee.findOne({ userId }).populate('department');
    if (!hodEmployee || hodEmployee.designation !== 'HOD') {
      return res.json({ message: 'Access denied. Only HODs can access this.' });
    }

    const departmentId = hodEmployee.department._id;

    // Step 2: Find all employees in the HOD's department
    const employeesInDept = await Employee.find({ department: departmentId }).select('userId');

    const userIdsInDept = employeesInDept.map(emp => emp.userId);

    // Step 3: Get leaves for these userIds
    const hodLeaves = await Leave.find({ userId: { $in: userIdsInDept } })
      .populate({
        path: 'userId',
        select: 'name email department profileImage',
        populate: {
          path: 'department',
          model: 'Department',
          select: 'name'
        }
      })
      .populate({
        path: 'relievingEId',
        select: 'staffId name designation', // Add any fields you want from Employee
        model: 'Employee'
      });


    res.json({ success: true, hodLeaves });

  } catch (err) {
    console.error('Fetch leaves error:', err);
    res.status(500).json({ message: 'Error fetching leaves', error: err.message });
  }
};





// API to update department
const updateLeave = async (req, res) => {

  const { leaveId, leave, reason, from, to, } = req.body;

  // Validate input
  if (!leave || !reason || !from || !to) {
    return res.json({ success: false, message: 'All fields are required!' });
  }

  try {
    // Update department
    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        leave, reason, from, to,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedLeave) {
      return res.json({
        success: false,
        message: "Leave not found!",
      });
    }

    res.json({
      success: true,
      message: "Leave updated successfully",
      Leave: updatedLeave,
    });

  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE Leave by ID
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findByIdAndDelete(id);

    if (!leave) {
      return res.json({ success: false, message: "Leave not found" });
    }

    res.json({ success: true, message: "Leave deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Admin approve Employee Leave
const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.body;
    console.log("Leave ID:", leaveId);
    if (!leaveId) {
      return res.status(400).json({ success: false, message: 'Leave ID is required' });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Leave already Approved' });
    }

    leave.status = 'Approved';
    leave.updatedAt = new Date();
    await leave.save();

    res.json({ success: true, message: 'Leave Approved!' });
  } catch (error) {
    console.error('Approved Leave Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// Reject Leave
const rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.body;
    console.log("Leave ID:", leaveId);
    if (!leaveId) {
      return res.status(400).json({ success: false, message: 'Leave ID is required' });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Leave already Rejected' });
    }

    leave.status = 'Rejected';
    leave.updatedAt = new Date();
    await leave.save();

    res.json({ success: true, message: 'Leave Rejected!' });
  } catch (error) {
    console.error('Rejected Leave Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Mark Leave As Resume 
const resumeLeave = async (req, res) => {
  try {
    const { leaveId } = req.body;

    if (!leaveId) {
      return res.status(400).json({ success: false, message: 'Leave ID is required' });
    }

    await Leave.findByIdAndUpdate(leaveId, {
      resumeStatus: true,
      resumeDate: Date.now()
    });

    res.json({ success: true, message: "Leave Mark As Resume!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// API to add salary using staffId lookup
const addSalary = async (req, res) => {
  try {
    // ✅ Step 1: Download Excel from Cloudinary
    const fileUrl = req.file.path;
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    // ✅ Step 2: Parse Excel from buffer
    const workbook = xlsx.read(response.data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const salaryData = [];

    for (const row of data) {
      const staffId = (row["Staff ID"] || "").trim().toLowerCase();
      if (!staffId) continue;

      const employee = await Employee.findOne({ staffId });
      if (!employee) continue;

      const loanDeduction = Number(row["Loan Deductions (₦)"]) || 0;
      const activeLoan = await Loan.findOne({ userId: employee.userId, status: "Approved" });

      if (activeLoan && loanDeduction > 0) {
        const repayment = Math.min(loanDeduction, activeLoan.amount - activeLoan.totalRepaid);
        activeLoan.totalRepaid += repayment;
        if (activeLoan.totalRepaid >= activeLoan.amount) activeLoan.status = "Completed";
        await activeLoan.save();
      }

      salaryData.push({
        employeeId: employee._id,
        basicSalary: Number(row["Basic Salary (₦)"]) || 0,
        transportAllowance: Number(row["Transport Allowance (₦)"]) || 0,
        mealAllowance: Number(row["Meal Allowance (₦)"]) || 0,
        overtimeHours:Number(row["Overtime Hours"]) || 0,
        overtimeRate:Number(row["Overtime Rate (₦)"]) || 0,
        overTime: Number(row["Overtime Amount (₦)"]) || 0,
        employeePension: Number(row["Employee Pension (₦)"]) || 0,
        employerPension: Number(row["Employer Pension (₦)"]) || 0,
        totalPension: Number(row["Total Pension (₦)"]) || 0,
        paye: Number(row["PAYE Tax (₦)"]) || 0,
        withholdingTax: Number(row["Withholding Tax (₦)"]) || 0,
        loan: Number(row["Loan Deductions (₦)"]) || 0,
        nonTaxPay: Number(row["Non-Tax Pay (₦)"]) || 0,
        totalDeductions: Number(row["Total Deductions (₦)"]) || 0,
        netSalary: Number(row["Net Salary (₦)"]) || 0,
        growthSalary: Number(row["Gross Salary (₦)"]) || 0,
        month: new Date().toLocaleString("default", { month: "long" }),
        year: new Date().getFullYear().toString(),
        payDate:new Date().toLocaleString("payDate"),
        status: row["Status"] || "Pending",
      });
    }

    if (salaryData.length === 0) {
      return res.status(400).json({ message: "No valid salary entries found." });
    }

    await Salary.insertMany(salaryData);
    res.status(200).json({
      success: true,
      message: "✅ Salary data uploaded successfully",
      count: salaryData.length,
    });
  } catch (err) {
    console.error("❌ Error uploading salary:", err);
    res.status(500).json({
      message: "Failed to upload salary data",
      error: err.message,
    });
  }
};



// Get Employee Salary

const getEmployeeSalaries = async (req, res) => {
  try {
    const userId = req.userId;

    // ✅ Find the employee document linked to this user
    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found for this user" });
    }

    // ✅ Fetch all salary records that belong to this employee
    const salaries = await Salary.find({ employeeId: employee._id })
      .populate({
        path: 'employeeId',
        select: 'staffId designation type userId department',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'department', select: 'name' },
        ],
      })
      .sort({ year: -1, month: -1 });

    if (!salaries.length) {
      return res.json({
        message: "No salary records found for this employee",
        data: [],
      });
    }

    // ✅ Group salaries by month/year for payslip generation
    const groupedSalaries = {};

    salaries.forEach(salary => {
      const key = `${salary.month}-${salary.year}`;
      if (!groupedSalaries[key]) {
        groupedSalaries[key] = {
          month: salary.month,
          year: salary.year,
          payDate: salary.payDate,
          netPay: salary.netSalary,
          totalAmount: 0,
          records: [],
        };
      }
      groupedSalaries[key].records.push(salary);
      groupedSalaries[key].totalAmount += Number(salary.growthSalary) || 0;
    });

    res.json({
      message: "Employee salary records grouped successfully",
      count: Object.keys(groupedSalaries).length,
      data: Object.values(groupedSalaries),
    });

  } catch (error) {
    console.error("Error fetching employee salaries:", error);
    res.status(500).json({
      message: "Server error while fetching salaries",
      error: error.message,
    });
  }
};





// API to Get All Salaries
const getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find()
      .populate({
        path: 'employeeId',
        select: 'staffId designation type userId department',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'department', select: 'name' },
        ],
      })
      .sort({ year: -1, month: -1 });

    // Group salaries by month and year
    const groupedSalaries = {};

    salaries.forEach(salary => {
      const key = `${salary.month} ${salary.year}`;
      if (!groupedSalaries[key]) {
        groupedSalaries[key] = {
          month: salary.month,
          year: salary.year,
          payDate: salary.payDate,
          totalAmount: 0,
          records: [],
        };
      }
      groupedSalaries[key].records.push(salary);
      groupedSalaries[key].totalAmount += salary.growthSalary || 0;
    });

    // Convert object to array
    const salaryGroups = Object.values(groupedSalaries);


    res.json({
      message: 'Grouped salary records',
      count: salaryGroups.length,
      data: salaryGroups,
    });
  } catch (error) {
    console.error('Error grouping salaries:', error);
    res.status(500).json({ message: 'Failed to group salary records', error: error.message });
  }
};



// API to change Password

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const userId = req.userId; // ✅ this comes from your auth middleware

    if (!userId || !oldPassword || !newPassword || !confirmPassword) {
      return res.json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.json({ success: false, message: "New password and confirm password do not match" });
    }

    const user = await User.findById(userId); // ✅ correctly placed after declaration
    if (!user || !user.password) {
      return res.json({ success: false, message: "User not found or password missing" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await User.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );


    return res.json({ success: true, message: "Password changed successfully" });

  } catch (error) {
    console.error("Password change error:", error); // 🔍 Shows the real error
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default changePassword;




// Forgot Passowd
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token (valid for 1 hour)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      text: `Hello: ${user.name}\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Password reset email sent', token });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// reset passowrd
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Api To Approve Leave
const approveHodLeave = async (req, res) => {
  try {
    const { leaveId, relievingStaff } = req.body;

    if (!leaveId || !relievingStaff) {
      return res.json({ success: false, message: 'Leave ID and Relieving Staff are required' });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.hodStatus === 'Approved') {
      return res.status(400).json({ success: false, message: 'Leave already approved by HOD' });
    }

    leave.hodStatus = 'Approved';
    leave.relievingEId = relievingStaff;
    leave.updatedAt = new Date();

    await leave.save();

    res.json({ success: true, message: 'Leave Approved by HOD!' });
  } catch (error) {
    console.error('Approve Leave Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};




// Reject Leave
const rejectHodLeave = async (req, res) => {
  try {
    const { leaveId } = req.body;
    console.log("Leave ID:", leaveId);
    if (!leaveId) {
      return res.status(400).json({ success: false, message: 'Leave ID is required' });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.hodStatus === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Leave already Rejected' });
    }

    leave.hodStatus = 'Rejected';
    leave.updatedAt = new Date();
    await leave.save();

    res.json({ success: true, message: 'Leave Rejected!' });
  } catch (error) {
    console.error('Rejected Leave Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

//API to Add Evaluation by HOD
const adminEvaluation = async (req, res) => {
  try {
    const { userId, evaluationId, kpiId, scores, total, grade, comments, year, month } = req.body;

    if (!userId || !scores || total == null || !grade) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const newEvaluation = new AdminEvaluation({
      userId,
      evaluationId,
      kpiId,
      scores,
      total,
      grade,
      comments,
      year,
      month,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await newEvaluation.save();

    res.status(200).json({ success: true, message: "Evaluation saved." });
  } catch (err) {
    console.error("Evaluation error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// API to update Evaluation
const updateAdminEvaluation = async (req, res) => {

  const { adminEvaluationId, evaluationId, userId, kpiId, scores, total, grade, comments, year, month } = req.body;

  try {
    // Update department
    const updatedEvaluation = await AdminEvaluation.findByIdAndUpdate(
      adminEvaluationId,
      {
        evaluationId, userId, kpiId, scores, total, grade, year, month, comments,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedEvaluation) {
      return res.json({
        success: false,
        message: "Leave not found!",
      });
    }

    res.json({
      success: true,
      message: "Evaluation updated successfully",
      Evaluation: updatedEvaluation,
    });

  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// API to Add Evaluation by HOD
const hodEvaluation = async (req, res) => {
  try {
    const { userId, kpiId, scores, total, grade, comments, year, month } = req.body;

    if (!userId || !scores || total == null || !grade) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const newEvaluation = new Evaluation({
      userId,
      kpiId,
      scores,
      total,
      grade,
      comments,
      year,
      month,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await newEvaluation.save();

    res.status(200).json({ success: true, message: "Evaluation saved." });
  } catch (err) {
    console.error("Evaluation error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



// API to update HOD Evaluation
const updateEvaluation = async (req, res) => {

  const { evaluationId, userId, kpiId, scores, total, grade, comments, year, month } = req.body;

  try {
    // Update department
    const updatedEvaluation = await Evaluation.findByIdAndUpdate(
      evaluationId,
      {
        userId, kpiId, scores, total, grade, year, month, comments,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedEvaluation) {
      return res.json({
        success: false,
        message: "Leave not found!",
      });
    }

    res.json({
      success: true,
      message: "Evaluation updated successfully",
      Evaluation: updatedEvaluation,
    });

  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const getAllevaluations = async (req, res) => {
  try {
    // Get all evaluations submitted by HOD
    const evaluations = await Evaluation.find()
      .populate('userId', 'name email role profileImage')
      .populate('kpiId', 'scores total grade comments userId month year');


    const results = await Promise.all(
      evaluations.map(async (hodEvaluation) => {
        if (!hodEvaluation.kpiId) return null;

        // Fetch admin evaluation linked to this KPI
        const adminEval = await AdminEvaluation.findOne({ kpiId: hodEvaluation.kpiId._id });

        return {
          kpi: hodEvaluation.kpiId,           // the original KPI data
          hodEvaluation,                      // current HOD evaluation
          adminEvaluation: adminEval || null  // optional admin evaluation
        };
      })
    );

    const filteredResults = results.filter((r) => r !== null);

    res.json({ success: true, results: filteredResults });
    console.log("Backend Response:", filteredResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};






// Search users by name
const getUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      name: { $regex: query, $options: 'i' },

    }).select('name _id');

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// API To Get Employee Dashboard
const getEmployeeDashboardData = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await Employee.findOne({ userId })
      .populate('department', 'name')
      .populate('userId', 'name email role profileImage');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const leaves = await Leave.find({ userId });

    const latestSalary = await Salary.findOne({ employeeId: profile._id })
      .sort({ year: -1, payDate: -1 })
      .limit(1);

    return res.status(200).json({
      success: true,
      data: {
        profile,
        leaves,
        latestSalary: latestSalary || null,
      }
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};




// Submit KPI
const submitKpi = async (req, res) => {

  try {
    const { scores, total, grade, comments, year, month } = req.body;
    const userId = req.userId;

    if (!userId || !scores || total == null || !grade) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const userExists = await User.findById(userId);

    if (!userExists) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const newKpi = new Kpi({
      userId,
      scores,
      total,
      grade,
      comments,
      year,
      month,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await newKpi.save();

    res.json({ success: true, message: 'KPI submitted successfully' });
  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({ success: false, message: 'Error submitting KPI' });
  }

};



// Get KPIs for logged-in employee
const getKpi = async (req, res) => {
  try {
    const userId = req.userId;

    // Step 1: Get all KPIs for this employee
    const kpis = await Kpi.find({ userId }).sort({ submittedAt: -1 })
      .populate('userId', 'name email department');

    // Step 2: Match each KPI with its HOD and Admin evaluations if they exist
    const results = await Promise.all(kpis.map(async (kpi) => {
      const hodEvaluation = await Evaluation.findOne({ kpiId: kpi._id })
        .populate('userId', 'name email department');
      const adminEval = await AdminEvaluation.findOne({ kpiId: kpi._id })
        .populate('userId', 'name email department');

      return {
        kpi,
        hodEvaluation: hodEvaluation || null, // Will be null if not yet evaluated
        adminEvaluation: adminEval || null
      };
    }));

    res.json({ success: true, records: results });
  } catch (error) {
    console.error("Error fetching KPI with evaluations:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Get KPIs for employees in the same department as the logged-in user
const getKpiByDepartment = async (req, res) => {
  try {
    const userId = req.userId;

    // Step 1: Verify HOD and get department
    const hod = await Employee.findOne({ userId }).populate('department');
    if (!hod || hod.designation !== 'HOD') {
      return res.status(403).json({ success: false, message: 'Access denied. Only HODs can access this.' });
    }

    const departmentId = hod.department._id;

    // Step 2: Get userIds of employees in the same department
    const employeesInDept = await Employee.find({ department: departmentId }).select('userId');
    const userIds = employeesInDept.map(emp => emp.userId);

    // Step 3: Fetch all KPIs for these users
    const kpis = await Kpi.find({ userId: { $in: userIds } })
      .sort({ submittedAt: -1 })
      .populate({
        path: 'userId',
        select: 'name email department profileImage',
        populate: {
          path: 'department',
          select: 'name'
        }
      });

    // Step 4: For each KPI, find the related HOD and Admin evaluations
    const results = await Promise.all(kpis.map(async (kpi) => {
      const hodEvaluation = await Evaluation.findOne({ kpiId: kpi._id });
      const adminEval = await AdminEvaluation.findOne({ kpiId: kpi._id });

      return {
        kpi,
        hodEvaluation: hodEvaluation || null, // Will be null if not yet evaluated
        adminEvaluation: adminEval || null
      };
    }));

    res.json({ success: true, departmentKpi: results });

  } catch (err) {
    console.error('Error fetching KPI records by department:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


// Upload attendance and parse Excel

const uploadAttendance = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filePath = path.join('public', 'upload', req.file.filename);
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  const records = [];

  for (const row of data) {
    const staffId = (row.staffId || '').trim().toLowerCase();
    if (!staffId) {
      console.warn('Missing staffId in row:', row);
      continue;
    }

    const employee = await Employee.findOne({ staffId });
    if (!employee) {
      console.warn(`Employee with staffId ${staffId} not found. Skipping.`);
      continue;
    }

    // Parse Excel date
    let excelDate = row['Date'];
    let date;
    if (typeof excelDate === 'number') {
      date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
    } else {
      date = new Date(excelDate);
    }

    // Map numeric status to string status
    let statusCode = (row['Status'] || '').toString().trim();
    let status;

    if (statusCode === '1') status = 'Present';
    else if (statusCode === '-1') status = 'Absent';
    else if (statusCode === '2') status = 'Leave';
    else if (statusCode === '3') status = 'overTime';
    else if (statusCode === '4') status = 'offDuty';
    else {
      console.warn(`Invalid status '${statusCode}' for staffId ${staffId}`);
      continue;
    }

    records.push({
      employeeId: employee._id,
      date,
      status,
    });
  }

  if (records.length > 0) {
    await Attendance.insertMany(records);
  }

  res.json({
    success: true,
    message: `Attendance uploaded successfully. ${records.length} records inserted.`,
  });
};


// to report Attendance
const getAttendance = async (req, res) => {
  try {
    const [year, month] = req.params.month.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(year, month, 0); // Last day of month

    const report = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('employeeId', 'name staffId');

    res.json({ success: true, report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error generating report' });
  }
};



// API to Get All Attendance
const getAllAttendance = async (req, res) => {
  try {
    const grouped = await Attendance.aggregate([

      {
        $project: {
          yearMonth: {
            $dateToString: { format: "%Y-%m", date: "$date" }
          },
          employeeId: 1,
          date: 1,
          status: 1
        }
      },
      {
        $group: {
          _id: "$yearMonth",
          records: {
            $push: {
              employeeId: "$employeeId",
              date: "$date",
              status: "$status"
            }
          }
        }
      },
      {
        $sort: { _id: -1 } // Newest month first
      }

    ])

    res.json({ success: true, groupedAttendance: grouped });
  } catch (error) {
    console.error("Group Error:", error);
    res.status(500).json({ success: false, message: 'Failed to group attendance' });
  }
};

// Apply for a loan
const applyLoan = async (req, res) => {
  const { amount, durationInMonths, reason } = req.body;
  const userId = req.userId;

  try {
    const monthDeduction = (amount / durationInMonths).toFixed(2);

    const newLoan = new Loan({
      userId,
      amount,
      durationInMonths,
      monthDeduction,
      reason,
      createdAt: Date.now(),

    });

    await newLoan.save();

    res.json({ success: true, message: "Loan application submitted", loan: newLoan });
  } catch (error) {
    console.error(error); // Log it
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


// Update an existing loan
const updateLoan = async (req, res) => {
  const { loanId, durationInMonths, reason, approvedAmount } = req.body;
  const userId = req.userId;

  try {
    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    // Only update reason, approvedAmount, and duration
    loan.reason = reason;
    loan.approvedAmount = approvedAmount;
    loan.durationInMonths = durationInMonths;

    // Calculate monthly deduction using approved amount
    loan.monthDeduction = (approvedAmount / durationInMonths).toFixed(2);

    await loan.save();

    res.json({ success: true, message: "Loan updated successfully", loan });
  } catch (error) {
    console.error("Loan update error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};




// Get all loans (admin)
const getAllyLoan = async (req, res) => {
  try {
    const loans = await Loan.find().populate("userId", "name email")
    res.json({ success: true, loans });

  } catch (error) {
    res.status(500).json({ success: false, error });
  }
};

// Get loans for the logged-in user only
const getEmployeeLoan = async (req, res) => {
  try {
    const userId = req.userId; // Ensure your auth middleware sets this

    const loans = await Loan.find({ userId }).populate("userId", "name email");

    res.json({ success: true, loans });
  } catch (error) {
    console.error("Error fetching user loans:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// Approve or Reject Loan
const approveRejectLoan = async (req, res) => {
  const { loanId, status } = req.body;

  try {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    loan.status = status;

    if (
      status === 'Approved' &&
      (!loan.approvedAmount || loan.approvedAmount === "") // if not set
    ) {
      loan.approvedAmount = loan.amount; // fallback to requested amount
      loan.approvedAt = new Date();
      loan.monthDeduction = Math.ceil(loan.approvedAmount / loan.durationInMonths); // optional: auto set monthly deduction
    }

    await loan.save();

    res.json({ success: true, message: `Loan ${status.toLowerCase()}`, loan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};






 


export {
  addDepartment, getAllDepartment, updateDepartment, addSalary, getEmployeeSalaries,
  addEmployee, getAllEmployees, updateEmployee, deleteEmployee, addLeave, updateLeave,
  getAllLeaves, deleteLeave, getEmployeeLeaves, approveLeave, rejectLeave, getAllSalaries,
  changePassword, forgotPassword, resetPassword, getLeaveToHod, approveHodLeave, rejectHodLeave,
  getAllevaluations, updateEvaluation, getUsers, getEmployeeDashboardData, fetchEmployees,
  submitKpi, getKpi, hodEvaluation, getKpiByDepartment, adminEvaluation, updateAdminEvaluation,
  uploadAttendance, getAttendance, getAllAttendance, resumeLeave, deactivateEmployee, getEmployeesByStatus,
  applyLoan, getAllyLoan, approveRejectLoan, updateLoan, getEmployeeLoan,getAllUsers,

}