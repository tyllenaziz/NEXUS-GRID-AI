import { Router } from 'express';
import { PrismaClient, PayoutMethod } from '@prisma/client';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import bcrypt from 'bcryptjs'; 
import { sendVaultOTP, sendStatusEmail } from '../services/emailService.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * 1. GET USER PROFILE & DYNAMIC ANALYTICS
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        workerProfile: true, 
        wallet: true,
        submissions: { 
          where: { review: { isNot: null } },
          include: { review: true } 
        }
      }
    });

    if (!user) return res.status(404).json({ message: "Node not found." });

    const starBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    user.submissions.forEach(sub => {
      if (sub.review) {
        const score = sub.review.score as keyof typeof starBreakdown;
        if (starBreakdown[score] !== undefined) starBreakdown[score]++;
      }
    });

    res.json({
      ...user,
      starBreakdown,
      finance: {
        pending: Number(user.wallet?.availableBalance || 0).toFixed(2),
        totalEarned: Number(user.wallet?.totalWithdrawn || 0).toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Interface sync failed." });
  }
});

/**
 * 2. TASK QUEUE CONTROLLERS
 */
router.get('/task-counts', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;

  try {
    // 1. Fetch user to check Triple-Gate status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        signedNDA: true,
        signedContract: true,
        passedAssessment: true
      }
    });

    const taskTypes = ['PREFERENCE_RANKING', 'TEXT_CLASSIFICATION', 'SENTIMENT_ANALYSIS', 'FACT_CHECKING'];
    const result: any = {};

    // 2. Define the Gate Logic
    const isFullyCleared = 
      user?.status === 'VERIFIED' && 
      user?.signedNDA && 
      user?.signedContract && 
      user?.passedAssessment;

    // 3. Process each type
    for (const type of taskTypes) {
      
      // If NOT cleared, return locked/zeroed data immediately for this type
      if (!isFullyCleared) {
        result[type] = {
          count: 0,
          payRate: "0.00",
          status: 'LOCKED' // UI can use this to show lock icons
        };
        continue; // Move to next task type
      }

      // If CLEARED, perform the actual database counts
      // Count available units ONLY in ACTIVE projects
      const count = await prisma.task.count({
        where: { 
          type, 
          status: 'AVAILABLE', 
          project: { status: 'ACTIVE' }, 
          submissions: { none: { workerId: userId } } 
        }
      });

      // Fetch the newest task AND its project status for the payRate
      const latestTask = await prisma.task.findFirst({
        where: { type },
        orderBy: { createdAt: 'desc' },
        include: { 
          project: { select: { status: true } }
        }
      });

      result[type] = {
        count: count || 0,
        payRate: latestTask ? parseFloat(latestTask.payRate.toString()).toFixed(2) : "0.00",
        status: latestTask?.project?.status || 'ACTIVE' 
      };
    }

    res.json(result);
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Failed to synchronize live market rates." });
  }
});
router.get('/tasks/next/:type', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.status === 'UNDER_REVIEW' || user?.status === 'SUSPENDED') {
      return res.status(403).json({ message: "Task access locked." });
    }
    const nextTask = await prisma.task.findFirst({
      where: { 
        type: req.params.type as string, 
        status: 'AVAILABLE', 
            project: { status: 'ACTIVE' }, // <--- ADD THIS LINE

        submissions: { none: { workerId: userId } } 
      }
    });
    if (!nextTask) return res.status(404).json({ message: "Queue empty" });
    res.json(nextTask);
  } catch (error) {
    res.status(500).json({ message: "Queue sync error." });
  }
});

router.get('/tasks/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id as string },
      include: { project: { select: { name: true } } }
    });
    if (!task) return res.status(404).json({ message: "Task stream not found." });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

/**
 * 3. IDENTITY VAULT (PAYMENT SETTINGS SECURITY)
 */
router.post('/wallet/request-unlock', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { id: userId },
      data: { 
        verificationCode: otp, 
        verificationExpires: new Date(Date.now() + 10 * 60 * 1000) 
      }
    });

    await sendVaultOTP(user.email, otp); 
    res.json({ success: true, message: "Security code sent to email." });
  } catch (error) {
    res.status(500).json({ message: "Vault protocol failure." });
  }
});

