import { Request, Response } from 'express';
import { User, UserRole } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validation
    if (!fullName || !email || !password || !role) {
      res.status(400).json({ error: 'Validation Error', message: 'All fields (fullName, email, password, role) are required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Validation Error', message: 'Invalid email address format' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 6 characters long' });
      return;
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`,
      });
      return;
    }

    // Check duplicate
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'Conflict', message: 'Email address is already registered' });
      return;
    }

    // Hash password & create user
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role: role as UserRole,
    });

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('[Auth Controller] Register Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Validation Error', message: 'Email and password are required' });
      return;
    }

    // Find user and explicitly select passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    res.status(200).json({
      message: 'Login successful',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('[Auth Controller] Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to authenticate user' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User record not found' });
      return;
    }

    res.status(200).json({
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[Auth Controller] GetMe Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve current user' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    message: 'Logout successful. Client should clear local token storage.',
  });
};
