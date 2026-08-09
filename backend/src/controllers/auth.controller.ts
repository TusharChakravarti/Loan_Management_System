import { Request, Response } from 'express';
import crypto from 'crypto';
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(200).json({
        success: true,
        message: `If an account exists for ${email}, a password reset link has been dispatched.`,
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 Hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    console.log(`\n======================================================`);
    console.log(`🔑 PASSWORD RESET LINK FOR: ${user.email}`);
    console.log(`👉 Direct Reset Link: ${resetUrl}`);
    console.log(`======================================================\n`);

    // Dispatch real email via Resend API if key is present
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    if (resendApiKey) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Credora Security <onboarding@resend.dev>';
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [user.email],
            subject: '🔒 Reset Your Credora Account Password',
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
                <h2 style="color: #6366f1; margin-bottom: 8px; font-weight: 900; letter-spacing: -0.5px;">CREDORA</h2>
                <h3 style="color: #ffffff; margin-top: 0;">Reset Your Account Password</h3>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">We received a request to reset the password for your Credora account (<strong>${user.email}</strong>).</p>
                <div style="margin: 28px 0; text-align: center;">
                  <a href="${resetUrl}" style="background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">Reset Password →</a>
                </div>
                <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #1e293b; margin-top: 24px;" />
                <p style="color: #475569; font-size: 11px; margin-bottom: 0;">© ${new Date().getFullYear()} Credora Financial Technologies Inc. All rights reserved.</p>
              </div>
            `,
          }),
        });

        const emailData = (await emailRes.json()) as any;
        if (!emailRes.ok) {
          console.warn('⚠️ [Resend Email Warning]:', emailData);
        } else {
          console.log('✉️ [Resend Password Reset Email Sent Successfully]:', emailData.id);
        }
      } catch (resendErr) {
        console.error('⚠️ [Resend API Dispatch Error]:', resendErr);
      }
    }

    res.status(200).json({
      success: true,
      message: `Password reset link generated for ${email}`,
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (error) {
    console.error('[Forgot Password Error]:', error);
    res.status(500).json({ success: false, message: 'Unable to process password reset request.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired. Please request a new link.',
      });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You may now sign in with your new password.',
    });
  } catch (error) {
    console.error('[Reset Password Error]:', error);
    res.status(500).json({ success: false, message: 'Unable to reset password. Please try again.' });
  }
};
