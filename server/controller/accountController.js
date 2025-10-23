import jwt from 'jsonwebtoken'
import multer from 'multer'
import bcrypt from 'bcrypt'
import Department from "../models/Department.js";
import User from "../models/User.js";
import Transaction from '../models/transactionModel.js';
import Account from '../models/accountModel.js';
import Budget from "../models/budgetModel.js";
import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import ExcelJS from 'exceljs'; // Add this import at the top
import Loan from '../models/loan.js';



export const createTransaction = async (req, res) => {
  try {
    const { account, description, amount, type, category, date, recurring } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!account || !description || !amount || !type || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'account, description, amount, type, category, and date are required!'
      });
    }

    // Convert amount to number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be either "income" or "expense"' });
    }

    // Make sure account exists
    const userAccount = await Account.findById(account);
    if (!userAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Create transaction
    const transaction = new Transaction({
      userId,
      account,
      description,
      amount: numericAmount,
      type,
      category,
      date: date || new Date(),
      recurring: recurring || false
    });

    // ✅ Update budget if expense
    if (type === "expense") {
      const now = new Date();
      await updateBudgetSpent(userId, category, amount, now.getMonth() + 1, now.getFullYear());
    }

    await transaction.save();

    // Update account balance
    userAccount.balance += type === 'income' ? numericAmount : -numericAmount;
    await userAccount.save();

    // Populate account details for response
    await transaction.populate('account', 'name type');

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne().populate('account', 'name type');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    // Fetch all transactions and populate related account info
    const transactions = await Transaction.find()
      .populate("account", "name type balance currency") // include key fields
      .populate("userId", "name email") // optional: show user info
      .sort({ date: -1 });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found",
      });
    }

    res.status(200).json({
      success: true,
      results: transactions.length,
      data: { transactions },
    });

    console.log("SAMPLE TRANSACTION:", JSON.stringify(transactions[0], null, 2));

  } catch (error) {
    console.error("Error fetching all transactions:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Update account balance (reverse the transaction)
    const account = await Account.findById(transaction.account);
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
      await account.save();
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};


// controllers/accountController.js

//Create Account

export const createAccount = async (req, res) => {
  try {
    const { name, type, balance, currency } = req.body;
    const userId = req.userId; // ✅ set by your auth middleware

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Check how many accounts the user already has
    const accountCount = await Account.countDocuments({ userId });

    // ✅ If no account exists, make this the default one
    const isDefault = accountCount === 0;

    // ✅ Create new account
    const accounts = await Account.create({
      userId,
      name,
      type,
      balance: balance || 0,
      currency: currency || "NGN",
      isDefault,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: accounts,
    });
  } catch (error) {
    console.error("Create Account Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};


// ✅ Get all accounts
export const getAllAccounts = async (req, res) => {
  try {
    console.log("✅ Fetching all accounts...");
    const accounts = await Account.find();
    console.log("✅ Found accounts:", accounts.length);
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error("❌ getAllAccounts Error:", error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

export const getAccountDetail = async (req, res) => {
  try {
    const accountId = req.params.id; // ✅ fixed destructuring

    // Fetch account by ID
    const account = await Account.findById(accountId);

    // Fetch transactions for this account
    const transactions = await Transaction.find({ account: accountId })
      .sort({ date: -1 })
      .lean();

    return res.json({
      success: true,
      account,
      transactions,
    });
  } catch (err) {
    console.error("Error fetching account detail:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



// ✅ Update account
export const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete account
export const deleteAccount = async (req, res) => {
  try {
    await Account.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// controllers/budgetController.js
export const addOrUpdateBudget = async (req, res) => {
  /*  try {*/
  const { account, category, amount, month, year } = req.body;

  if (!account || !category || !amount || !month || !year)
    return res.status(400).json({ success: false, message: "Missing required fields" });

  let budget = await Budget.findOne({ category, month, year });

  if (budget) {
    budget.amount = amount;
    budget.account = account;
    await budget.save();
    return res.json({ success: true, message: "Budget updated", data: budget });
  } else {
    const newBudget = await Budget.create({ account, category, amount, month, year });
    return res.json({ success: true, message: "Budget created", data: newBudget });
  }
  /* } catch (error) {
     console.error("❌ Error in addOrUpdateBudget:", error);
     res.status(500).json({ success: false, message: error.message || "Error saving budget" });
   }*/
};

// @desc  Get budgets for user (filter by month/year)

export const getBudgets = async (req, res) => {
  try {
    const user = req.userId;
    const { month, year } = req.query;

    const filter = { user };
    if (month) filter.month = month;
    if (year) filter.year = year;

    const budgets = await Budget.find(filter).populate("account", "name type");

    res.json({ success: true, data: budgets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching budgets" });
  }
};

// @desc Deduct expenses automatically when new transaction is added
// @used internally from transactionController
export const updateBudgetSpent = async (userId, category, amount, month, year) => {
  try {
    const budget = await Budget.findOne({ user: userId, category, month, year });
    if (budget) {
      budget.spent += amount;
      await budget.save();
    }
  } catch (error) {
    console.error("Error updating budget spent:", error);
  }
};






// Generate payroll for all employees
export const AddPayroll = async (req, res) => {
  try {
    const { month, year, staffType } = req.body;
    if (!staffType) return res.status(400).json({ success: false, message: 'Staff type is required' });


    // Get only active employees of the selected type
    const employees = await Employee.find({ 
      status: true, 
      type: staffType.toLowerCase() 
    }).populate('userId', '_id');

    if (employees.length === 0) {
      return res.json({ success: false, message: `No ${staffType} employees found` });
    }

    const payrollsToInsert = [];

    for (const employee of employees) {
      const existingPayroll = await Payroll.findOne({ 
        employee: employee._id, 
        month, 
        year 
      });
      if (existingPayroll) {
        console.log(`Skipping ${employee.name} - payroll already exists`);
        continue;
      }

   
      // Get active loans for the employee
      const activeLoans = await Loan.find({ 
        userId: employee.userId._id,
        status: 'Approved'
      });

      // Filter loans that are not fully repaid and have valid monthly deductions
      const validActiveLoans = activeLoans.filter(loan => {
        const approvedAmount = typeof loan.approvedAmount === 'string' 
          ? parseFloat(loan.approvedAmount) || 0 
          : loan.approvedAmount || 0;
        
        const totalRepaid = loan.totalRepaid || 0;
        const monthlyDeduction = loan.monthDeduction || 0;
        
        const isNotFullyRepaid = totalRepaid < approvedAmount;
        const hasMonthlyDeduction = monthlyDeduction > 0;
        
        return isNotFullyRepaid && hasMonthlyDeduction;
      });

      // Calculate total loan deductions
      const totalLoanDeductions = validActiveLoans.reduce((sum, loan) => {
        return sum + (loan.monthDeduction || 0);
      }, 0);

      const basicSalary = employee.basicSalary || 0;
      const overtimeHours = 0;
      const overtimeRate = employee.overtimeRate || 0;
      const overtimeAmount = overtimeHours * overtimeRate;
      
      // ✅ UPDATED: Set transport allowance to 0 and meal allowance to 20% of basic
      const transportAllowance = 0; // Set to 0 as requested
      const mealAllowance = basicSalary * 0.20; // 20% of basic salary
      
      const grossSalary = basicSalary + overtimeAmount + transportAllowance + mealAllowance;

      // Initialize all fields with explicit values
      let employerPension = 0;
      let employeePension = 0;
      let totalPension = 0;
      let payeTax = 0;
      let withholdingTax = 0;
      let nonTaxPay = 0;

      

      // ✅ FIXED: Clear logic for employee types
      if (employee.type === 'permanent') {        
        // Calculate PENSION for permanent staff only
        employerPension = basicSalary * 0.10;
        employeePension = basicSalary * 0.08;
        totalPension = employerPension + employeePension;

        // Calculate PAYE TAX for permanent staff only
        const taxableIncome = grossSalary - employeePension;
        const annualTaxableIncome = taxableIncome * 12;
        
        // Nigerian PAYE tax brackets
        if (annualTaxableIncome <= 300000) {
          payeTax = annualTaxableIncome * 0.07;
        } else if (annualTaxableIncome <= 600000) {
          payeTax = 21000 + (annualTaxableIncome - 300000) * 0.11;
        } else if (annualTaxableIncome <= 1100000) {
          payeTax = 54000 + (annualTaxableIncome - 600000) * 0.15;
        } else if (annualTaxableIncome <= 1600000) {
          payeTax = 129000 + (annualTaxableIncome - 1100000) * 0.19;
        } else if (annualTaxableIncome <= 3200000) {
          payeTax = 224000 + (annualTaxableIncome - 1600000) * 0.21;
        } else {
          payeTax = 560000 + (annualTaxableIncome - 3200000) * 0.24;
        }

        payeTax = payeTax / 12;
        withholdingTax = 0; // ✅ Explicitly set to 0 for permanent staff

      } else {

        // ✅ Calculate WITHHOLDING TAX for non-permanent staff only (5% of gross)
        withholdingTax = grossSalary * 0.05;
        
        // ✅ Explicitly set all other fields to 0 for non-permanent staff
        employerPension = 0;
        employeePension = 0;
        totalPension = 0;
        payeTax = 0; // ✅ CRITICAL: Set PAYE tax to 0 for non-permanent staff
      }

      // Calculate total deductions and net salary
      const totalDeductions = employeePension + payeTax + withholdingTax + totalLoanDeductions + nonTaxPay;
      const netSalary = grossSalary - totalDeductions;

      // ✅ Create payroll object with ALL fields explicitly set
      const payrollData = {
        employee: employee._id,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary: basicSalary,
        transportAllowance: transportAllowance, // ✅ Set to 0
        mealAllowance: mealAllowance, // ✅ Set to 20% of basic
        overtimeHours: overtimeHours,
        overtimeRate: overtimeRate,
        overtimeAmount: overtimeAmount,
        loanDeductions: totalLoanDeductions,
        grossSalary: grossSalary,
        pension: totalPension,
        employerPension: employerPension,
        employeePension: employeePension,
        payeTax: payeTax,                    // Should be 0 for non-permanent
        withholdingTax: withholdingTax,       // Should be calculated for non-permanent
        nonTaxPay: nonTaxPay,
        totalDeductions: totalDeductions,
        netSalary: netSalary,
        status: 'Pending',
        loanDetails: validActiveLoans.map(loan => ({
          loanId: loan._id,
          amount: loan.amount,
          approvedAmount: loan.approvedAmount,
          monthlyDeduction: loan.monthDeduction,
          totalRepaid: loan.totalRepaid
        }))
      };

      payrollsToInsert.push(payrollData);
    }

    if (payrollsToInsert.length === 0) {
      return res.json({ success: false, message: 'No new payroll to generate for selected period' });
    }



    // Insert payroll records
    const createdPayrolls = await Payroll.insertMany(payrollsToInsert);
    
    const savedPayrolls = await Payroll.find({
      _id: { $in: createdPayrolls.map(p => p._id) }
    });
    
    await Payroll.populate(createdPayrolls, { 
      path: 'employee', 
      select: 'name staffId bankAccount department overtimeRate type userId',
      populate: [
        { 
          path: 'department', 
          select: 'name' 
        },
        {
          path: 'userId',
          select: 'name email'
        }
      ]
    });

    res.json({ 
      success: true, 
      message: `Payroll generated for ${createdPayrolls.length} employees`, 
      data: createdPayrolls 
    });

  } catch (error) {
    console.error('Error generating payroll:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// Update Payroll
// Update Payroll
export const updatePayroll = async (req, res) => {
  try {
    const { 
      payrollId, 
      overtimeHours, 
      loanDeductions, 
      nonTaxPay, 
      withholdingTax,
      transportAllowance
      
    } = req.body;

    console.log('🔧 UPDATE PAYROLL REQUEST BODY:', req.body);
    console.log('📦 Transport Allowance received:', transportAllowance);

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    console.log('📊 Before update - Transport Allowance:', payroll.transportAllowance);

    // Update fields
    if (overtimeHours !== undefined) payroll.overtimeHours = parseFloat(overtimeHours) || 0;
    if (loanDeductions !== undefined) payroll.loanDeductions = parseFloat(loanDeductions) || 0;
    if (nonTaxPay !== undefined) payroll.nonTaxPay = parseFloat(nonTaxPay) || 0;
    if (withholdingTax !== undefined) payroll.withholdingTax = parseFloat(withholdingTax) || 0;
    
    // ✅ Update transport allowance
    if (transportAllowance !== undefined) {
      payroll.transportAllowance = parseFloat(transportAllowance) || 0;
      console.log('✅ Transport Allowance updated to:', payroll.transportAllowance);
    }

    // Recalculate overtime amount
    payroll.overtimeAmount = payroll.overtimeHours * payroll.overtimeRate;
    
    // Recalculate gross salary with allowances
    payroll.grossSalary = payroll.basicSalary + payroll.overtimeAmount + payroll.transportAllowance + payroll.mealAllowance;
    
    // Recalculate net salary
    const totalDeductions = payroll.employeePension + payroll.payeTax + payroll.withholdingTax + payroll.loanDeductions + payroll.nonTaxPay;
    payroll.netSalary = payroll.grossSalary - totalDeductions;

    // Update total deductions field
    payroll.totalDeductions = totalDeductions;

    console.log('💰 After recalculation - Gross:', payroll.grossSalary, 'Net:', payroll.netSalary);

    await payroll.save();

    console.log('✅ Payroll saved successfully');

    res.json({ 
      success: true, 
      message: 'Payroll updated successfully', 
      data: payroll 
    });

  } catch (error) {
    console.error('❌ Error updating payroll:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download Excel
export const downloadExcel = async (req, res) => {
  try {
    const { month, year } = req.query;

    console.log('Download Excel request received:', { month, year });

    // Validate inputs
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Find payrolls with detailed population
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    })
      .populate({
        path: 'employee',
        select: 'name staffId bankAccount department overtimeRate type userId',
        populate: [
          {
            path: 'department',
            select: 'name'
          },
          {
            path: 'userId',
            select: 'name'
          }
        ]
      })
      .lean();

    console.log(`Found ${payrolls.length} payroll records for ${month}/${year}`);

    if (payrolls.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No payroll data found for ${month}/${year}`
      });
    }

    // Log a sample to check data structure
    console.log('Sample payroll data:', {
      name: payrolls[0]?.employee?.userId?.name,
      basicSalary: payrolls[0]?.basicSalary,
      transportAllowance: payrolls[0]?.transportAllowance,
      mealAllowance: payrolls[0]?.mealAllowance,
      overtimeRate: payrolls[0]?.overtimeRate,
      grossSalary: payrolls[0]?.grossSalary
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll');

    // Updated columns to match Payroll Schema
    worksheet.columns = [
      { header: 'S/N', key: 'sn', width: 8 },
      { header: 'Staff ID', key: 'staffId', width: 15 },
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Bank Name', key: 'bankName', width: 20 },
      { header: 'Account Number', key: 'accountNumber', width: 20 },
      { header: 'Account Name', key: 'accountName', width: 25 },
      { header: 'Basic Salary (₦)', key: 'basicSalary', width: 18 },
      { header: 'Transport Allowance (₦)', key: 'transportAllowance', width: 22 },
      { header: 'Meal Allowance (₦)', key: 'mealAllowance', width: 18 },
      { header: 'Overtime Hours', key: 'overtimeHours', width: 15 },
      { header: 'Overtime Rate (₦)', key: 'overtimeRate', width: 18 },
      { header: 'Overtime Amount (₦)', key: 'overtimeAmount', width: 18 },
      { header: 'Gross Salary (₦)', key: 'grossSalary', width: 18 },
      { header: 'Employee Pension (₦)', key: 'employeePension', width: 20 },
      { header: 'Employer Pension (₦)', key: 'employerPension', width: 20 },
      { header: 'Total Pension (₦)', key: 'pension', width: 18 },
      { header: 'PAYE Tax (₦)', key: 'payeTax', width: 15 },
      { header: 'Withholding Tax (₦)', key: 'withholdingTax', width: 18 },
      { header: 'Loan Deductions (₦)', key: 'loanDeductions', width: 18 },
      { header: 'Non-Tax Pay (₦)', key: 'nonTaxPay', width: 18 },
      { header: 'Total Deductions (₦)', key: 'totalDeductions', width: 18 },
      { header: 'Net Salary (₦)', key: 'netSalary', width: 18 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Add header styling
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E86AB' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // Add data rows with all fields from Payroll Schema
    payrolls.forEach((payroll, index) => {
      const employee = payroll.employee;
      
      const rowData = {
        sn: index + 1,
        staffId: employee?.staffId || 'N/A',
        name: employee?.userId?.name || employee?.name || 'Unknown Employee',
        department: employee?.department?.name || 'N/A',
        bankName: employee?.bankAccount?.bankName || 'Not provided',
        accountNumber: employee?.bankAccount?.accountNumber || 'Not provided',
        accountName: employee?.bankAccount?.accountName || 'Not provided',
        basicSalary: payroll.basicSalary || 0,
        transportAllowance: payroll.transportAllowance || 0,
        mealAllowance: payroll.mealAllowance || 0,
        overtimeHours: payroll.overtimeHours || 0,
        overtimeRate: payroll.overtimeRate || 0,
        overtimeAmount: payroll.overtimeAmount || 0,
        grossSalary: payroll.grossSalary || 0,
        employeePension: payroll.employeePension || 0,
        employerPension: payroll.employerPension || 0,
        pension: payroll.pension || 0,
        payeTax: payroll.payeTax || 0,
        withholdingTax: payroll.withholdingTax || 0,
        loanDeductions: payroll.loanDeductions || 0,
        nonTaxPay: payroll.nonTaxPay || 0,
        totalDeductions: payroll.totalDeductions || 0,
        netSalary: payroll.netSalary || 0,
        status: payroll.status || 'Pending'
      };

      console.log(`Adding row ${index + 1}:`, {
        name: rowData.name,
        basicSalary: rowData.basicSalary,
        transportAllowance: rowData.transportAllowance,
        mealAllowance: rowData.mealAllowance,
        grossSalary: rowData.grossSalary
      });

      worksheet.addRow(rowData);
    });

    // Format numeric columns
    const currencyColumns = ['H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];
    currencyColumns.forEach(col => {
      const column = worksheet.getColumn(col);
      if (col === 'K') { // Overtime Hours (column K)
        column.numFmt = '0.00';
        column.alignment = { horizontal: 'right' };
      } else { // Currency columns
        column.numFmt = '"₦"#,##0.00';
        column.alignment = { horizontal: 'right' };
      }
    });

    // Center align specific columns
    const centerAlignColumns = ['A', 'B', 'X']; // S/N, Staff ID, Status
    centerAlignColumns.forEach(col => {
      worksheet.getColumn(col).alignment = { horizontal: 'center' };
    });

    // Left align text columns
    const leftAlignColumns = ['C', 'D', 'E', 'F', 'G']; // Name, Department, Bank fields
    leftAlignColumns.forEach(col => {
      worksheet.getColumn(col).alignment = { horizontal: 'left' };
    });

    // Add summary row
    const lastRow = worksheet.rowCount;
    worksheet.addRow([]); // Empty row for spacing

    // Summary row with formulas for all monetary columns
    const summaryRow = worksheet.addRow({
      sn: 'TOTAL',
      staffId: '',
      name: '',
      department: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      basicSalary: { formula: `SUM(H2:H${lastRow})` },
      transportAllowance: { formula: `SUM(I2:I${lastRow})` },
      mealAllowance: { formula: `SUM(J2:J${lastRow})` },
      overtimeHours: { formula: `SUM(K2:K${lastRow})` },
      overtimeAmount: { formula: `SUM(M2:M${lastRow})` },
      grossSalary: { formula: `SUM(N2:N${lastRow})` },
      employeePension: { formula: `SUM(O2:O${lastRow})` },
      employerPension: { formula: `SUM(P2:P${lastRow})` },
      pension: { formula: `SUM(Q2:Q${lastRow})` },
      payeTax: { formula: `SUM(R2:R${lastRow})` },
      withholdingTax: { formula: `SUM(S2:S${lastRow})` },
      loanDeductions: { formula: `SUM(T2:T${lastRow})` },
      nonTaxPay: { formula: `SUM(U2:U${lastRow})` },
      totalDeductions: { formula: `SUM(V2:V${lastRow})` },
      netSalary: { formula: `SUM(W2:W${lastRow})` },
      status: ''
    });

    // Style summary row
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };

    // Format summary row currency cells
    const summaryCurrencyColumns = ['H', 'I', 'J', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];
    summaryCurrencyColumns.forEach(col => {
      const cell = summaryRow.getCell(col);
      cell.numFmt = '"₦"#,##0.00';
    });

    // Format overtime hours in summary
    summaryRow.getCell('K').numFmt = '0.00';

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payroll-${month}-${year}.xlsx`);

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    console.log('Excel file generated successfully with all Payroll Schema fields');
    res.send(buffer);

  } catch (error) {
    console.error('Error in downloadExcel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Excel file: ' + error.message
    });
  }
};

// Get Payroll - robust version
export const GetPayroll = async (req, res) => {
  try {
    const { month, year, staffType } = req.query;

    // Build filter for month/year
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    // Build employee filter (case-insensitive)
    let employeeFilter = {};
    if (staffType) {
      employeeFilter.type = new RegExp(`^${staffType}$`, 'i'); // matches 'permanent', 'Permanent', etc.
    }

    // Fetch payrolls and populate employee & department info
    const payrolls = await Payroll.find(filter)
      .populate({
        path: 'employee',
        match: employeeFilter, // only match type if provided
        select: 'staffId name bankAccount department overtimeRate type',
        populate: { path: 'department', select: 'name' },
      });

    // Remove payrolls where employee is null (only if employeeFilter was applied)
    const filteredPayrolls = staffType ? payrolls.filter(p => p.employee) : payrolls;

    console.log('Payrolls returned:', filteredPayrolls.length);

    res.json({
      success: true,
      data: filteredPayrolls,
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};