import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import crypto from 'crypto'; // <--- ENSURE THIS IS HERE
import { sendStatusEmail, sendWarningEmail, sendPayoutEmail } from '../services/emailService.js';
import { sendReverificationEmail } from '../services/emailService.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const router = Router();
const prisma = new PrismaClient();

/**
 * 1. SYSTEM SETTINGS: Manage Flat Rate Prices
 */
router.get('/settings/prices', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { settingKey: { startsWith: 'PAY_' } }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch price settings" });
  }
});

router.put('/settings/prices', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { key, value } = req.body;
    await prisma.systemSetting.upsert({
      where: { settingKey: key },
      update: { settingValue: value },
      create: { settingKey: key, settingValue: value }
    });
    res.json({ success: true, message: "System rate updated." });
  } catch (error) {
    res.status(500).json({ message: "Failed to update price" });
  }
});

/**
 * 2. TASK ENGINE: Creation & Statistics
 */
router.post('/tasks', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { projectId, title, instruction, type, content, payRate } = req.body;

    // Use payRate from body if provided, otherwise check settings, fallback to 0.50
    let finalPayRate = payRate ? parseFloat(payRate) : null;

    if (!finalPayRate) {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: `PAY_${type}` }
      });
      finalPayRate = setting ? parseFloat(setting.settingValue) : 0.50;
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        instruction,
        type, 
        payRate: finalPayRate, // Use the custom rate
        content,
        status: 'AVAILABLE'
      }
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ message: "Task deployment failed." });
  }
});

router.get('/task-stats', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const stats = await prisma.task.groupBy({
    by: ['type'],
    _count: { _all: true }
  });
  res.json(stats);
});

/**
 * 3. PROJECT ARCHITECT (Supports Manual IDs)
 * NOTE: This is the ONLY place '/projects' GET/POST should be defined in
 * this router. Express matches routes in registration order, so a second
 * '/projects' handler added further down the file would never be reached —
 * these are it.
 */
router.get('/projects', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const projects = await prisma.project.findMany({
    include: { _count: { select: { tasks: true } } }
  });
  res.json(projects);
});

// Creates the Project AND its mapped chat Channel together in one
// transaction, so if either half fails, neither is left behind.
/**
 * 3. PROJECT ARCHITECT (UPDATED to support Assessments)
 */
// Replace your existing router.post('/projects') block with this:
router.post('/projects', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // 1. Destructure the NEW fields from the request body
    const { id, name, description, isAssessment, assessmentData } = req.body;

    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          id: typeof id === 'string' && id.trim() !== "" ? id : undefined,
          name,
          description,
          // 2. Save the Assessment fields to the database
          isAssessment: isAssessment === true, 
          assessmentData: assessmentData || null
        }
      });

      // Auto-create a matching chat channel, locked by default.
      await tx.channel.create({
        data: {
          name: name.toUpperCase().replace(/\s+/g, '_'),
          projectId: proj.id,
          isLocked: true
        }
      });

      return proj;
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error("Project Creation Error:", error);
    res.status(400).json({ message: "Conflict: Project ID or channel name already in use." });
  }
});
/**
 * 3b. PROJECT LIFECYCLE: Update Status (Active, Paused, Completed)
 */
router.patch('/projects/:id/status', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { status } = req.body;
    await prisma.project.update({
where: { id: req.params.id as string },
      data: { status }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Status update failed." });
  }
});


 router.delete('/projects/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const projectId = req.params.id as string;
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated channel first
      await tx.channel.deleteMany({ where: { projectId } });
      // 2. Delete the project itself
      await tx.project.delete({ where: { id: projectId } });
    });
    res.json({ success: true, message: "Project mapping purged." });
  } catch (error) {
    res.status(500).json({ message: "Purge failed. Ensure project has no active tasks first." });
  }
});

