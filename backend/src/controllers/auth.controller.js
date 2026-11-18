import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import config from '../config/index.js';
import { AuthenticationError, ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role = 'LEARNER' } = req.body;

      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          status: 'PENDING',
          emailVerified: false,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      // Create verification token
      const verificationToken = uuidv4();
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // TODO: Send verification email

      // Generate tokens
      const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          ...tokens,
        },
        message: 'Registration successful. Please verify your email.',
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      if (user.status !== 'ACTIVE') {
        throw new AuthenticationError('Account is not active');
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new AuthenticationError('Invalid credentials');
      }

      const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
          },
          ...tokens,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const decoded = verifyRefreshToken(refreshToken);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User not found or inactive');
      }

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });

      // Generate new tokens
      const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

      // Store new refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.json({
        success: true,
        data: tokens,
      });
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  },

  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (token) {
        // Revoke all refresh tokens for user
        await prisma.refreshToken.updateMany({
          where: { userId: req.user.id },
          data: { revokedAt: new Date() },
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If the email exists, a reset link will be sent',
        });
      }

      const token = crypto.randomBytes(32).toString('hex');
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // TODO: Send reset email

      res.json({
        success: true,
        message: 'If the email exists, a reset link will be sent',
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const reset = await prisma.passwordReset.findUnique({ where: { token } });
      if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
        throw new ValidationError('Invalid or expired reset token');
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: reset.userId },
          data: { passwordHash },
        }),
        prisma.passwordReset.update({
          where: { id: reset.id },
          data: { usedAt: new Date() },
        }),
        prisma.refreshToken.updateMany({
          where: { userId: reset.userId },
          data: { revokedAt: new Date() },
        }),
      ]);

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        throw new ValidationError('Current password is incorrect');
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: req.user.id },
          data: { passwordHash },
        }),
        prisma.refreshToken.updateMany({
          where: { userId: req.user.id },
          data: { revokedAt: new Date() },
        }),
      ]);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          avatar: true,
          phone: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      const verification = await prisma.emailVerification.findUnique({ where: { token } });
      if (!verification || verification.verifiedAt || verification.expiresAt < new Date()) {
        throw new ValidationError('Invalid or expired verification token');
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: verification.userId },
          data: { emailVerified: true },
        }),
        prisma.emailVerification.update({
          where: { id: verification.id },
          data: { verifiedAt: new Date() },
        }),
      ]);

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  async resendVerification(req, res, next) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user.emailVerified) {
        return res.json({ success: true, message: 'Email already verified' });
      }

      // Delete old verification tokens
      await prisma.emailVerification.deleteMany({ where: { userId: user.id } });

      const token = crypto.randomBytes(32).toString('hex');
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // TODO: Send verification email

      res.json({
        success: true,
        message: 'Verification email sent',
      });
    } catch (err) {
      next(err);
    }
  },
};

// Need to import crypto
import crypto from 'crypto';