import prisma from '../config/database.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';

export const courseController = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 10, category, level, search, tutorId, status } = req.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      else if (req.user?.role === 'LEARNER') where.status = 'ACTIVE';
      if (category) where.category = { slug: category };
      if (level) where.level = level;
      if (tutorId) where.tutorId = tutorId;
      if (search) where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          skip,
          take: limit,
          include: { tutor: { select: { firstName: true, lastName: true, avatar: true } }, category: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.course.count({ where }),
      ]);

      res.json({ success: true, data: courses, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  },

  async featured(req, res, next) {
    try {
      const courses = await prisma.course.findMany({
        where: { status: 'ACTIVE', isFree: false },
        take: 6,
        include: { tutor: { select: { firstName: true, lastName: true, avatar: true } }, category: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: courses });
    } catch (err) { next(err); }
  },

  async categories(req, res, next) {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: { _count: { select: { courses: { where: { status: 'ACTIVE' } } } } },
        orderBy: { sortOrder: 'asc' },
      });
      res.json({ success: true, data: categories });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
        include: {
          modules: { include: { lessons: true } },
          tutor: { select: { firstName: true, lastName: true, avatar: true, bio: true, rating: true } },
          category: true,
          reviews: { take: 5, include: { author: { select: { firstName: true, lastName: true, avatar: true } } } },
          _count: { select: { enrollments: true, reviews: true } },
        },
      });
      if (!course) throw new NotFoundError('Course');
      res.json({ success: true, data: course });
    } catch (err) { next(err); }
  },

  async getModules(req, res, next) {
    try {
      const modules = await prisma.module.findMany({
        where: { courseId: req.params.id },
        include: { lessons: true },
        orderBy: { order: 'asc' },
      });
      res.json({ success: true, data: modules });
    } catch (err) { next(err); }
  },

  async getLessons(req, res, next) {
    try {
      const lessons = await prisma.lesson.findMany({
        where: { moduleId: req.params.moduleId },
        orderBy: { order: 'asc' },
      });
      res.json({ success: true, data: lessons });
    } catch (err) { next(err); }
  },

  async getLesson(req, res, next) {
    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id: req.params.lessonId },
        include: { activities: { include: { questions: true } }, questions: true, resources: true, module: { select: { courseId: true } } },
      });
      if (!lesson) throw new NotFoundError('Lesson');
      res.json({ success: true, data: lesson });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { title, description, shortDescription, price, currency, duration, level, language, curriculum, tags, categoryId, tutorId } = req.body;

      const course = await prisma.course.create({
        data: {
          title,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
          description,
          shortDescription,
          price: price || 0,
          currency: currency || 'USD',
          duration,
          level: level || 'BEGINNER',
          language: language || 'en',
          curriculum,
          tags,
          categoryId,
          tutorId: tutorId || (req.user.role === 'TUTOR' ? (await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } }))?.id : undefined),
          creatorId: req.user.role === 'CREATOR' ? (await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } }))?.id : undefined,
          instructorId: req.user.id,
          status: 'DRAFT',
        },
        include: { tutor: true, category: true },
      });

      res.status(201).json({ success: true, data: course });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) throw new NotFoundError('Course');

      if (course.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new AuthorizationError('Not authorized to update this course');
      }

      const updated = await prisma.course.update({
        where: { id: req.params.id },
        data: req.body,
      });

      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) throw new NotFoundError('Course');

      if (course.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new AuthorizationError('Not authorized to delete this course');
      }

      await prisma.course.update({ where: { id: req.params.id }, data: { status: 'ARCHIVED', deletedAt: new Date() } });
      res.json({ success: true, message: 'Course archived' });
    } catch (err) { next(err); }
  },

  async enroll(req, res, next) {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) throw new NotFoundError('Course');
      if (course.status !== 'ACTIVE') throw new ValidationError('Course is not available for enrollment');

      const existing = await prisma.enrollment.findUnique({
        where: { learnerId_courseId: { learnerId: req.user.id, courseId: req.params.id } },
      });

      if (existing) throw new ValidationError('Already enrolled');

      const enrollment = await prisma.enrollment.create({
        data: { learnerId: req.user.id, courseId: req.params.id, status: 'ACTIVE' },
      });

      res.status(201).json({ success: true, data: enrollment });
    } catch (err) { next(err); }
  },

  async unenroll(req, res, next) {
    try {
      await prisma.enrollment.delete({
        where: { learnerId_courseId: { learnerId: req.user.id, courseId: req.params.id } },
      });
      res.json({ success: true, message: 'Unenrolled successfully' });
    } catch (err) { next(err); }
  },

  async getProgress(req, res, next) {
    try {
      const progress = await prisma.learnerProgress.findMany({
        where: { learnerId: req.user.id, courseId: req.params.id },
        include: { lesson: { include: { module: true } } },
      });
      res.json({ success: true, data: progress });
    } catch (err) { next(err); }
  },

  async addModule(req, res, next) {
    try {
      const module = await prisma.module.create({
        data: { ...req.body, courseId: req.params.id },
      });
      res.status(201).json({ success: true, data: module });
    } catch (err) { next(err); }
  },

  async updateModule(req, res, next) {
    try {
      const module = await prisma.module.update({
        where: { id: req.params.moduleId, courseId: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: module });
    } catch (err) { next(err); }
  },

  async deleteModule(req, res, next) {
    try {
      await prisma.module.delete({ where: { id: req.params.moduleId, courseId: req.params.id } });
      res.json({ success: true, message: 'Module deleted' });
    } catch (err) { next(err); }
  },

  async addLesson(req, res, next) {
    try {
      const lesson = await prisma.lesson.create({
        data: { ...req.body, moduleId: req.params.moduleId },
      });
      res.status(201).json({ success: true, data: lesson });
    } catch (err) { next(err); }
  },

  async updateLesson(req, res, next) {
    try {
      const lesson = await prisma.lesson.update({
        where: { id: req.params.lessonId, moduleId: req.params.moduleId },
        data: req.body,
      });
      res.json({ success: true, data: lesson });
    } catch (err) { next(err); }
  },

  async deleteLesson(req, res, next) {
    try {
      await prisma.lesson.delete({ where: { id: req.params.lessonId, moduleId: req.params.moduleId } });
      res.json({ success: true, message: 'Lesson deleted' });
    } catch (err) { next(err); }
  },

  async addActivity(req, res, next) {
    try {
      const activity = await prisma.activity.create({
        data: { ...req.body, lessonId: req.params.lessonId },
      });
      res.status(201).json({ success: true, data: activity });
    } catch (err) { next(err); }
  },

  async addQuestion(req, res, next) {
    try {
      const question = await prisma.question.create({
        data: { ...req.body, lessonId: req.params.lessonId },
      });
      res.status(201).json({ success: true, data: question });
    } catch (err) { next(err); }
  },

  async addResource(req, res, next) {
    try {
      const resource = await prisma.resource.create({
        data: { ...req.body, lessonId: req.params.lessonId },
      });
      res.status(201).json({ success: true, data: resource });
    } catch (err) { next(err); }
  },

  async getReviews(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { courseId: req.params.id },
          skip,
          take: limit,
          include: { author: { select: { firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.review.count({ where: { courseId: req.params.id } }),
      ]);

      res.json({ success: true, data: reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  },

  async addReview(req, res, next) {
    try {
      const { rating, title, content } = req.body;
      if (rating < 1 || rating > 5) throw new ValidationError('Rating must be 1-5');

      const enrollment = await prisma.enrollment.findUnique({
        where: { learnerId_courseId: { learnerId: req.user.id, courseId: req.params.id } },
      });
      if (!enrollment) throw new ValidationError('Must be enrolled to review');

      const existing = await prisma.review.findFirst({ where: { authorId: req.user.id, courseId: req.params.id } });
      if (existing) throw new ValidationError('Already reviewed this course');

      const review = await prisma.review.create({
        data: { authorId: req.user.id, courseId: req.params.id, rating, title, content },
      });

      res.status(201).json({ success: true, data: review });
    } catch (err) { next(err); }
  },

  async analytics(req, res, next) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
        select: { id: true, instructorId: true, tutorId: true, creatorId: true },
      });
      if (!course) throw new NotFoundError('Course');

      const isOwner = course.instructorId === req.user.id || course.tutorId === req.user.id || course.creatorId === req.user.id;
      if (!isOwner && req.user.role !== 'ADMIN') throw new AuthorizationError('Not authorized');

      const analytics = await prisma.courseAnalytics.findUnique({ where: { courseId: req.params.id } });
      res.json({ success: true, data: analytics });
    } catch (err) { next(err); }
  },
};