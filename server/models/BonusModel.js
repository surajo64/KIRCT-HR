import { request } from "express";
import mongoose, { Schema } from "mongoose";


const bonusSchema = new mongoose.Schema({
  employee: { 
    type: Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  staffId: {
    type: String,
    required: true
  },
   type: {
    type: String,
    enum: ["13 Month", "Leave Allowance", "Others"],
    default: "pending"
  },
  name: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  basicSalary: {
    type: Number,
    required: true
  },
  annualSalary: {
    type: Number,
    required: true
  },
  bonusCalculation: {
    oneMonthBasic: Number,
    tenPercentAnnual: Number,
    totalBonus: Number
  },
  status: {
    type: String,
    enum: ["pending", "processed", "paid", "failed"],
    default: "pending"
  },
  paymentDate: Date,
  processedAt: Date,
  payrollReference: String,
  remarks: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

const Bonus = mongoose.model('Bonus', bonusSchema);
export default Bonus;