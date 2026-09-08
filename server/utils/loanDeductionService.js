import Loan from "../models/loan.js";

/**
 * Calculates default deduction start month (the month after approval).
 * @param {Date} approvedDate - Date loan was approved
 * @returns {string} "YYYY-MM"
 */
export const getDefaultDeductionStartMonth = (approvedDate = new Date()) => {
  const d = new Date(approvedDate);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
};

/**
 * Executes a single monthly deduction on an approved loan.
 * Rules enforced:
 * 1. Only once every month (no duplicate deductions for the same monthYear).
 * 2. Only if the selected month is on or after the loan's deductionStartMonth.
 * 3. Never over-deducts beyond the remaining balance.
 * 4. Automatically marks loan as 'Completed' when totalRepaid reaches the target.
 *
 * @param {Object} loan - Mongoose Loan document
 * @param {string} monthYear - "YYYY-MM" e.g. "2026-09"
 * @param {string} method - Deduction description
 * @returns {Object}
 */
export const executeMonthlyDeduction = async (loan, monthYear = null, method = "Manual Process") => {
  const currentMonthYear = monthYear || new Date().toISOString().slice(0, 7);

  // 1. Guard: Check if start month has arrived
  if (loan.deductionStartMonth && currentMonthYear < loan.deductionStartMonth) {
    return {
      success: false,
      reason: `Deduction start month (${loan.deductionStartMonth}) has not arrived yet for ${currentMonthYear}`,
      loanId: loan._id,
      skippedNotStarted: true,
    };
  }

  // 2. Guard: Strictly once every month (check existing repayment history)
  const alreadyDeducted = (loan.repaymentHistory || []).some(
    (r) => r.monthYear === currentMonthYear
  );
  if (alreadyDeducted) {
    return {
      success: false,
      reason: `Already deducted for month ${currentMonthYear}. Loan deductions can only be made once every month.`,
      loanId: loan._id,
      alreadyDeducted: true,
    };
  }

  // 3. Determine effective target amount & remaining balance
  const targetAmount = loan.approvedAmount > 0 ? loan.approvedAmount : loan.amount;
  const currentRepaid = loan.totalRepaid || 0;
  const remainingBalance = Math.max(0, targetAmount - currentRepaid);

  if (remainingBalance <= 0) {
    loan.status = "Completed";
    await loan.save();
    return { success: false, reason: "Loan is already fully repaid", loanId: loan._id };
  }

  // 4. Calculate monthly deduction
  const duration = loan.durationInMonths > 0 ? loan.durationInMonths : 1;
  const standardDeduction = loan.monthDeduction > 0 
    ? loan.monthDeduction 
    : Math.ceil(targetAmount / duration);

  const actualDeduction = Math.min(standardDeduction, remainingBalance);
  loan.totalRepaid = currentRepaid + actualDeduction;

  const newBalance = Math.max(0, targetAmount - loan.totalRepaid);
  if (loan.totalRepaid >= targetAmount) {
    loan.status = "Completed";
  }

  loan.lastDeductionDate = new Date();
  if (!loan.repaymentHistory) {
    loan.repaymentHistory = [];
  }

  loan.repaymentHistory.push({
    amount: actualDeduction,
    deductionDate: new Date(),
    monthYear: currentMonthYear,
    method,
    balanceAfter: newBalance,
  });

  await loan.save();

  return {
    success: true,
    loanId: loan._id,
    deductedAmount: actualDeduction,
    totalRepaid: loan.totalRepaid,
    remainingBalance: newBalance,
    isCompleted: loan.status === "Completed",
    monthYear: currentMonthYear,
  };
};

/**
 * Runs monthly deductions on all active Approved loans for the selected monthYear.
 * Triggered exclusively when the admin clicks "Process Monthly Deductions".
 *
 * @param {string} targetMonthYear - "YYYY-MM" (defaults to current month)
 * @param {string} method - Deduction description
 * @returns {Object} Results breakdown
 */
export const processAllApprovedLoans = async (targetMonthYear = null, method = "Manual Process via Button") => {
  const currentMonthYear = targetMonthYear || new Date().toISOString().slice(0, 7);
  console.log(`[Manual Loan Deductions] Processing deductions for ${currentMonthYear}...`);

  const approvedLoans = await Loan.find({ status: "Approved" }).populate("userId", "name email");

  const results = {
    processed: 0,
    skippedAlreadyDeducted: 0,
    skippedNotStarted: 0,
    completed: 0,
    errors: [],
    details: [],
  };

  for (const loan of approvedLoans) {
    try {
      // Check if start month has not arrived yet
      if (loan.deductionStartMonth && currentMonthYear < loan.deductionStartMonth) {
        results.skippedNotStarted++;
        continue;
      }

      // Check if already deducted for this month
      const alreadyDeducted = (loan.repaymentHistory || []).some(
        (r) => r.monthYear === currentMonthYear
      );

      if (alreadyDeducted) {
        results.skippedAlreadyDeducted++;
        continue;
      }

      const res = await executeMonthlyDeduction(loan, currentMonthYear, method);
      if (res.success) {
        results.processed++;
        if (res.isCompleted) results.completed++;
        results.details.push({
          loanId: loan._id,
          employeeName: loan.userId?.name || "N/A",
          deductedAmount: res.deductedAmount,
          remainingBalance: res.remainingBalance,
          isCompleted: res.isCompleted,
        });
      }
    } catch (err) {
      console.error(`[Manual Loan Deductions] Error processing loan ${loan._id}:`, err);
      results.errors.push({ loanId: loan._id, error: err.message });
    }
  }

  console.log(
    `[Manual Loan Deductions] Completed for ${currentMonthYear}: ${results.processed} deducted, ${results.skippedAlreadyDeducted} already up-to-date, ${results.skippedNotStarted} not yet started, ${results.completed} fully paid off.`
  );
  return results;
};