router.post('/release-all', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // 1. Find all wallets with money
    const walletsWithBalance = await prisma.wallet.findMany({
      where: { availableBalance: { gt: 0 } },
      include: { user: true }
    });

    if (walletsWithBalance.length === 0) {
      return res.status(400).json({ message: "No balances available for release." });
    }

    // 2. Perform Transactional Sweep
    await prisma.$transaction(async (tx) => {
      for (const wallet of walletsWithBalance) {
        const amountToPay = wallet.availableBalance;

        // Create Transaction History
        await tx.transaction.create({
          data: {
            userId: wallet.userId,
            amount: amountToPay,
            type: 'WITHDRAWAL',
            status: 'PAID',
            description: `Automatic Bi-Weekly Disbursement (${wallet.payoutMethod})`,
            payoutDate: new Date()
          }
        });

        // Reset Wallet Balance & Increment Withdrawn
        await tx.wallet.update({
          where: { userId: wallet.userId },
          data: {
            availableBalance: 0,
            totalWithdrawn: { increment: amountToPay }
          }
        });
      }
    });

    res.json({ success: true, count: walletsWithBalance.length });
  } catch (error) {
    res.status(500).json({ message: "Financial sweep failed." });
  }
});

// Get recent transactions for Admin view
router.get('/payout-history', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const history = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    take: 50
  });
  res.json(history);
});

/**
 * 5. AUDIT & REVIEW CONSOLE
 */
// ... inside router.get('/all-submissions' ...)
router.get('/all-submissions', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const subs = await prisma.submission.findMany({
    include: { 
      // FIX: Added 'id: true' to the worker select object
      worker: { select: { id: true, email: true, firstName: true, lastName: true } }, 
      task: { select: { title: true, payRate: true } } 
    },
    orderBy: { submittedAt: 'desc' }
  });
  res.json(subs);
});

// ADMIN: Quality Audit — approve or reject a submission.
// Uses UPSERT on Review (unique on submissionId) so re-reviewing a
// resubmitted revision UPDATES the existing review instead of trying to
// create a second one, which is what was throwing the unique-constraint
// error ("Review failed to save...").
router.post('/review', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const { submissionId, score, status, feedback, isRedFlag } = req.body;
  const adminId = (req as any).user.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the submission first to find the worker and task details
      const sub = await tx.submission.findUnique({
        where: { id: submissionId },
        include: { task: true }
      });

      if (!sub) throw new Error("Submission not found");

      // 2. REVERSAL LOGIC: If this is a rejection, subtract balance.
      // (If it was already rejected once and then revised, submit-revision
      // already added the balance back, so this stays safe either way.)
      if (status.includes('REJECTED')) {
        await tx.wallet.update({
          where: { userId: sub.workerId },
          data: { availableBalance: { decrement: sub.task.payRate } }
        });
      }

      // 3. Update the Submission Status
      const updatedSub = await tx.submission.update({
        where: { id: submissionId },
        data: {
          status: status,
          adminFeedback: feedback
        }
      });

      // 4. UPSERT the Review — update if one already exists for this
      // submission, create it if this is the first review.
      await tx.review.upsert({
        where: { submissionId: submissionId },
        update: {
          reviewerId: adminId,
          score: score,
          status: status,
          feedback: feedback,
          isRedFlag: isRedFlag || false,
          reviewedAt: new Date()
        },
        create: {
          submissionId: submissionId,
          reviewerId: adminId,
          score: score,
          status: status,
          feedback: feedback,
          isRedFlag: isRedFlag || false
        }
      });

      // 5. Recalculate the worker's overall accuracy rating
       const allReviews = await tx.review.findMany({
        where: { submission: { workerId: sub.workerId } }
      });
      
      const avg = allReviews.length > 0 
        ? allReviews.reduce((acc, r) => acc + r.score, 0) / allReviews.length 
        : 0;

      await tx.workerProfile.update({
        where: { userId: sub.workerId },
        data: {
          accuracyScore: avg,
          totalAudits: { increment: 1 }
        }
      });

      return updatedSub;
    });

    res.json({ success: true, submission: result });
  } catch (error: any) {
    console.error("Audit Error:", error);
    res.status(500).json({ message: "Database conflict: Could not update audit record." });
  }
});

