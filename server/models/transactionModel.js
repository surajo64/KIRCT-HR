// models/Transaction.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const transactionSchema = new Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Transaction must belong to a user']
  },
  account: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account',
    required: [true, 'Transaction must belong to an account']
  },
  description: {
    type: String,
    required: [true, 'Transaction description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: 0
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required']
  },
  category: {
    type: String,
    enum: ['housing', 'entertainment', 'shopping', 'travel', 'food', 'transportation', 'salary', 'other'],
    required: [true, 'Transaction category is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  recurring: {
    type: Boolean,
    default: false 
  },
  recurringType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  }
}, {
  timestamps: true
});


// Index for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;



