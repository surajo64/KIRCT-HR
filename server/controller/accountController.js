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
import Bonus from '../models/BonusModel.js';



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

      // Calculate salary components
      const basicSalary = employee.basicSalary || 0;
      const annualRent = employee.rent || 0;
      const overtimeHours = 0;
      const nonTaxPay = employee.nonTaxPay || 0;
      const overtimeRate = employee.overtimeRate || 0;
      const overtimeAmount = overtimeHours * overtimeRate;
      const transportAllowance = 0;
      const mealAllowance = basicSalary * 0.20;
      const grossSalary = basicSalary + overtimeAmount + transportAllowance + mealAllowance;

      // Initialize tax and pension variables
      let employerPension = 0;
      let employeePension = 0;
      let totalPension = 0;
      let payeTax = 0;
      let withholdingTax = 0;


      // Tax calculation based on staff type
      if (staffType.toLowerCase() === "permanent") {
        // Calculate PAYE Tax for permanent staff
        payeTax = calculatePAYETax(grossSalary, basicSalary, annualRent);

        // Calculate pension for permanent staff
        employerPension = basicSalary * 0.10;
        employeePension = basicSalary * 0.08;
        totalPension = employerPension + employeePension;

        // Permanent staff don't pay withholding tax
        withholdingTax = 0;
      } else {
        // Calculate withholding tax for non-permanent staff (5%)
        withholdingTax = grossSalary * 0.05;

        // Non-permanent staff don't have pension or PAYE tax
        payeTax = 0;
        employerPension = 0;
        employeePension = 0;
        totalPension = 0;
      }

      // Final rounding
      payeTax = Number(payeTax.toFixed(2));
      withholdingTax = Number(withholdingTax.toFixed(2));

      // Calculate total deductions and net salary
      const totalDeductions = employeePension + payeTax + withholdingTax + totalLoanDeductions;
      const netSalary = grossSalary - totalDeductions + nonTaxPay;

      // Create payroll object
      const payrollData = {
        employee: employee._id,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary: basicSalary,
        transportAllowance: transportAllowance,
        mealAllowance: mealAllowance,
        overtimeHours: overtimeHours,
        overtimeRate: overtimeRate,
        overtimeAmount: overtimeAmount,
        loanDeductions: totalLoanDeductions,
        grossSalary: grossSalary,
        pension: totalPension,
        employerPension: employerPension,
        employeePension: employeePension,
        payeTax: payeTax,
        withholdingTax: withholdingTax,
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

// Separate function for PAYE tax calculation (for better organization)
const calculatePAYETax = (grossSalary, basicSalary, annualRent) => {
  // Step 1: Compute Annual Gross Income
  const annualGrossIncome = grossSalary * 12;

  // Step 2: Annual Pension (employee contribution only for tax calculation)
  const annualPension = (basicSalary * 0.08) * 12;

  // Step 3: Compute CRA (Consolidated Relief Allowance)
  const cra = Math.min(500000, 0.20 * annualRent);

  // Step 4: Taxable Income
  const taxableIncome = Math.max(annualGrossIncome - (annualPension + cra), 0);

  // Step 5: Apply 2026 Nigerian PAYE Tax Bands
  let totalTax = 0;
  let remaining = taxableIncome;
  console.log("initail reming:", remaining)
  const taxBands = [
    { limit: 800000, rate: 0.00 },
    { limit: 3000000, rate: 0.15 },
    { limit: 12000000, rate: 0.18 },
    { limit: 25000000, rate: 0.21 },
    { limit: 50000000, rate: 0.23 },
    { limit: Infinity, rate: 0.25 }
  ];

  let previousLimit = 0;

  for (const band of taxBands) {
    if (remaining <= 0) break;

    const bandAmount = Math.min(remaining, band.limit);
    if (bandAmount > 0) {
      totalTax += bandAmount * band.rate;
    }

    remaining -= bandAmount;

    previousLimit = band.limit;
  }

  // Step 6: Convert annual tax to monthly
  return totalTax / 12;

};

export const updatePayroll = async (req, res) => {
  try {
    const {
      payrollId,
      overtimeHours,
      loanDeductions,
      nonTaxPay,
      withholdingTax,
      transportAllowance,
    } = req.body;

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll not found" });
    }

    // 🔄 Update editable fields
    if (overtimeHours !== undefined) payroll.overtimeHours = parseFloat(overtimeHours) || 0;
    if (loanDeductions !== undefined) payroll.loanDeductions = parseFloat(loanDeductions) || 0;
    if (nonTaxPay !== undefined) payroll.nonTaxPay = parseFloat(nonTaxPay) || 0;
    if (withholdingTax !== undefined) payroll.withholdingTax = parseFloat(withholdingTax) || 0;
    if (transportAllowance !== undefined)
      payroll.transportAllowance = parseFloat(transportAllowance) || 0;

    // ⚙️ Recalculate core values
    payroll.overtimeAmount = payroll.overtimeHours * payroll.overtimeRate;
    payroll.grossSalary =
      payroll.basicSalary +
      payroll.overtimeAmount +
      payroll.transportAllowance +
      (payroll.mealAllowance || 0);

    // ✅ Get annualRent from Employee record
    const employee = await Employee.findById(payroll.employee);
    const annualRent = employee?.rent || 0;

    // ✅ Recalculate PAYE using same logic
    payroll.payeTax = calculatePAYETax(
      payroll.grossSalary,
      payroll.basicSalary,
      annualRent
    );

    // ✅ Recalculate deductions & net
    const totalDeductions =
      payroll.payeTax + payroll.withholdingTax + payroll.loanDeductions + (payroll.employeePension || 0);

    payroll.totalDeductions = totalDeductions;
    payroll.netSalary = payroll.grossSalary + payroll.nonTaxPay - totalDeductions;

    await payroll.save();

    res.json({
      success: true,
      message: "Payroll updated successfully with correct PAYE",
      data: payroll,
    });
  } catch (error) {
    console.error("❌ Error updating payroll:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// Download Excel

export const downloadExcel = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Fetch payrolls for the given month/year
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    })
      .populate({
        path: 'employee',
        select: 'name staffId bankAccount department overtimeRate type userId',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'userId', select: 'name' }
        ]
      })
      .lean();

    if (!payrolls.length) {
      return res.status(404).json({
        success: false,
        message: `No payroll data found for ${month}/${year}`
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll');

    // Add a title row for selected month/year
    worksheet.addRow([`Payroll Report for Month: ${month}, Year: ${year}`]);
    worksheet.addRow([]); // empty row for spacing

    // Define columns - CORRECTED: Added Month and Year columns
    worksheet.columns = [
      { header: 'S/N', key: 'sn', width: 8 },
      { header: 'Staff ID', key: 'staffId', width: 15 },
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Month', key: 'monthColumn', width: 12 }, // Changed key to avoid conflict
      { header: 'Year', key: 'yearColumn', width: 12 },   // Changed key to avoid conflict
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

    // Style header row
    const headerRow = worksheet.getRow(3); // actual header after title + empty row
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'FF2E86AB' } 
    };
    headerRow.alignment = { horizontal: 'center' };

    // Helper function to get month name
    const getMonthName = (monthNum) => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[parseInt(monthNum) - 1] || monthNum;
    };

    // Add payroll data rows - CORRECTED: Include month and year data
    payrolls.forEach((payroll, index) => {
      const emp = payroll.employee;
      const rowData = {
        sn: index + 1,
        staffId: emp?.staffId || 'N/A',
        name: emp?.userId?.name || emp?.name || 'Unknown',
        department: emp?.department?.name || 'N/A',
        monthColumn: getMonthName(payroll.month), // Use the correct key
        yearColumn: payroll.year, // Use the correct key
        bankName: emp?.bankAccount?.bankName || 'N/A',
        accountNumber: emp?.bankAccount?.accountNumber || 'N/A',
        accountName: emp?.bankAccount?.accountName || 'N/A',
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

      console.log(`Row ${index + 1} month/year data:`, {
        monthColumn: rowData.monthColumn,
        yearColumn: rowData.yearColumn
      });

      worksheet.addRow(rowData);
    });

    // Set numeric formatting (currency & hours) - CORRECTED column references
    const currencyCols = ['J','K','L','N','O','P','Q','R','S','T','U','V','W','X','Y'];
    currencyCols.forEach(col => {
      const column = worksheet.getColumn(col);
      if (col === 'M') { 
        // Overtime Hours column
        column.numFmt = '0.00'; 
        column.alignment = { horizontal: 'right' }; 
      } else { 
        // Currency columns
        column.numFmt = '"₦"#,##0.00'; 
        column.alignment = { horizontal: 'right' }; 
      }
    });

    // Align columns - CORRECTED column references
    // Center align: S/N, Staff ID, Month, Year, Status
    ['A','B','E','F','Z'].forEach(col => {
      const column = worksheet.getColumn(col);
      if (column) {
        column.alignment = { horizontal: 'center' };
      }
    });
    
    // Left align: Name, Department, Bank fields
    ['C','D','G','H','I'].forEach(col => {
      const column = worksheet.getColumn(col);
      if (column) {
        column.alignment = { horizontal: 'left' };
      }
    });

    // Add summary row - CORRECTED: Include empty month/year columns
    const lastRow = worksheet.rowCount;
    worksheet.addRow([]); // Empty row for spacing

    const summaryRow = worksheet.addRow({
      sn: 'TOTAL',
      staffId: '',
      name: '',
      department: '',
      monthColumn: '', // Empty for month
      yearColumn: '',  // Empty for year
      bankName: '',
      accountNumber: '',
      accountName: '',
      basicSalary: { formula: `SUM(J4:J${lastRow})` },
      transportAllowance: { formula: `SUM(K4:K${lastRow})` },
      mealAllowance: { formula: `SUM(L4:L${lastRow})` },
      overtimeHours: { formula: `SUM(M4:M${lastRow})` },
      overtimeAmount: { formula: `SUM(O4:O${lastRow})` },
      grossSalary: { formula: `SUM(P4:P${lastRow})` },
      employeePension: { formula: `SUM(Q4:Q${lastRow})` },
      employerPension: { formula: `SUM(R4:R${lastRow})` },
      pension: { formula: `SUM(S4:S${lastRow})` },
      payeTax: { formula: `SUM(T4:T${lastRow})` },
      withholdingTax: { formula: `SUM(U4:U${lastRow})` },
      loanDeductions: { formula: `SUM(V4:V${lastRow})` },
      nonTaxPay: { formula: `SUM(W4:W${lastRow})` },
      totalDeductions: { formula: `SUM(X4:X${lastRow})` },
      netSalary: { formula: `SUM(Y4:Y${lastRow})` },
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
    const summaryCurrencyCols = ['J','K','L','O','P','Q','R','S','T','U','V','W','X','Y'];
    summaryCurrencyCols.forEach(col => {
      const cell = summaryRow.getCell(col);
      cell.numFmt = '"₦"#,##0.00';
    });

    // Format overtime hours in summary
    summaryRow.getCell('M').numFmt = '0.00';

    // Set response headers and send Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payroll-${month}-${year}.xlsx`);
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log(`Excel file generated successfully with ${payrolls.length} records`);
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



// controllers/bonusController.js
export const calculateAnnualBonus = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.body;

    // ✅ Check only if 13 Month bonuses exist for this year (not other types)
    const existing = await Bonus.findOne({ year, type: "13 Month" });
    if (existing) {
      return res.json({
        success: false,
        message: "Bonus for this year already exists.",
      });
    }

    // ✅ Get only permanent, active employees
    const permanentEmployees = await Employee.find({
      type: "permanent",
      status: true,
    }).populate("department", "name");

    if (!permanentEmployees.length) {
      return res.status(404).json({
        success: false,
        message: "No permanent employees found.",
      });
    }

    const bonusCalculations = [];
    const errors = [];

    for (const employee of permanentEmployees) {
      try {
        if (!employee.basicSalary || employee.basicSalary <= 0) {
          errors.push({
            staffId: employee.staffId,
            name: employee.name,
            error: "Basic salary not set or invalid.",
          });
          continue;
        }

        // ✅ Check if this employee already has a 13 Month bonus for this year
        const existingEmployee13 = await Bonus.findOne({
          employee: employee._id,
          year,
          type: "13 Month",
        });

        if (existingEmployee13) {
          // Skip — already has 13 Month bonus
          continue;
        }

        // ✅ Calculate 13th Month bonus
        const annualSalary = employee.basicSalary * 12;
        const oneMonthBasic = employee.basicSalary;
        const tenPercentAnnual = annualSalary * 0.1;
        const totalBonus = oneMonthBasic + tenPercentAnnual;

        const bonusCalculation = {
          employee: employee._id,
          staffId: employee.staffId,
          name: employee.name,
          year,
          type: "13 Month", // Important flag
          basicSalary: employee.basicSalary,
          annualSalary,
          bonusCalculation: {
            oneMonthBasic,
            tenPercentAnnual,
            totalBonus,
          },
          department: employee.department?.name || "",
          bankAccount: {
            bankName: employee.bankAccount?.bankName || "",
            accountNumber: employee.bankAccount?.accountNumber || "",
            accountName: employee.bankAccount?.accountName || "",
          },
          status: "pending",
        };

        bonusCalculations.push(bonusCalculation);
      } catch (error) {
        errors.push({
          staffId: employee.staffId,
          name: employee.name,
          error: error.message,
        });
      }
    }

    if (bonusCalculations.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No new 13 Month bonuses generated. They may already exist for ${year}.`,
      });
    }

    res.json({
      success: true,
      message: `13 Month bonuses calculated for ${bonusCalculations.length} employee(s) for ${year}.`,
      data: bonusCalculations,
      errors,
      summary: {
        totalEmployees: permanentEmployees.length,
        calculated: bonusCalculations.length,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("❌ Bonus calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate bonuses.",
      error: error.message,
    });
  }
};


// Process and save bonus calculations
export const processAnnualBonus = async (req, res) => {
  try {
    const { calculations, year = new Date().getFullYear() } = req.body;
    console.log("Received calculations:", calculations?.[0]);

    if (!calculations || !Array.isArray(calculations)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calculations data",
      });
    }

    const processedBonuses = [];
    const errors = [];

    for (const calc of calculations) {
      try {
        // ✅ Validate required fields
        if (!calc.employee || !calc.staffId || !calc.basicSalary) {
          errors.push({
            staffId: calc.staffId,
            error: "Missing required fields",
          });
          continue;
        }

        let bonusData = {
          ...calc,
          year,
          type: "13 Month", // ✅ Always set to 13 Month
          status: "processed", // ✅ Automatically mark as processed
          processedAt: new Date(),
          updatedAt: new Date(),
        };

        let bonus;

        // ✅ If record already exists, update it
        if (calc._id) {
          bonus = await Bonus.findByIdAndUpdate(calc._id, bonusData, { new: true });
        } else {
          // ✅ Otherwise, create a new bonus record
          bonus = new Bonus(bonusData);
          await bonus.save();
        }

        // ✅ Populate employee details
        await bonus.populate([
          { path: "employee", select: "name staffId bankAccount basicSalary department designation", populate: { path: "department", select: "name designation" } }
        ]);


        processedBonuses.push(bonus);
      } catch (error) {
        errors.push({
          staffId: calc.staffId,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: "13th Month bonuses processed successfully.",
      data: processedBonuses,
      errors,
      summary: {
        processed: processedBonuses.length,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("Bonus processing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bonuses",
      error: error.message,
    });
  }
};


// Get bonus history
export const getBonusHistory = async (req, res) => {
  try {
    const { year, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (year) filter.year = parseInt(year);


    const bonuses = await Bonus.find(filter)
      .populate([
        { path: "employee", select: "name staffId department designation", populate: { path: "department", select: "name designation" } }
      ]).sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bonus.countDocuments(filter);

    res.json({
      success: true,
      data: bonuses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get bonus history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus history",
      error: error.message
    });
  }
};

// Get bonus history
export const getEmployeeBonusHistory = async (req, res) => {
  try {
    const bonuses = await Bonus.find()
      .populate([
        { path: "employee", select: "name staffId department designation", populate: { path: "department", select: "name designation" } }
      ]);


    res.status(200).json({
      success: true,
      bonuses,
    });
  } catch (error) {
    console.error("Get bonus history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus records",
      error: error.message,
    });
  }
};

// Mark bonus as paid
export const markBonusAsPaid = async (req, res) => {
  try {
    const { bonusIds, paymentDate, payrollReference } = req.body;

    if (!bonusIds || !Array.isArray(bonusIds)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bonus IDs"
      });
    }

    const updateResult = await Bonus.updateMany(
      { _id: { $in: bonusIds } },
      {
        status: "paid",
        paymentDate: paymentDate || new Date(),
        payrollReference: payrollReference,
        processedAt: new Date(),
        updatedAt: new Date()
      }
    );

    const updatedBonuses = await Bonus.find({ _id: { $in: bonusIds } })
      .populate('employee', 'name staffId department');

    res.json({
      success: true,
      message: `Successfully marked ${updateResult.modifiedCount} bonuses as paid`,
      data: updatedBonuses
    });

  } catch (error) {
    console.error("Mark bonus as paid error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update bonus status",
      error: error.message
    });
  }
};

// ✅ Export Annual Bonuses to Excel (Stable Version)
export const exportBonusesToExcel = async (req, res) => {
  try {
    const { year } = req.params;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Year parameter is required",
      });
    }

    // ✅ Fetch bonuses for the given year with employee bank info
    const bonuses = await Bonus.find({ year: parseInt(year) })
      .populate({
        path: "employee",
        select: "name staffId department designation bankAccount",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .lean();

    if (!bonuses.length) {
      return res.status(404).json({
        success: false,
        message: `No bonus records found for year ${year}`,
      });
    }

    // ✅ Create workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Annual_Bonuses_${year}`);

    // ✅ Define columns (same styling as payroll format)
    worksheet.columns = [
      { header: "S/N", key: "sn", width: 8 },
      { header: "Staff ID", key: "staffId", width: 15 },
      { header: "Employee Name", key: "name", width: 25 },
      { header: "Department", key: "department", width: 20 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Bank Name", key: "bankName", width: 20 },
      { header: "Account Number", key: "accountNumber", width: 20 },
      { header: "Account Name", key: "accountName", width: 25 },
      { header: "Basic Salary (₦)", key: "basicSalary", width: 18 },
      { header: "Annual Salary (₦)", key: "annualSalary", width: 18 },
      { header: "1-Month Basic Bonus (₦)", key: "oneMonthBasic", width: 22 },
      { header: "10% Annual Bonus (₦)", key: "tenPercentAnnual", width: 22 },
      { header: "Total Bonus (₦)", key: "totalBonus", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Payment Date", key: "paymentDate", width: 20 },
      { header: "Payroll Ref", key: "payrollReference", width: 20 },
    ];

    // ✅ Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E86AB" },
    };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    // ✅ Add data rows
    bonuses.forEach((bonus, index) => {
      const emp = bonus.employee || {};

      worksheet.addRow({
        sn: index + 1,
        staffId: emp.staffId || "N/A",
        name: emp.name || "Unknown Employee",
        department: emp.department?.name || "N/A",
        designation: emp.designation || "N/A",
        bankName: emp.bankAccount?.bankName || "Not Provided",
        accountNumber: emp.bankAccount?.accountNumber || "Not Provided",
        accountName: emp.bankAccount?.accountName || "Not Provided",
        basicSalary: bonus.basicSalary || 0,
        annualSalary: bonus.annualSalary || 0,
        oneMonthBasic: bonus.bonusCalculation?.oneMonthBasic || 0,
        tenPercentAnnual: bonus.bonusCalculation?.tenPercentAnnual || 0,
        totalBonus: bonus.bonusCalculation?.totalBonus || 0,
        status: bonus.status || "Pending",
        paymentDate: bonus.paymentDate
          ? new Date(bonus.paymentDate).toLocaleDateString()
          : "",
        payrollReference: bonus.payrollReference || "",
      });
    });

    // ✅ Numeric formatting (₦)
    const currencyColumns = ["I", "J", "K", "L", "M"];
    currencyColumns.forEach((col) => {
      const column = worksheet.getColumn(col);
      column.numFmt = '"₦"#,##0.00';
      column.alignment = { horizontal: "right" };
    });

    // ✅ Center align specific columns
    const centerColumns = ["A", "B", "N", "O"];
    centerColumns.forEach((col) => {
      worksheet.getColumn(col).alignment = { horizontal: "center" };
    });

    // ✅ Add total summary row
    const lastRow = worksheet.rowCount;
    const totalRow = worksheet.addRow({
      sn: "",
      staffId: "",
      name: "TOTAL BONUS →",
      totalBonus: { formula: `SUM(M2:M${lastRow})` },
    });

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    };
    totalRow.getCell("M").numFmt = '"₦"#,##0.00';

    // ✅ Proper headers for Excel stream
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Annual_Bonuses_${year}.xlsx`
    );

    // ✅ Write to buffer (no corruption)
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);

    console.log(`✅ Bonus Excel generated for year ${year} with ${bonuses.length} rows`);
  } catch (error) {
    console.error("❌ Error exporting bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export bonuses",
      error: error.message,
    });
  }
};


// calculate bonus
export const calculateOtherBonus = async (req, res) => {
  try {
    const { year, type, staffId } = req.body;

    if (!year || !type || !staffId) {
      return res.status(400).json({ success: false, message: "Year, bonus type, and staff ID are required." });
    }

    // ✅ Only allow one Leave Allowance per year
    if (type === "Leave Allowance") {
      const existingBonus = await Bonus.findOne({
        staffId,
        type: "Leave Allowance",
        year,
      });

      if (existingBonus) {
        return res.status(400).json({
          success: false,
          message: `Annual Leave Bonus has already been generated for this employee in ${year}.`,
        });
      }
    }

    // Fetch the employee
    const emp = await Employee.findOne({ staffId, status: true });
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found." });

    const basicSalary = emp.basicSalary || 0;
    const annualSalary = basicSalary * 12;

    let oneMonthBasic = 0;
    let tenPercentAnnual = 0;
    let totalBonus = 0;

    if (type === "Leave Allowance") {
      tenPercentAnnual = annualSalary * 0.1;
      totalBonus = tenPercentAnnual;
    } else {
      totalBonus = basicSalary * 0.05;
    }

    const result = {
      employee: emp._id,
      staffId: emp.staffId,
      name: emp.name,
      basicSalary,
      annualSalary,
      year,
      type,
      bonusCalculation: { oneMonthBasic, tenPercentAnnual, totalBonus },
      status: "pending",
    };

    res.status(200).json({
      success: true,
      message: `${type} bonus calculated for ${emp.name}.`,
      data: [result],
    });
  } catch (error) {
    console.error("❌ calculateOtherBonus error:", error);
    res.status(500).json({ success: false, message: "Failed to calculate bonus.", error: error.message });
  }
};

// process other bonus
export const processOtherBonus = async (req, res) => {
  try {
    const { calculations, year, type } = req.body;

    if (!calculations || calculations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No bonus records provided.",
      });
    }

    let saved = [];

    for (const item of calculations) {
      const existing = await Bonus.findOne({
        staffId: item.staffId,
        year,
        type,
      });

      if (existing) {
        // ✅ Update existing record
        existing.bonusCalculation = item.bonusCalculation;
        existing.basicSalary = item.basicSalary;
        existing.annualSalary = item.annualSalary;
        existing.status = "processed";
        existing.processedAt = new Date();
        await existing.save();
        saved.push(existing);
      } else {
        // ✅ Create new record
        const newBonus = new Bonus({
          ...item,
          status: "processed",
          processedAt: new Date(),
        });
        await newBonus.save();
        saved.push(newBonus);
      }
    }

    res.status(200).json({
      success: true,
      message: `${saved.length} bonuses processed successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error("❌ processOtherBonus error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bonuses.",
      error: error.message,
    });
  }
};

// mark as paid
export const markOtherBonusPaid = async (req, res) => {
  try {
    const { bonusIds, paymentDate, payrollReference, type } = req.body;

    if (!bonusIds || bonusIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No bonus records selected.",
      });
    }

    const bonuses = await Bonus.updateMany(
      { _id: { $in: bonusIds } },
      {
        $set: {
          status: "paid",
          paymentDate,
          payrollReference,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: `${bonuses.modifiedCount} bonuses marked as paid.`,
    });
  } catch (error) {
    console.error("❌ markOtherBonusPaid error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark bonuses as paid.",
      error: error.message,
    });
  }
};

/// ✅ Get Other Bonus (filtered by year, type, and staffId)
export const getOtherBonusHistory = async (req, res) => {
  try {
    const { year, type, staffId } = req.query; // 👈 include staffId

    const query = {};
    if (year) query.year = year;
    if (type) query.type = type;
    if (staffId) query.staffId = staffId; // 👈 filter by staffId

    const bonuses = await Bonus.find(query)
      .populate("employee", "name staffId basicSalary")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bonuses,
    });
  } catch (error) {
    console.error("❌ getOtherBonusHistory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus history.",
      error: error.message,
    });
  }
};