/**
 * 6. INVENTORY MANAGEMENT
 */
router.get('/all-tasks', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const tasks = await prisma.task.findMany({
    include: { project: { select: { name: true } }, _count: { select: { submissions: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tasks);
});

router.delete('/tasks/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const taskId = req.params.id as string;
 
  try {
    await prisma.$transaction(async (tx) => {
      // Find every submission tied to this task first — SupportTicket and
      // Review both key off submissionId, so we need these IDs before
      // deleting anything.
      const submissions = await tx.submission.findMany({
        where: { taskId },
        select: { id: true }
      });
      const submissionIds = submissions.map((s) => s.id);
 
      if (submissionIds.length > 0) {
        // 1. Support tickets opened against any of these submissions
        await tx.supportTicket.deleteMany({ where: { submissionId: { in: submissionIds } } });
 
        // 2. Reviews left on any of these submissions
        await tx.review.deleteMany({ where: { submissionId: { in: submissionIds } } });
 
        // 3. The submissions themselves
        await tx.submission.deleteMany({ where: { taskId } });
      }
 
      // 4. Finally, the task
      await tx.task.delete({ where: { id: taskId } });
    });
 
    res.json({ success: true, message: "Task and all linked submissions permanently removed." });
  } catch (error: any) {
    console.error("Task Delete Error:", error);
    res.status(500).json({ message: "Deletion failed. This task may have dependent records that couldn't be cleared — check server logs." });
  }
});
 

/**
 * 7. FINANCE: Snapshot / Payout Cycle
 */

// Snapshot Guard: Don't allow starting a new snapshot while one is still
// PROCESSING — prevents double-capturing submissions into two cycles.
router.post('/finance/snapshot', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const activeCycle = await prisma.payoutCycle.findFirst({ where: { status: 'PROCESSING' } });
    if (activeCycle) return res.status(400).json({ message: "A payout cycle is already in progress. Complete it first." });

    const cycle = await prisma.payoutCycle.create({
      data: { snapshotDate: new Date(), status: 'PROCESSING' }
    });

    // Capture ONLY approved tasks not yet in a cycle
    await prisma.submission.updateMany({
      where: { payoutCycleId: null, status: 'APPROVED' },
      data: { payoutCycleId: cycle.id }
    });

    res.json({ success: true, cycleId: cycle.id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Processes a single worker's payout within the active cycle.
 * Fires a disbursement email once the DB transaction succeeds. Like the
 * status/warning emails, the send is isolated in its own try/catch so a
 * delivery failure never masks a successful payout or makes it look like
 * the payout didn't go through when it actually did.
 */
router.post('/payout/process', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  // Added 'manualDate' to the destructured body
  const { userId, amountToPay, manualDate } = req.body;

  try {
    const activeCycle = await prisma.payoutCycle.findFirst({ where: { status: 'PROCESSING' } });
    if (!activeCycle) {
      return res.status(400).json({ message: "No active payout cycle. Take a snapshot first." });
    }

    // 1. Guard: has this user already been paid in THIS cycle?
    const alreadyPaid = await prisma.transaction.findFirst({
      where: { userId, payoutCycleId: activeCycle.id, type: 'WITHDRAWAL', status: 'PAID' }
    });
    
    if (alreadyPaid) {
      return res.status(400).json({ message: "This worker has already been paid in the current cycle." });
    }

    // 2. Execute Financial Transaction
    await prisma.$transaction(async (tx) => {
      // Create the history record
      await tx.transaction.create({
        data: {
          userId,
          amount: amountToPay,
          type: 'WITHDRAWAL',
          status: 'PAID',
          description: `Disbursement completed via manual sweep.`,
          payoutCycleId: activeCycle.id,
          // NEW: If manualDate exists, use it. Otherwise, use current time.
          payoutDate: manualDate ? new Date(manualDate) : new Date() 
        }
      });

      // Update the live wallet balances
      await tx.wallet.update({
        where: { userId },
        data: {
          availableBalance: { decrement: amountToPay },
          totalWithdrawn: { increment: amountToPay }
        }
      });
    });

    // --- AUTOMATED PAYOUT TRIGGER ---
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true }
      });
      if (user) {
        await sendPayoutEmail(user.email, String(amountToPay), user.wallet?.payoutMethod || 'NONE');
      }
    } catch (emailError) {
      console.error("Payout email failed to send (payout itself succeeded):", emailError);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Payout Processing Error:", error);
    res.status(500).json({ message: "Critical Database Error: Payout failed." });
  }
});
// Mark the active cycle as Complete
router.post('/finance/cycle-complete', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  await prisma.payoutCycle.updateMany({
    where: { status: 'PROCESSING' },
    data: { status: 'COMPLETED' }
  });
  res.json({ success: true });
});

