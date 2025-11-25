import mongoose from 'mongoose'

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relievingEId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  leave: { type: String, required: true },
  reason: { type: String, required: true },
  // Remove leaveBalance from here - it should come from User table
  hodComments: { type: String, default: '' }, // Changed to default empty
  hrComments: { type: String, default: '' },  // Changed to default empty
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  from2: { type: Date }, // For split leave
  to2: { type: Date },   // For split leave
  isSplit: { type: Boolean, default: false },
  totalDays: { type: Number, default: 0 }, // Calculated working days
  appliedAt: { type: Date, default: Date.now },
  hodStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  resumeStatus: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  resumeDate: { type: Date },
  updatedAt: { type: Date, default: Date.now },
});

const Leave = mongoose.model('Leave', leaveSchema)
export default Leave