import { query } from '@/database/connection';

export const generateOTP = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const saveOTP = async (mobile: string, otp: string): Promise<void> => {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  
  await query(
    'INSERT INTO otps (mobile, otp_code, expires_at) VALUES ($1, $2, $3)',
    [mobile, otp, expiresAt]
  );
};

export const verifyOTP = async (mobile: string, otp: string): Promise<boolean> => {
  const result = await query(
    `SELECT id FROM otps 
     WHERE mobile = $1 AND otp_code = $2 AND expires_at > NOW() AND is_used = false
     ORDER BY created_at DESC LIMIT 1`,
    [mobile, otp]
  );

  if (result.rows.length === 0) {
    return false;
  }

  // Mark OTP as used
  await query(
    'UPDATE otps SET is_used = true WHERE id = $1',
    [result.rows[0].id]
  );

  return true;
};

export const sendOTP = async (mobile: string, otp: string): Promise<boolean> => {
  // In a real application, you would integrate with an SMS service
  // For now, we'll just log the OTP
  console.log(`📱 OTP for ${mobile}: ${otp}`);
  
  // Simulate SMS sending
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
};