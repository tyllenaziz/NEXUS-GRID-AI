// backend/src/routes/chatRoutes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/channels', authenticate, async (req: Request, res: Response) => {
  const channels = await prisma.channel.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(channels);
});

router.get('/channels/:channelId/messages', authenticate, async (req: Request, res: Response) => {
  const messages = await prisma.message.findMany({
    where: { channelId: req.params.channelId as string }, // FIX: Explicit cast
    include: { 
      author: { select: { firstName: true, lastName: true, role: true, workerProfile: { select: { profilePicture: true } } } } 
    },
    orderBy: { createdAt: 'asc' }
  });
  res.json(messages);
});

router.post('/messages', authenticate, async (req: Request, res: Response) => {
  const { content, channelId } = req.body;
  const user = (req as any).user;
  const channel = await prisma.channel.findUnique({ where: { id: channelId as string } });
  if (channel?.isLocked && user.role === 'WORKER') return res.status(403).json({ message: "Locked." });

  const msg = await prisma.message.create({
    data: { content, channelId, authorId: user.userId, reactions: {} },
    include: { author: { select: { firstName: true, lastName: true } } }
  });
  res.status(201).json(msg);
});

router.patch('/messages/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.message.update({
    where: { id: req.params.id as string }, // FIX
    data: { content: req.body.content }
  });
  res.json({ success: true });
});

router.delete('/messages/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.message.delete({ where: { id: req.params.id as string } }); // FIX
  res.json({ success: true });
});

router.patch('/messages/:id/pin', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  await prisma.message.update({
    where: { id: req.params.id as string }, // FIX
    data: { isPinned: req.body.isPinned }
  });
  res.json({ success: true });
});

router.patch('/channels/:id/lock', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  await prisma.channel.update({
    where: { id: req.params.id as string }, // FIX
    data: { isLocked: req.body.isLocked }
  });
  res.json({ success: true });
});

router.post('/messages/:id/react', authenticate, async (req: Request, res: Response) => {
  const { emoji } = req.body;
  const userId = (req as any).user.userId;
  const msg = await prisma.message.findUnique({ where: { id: req.params.id as string } });
  if (!msg) return res.status(404).json({ message: "Not found" });

  let reactions = (msg.reactions as any) || {};
  if (!reactions[emoji]) reactions[emoji] = [];
  if (reactions[emoji].includes(userId)) {
    reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji].push(userId);
  }

  await prisma.message.update({
    where: { id: req.params.id as string },
    data: { reactions }
  });
  res.json({ success: true, reactions });
});

export default router;