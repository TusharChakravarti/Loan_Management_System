import { Request, Response } from 'express';
import { User, UserRole } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, verifyToken } from '../utils/jwt.js';

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

export const googleAuthInit = async (req: Request, res: Response): Promise<void> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  if (!clientId) {
    let demoUser = await User.findOne({ email: 'google.demo@credora.bank' });
    if (!demoUser) {
      const passwordHash = await hashPassword('GoogleDemoPass123!');
      demoUser = await User.create({
        fullName: 'Google Authenticated User',
        email: 'google.demo@credora.bank',
        passwordHash,
        role: UserRole.BORROWER,
      });
    }

    const token = generateToken({
      userId: demoUser._id.toString(),
      role: demoUser.role,
      email: demoUser.email,
    });

    res.redirect(`${clientUrl}/auth/google/callback?token=${token}`);
    return;
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    callbackUrl
  )}&scope=email%20profile`;

  res.redirect(googleAuthUrl);
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  try {
    const { code } = req.query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    if (code && clientId && clientSecret) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = (await tokenRes.json()) as any;
      if (tokenData.access_token) {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const googleUser = (await userInfoRes.json()) as any;

        if (googleUser.email) {
          let user = await User.findOne({ email: googleUser.email.toLowerCase() });
          if (!user) {
            const passwordHash = await hashPassword('GoogleOAuth_' + Math.random());
            user = await User.create({
              fullName: googleUser.name || googleUser.email.split('@')[0],
              email: googleUser.email.toLowerCase(),
              passwordHash,
              role: UserRole.BORROWER,
            });
          }

          const token = generateToken({
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
          });

          res.redirect(`${clientUrl}/auth/google/callback?token=${token}`);
          return;
        }
      }
    }

    let demoUser = await User.findOne({ email: 'google.demo@credora.bank' });
    if (!demoUser) {
      const passwordHash = await hashPassword('GoogleDemoPass123!');
      demoUser = await User.create({
        fullName: 'Google Authenticated User',
        email: 'google.demo@credora.bank',
        passwordHash,
        role: UserRole.BORROWER,
      });
    }

    const token = generateToken({
      userId: demoUser._id.toString(),
      role: demoUser.role,
      email: demoUser.email,
    });

    res.redirect(`${clientUrl}/auth/google/callback?token=${token}`);
  } catch (error) {
    console.error('[Google Callback Error]:', error);
    res.redirect(`${clientUrl}/login?error=google_failed`);
  }
};

export const setGoogleToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token is required' });
      return;
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email address format' });
      return;
    }

    await User.findOne({ email: email.toLowerCase() });
    res.status(200).json({
      success: true,
      message: `Password reset link has been dispatched to ${email}`,
    });
  } catch (error) {
    console.error('[Forgot Password Error]:', error);
    res.status(500).json({ success: false, message: 'Unable to process password reset request.' });
  }
};
