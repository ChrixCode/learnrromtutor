import prisma from '../config/database.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';

export const userController = {
  async getProfile(req, res, next) {
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
          dateOfBirth: true,
          createdAt: true,
          learnerProfile: true,
          tutorProfile: true,
        },
      });

      if (!user) throw new NotFoundError('User');
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone, bio, dateOfBirth, timezone } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { firstName, lastName, phone, bio, dateOfBirth, timezone },
        select: { id: true, firstName: true, lastName: true, phone: true, bio: true, timezone: true },
      });

      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async deleteAccount(req, res, next) {
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { status: 'DELETED', deletedAt: new Date() },
      });
      res.json({ success: true, message: 'Account deleted' });
    } catch (err) { next(err); }
  },

  async getProgress(req, res, next) {
    try {
      const profile = await prisma.learnerProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile) throw new NotFoundError('Learner profile');

      const mastery = await prisma.masteryState.findMany({
        where: { learnerId: profile.id },
        include: { objective: true },
      });

      const progress = await prisma.learnerProgress.findMany({
        where: { learnerId: profile.id },
        include: { lesson: { include: { module: true } }, course: true },
      });

      res.json({ success: true, data: { mastery, progress } });
    } catch (err) { next(err); }
  },

  async getEnrollments(req, res, next) {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { learnerId: req.user.id },
        include: { course: { include: { tutor: true, category: true } } },
        orderBy: { enrolledAt: 'desc' },
      });
      res.json({ success: true, data: enrollments });
    } catch (err) { next(err); }
  },

  async getSessions(req, res, next) {
    try {
      const sessions = await prisma.session.findMany({
        where: { studentId: req.user.id },
        include: { tutor: { select: { firstName: true, lastName: true, avatar: true } }, course: true },
        orderBy: { scheduledAt: 'desc' },
      });
      res.json({ success: true, data: sessions });
    } catch (err) { next(err); }
  },

  async getBookings(req, res, next) {
    try {
      const bookings = await prisma.booking.findMany({
        where: { studentId: req.user.id },
        include: { tutor: { select: { firstName: true, lastName: true, avatar: true } }, course: true },
        orderBy: { scheduledAt: 'desc' },
      });
      res.json({ success: true, data: bookings });
    } catch (err) { next(err); }
  },

  async getPayments(req, res, next) {
    try {
      const payments = await prisma.payment.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: payments });
    } catch (err) { next(err); }
  },

  async getReviews(req, res, next) {
    try {
      const reviews = await prisma.review.findMany({
        where: { authorId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: reviews });
    } catch (err) { next(err); }
  },

  async getMessages(req, res, next) {
    try {
      const messages = await prisma.message.findMany({
        where: { senderId: req.user.id },
        include: { recipient: { select: { firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: messages });
    } catch (err) { next(err); }
  },

  async getNotifications(req, res, next) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: notifications });
    } catch (err) { next(err); }
  },

  async markNotificationRead(req, res, next) {
    try {
      await prisma.notification.update({
        where: { id: req.params.id, userId: req.user.id },
        data: { isRead: true, readAt: new Date() },
      });
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async getTutors(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const [tutors, total] = await Promise.all([
        prisma.tutorProfile.findMany({
          where: { isVerified: true },
          include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
          skip,
          take: limit,
          orderBy: { rating: 'desc' },
        }),
        prisma.tutorProfile.count({ where: { isVerified: true } }),
      ]);

      res.json({ success: true, data: tutors, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  },

  async getTutor(req, res, next) {
    try {
      const tutor = await prisma.tutorProfile.findUnique({
        where: { id: req.params.id },
        include: { user: { select: { firstName: true, lastName: true, avatar: true, bio: true } }, courses: { where: { status: 'ACTIVE' } }, reviews: { take: 5 } },
      });
      if (!tutor) throw new NotFoundError('Tutor');
      res.json({ success: true, data: tutor });
    } catch (err) { next(err); }
  },

  async getCourses(req, res, next) {
    try {
      const { page = 1, limit = 10, category, level, search } = req.query;
      const skip = (page - 1) * limit;

      const where = { status: 'ACTIVE' };
      if (category) where.category = { slug: category };
      if (level) where.level = level;
      if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];

      const [courses, total] = await Promise.all([
        prisma.course.findMany({ where, skip, take: limit, include: { tutor: { select: { firstName: true, lastName: true } }, category: true }, orderBy: { createdAt: 'desc' } }),
        prisma.course.count({ where }),
      ]);

      res.json({ success: true, data: courses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  },

  async getCourse(req, res, next) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
        include: { modules: { include: { lessons: true } }, tutor: { select: { firstName: true, lastName: true, avatar: true, bio: true, rating: true } }, category: true, reviews: { take: 5, include: { author: { select: { firstName: true, lastName: true, avatar: true } } } } },
      });
      if (!course) throw new NotFoundError('Course');
      res.json({ success: true, data: course });
    } catch (err) { next(err); }
  },

  async search(req, res, next) {
    try {
      const { q, type, page = 1, limit = 10 } = req.query;
      if (!q) throw new ValidationError('Query required');

      const skip = (page - 1) * limit;

      const [courses, tutors, total] = await Promise.all([
        prisma.course.findMany({ where: { status: 'ACTIVE', OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }, skip, take: limit, include: { tutor: true, category: true } }),
        prisma.tutorProfile.findMany({ where: { isVerified: true, OR: [{ user: { firstName: { contains: q, mode: 'insensitive' } } }, { user: { lastName: { contains: q, mode: 'insensitive' } } }, { specializations: { hasSome: [q] } }] }, skip, take: limit, include: { user: { select: { firstName: true, lastName: true, avatar: true } } }),
        prisma.course.count({ where: { status: 'ACTIVE', OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } }),
      ]);

      res.json({ success: true, data: { courses, tutors }, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  },
};