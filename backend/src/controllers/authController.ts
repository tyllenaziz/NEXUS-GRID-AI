import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOTP, sendWelcomeEmail } from '../services/emailService.js';
// Centralized Prisma instance
import prisma from '../lib/prisma.js'; 
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// --- HELPER: GENERATE 6-DIGIT OTP ---
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * 1. REGISTER NODE
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, referredBy } = req.body;
    
    // Referral Cap: Max 3 people
    if (referredBy) {
      const referralCount = await prisma.user.count({
        where: { referredBy: referredBy }
      });
      if (referralCount >= 3) {
        return res.status(400).json({ message: 'This referral link has reached its maximum limit of 3 uses.' });
      }
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) return res.status(400).json({ message: 'Identity already exists in grid.' });

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const otp = generateOTP();

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        verificationCode: otp,
        verificationExpires: new Date(Date.now() + 15 * 60 * 1000),
        isEmailVerified: false,
        referredBy: referredBy || null,
        workerProfile: { create: {} }, 
        wallet: { create: {} }        
      }
    });

    await sendOTP(newUser.email, otp, 'VERIFY');
    res.status(201).json({ success: true, message: 'OTP transmitted.' });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Registration sequence failed.' });
  }
};

/**
 * 2. VERIFY EMAIL OTP
 */
export const verifyEmail = async (req: Request, res: Response) => {
    const { email, code } = req.body;
    try {
        const cleanEmail = email.toLowerCase().trim();
        const foundUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

        if (!foundUser || foundUser.verificationCode !== code) {
            return res.status(400).json({ message: "Invalid verification sequence." });
        }
        
        await prisma.user.update({
            where: { id: foundUser.id },
            data: { 
                isEmailVerified: true, 
                verificationCode: null, 
                verificationExpires: null,
                status: 'UNVERIFIED' 
            }
        });

        await sendWelcomeEmail(foundUser.email, foundUser.firstName);
        res.json({ success: true, message: "Node activated." });
    } catch (error) {
        res.status(500).json({ message: "Verification failed." });
    }
};

/**
 * 3. LOGIN NODE (With Trusted Device Logic)
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password.trim(), user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isEmailVerified) return res.status(403).json({ message: 'Verify email first.' });

    // --- LOGIC: CHECK FOR TRUSTED DEVICE COOKIE ---
    const deviceTrustToken = req.cookies.nexus_device_trust;
    let deviceIsTrusted = false;

    if (deviceTrustToken) {
        try {
            const decoded: any = jwt.verify(deviceTrustToken, JWT_SECRET);
            if (decoded.userId === user.id) deviceIsTrusted = true;
        } catch (e) { deviceIsTrusted = false; }
    }

    if (deviceIsTrusted) {
        // SKIP OTP: Device recognized
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.json({ 
            success: true, 
            mfaRequired: false, 
            user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName } 
        });
    }

    // REQUIRE OTP: New device detected
    const otp = generateOTP();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: otp, verificationExpires: new Date(Date.now() + 5 * 60 * 1000) }
    });

    await sendOTP(user.email, otp, 'LOGIN');
    res.json({ success: true, mfaRequired: true, message: "Security code sent." });
  } catch (error) {
    console.error("CRITICAL LOGIN ERROR:", error); // This allows you to see the exact error in Render Logs
    res.status(500).json({ 
        message: 'Grid synchronization error. Please refresh and try again.' 
    });
  }
};

/**
 * 4. VERIFY LOGIN OTP (Marks device as trusted)
 */
export const verifyLoginOTP = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.verificationCode !== code) return res.status(400).json({ message: "Invalid code." });

    // Issue Session Token
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // --- MARK DEVICE AS TRUSTED (Valid for 30 Days) ---
    const deviceToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('nexus_device_trust', deviceToken, {
        httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000
    });

    await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode: null, verificationExpires: null }
    });

    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName } });
  } catch (error) {
    res.status(500).json({ message: "Login verification failed." });
  }
};

/**
 * 5. FORGOT PASSWORD
 */
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) return res.status(404).json({ message: "Identity not found." });

        const otp = generateOTP();
        await prisma.user.update({
            where: { id: user.id },
            data: { resetCode: otp, resetExpires: new Date(Date.now() + 15 * 60 * 1000) }
        });

        await sendOTP(user.email, otp, 'RESET');
        res.json({ success: true, message: "Reset token sent." });
    } catch (error) {
        res.status(500).json({ message: "Recovery failed." });
    }
};

/**
 * 6. RESET PASSWORD
 */
export const resetPassword = async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user || user.resetCode !== code) return res.status(400).json({ message: "Invalid recovery token." });

        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword, resetCode: null, resetExpires: null }
        });

        res.json({ success: true, message: "Credentials updated." });
    } catch (error) {
        res.status(500).json({ message: "Reset failed." });
    }
};
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  // Capture referredBy from the body (sent by your Register page)
  const { credential, referredBy } = req.body; 

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ message: "Google auth failed." });

    const { sub: googleId, email, given_name, family_name } = payload;
    const cleanEmail = email!.toLowerCase().trim();

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email: cleanEmail }] }
    });

    if (!user) {
      // --- NEW: Check Referral Limit for Google signups ---
      if (referredBy) {
         const referralCount = await prisma.user.count({ where: { referredBy } });
         if (referralCount >= 3) {
            return res.status(400).json({ message: 'Referral limit reached.' });
         }
      }

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          googleId,
          firstName: given_name || "Nexus",
          lastName: family_name || "Contributor",
          passwordHash: "GOOGLE_OAUTH_ACCOUNT", 
          isEmailVerified: true,
          status: 'UNVERIFIED',
          referredBy: referredBy || null, // <--- SAVE REFERRAL HERE
          workerProfile: { create: {} },
          wallet: { create: {} }
        }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const deviceToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('nexus_device_trust', deviceToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName } });
  } catch (error) {
    res.status(500).json({ message: "Google link failed." });
  }
};