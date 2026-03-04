import mongoose from 'mongoose'

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    
  }
}
export default connectToDatabase;