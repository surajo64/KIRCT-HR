// models/Budget.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const budgetSchema = new Schema({
  account: {
  type: mongoose.Schema.ObjectId,
  ref: 'Account',
  required: false
},
  category: {
    type: String,
    enum: ['housing', 'entertainment', 'shopping', 'travel', 'food', 'transportation', 'other'],
    required: [true, 'Budget category is required']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: 0
  },
  month: {
    type: Number,
    required: [true, 'Budget month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Budget year is required'],
    min: 2020
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// One budget per category per month (organization-wide)
budgetSchema.index({ category: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
