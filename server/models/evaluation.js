import mongoose from 'mongoose'

const evaluationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  kpiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kpi' }, // ✅ Reference to KPI
  scores: { type: Object },
  total: { type: Number },
  grade: { type: String },
  comments: { type: String },
  year: { type: Number },
  month: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation