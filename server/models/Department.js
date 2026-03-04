import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, lowercase: true, required: true },
  designations: [{ type: String, required: true }], // array of designation titles
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Department = mongoose.model('Department', departmentSchema);

export default Department;
