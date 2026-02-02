
import { Employee } from "../types";

// Standard Rules:
// - Promotion (Pangkat): Every 4 years from TMT Golongan
// - Periodic Salary (KGB): Every 2 years from TMT KGB
// - Retirement (Pensiun): Age 58

export const getNextPromotion = (tmt: string) => {
  const date = new Date(tmt);
  date.setFullYear(date.getFullYear() + 4);
  return date;
};

export const getNextKgb = (tmt: string) => {
  const date = new Date(tmt);
  date.setFullYear(date.getFullYear() + 2);
  return date;
};

export const getRetirementDate = (birthDate: string, age: number = 58) => {
  const date = new Date(birthDate);
  date.setFullYear(date.getFullYear() + age);
  // Usually retired on the 1st of the month following birth month
  date.setMonth(date.getMonth() + 1);
  date.setDate(1);
  return date;
};

export const isNear = (targetDate: Date, monthsThreshold: number = 12) => {
  const now = new Date();
  const threshold = new Date();
  threshold.setMonth(now.getMonth() + monthsThreshold);
  return targetDate <= threshold && targetDate >= now;
};

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};
