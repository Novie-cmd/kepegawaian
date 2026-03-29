
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
