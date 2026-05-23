import mongoose from 'mongoose';

const { Schema } = mongoose;

const loginLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
  logoutTime: { type: Date, default: null },
  sessionDuration: { type: Number, default: null }, // in seconds
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const LoginLog = mongoose.model('LoginLog', loginLogSchema);

export default LoginLog;
