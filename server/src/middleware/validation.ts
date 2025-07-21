import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional(),
  }),
  mobile: Joi.string().pattern(/^9\d{8}$/).required(),
  pin: Joi.string().length(6).pattern(/^\d+$/).required(),
  otp: Joi.string().length(5).pattern(/^\d+$/).required(),
};