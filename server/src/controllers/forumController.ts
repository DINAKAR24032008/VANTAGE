import { Request, Response } from 'express';
import { prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';

export class ForumController {
  static async getPosts(req: Request, res: Response) {
    try {
      const { courseId, general } = req.query;

      let whereClause: any = { parentPostId: null };

      if (courseId) {
        whereClause.courseId = String(courseId);
      } else if (general === 'true') {
        whereClause.courseId = null;
      }

      const posts = await prisma.forumPost.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, role: true, department: true },
          },
          course: {
            select: { id: true, title: true, trainerId: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, name: true, role: true, department: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      });

      return res.json(posts);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { title, body, courseId, parentPostId } = req.body;

      if (!body) {
        return res.status(400).json({ error: 'Post body is required' });
      }

      const post = await prisma.forumPost.create({
        data: {
          title: parentPostId ? null : title || 'Discussion',
          body,
          courseId: courseId || null,
          parentPostId: parentPostId || null,
          authorId: req.user.userId,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true, department: true },
          },
          course: {
            select: { id: true, title: true, trainerId: true },
          },
        },
      });

      return res.status(201).json(post);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getPostById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);

      const post = await prisma.forumPost.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, name: true, role: true, department: true },
          },
          course: {
            select: { id: true, title: true, trainerId: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, name: true, role: true, department: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      return res.json(post);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async togglePinPost(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const id = String(req.params.id);

      const post = await prisma.forumPost.findUnique({
        where: { id },
        include: {
          course: true,
        },
      });

      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (!post.courseId || !post.course) {
        return res.status(400).json({ error: 'Only course-scoped discussion threads can be pinned' });
      }

      // Allow if authoring trainer or admin
      const isAuthorized = req.user.role === 'admin' || post.course.trainerId === req.user.userId;
      if (!isAuthorized) {
        return res.status(403).json({ error: 'Only the course instructor or an administrator can pin threads' });
      }

      const willBePinned = !post.isPinned;

      if (willBePinned) {
        // Unpin any existing pinned post for this course so only 1 thread is pinned
        await prisma.forumPost.updateMany({
          where: { courseId: post.courseId, isPinned: true },
          data: { isPinned: false },
        });
      }

      const updated = await prisma.forumPost.update({
        where: { id },
        data: { isPinned: willBePinned },
      });

      return res.json({
        message: willBePinned ? 'Thread pinned to top' : 'Thread unpinned',
        post: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updatePost(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const id = String(req.params.id);
      const { body } = req.body;

      if (!body) return res.status(400).json({ error: 'Post body is required' });

      const post = await prisma.forumPost.findUnique({
        where: { id },
        include: {
          course: true,
          parentPost: { include: { course: true } },
        },
      });

      if (!post) return res.status(404).json({ error: 'Post not found' });

      const courseTrainerId = post.course?.trainerId || post.parentPost?.course?.trainerId;
      const isAuthorized =
        post.authorId === req.user.userId ||
        req.user.role === 'admin' ||
        (courseTrainerId && courseTrainerId === req.user.userId);

      if (!isAuthorized) {
        return res.status(403).json({ error: 'You are not authorized to edit this post' });
      }

      const updated = await prisma.forumPost.update({
        where: { id },
        data: { body },
      });

      return res.json({
        message: 'Post updated successfully',
        post: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async deletePost(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const id = String(req.params.id);

      const post = await prisma.forumPost.findUnique({
        where: { id },
        include: {
          course: true,
          parentPost: { include: { course: true } },
        },
      });

      if (!post) return res.status(404).json({ error: 'Post not found' });

      const courseTrainerId = post.course?.trainerId || post.parentPost?.course?.trainerId;
      const isAuthorized =
        post.authorId === req.user.userId ||
        req.user.role === 'admin' ||
        (courseTrainerId && courseTrainerId === req.user.userId);

      if (!isAuthorized) {
        return res.status(403).json({ error: 'You are not authorized to delete this post' });
      }

      await prisma.forumPost.delete({ where: { id } });

      return res.json({ message: 'Post deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