router.post('/wallet/verify-otp', authenticate, async (req, res) => {
  const { code } = req.body;
  const userId = (req as any).user.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user && user.verificationCode === code && new Date() < (user.verificationExpires as Date)) {
    await prisma.user.update({ where: { id: userId }, data: { verificationCode: null } });
    res.json({ success: true });
  } else {
    res.status(401).json({ message: "Invalid or expired security code." });
  }
});

router.put('/wallet/payout-settings', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;
  const { method, details } = req.body; 

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User missing." });

    await prisma.wallet.update({
      where: { userId },
      data: { 
        payoutMethod: method as PayoutMethod,
        payoutDetails: details
      }
    });

    // SECURITY ALERT: Send notification of change
    await sendStatusEmail(user.email, 'PAYMENT_METHOD_UPDATED');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Database update failed." });
  }
});

/**
 * 4. PRODUCTION (SUBMIT WORK & REFERRAL LOGIC)
 */
router.post('/submit', authenticate, async (req, res) => {
  const { taskId, answers, durationSeconds } = req.body;
  const userId = (req as any).user.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.status === 'UNDER_REVIEW' || user?.status === 'SUSPENDED') {
      return res.status(403).json({ message: "Production access is gated." });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ message: "Task missing" });
    
    const isSuspicious = (Number(task.payRate) > 10 && durationSeconds < 60);

    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.create({
        data: { taskId, workerId: userId, answers, durationSeconds, isSuspicious, status: 'PENDING' }
      });

      // Update worker balance
      await tx.wallet.update({ where: { userId }, data: { availableBalance: { increment: task.payRate } } });
      await tx.workerProfile.update({ where: { userId }, data: { tasksCompleted: { increment: 1 } } });

      // REFERRAL BONUS PROTOCOL
      const currentUser = await tx.user.findUnique({ where: { id: userId } });

      if (currentUser?.referredBy && !currentUser.referralBonusPaid) {
        const referrer = await tx.user.findUnique({ where: { referralCode: currentUser.referredBy } });

        if (referrer) {
          // Double-Lock check inside transaction
          const bonusCount = await tx.transaction.count({
            where: { userId: referrer.id, type: 'REFERRAL_BONUS' }
          });

          if (bonusCount < 3) {
            await tx.wallet.update({
              where: { userId: referrer.id },
              data: { availableBalance: { increment: 50.00 } }
            });

            await tx.transaction.create({
              data: {
                userId: referrer.id,
                amount: 50.00,
                type: 'REFERRAL_BONUS',
                status: 'PAID',
                description: `Bonus: ${currentUser.firstName} completed their 1st task.`
              }
            });

            await tx.user.update({
              where: { id: userId },
              data: { referralBonusPaid: true }
            });
          }
        }
      }
      return sub;
    });

    res.json({ success: true, suspicious: isSuspicious });
  } catch (error) {
    res.status(500).json({ message: "Transmission failed." });
  }
});

router.post('/submit-revision', authenticate, async (req, res) => {
  const { taskId, answers } = req.body;
  const userId = (req as any).user.userId;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ message: "Task missing" });

    const existing = await prisma.submission.findFirst({
      where: { 
        taskId: taskId, 
        workerId: userId, 
        status: { in: ['REJECTED_REVISION_NEEDED', 'REJECTED_PERMANENT'] } 
      }
    });

    if (!existing) return res.status(404).json({ message: "No rejected submission found to revise." });

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: existing.id },
        data: { answers, status: 'PENDING', revisionCount: { increment: 1 } }
      });

      await tx.wallet.update({ 
        where: { userId }, 
        data: { availableBalance: { increment: task.payRate } } 
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Revision sync failed." });
  }
});

/**
 * 5. LEGAL SIGNATURES
 */
router.post('/legal/sign', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;
  const { docType } = req.body; 
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '0.0.0.0';

  const updateData = docType === 'NDA'
    ? { signedNDA: new Date(), onboardingIP: ip }
    : { signedContract: new Date() };

  try {
    await prisma.user.update({ where: { id: userId }, data: updateData });
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ message: "Legal sync failed." });
  }
});

/**
 * 6. HISTORY & REFERRAL ANALYTICS
 */
