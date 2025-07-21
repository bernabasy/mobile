import express from 'express';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { query } from '@/database/connection';
import { generateTokens, verifyRefreshToken } from '@/utils/jwt';
import { generateOTP, saveOTP, verifyOTP, sendOTP } from '@/utils/otp';
import { hashPin, comparePin, formatMobile } from '@/utils/helpers';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const signupSchema = {
  body: Joi.object({
    firstname: Joi.string().min(2).max(50).required(),
    middlename: Joi.string().min(2).max(50).optional(),
    lastname: Joi.string().min(2).max(50).required(),
    mobile: commonSchemas.mobile,
    pin: commonSchemas.pin,
  }),
};

const loginSchema = {
  body: Joi.object({
    mobile: commonSchemas.mobile,
    pin: commonSchemas.pin,
  }),
};

const verifyOtpSchema = {
  body: Joi.object({
    mobile: Joi.string().required(),
    otp: commonSchemas.otp,
  }),
};

const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

// POST /api/auth/signup
router.post('/signup', validateRequest(signupSchema), asyncHandler(async (req, res) => {
  const { firstname, middlename, lastname, mobile, pin } = req.body;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE mobile = $1',
    [mobile]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: 'User already exists with this mobile number',
    });
  }

  // Hash the PIN
  const hashedPin = await hashPin(pin);

  // Create user
  const userResult = await query(
    `INSERT INTO users (firstname, middlename, lastname, mobile, pin)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, firstname, middlename, lastname, mobile, is_verified, created_at`,
    [firstname, middlename, lastname, mobile, hashedPin]
  );

  const user = userResult.rows[0];

  // Generate and send OTP
  const otp = generateOTP();
  const formattedMobile = formatMobile(mobile);
  
  await saveOTP(formattedMobile, otp);
  await sendOTP(formattedMobile, otp);

  res.status(201).json({
    success: true,
    message: 'User created successfully. OTP sent for verification.',
    data: {
      user: {
        id: user.id,
        firstname: user.firstname,
        middlename: user.middlename,
        lastname: user.lastname,
        mobile: user.mobile,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
    },
  });
}));

// POST /api/auth/verify-otp
router.post('/verify-otp', validateRequest(verifyOtpSchema), asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  const formattedMobile = formatMobile(mobile);
  const isValidOTP = await verifyOTP(formattedMobile, otp);

  if (!isValidOTP) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired OTP',
    });
  }

  // Update user verification status
  await query(
    'UPDATE users SET is_verified = true WHERE mobile = $1',
    [mobile]
  );

  res.json({
    success: true,
    message: 'OTP verified successfully',
  });
}));

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), asyncHandler(async (req, res) => {
  const { mobile, pin } = req.body;

  // Get user from database
  const userResult = await query(
    'SELECT id, firstname, lastname, mobile, pin, is_verified, is_active FROM users WHERE mobile = $1',
    [mobile]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  const user = userResult.rows[0];

  if (!user.is_active) {
    return res.status(403).json({
      success: false,
      error: 'Account is deactivated',
    });
  }

  if (!user.is_verified) {
    // Generate and send OTP for verification
    const otp = generateOTP();
    const formattedMobile = formatMobile(mobile);
    
    await saveOTP(formattedMobile, otp);
    await sendOTP(formattedMobile, otp);

    return res.status(403).json({
      success: false,
      error: 'Account not verified. OTP sent for verification.',
      requiresVerification: true,
    });
  }

  // Verify PIN
  const isValidPin = await comparePin(pin, user.pin);
  if (!isValidPin) {
    return res.status(401).json({
      success: false,
      error: 'Invalid PIN',
    });
  }

  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    mobile: user.mobile,
  });

  // Update last login
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        mobile: user.mobile,
      },
      ...tokens,
    },
  });
}));

// POST /api/auth/refresh-token
router.post('/refresh-token', validateRequest(refreshTokenSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Verify user still exists and is active
    const userResult = await query(
      'SELECT id, mobile, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: decoded.userId,
      mobile: decoded.mobile,
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokens,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
}));

// POST /api/auth/resend-otp
router.post('/resend-otp', validateRequest({ body: Joi.object({ mobile: Joi.string().required() }) }), asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  // Check if user exists
  const userResult = await query(
    'SELECT id FROM users WHERE mobile = $1',
    [mobile]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  // Generate and send new OTP
  const otp = generateOTP();
  const formattedMobile = formatMobile(mobile);
  
  await saveOTP(formattedMobile, otp);
  await sendOTP(formattedMobile, otp);

  res.json({
    success: true,
    message: 'OTP sent successfully',
  });
}));

export default router;