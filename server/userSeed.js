import User from "./models/User.js"
import Department from "./models/Department.js"
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectToDatabase = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...")
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

const userRegister = async () => {
  try {
    await connectToDatabase()

    // Check if admin department exists, if not create it
    let adminDept = await Department.findOne({ name: "Administration" })
    if (!adminDept) {
      adminDept = new Department({
        name: "Administration",
        description: "Administration department",
        designations: ["Admin"]
      })
      await adminDept.save()
      console.log("✓ Administration department created")
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("123456", 10)
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: "surajoumar52@gmail.com" })
    if (existingUser) {
      console.log("✓ Admin user already exists")
      await mongoose.connection.close()
      return
    }

    // Create new admin user
    const newUser = new User({
      name: "Surajo Umara Danja",
      email: "surajoumar52@gmail.com",
      password: hashedPassword,
      role: "admin",
      department: adminDept._id,
      leaveDays: 0
    })
    await newUser.save()
    console.log("✓ Admin user created successfully")
    console.log("Email: surajoumar52@gmail.com")
    console.log("Password: 123456")

    await mongoose.connection.close()

  } catch (error) {
    console.error("❌ Error creating admin user:", error.message)
    process.exit(1)
  }
}

userRegister();