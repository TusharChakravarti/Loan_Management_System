import { Request, Response } from 'express';
import { User, UserRole } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validation
    if (!fullName || !email || !password || !role) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'All fields (fullName, email, password, role) are required',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid email address format',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid role selected`,
      });
      return;
    }

    // Check duplicate
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email address is already registered',
      });
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
      success: true,
      message: 'User registered successfully',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('[Auth Controller] Register Error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration Error',
      message: 'Unable to create your account. Please try again.',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user and explicitly select passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Unable to sign in. Please check your credentials and try again.',
      });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Unable to sign in. Please check your credentials and try again.',
      });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('[Auth Controller] Login Error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication Error',
      message: 'Unable to sign in. Please try again.',
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User record not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[Auth Controller] GetMe Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again later.',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};
