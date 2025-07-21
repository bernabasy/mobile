import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '@/database/connection';
import { JWTPayload } from '@/types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    mobile: string;
    firstname: string;
    lastname: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Get user from database
    const userResult = await query(
      'SELECT id, firstname, lastname, mobile, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
      return;
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      mobile: user.mobile,
      firstname: user.firstname,
      lastname: user.lastname,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

export { AuthenticatedRequest };