// Get Snapshot Data for the Payout Table
router.get('/finance/snapshot-data', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // 1. Identify the active cycle that is currently in the 'PROCESSING' phase
    const activeCycle = await prisma.payoutCycle.findFirst({
        where: { status: 'PROCESSING' },
        include: { submissions: { include: { task: true } } }
    });

    // If no cycle is active, tell the frontend so it can show the "Initialize" button
    if (!activeCycle) return res.json({ cycleActive: false, users: [] });

    // 2. Fetch all workers who have approved work frozen inside this specific cycle
    const workers = await prisma.user.findMany({
        where: { 
          submissions: { 
            some: { payoutCycleId: activeCycle.id } 
          } 
        },
        include: { 
          wallet: true, 
          submissions: { 
            where: { payoutCycleId: activeCycle.id }, 
            include: { task: true } 
          } 
        }
    });

    // 3. Identification Check: Find which workers have already received their funds in this cycle
    const paidTransactions = await prisma.transaction.findMany({
        where: { 
          payoutCycleId: activeCycle.id, 
          type: 'WITHDRAWAL', 
          status: 'PAID' 
        },
        select: { userId: true }
    });
    
    // Create a Set for O(1) lookup speed
    const paidUserIds = new Set(paidTransactions.map(t => t.userId));

    // 4. Data Transformation: Map DB records to the high-fidelity spreadsheet format
    const result = workers.map(w => ({
        id: w.id,
        firstName: w.firstName,
        lastName: w.lastName,
        email: w.email,
        payoutMethod: w.wallet?.payoutMethod || 'NONE',
        // CRITICAL: We pass the entire JSON object so the Admin can see Bank/Stripe details
        payoutDetails: w.wallet?.payoutDetails || {},
        // Sum up the payRates of all tasks captured in this specific snapshot
        snapshotBalance: w.submissions.reduce((sum, s) => sum + Number(s.task.payRate), 0),
        // Flag to disable the "Release" button if they were already paid
        paidThisCycle: paidUserIds.has(w.id)   
    }));

    res.json({ 
      cycleActive: true, 
      cycleId: activeCycle.id,
      users: result 
    });
  } catch (error: any) {
    console.error("Snapshot Data Fetch Error:", error);
    res.status(500).json({ message: "Failed to compile financial snapshot." });
  }
});
router.post('/announcements', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { content } = req.body;
    const adminId = (req as any).user.userId;

    if (!content || content.length < 5) {
      return res.status(400).json({ message: "Pulse content too short." });
    }

    const pulse = await prisma.announcement.create({
      data: {
        content,
        authorId: adminId
      },
      include: { author: { select: { firstName: true, lastName: true } } }
    });

    res.status(201).json({ success: true, pulse });
  } catch (error) {
    res.status(500).json({ message: "Failed to transmit pulse." });
  }
});

