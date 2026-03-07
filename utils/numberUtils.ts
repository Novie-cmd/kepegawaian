
export const formatRupiah = (value: string | number): string => {
  if (!value) return '';
  const numberString = value.toString().replace(/[^0-9]/g, '');
  if (!numberString) return '';
  
  const number = parseInt(numberString);
  return new Intl.NumberFormat('id-ID').format(number);
};

export const cleanNumber = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

export const terbilang = (n: number | string): string => {
  const number = typeof n === 'string' ? parseInt(n.replace(/[^0-9]/g, '')) : n;
  if (isNaN(number) || number === 0) return '';
  
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  let res = '';
  if (number < 12) {
    res = units[number];
  } else if (number < 20) {
    res = terbilang(number - 10) + ' Belas';
  } else if (number < 100) {
    res = terbilang(Math.floor(number / 10)) + ' Puluh ' + terbilang(number % 10);
  } else if (number < 200) {
    res = 'Seratus ' + terbilang(number - 100);
  } else if (number < 1000) {
    res = terbilang(Math.floor(number / 100)) + ' Ratus ' + terbilang(number % 100);
  } else if (number < 2000) {
    res = 'Seribu ' + terbilang(number - 1000);
  } else if (number < 1000000) {
    res = terbilang(Math.floor(number / 1000)) + ' Ribu ' + terbilang(number % 1000);
  } else if (number < 1000000000) {
    res = terbilang(Math.floor(number / 1000000)) + ' Juta ' + terbilang(number % 1000000);
  } else if (number < 1000000000000) {
    res = terbilang(Math.floor(number / 1000000000)) + ' Miliar ' + terbilang(number % 1000000000);
  }
  
  return res.trim().replace(/\s+/g, ' ');
};
