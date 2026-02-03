
import { Employee } from "../types";

// Fungsi untuk parsing string tanggal "YYYY-MM-DD" tanpa masalah zona waktu
export const parseDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getNextPromotion = (tmt: string) => {
  const date = parseDateString(tmt);
  date.setFullYear(date.getFullYear() + 4);
  return date;
};

export const getNextKgb = (tmt: string) => {
  const date = parseDateString(tmt);
  date.setFullYear(date.getFullYear() + 2);
  return date;
};

// Mengecek apakah seorang pegawai memiliki jadwal kenaikan pangkat/KGB pada bulan/tahun tertentu
export const isDueInPeriod = (tmtStr: string, filterMonth: number, filterYear: number, interval: number): boolean => {
  if (!tmtStr) return false;
  const tmt = parseDateString(tmtStr);
  const yearDiff = filterYear - tmt.getFullYear();
  
  // Harus di tahun yang sama atau tahun depan (selisih >= 0) 
  // dan selisih tahun harus kelipatan interval (2 untuk KGB, 4 untuk Pangkat)
  // serta bulan harus sama
  return yearDiff >= 0 && yearDiff % interval === 0 && tmt.getMonth() === filterMonth;
};

export const getRetirementDate = (birthDate: string, age: number = 58) => {
  const date = parseDateString(birthDate);
  date.setFullYear(date.getFullYear() + age);
  // Biasanya pensiun pada tanggal 1 bulan berikutnya setelah bulan lahir
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

// Cek apakah ada jadwal di masa depan (recurring) dalam rentang 12 bulan ke depan
export const isDueSoon = (tmtStr: string, interval: number): boolean => {
  if (!tmtStr) return false;
  const tmt = parseDateString(tmtStr);
  const now = new Date();
  
  // Hitung tahun terdekat berikutnya yang merupakan kelipatan interval dari TMT
  let nextYear = tmt.getFullYear();
  while (nextYear < now.getFullYear() || (nextYear === now.getFullYear() && tmt.getMonth() < now.getMonth())) {
    nextYear += interval;
  }
  
  const nextOccurrence = new Date(nextYear, tmt.getMonth(), 1);
  return isNear(nextOccurrence);
};

export const formatDate = (date: Date | string) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseDateString(date) : date;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};