router.get('/history', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;
  try {
    const history = await prisma.submission.findMany({
      where: { workerId: userId },
      include: { 
        task: { select: { title: true, type: true, payRate: true } },
        review: { select: { feedback: true, score: true, status: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Ledger fetch failed." });
  }
});

router.get('/payout-history', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const history = await prisma.transaction.findMany({
      where: { userId, type: { in: ['WITHDRAWAL', 'REFERRAL_BONUS'] }, status: 'PAID' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Ledger sync failed." });
  }
});

router.get('/referrals/stats', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const referrals = await prisma.user.findMany({
    where: { referredBy: user?.referralCode },
    select: { firstName: true, referralBonusPaid: true, createdAt: true }
  });

  res.json({ 
    stats: {
      count: referrals.length,
      earned: referrals.filter(r => r.referralBonusPaid).length * 50,
      limit: 3
    }, 
    referrals: referrals.map(r => ({ 
        name: r.firstName, 
        status: r.referralBonusPaid ? 'Bonus Paid' : 'Pending Task' 
    })) 
  });
});

/**
 * 7. OTHER PROFILE OPERATIONS
 */
router.put('/profile', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;
  const { firstName, lastName, linkedinUrl, githubUrl, category, experienceYears, country, primaryLanguage, university, availability, profilePicture, resumeUrl } = req.body;

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { firstName, lastName } }),
      prisma.workerProfile.update({ where: { userId: userId }, data: { linkedinUrl, githubUrl, category, experienceYears, country, primaryLanguage, university, availability, profilePicture, resumeUrl } })
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Profile sync failed." });
  }
});

router.post('/verify-identity', authenticate, async (req, res) => {
  const { idFront, idBack, facePulse } = req.body; 
  const userId = (req as any).user.userId;

  try {
    await prisma.$transaction([
      prisma.workerProfile.update({
        where: { userId },
        data: { 
          governmentIdFrontUrl: idFront, 
          governmentIdBackUrl: idBack, 
          faceVerificationUrl: facePulse 
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { status: 'PENDING_VERIFICATION' }
      })
    ]);
    res.json({ success: true, message: "Identity package transmitted for audit." });
  } catch (error) {
    res.status(500).json({ message: "Upload failed. Data payload too large or connection error." });
  }
});

router.get('/active-projects', authenticate, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        // SECURITY: If they haven't passed assessment, return an empty list
        if (!user?.passedAssessment || user.status !== 'VERIFIED') {
            return res.json([]); 
        }

        const projects = await prisma.project.findMany({
            where: { status: 'ACTIVE', isAssessment: false },
            include: { _count: { select: { tasks: true } } }
        });
        res.json(projects);
    } catch (e) { res.status(500).json({ message: "Sync failed." }); }
});


router.get('/assessment-test', authenticate, async (req, res) => {
    try {
        const test = await prisma.project.findFirst({ 
            where: { isAssessment: true, status: 'ACTIVE' } 
        });
        if (!test) return res.status(404).json({ message: "No active test found." });
        res.json(test);
    } catch (e) { res.status(500).json({ message: "Database error." }); }
});

router.post('/submit-assessment', authenticate, async (req, res) => {
  const { answers } = req.body; // Array of selected indexes: [0, 2, 1...]
  const userId = (req as any).user.userId;

  const test = await prisma.project.findFirst({ where: { isAssessment: true, status: 'ACTIVE' } });
  if (!test) return res.status(404).json({ message: "No active assessment found." });

  const questions = test.assessmentData as any[];
  let correct = 0;

  questions.forEach((q, index) => {
    if (q.correct === answers[index]) correct++;
  });

  const score = (correct / questions.length) * 100;

  if (score >= 70) {
    await prisma.user.update({ where: { id: userId }, data: { passedAssessment: true } });
    res.json({ success: true, score, message: "Qualification Passed. Dashboard Unlocked." });
  } else {
    res.status(400).json({ success: false, score, message: "Score below 70%. Please review guidelines and retry." });
  }
});
router.post('/support-ticket', authenticate, async (req, res) => {
  const { subject, message } = req.body;
  const user = (req as any).user; // This contains the decoded JWT

  try {
    await prisma.supportTicket.create({
      data: {
        userId: user.userId as string, // Cast to string to fix the TS error
        subject: subject as string,
        message: message as string,
        status: 'OPEN'
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Ticket Error:", error);
    res.status(500).json({ message: "Ticket submission failed." });
  }
});
export default router;