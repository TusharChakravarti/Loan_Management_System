import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication context required',
      });
      return;
    }

    const { role } = req.user;

    // ADMIN is authorized across all operations modules
    if (role === UserRole.ADMIN || allowedRoles.includes(role)) {
      next();
      return;
    }

    res.status(403).json({
      error: 'Forbidden',
      message: `Access denied. Role '${role}' is not authorized for this resource.`,
    });
  };
};
