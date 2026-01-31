import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';
// import * as Sentry from '@sentry/node';

/**
 * Get User Credits
 */
export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // If user not found in database, create them with default 20 credits
    if (!user) {
      const auth = req.auth();
      let clerkUser = null as any;
      if (auth.getToken) {
        clerkUser = await auth.getToken();
      }
      user = await prisma.user.create({
        data: {
          id: userId,
          email: auth.sessionClaims?.email as string || '',
          name: auth.sessionClaims?.name as string || 'User',
          image: auth.sessionClaims?.image_url as string || '',
        },
      });
    }

    res.json({ credits: user.credits });
  } catch (error: any) {
    // Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

/**
 * Get all projects of logged-in user
 */
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ projects });
  } catch (error: any) {
    // Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

/**
 * Get project by ID (user-owned)
 */
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projectId = req.params.projectId as string;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (error: any) {
    // Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

/**
 * Publish / Unpublish project
 */
export const toggleProjectPublic = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projectId = req.params.projectId as string;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.generatedImage && !project.generatedVideo) {
      return res
        .status(400)
        .json({ message: 'Image or video not generated yet' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        isPublished: !project.isPublished
      }
    });

    res.json({ isPublished: updatedProject.isPublished });
  } catch (error: any) {
    // Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
