// utils/calculateDuration.js
export const calculateDuration = (joinDate) => {
  if (!joinDate) return "";

  const join = new Date(joinDate);
  const now = new Date();

  let years = now.getFullYear() - join.getFullYear();
  let months = now.getMonth() - join.getMonth();
  let days = now.getDate() - join.getDate();

  if (days < 0) {
    months--;
    const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} year(s) ${months} month(s) ${days} day(s)`;
};
