import mongoose from 'mongoose'

const salarySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  
  // Core Salary Components
  basicSalary: { type: Number, required: true },
  transportAllowance: { type: Number, default: 0 },
  mealAllowance: { type: Number, default: 0 },
  
  // Overtime Details
  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 0 },
  overTime: { type: Number, default: 0 }, // Overtime Amount
  
  // Pension Details
  employeePension: { type: Number, default: 0 },
  employerPension: { type: Number, default: 0 },
  totalPension: { type: Number, default: 0 },
  
  // Tax Components
  paye: { type: Number, default: 0 }, // PAYE Tax
  withholdingTax: { type: Number, default: 0 },
  
  // Deductions
  loan: { type: Number, default: 0 }, // Loan Deductions
  nonTaxPay: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  
  // Net Salary & Growth
  netSalary: { type: Number, default: 0 },
  growthSalary: { type: Number, default: 0 },
  
  // Period Information
  month: { type: String, required: true },
  year: { type: String, required: true },
  payDate: { type: Date, required: true },
  
  // Status (from Excel)
  status: { type: String, default: 'Pending' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
salarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Salary = mongoose.model('Salary', salarySchema);

export default Salary;