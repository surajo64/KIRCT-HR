import mongoose from 'mongoose';

const kpiSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scores: { type: Object },
    total: { type: Number },
    grade: { type: String },
    comments: { type: String },
    year: { type: Number },
    month: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });


const Kpi = mongoose.model('Kpi', kpiSchema);
export default Kpi;