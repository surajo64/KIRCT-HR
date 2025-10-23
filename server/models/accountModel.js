// models/Account.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const accountSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },

    type: {
      type: String,
      enum: ['Savings Account', 'Current Account', 'Investment Account', 'Credit Card'],
      required: [true, 'Account type is required'],
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      enum: ['NGN', 'USD', 'EUR'],
      default: 'NGN',
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // ✅ handles createdAt & updatedAt automatically
);

// ✅ Ensure only one default account per user
accountSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

const Account = mongoose.model('Account', accountSchema);

export default Account;
