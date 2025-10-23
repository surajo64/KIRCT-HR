import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, default: 0 },
  transportAllowance: { type: Number, default: 0 },
  mealAllowance: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 0 },
  overtimeAmount: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  
  // Tax fields
  payeTax: { type: Number, default: 0 },
  withholdingTax: { type: Number, default: 0 }, // Add this field
  
  // Pension fields
  pension: { type: Number, default: 0 },
  employerPension: { type: Number, default: 0 },
  employeePension: { type: Number, default: 0 },
  
  // Deductions
  loanDeductions: { type: Number, default: 0 },
  nonTaxPay: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  
  // Final amount
  netSalary: { type: Number, default: 0 },
  
  // Status
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  
  // Loan details
  loanDetails: [{
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    amount: Number,
    approvedAmount: Number,
    monthlyDeduction: Number,
    totalRepaid: Number
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Payroll = mongoose.model('Payroll', payrollSchema);
export default Payroll;