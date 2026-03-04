// jobs/updateEmployeeDuration.js
import cron from "node-cron";
import Employee from "../models/Employee.js";
import { calculateDuration } from "../utils/calculateDuration.js";

// Run every day at 00:05 AM server time
cron.schedule("5 0 * * *", async () => {
  try {
    console.log("Starting daily employee duration update...");

    const employees = await Employee.find({});

    for (const emp of employees) {
      const newDuration = calculateDuration(emp.joinDate);

      // Only update if duration changed (optional)
      if (emp.duration !== newDuration) {
        emp.duration = newDuration;
        emp.updatedAt = new Date();
        await emp.save();
        console.log(`Updated duration for ${emp.staffId}: ${newDuration}`);
      }
    }

    console.log("Employee duration update completed!");
  } catch (err) {
    console.error("Error updating employee durations:", err);
  }
});
