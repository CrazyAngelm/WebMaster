// 📁 server/src/middleware/authMiddleware.ts - Authentication middleware
// 🎯 Core function: Validates JWT and injects userId into request
// 🔗 Key dependencies: jsonwebtoken
// 💡 Usage: Used to protect private routes

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    // @ts-ignore
    req.userId = payload.userId;
    // @ts-ignore
    req.userRole = payload.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.userRole !== 'ADMIN' && req.userRole !== 'OWNER') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

export const isOwner = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.userRole !== 'OWNER') {
    return res.status(403).json({ error: 'Forbidden: Owner access required' });
  }
  next();
};