// GET existing pulses for the admin view
router.get('/announcements', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const pulses = await prisma.announcement.findMany({
    include: { author: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(pulses);
});

/**
 * ACCOUNT STATUS: Verify / Suspend / Put under review.
 * Fires an automated status-change email after the DB write succeeds.
 * The email send is isolated in its own try/catch so a delivery failure
 * (bad API key, rate limit, etc.) never masks a successful status update
 * or reports "Update failed" when the update actually went through.
 */
router.patch('/users/:id/status', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const { status } = req.body; // SUSPENDED, UNDER_REVIEW, VERIFIED
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { status }
    });

    // --- AUTOMATED TRANSMISSION TRIGGER ---
    try {
      if (status === 'VERIFIED') {
        await sendStatusEmail(user.email, 'AUTHORIZED');
      } else if (status === 'SUSPENDED') {
        await sendStatusEmail(user.email, 'TERMINATED');
      } else if (status === 'UNDER_REVIEW') {
        await sendStatusEmail(user.email, 'UNDER_REVIEW');
      }
    } catch (emailError) {
      console.error("Status email failed to send (status update itself succeeded):", emailError);
    }

    res.json({ success: true, message: `Node status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

/**
 * COMPLIANCE WARNING: Increments this worker's warningCount and emails them.
 * Fixed to match on WorkerProfile.userId (req.params.id is the User's id,
 * not the WorkerProfile's own id — matching on `id` here would silently hit
 * the wrong record or throw "record not found").
 * The warning email is isolated in its own try/catch for the same reason as
 * above — a failed send must not make it look like the warning wasn't
 * issued, since that would risk a double increment on retry.
 */
// 13. MANAGE NODE ROLES (ADMIN -> WORKER, etc.)
router.patch('/users/:id/role', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  const { role } = req.body; // 'ADMIN', 'WORKER', 'PROJECT_MANAGER'

  try {
    await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role }
    });
    res.json({ success: true, message: `Node authority updated to ${role}` });
  } catch (error) {
    res.status(500).json({ message: "Authority sync failed." });
  }
});

router.post('/users/:id/warn', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const profile = await prisma.workerProfile.update({
      where: { userId: req.params.id as string },
      data: { warningCount: { increment: 1 } },
      include: { user: { select: { email: true } } }
    });

    // --- AUTOMATED WARNING TRIGGER ---
    try {
      await sendWarningEmail(profile.user.email, profile.warningCount);
    } catch (emailError) {
      console.error("Warning email failed to send (warning itself was recorded):", emailError);
    }

    res.json({ success: true, message: "Compliance warning issued." });
  } catch (error) {
    res.status(500).json({ message: "Warning failed" });
  }
});
// 11. NODE DIRECTORY (Fetch everyone so we can manage roles)
router.get('/node-directory', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      // REMOVE the "where: { role: 'WORKER' }" line here
      include: { 
        workerProfile: { select: { accuracyScore: true, warningCount: true } }, 
        wallet: { select: { availableBalance: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal directory failure." });
  }
});
router.patch('/users/:id/request-reverify', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { status: 'UNVERIFIED' } 
    });

    // --- TRIGGER THE EMAIL ---
    await sendReverificationEmail(user.email);

    res.json({ success: true, message: "Node gated and notification transmitted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to flag node." });
  }
});
// TRIGGER MANUAL RE-VERIFICATION
router.patch('/users/:id/request-reverify', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    await prisma.user.update({
where: { id: req.params.id as string },
      data: { status: 'UNVERIFIED' } // This forces the FaceVerificationModule to show up
    });
    res.json({ success: true, message: "Node flagged for mandatory re-verification." });
  } catch (error) {
    res.status(500).json({ message: "Failed to flag node." });
  }
});


router.delete('/users/:id/purge', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  const userId = req.params.id as string;

  try {
    await prisma.$transaction(async (tx) => {
      // Grab this worker's submission IDs first — Review and SupportTicket
      // both key off submissionId, so we need these before deleting anything.
      const submissions = await tx.submission.findMany({
        where: { workerId: userId },
        select: { id: true }
      });
      const submissionIds = submissions.map((s) => s.id);

      // 1. Reviews on this worker's submissions
      if (submissionIds.length > 0) {
        await tx.review.deleteMany({ where: { submissionId: { in: submissionIds } } });
      }

      // 2. Support tickets raised by this user (also clears the FK back to
      // their submissions before those submissions are deleted)
      await tx.supportTicket.deleteMany({ where: { userId } });

      // 3. Submissions
      await tx.submission.deleteMany({ where: { workerId: userId } });

      // 4. Transactions
      await tx.transaction.deleteMany({ where: { userId } });

      // 5. Messages authored by this user
      await tx.message.deleteMany({ where: { authorId: userId } });

      // 6. Announcements authored by this user
      await tx.announcement.deleteMany({ where: { authorId: userId } });

      // 7. Worker profile (1:1)
      await tx.workerProfile.deleteMany({ where: { userId } });

      // 8. Wallet (1:1)
      await tx.wallet.deleteMany({ where: { userId } });

      // 9. The user record itself, last
      await tx.user.delete({ where: { id: userId } });
    });

    res.json({ success: true, message: "Node permanently purged from the grid." });
  } catch (error: any) {
    console.error("Purge Error:", error);
    res.status(500).json({ message: "Purge failed. The node may have dependent records that couldn't be cleared." });
  }
});

router.post('/communicate', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    const { targetEmail, subject, message, sendToAll } = req.body;
    try {
        let emails: string[] = [];
        if (sendToAll) {
            const users = await prisma.user.findMany({ select: { email: true } });
            emails = users.map(u => u.email);
        } else {
            const user = await prisma.user.findUnique({ 
                where: { email: (targetEmail as string)?.toLowerCase().trim() } 
            });
            if (!user) return res.status(404).json({ message: "Node not found." });
            emails.push(user.email);
        }

        for (const email of emails) {
            // FIX: Explicitly cast email to string
            await resend.emails.send({
                from: 'NexusGrid Staff <support@nexugrid.site>',
                to: email as string, 
                subject: `[NexusGrid] ${subject}`,
                html: `<div style="background:#050505;color:white;padding:40px;border-radius:20px;font-family:sans-serif;">
                        <h1 style="color:#6366f1">NexusGrid Official Transmission</h1>
                        <p>${message}</p>
                       </div>`
            });
        }
        res.json({ success: true, message: `Sent to ${emails.length} users.` });
    } catch (e) { res.status(500).json({ message: "Communication bridge failed." }); }
});
router.get('/tickets', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    const tickets = await prisma.supportTicket.findMany({
        include: { user: { select: { firstName: true, email: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
});

// Reply to a ticket (Sends Email)
router.post('/tickets/:id/reply', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    const { replyMessage } = req.body;
    try {
        // Fetch ticket with the related user
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: req.params.id as string },
            include: { user: true }
        });

        // FIX: Added explicit check and casting for the user property
        if (ticket && (ticket as any).user) {
            await resend.emails.send({
                from: 'NexusGrid Support <support@nexugrid.site>',
                to: (ticket as any).user.email as string,
                subject: `RE: ${ticket.subject}`,
                html: `<div style="font-family:sans-serif; padding:20px;">
                        <p>${replyMessage}</p>
                        <br/><hr/>
                        <p style="font-size:10px; color:gray;">Original Enquiry: ${ticket.message}</p>
                       </div>`
            });

            await prisma.supportTicket.update({ 
                where: { id: ticket.id }, 
                data: { status: 'RESOLVED', adminReply: replyMessage } 
            });
            
            res.json({ success: true });
        } else {
            res.status(404).json({ message: "Ticket or associated user not found." });
        }
    } catch (error) { 
        console.error("Reply Error:", error);
        res.status(500).json({ message: "Reply transmission failed." }); 
    }
});
router.delete('/tickets/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    await prisma.supportTicket.delete({
      where: { id: req.params.id as string }
    });
    res.json({ success: true, message: "Ticket successfully purged from ledger." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete ticket. It may have already been removed." });
  }
});
export default router;