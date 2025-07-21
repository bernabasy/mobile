import bcrypt from 'bcryptjs';

export const hashPin = async (pin: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(pin, saltRounds);
};

export const comparePin = async (pin: string, hashedPin: string): Promise<boolean> => {
  return bcrypt.compare(pin, hashedPin);
};

export const generateOrderNumber = (prefix: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};

export const calculateTax = (amount: number, taxRate: number): number => {
  return (amount * taxRate) / 100;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatMobile = (mobile: string): string => {
  // Ensure mobile starts with +251
  if (mobile.startsWith('9') && mobile.length === 9) {
    return `+251${mobile}`;
  }
  if (mobile.startsWith('251') && mobile.length === 12) {
    return `+${mobile}`;
  }
  if (mobile.startsWith('+251') && mobile.length === 13) {
    return mobile;
  }
  throw new Error('Invalid mobile number format');
};

export const validateEthiopianMobile = (mobile: string): boolean => {
  // Ethiopian mobile numbers start with 9 and are 9 digits long
  const pattern = /^9\d{8}$/;
  return pattern.test(mobile);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const generateSKU = (name: string, category: string): string => {
  const namePrefix = name.substring(0, 3).toUpperCase();
  const categoryPrefix = category.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${categoryPrefix}-${namePrefix}-${timestamp}`;
};