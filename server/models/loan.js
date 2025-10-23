import { strict } from 'assert';
import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  approvedAmount: { type: Number, default: 0 },
  durationInMonths: { type: Number, required: true }, // E.g., 6 months
  monthDeduction: { type: Number },
  totalRepaid: { type: Number, default: 0 },
  reason: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
