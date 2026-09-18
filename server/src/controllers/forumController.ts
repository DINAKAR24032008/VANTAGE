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
            select: { id: true, title: true },
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
        orderBy: { createdAt: 'desc' },
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
            select: { id: true, title: true },
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
}
