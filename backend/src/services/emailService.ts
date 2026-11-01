import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * SOURCE IDENTITIES
 * Mapped to specific departments to ensure a professional user experience.
 * These will work immediately as long as 'nexugrid.site' is verified in Resend.
 */
const IDS = {
  SECURITY: 'NexusGrid Security <security@nexugrid.site>',
  FINANCE:  'NexusGrid Finance <finance@nexugrid.site>',
  SUPPORT:  'NexusGrid Support <support@nexugrid.site>',
};

/**
 * 1. SEND OTP (Verification, Login MFA, or Password Reset)
 * Identity: Security
 */
export const sendOTP = async (email: string, code: string, type: 'VERIFY' | 'RESET' | 'LOGIN') => {
  const subjects = {
    VERIFY: 'Verify your Node Identity',
    RESET: 'Password Reset Protocol',
    LOGIN: 'Secure Login Access Key'
  };
  const titles = {
    VERIFY: 'Identity Verification',
    RESET: 'Reset Authorized',
    LOGIN: 'Login Authorization'
  };

  try {
    await resend.emails.send({
      from: IDS.SECURITY,
      to: email,
      subject: `[NexusGrid] ${subjects[type]}`,
      html: `
        <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #1f2937;">
          <h1 style="color: #6366f1; text-transform: uppercase; letter-spacing: 2px;">NexusGrid</h1>
          <h2 style="font-size: 18px; color: #f3f4f6;">${titles[type]}</h2>
          <div style="background: #111827; padding: 30px; border-radius: 15px; text-align: center; margin: 30px 0; border: 1px solid #374151;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #6366f1; font-family: monospace;">${code}</span>
          </div>
          <p style="font-size: 11px; color: #4b5563; text-transform: uppercase;">Authorized via Secure Stream • Connection: Encrypted</p>
        </div>
      `
    });
  } catch (error) {
    console.error(`Email Transmission Failed (${type}):`, error);
  }
};

/**
 * 2. SEND VAULT OTP (For modifying payout methods)
 * Identity: Finance
 */
export const sendVaultOTP = async (email: string, code: string) => {
    try {
      await resend.emails.send({
        from: IDS.FINANCE,
        to: email,
        subject: '[NexusGrid] Vault Access Key',
        html: `
          <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 2px solid #6366f1;">
            <h1 style="color: #6366f1; text-transform: uppercase;">Identity Vault</h1>
            <p>A request was made to modify your payout credentials. Enter this code to unlock your vault:</p>
            <div style="background: rgba(99, 102, 241, 0.1); padding: 30px; border-radius: 15px; text-align: center; margin: 30px 0;">
              <span style="font-size: 42px; font-weight: 900; color: white; letter-spacing: 10px;">${code}</span>
            </div>
            <p style="color: #ef4444; font-size: 12px; font-weight: bold;">If you did not request this, secure your account immediately.</p>
          </div>
        `
      });
    } catch (error) {
      console.error("Vault OTP Transmission Failed:", error);
    }
};

/**
 * 3. SEND WELCOME EMAIL (Onboarding)
 * Identity: Support
 */
export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    await resend.emails.send({
      from: IDS.SUPPORT,
      to: email,
      subject: '[NexusGrid] Identity Initialized',
      html: `
        <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto;">
          <h1 style="color: #6366f1;">NexusGrid</h1>
          <h2 style="color: #fff;">Welcome to the Grid, ${name}</h2>
          <p style="color: #9ca3af; line-height: 1.6;">Your contributor account has been activated. Please log in to complete your biometric scan and sign required legal protocols.</p>
          <div style="margin-top: 30px;">
              <a href="https://nexugrid.site/login" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold;">Access Dashboard</a>
          </div>
        </div>
      `
    });
  } catch (error) {
    console.error("Welcome Email Failed:", error);
  }
};

/**
 * 4. RE-VERIFICATION REQUEST
 * Identity: Security
 */
export const sendReverificationEmail = async (email: string) => {
  try {
    await resend.emails.send({
      from: IDS.SECURITY,
      to: email,
      subject: '[NexusGrid] RE-VERIFICATION REQUIRED',
      html: `
        <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px; border-left: 4px solid #f59e0b;">
          <h2 style="color: #f59e0b; text-transform: uppercase;">Security Protocol Triggered</h2>
          <p>An administrator has requested a mandatory biometric re-scan for your node.</p>
          <p style="color: #9ca3af;">Access to work queues is temporarily gated. Please perform a new face scan to restore access.</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Re-verification Email Failed:", error);
  }
};

/**
 * 5. SEND STATUS EMAIL (Admin Action)
 * Identity: Security
 */
export const sendStatusEmail = async (email: string, status: 'AUTHORIZED' | 'TERMINATED' | 'UNDER_REVIEW' | 'PAYMENT_METHOD_UPDATED') => {
    const titles = {
        AUTHORIZED: 'Production Access Granted',
        TERMINATED: 'Node Connection Terminated',
        UNDER_REVIEW: 'Security Audit Initiated',
        PAYMENT_METHOD_UPDATED: 'Security Alert: Payout Details Changed'
    };

    try {
        await resend.emails.send({
            from: IDS.SECURITY,
            to: email,
            subject: `[NexusGrid] ${titles[status] || 'Account Update'}`,
            html: `
              <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px;">
                <h1 style="color: #6366f1;">NEXUSGRID OPS</h1>
                <h2>${titles[status]}</h2>
                <p>An update has been registered for your node status or security credentials.</p>
                <p style="color: #9ca3af;">Action Type: <strong>${status.replace(/_/g, ' ')}</strong></p>
                <p style="font-size: 12px; margin-top: 20px; color: #4b5563;">If you did not authorize this change, contact support@nexugrid.site immediately.</p>
              </div>
            `
        });
    } catch (e) { 
        console.error("Status Email Failed:", e); 
    }
};

/**
 * 6. SEND WARNING EMAIL (Compliance)
 * Identity: Security
 */
export const sendWarningEmail = async (email: string, count: number) => {
  try {
    await resend.emails.send({
      from: IDS.SECURITY,
      to: email,
      subject: `[NexusGrid] COMPLIANCE WARNING`,
      html: `
        <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border: 2px solid #ef4444; border-radius: 20px;">
          <h1 style="color: #ef4444; text-transform: uppercase;">Urgent Compliance Alert</h1>
          <p>Strike Count: <span style="font-size: 24px; color: #ef4444;">${count} / 3</span></p>
          <p style="color: #9ca3af; font-size: 12px;">3 warnings result in permanent account termination.</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Warning Email Failed:", error);
  }
};

/**
 * 7. SEND PAYOUT EMAIL (Financials)
 * Identity: Finance
 */
export const sendPayoutEmail = async (email: string, amount: string, method: string) => {
  try {
    await resend.emails.send({
      from: IDS.FINANCE,
      to: email,
      subject: '[NexusGrid] Disbursement Successful',
      html: `
        <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px; border: 1px solid #10b981; max-width: 600px; margin: auto;">
          <h2 style="color: #10b981; margin-top: 0;">FUNDS RELEASED</h2>
          <p>Your payment has been successfully disbursed! Please check with your bank. The arrival time depends on the specific processing period your bank takes.</p>

          <div style="margin: 30px 0;">
            <span style="font-size: 48px; font-weight: 900; color: white;">$${amount}</span>
          </div>
          <p style="color: #9ca3af;">Transmission Method: <strong style="color: white;">${method}</strong></p>
        </div>
      `
    });
  } catch (error) {
    console.error("Payout Email Failed:", error);
  }
};