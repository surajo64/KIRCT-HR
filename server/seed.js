import User from "./models/User.js";
import Department from "./models/Department.js";
import Employee from "./models/Employee.js";
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectToDatabase = async () => {
    try {
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

const seed = async () => {
    try {
        await connectToDatabase();

        // 1. Create Departments
        console.log("📂 Seeding Departments...");

        let adminDept = await Department.findOne({ name: "Administration" });
        if (!adminDept) {
            adminDept = new Department({
                name: "Administration",
                description: "Administration department handles core management and overall system oversight.",
                designations: ["Admin", "Manager"]
            });
            await adminDept.save();
            console.log("✓ Administration department created");
        }

        let itDept = await Department.findOne({ name: "IT" });
        if (!itDept) {
            itDept = new Department({
                name: "IT",
                description: "IT department manages technical infrastructure and software development.",
                designations: ["Software Engineer", "System Admin", "HOD IT"]
            });
            await itDept.save();
            console.log("✓ IT department created");
        }

        // 2. Create Admin User
        console.log("👤 Seeding Admin User...");
        const adminEmail = "admin@example.com";
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const hashedAdminPassword = await bcrypt.hash("admin123", 10);
            const adminUser = new User({
                name: "System Admin",
                email: adminEmail,
                password: hashedAdminPassword,
                role: "admin",
                department: adminDept._id,
                leaveDays: 30
            });
            await adminUser.save();
            console.log("✓ Admin user created (admin@example.com / admin123)");
        } else {
            console.log("✓ Admin user already exists");
        }

        // 3. Create HOD User and Employee Record
        console.log("👤 Seeding HOD...");
        const hodEmail = "hod@example.com";
        let hodUser = await User.findOne({ email: hodEmail });
        if (!hodUser) {
            const hashedHodPassword = await bcrypt.hash("hod123", 10);
            hodUser = new User({
                name: "John HOD",
                email: hodEmail,
                password: hashedHodPassword,
                role: "HOD",
                department: itDept._id,
                leaveDays: 25
            });
            await hodUser.save();

            const hodEmployee = new Employee({
                userId: hodUser._id,
                staffId: "KIRCT001",
                name: "John HOD",
                gender: "Male",
                dob: new Date("1985-05-15"),
                joinDate: new Date("2020-01-10"),
                type: "permanent",
                department: itDept._id,
                designation: "HOD IT",
                state: "Lagos",
                phone: "08012345678",
                basicSalary: 500000
            });
            await hodEmployee.save();
            console.log("✓ HOD user and employee record created (hod@example.com / hod123)");
        } else {
            console.log("✓ HOD user already exists");
        }

        // 4. Create Employee User and Employee Record
        console.log("👤 Seeding Employee...");
        const empEmail = "emp@example.com";
        let empUser = await User.findOne({ email: empEmail });
        if (!empUser) {
            const hashedEmpPassword = await bcrypt.hash("emp123", 10);
            empUser = new User({
                name: "Jane Doe",
                email: empEmail,
                password: hashedEmpPassword,
                role: "employee",
                department: itDept._id,
                leaveDays: 20
            });
            await empUser.save();

            const employeeRecord = new Employee({
                userId: empUser._id,
                staffId: "STF002",
                name: "Jane Doe",
                gender: "Female",
                dob: new Date("1995-08-20"),
                joinDate: new Date("2023-03-01"),
                type: "probation",
                department: itDept._id,
                designation: "Software Engineer",
                state: "Abuja",
                phone: "08098765432",
                basicSalary: 150000
            });
            await employeeRecord.save();
            console.log("✓ Employee user and record created (emp@example.com / emp123)");
        } else {
            console.log("✓ Employee user already exists");
        }

        console.log("✨ Seeding completed successfully!");
        await mongoose.connection.close();

    } catch (error) {
        console.error("❌ Error during seeding:", error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

seed();
