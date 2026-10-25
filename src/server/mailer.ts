import nodemailer from 'nodemailer';

export interface SendOtpEmailParams {
  toEmail: string;
  otpCode: string;
  purpose: 'registration' | 'login' | 'reset';
  userName?: string;
}

interface MailerStatus {
  isConfigured: boolean;
  provider: 'smtp' | 'resend' | 'server_log';
  fromEmail: string;
}

/**
 * Returns current mailer configuration status without revealing passwords
 */
export function getMailerStatus(): MailerStatus {
  const fromEmail = process.env.SMTP_FROM || process.env.MAIL_FROM || 'MessMate <noreply@messmate.in>';

  if (process.env.RESEND_API_KEY) {
    return { isConfigured: true, provider: 'resend', fromEmail };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return { isConfigured: true, provider: 'smtp', fromEmail };
  }

  return { isConfigured: false, provider: 'server_log', fromEmail };
}

/**
 * Sends a real transactional OTP verification email using configured provider
 * (SMTP, Resend API, or secure server delivery log)
 */
export async function sendOtpVerificationEmail(params: SendOtpEmailParams): Promise<{ success: boolean; previewUrl?: string }> {
  const { toEmail, otpCode, purpose, userName } = params;
  const fromEmail = process.env.SMTP_FROM || process.env.MAIL_FROM || 'MessMate Security <noreply@messmate.in>';

  const purposeLabels: Record<string, { title: string; subtitle: string }> = {
    registration: {
      title: 'Verify Your Email Address',
      subtitle: 'Thank you for signing up for MessMate. Please use the verification code below to complete your registration.',
    },
    login: {
      title: 'Sign In Verification Code',
      subtitle: 'We received a request to sign in to your MessMate account. Use this one-time code to authenticate securely.',
    },
    reset: {
      title: 'Reset Account Password',
      subtitle: 'Use this one-time security code to authorize a password change for your MessMate account.',
    },
  };

  const actionInfo = purposeLabels[purpose] || purposeLabels.registration;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${actionInfo.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1f2937; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: #064e3b; padding: 28px 24px; text-align: center; }
    .brand { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
    .tagline { color: #a7f3d0; font-size: 13px; margin: 4px 0 0 0; }
    .content { padding: 32px 28px; }
    .title { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
    .desc { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 24px 0; }
    .code-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 24px 0; }
    .code-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #047857; letter-spacing: 1px; margin-bottom: 8px; }
    .code-value { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #064e3b; margin: 0; }
    .code-expiry { font-size: 12px; color: #059669; margin-top: 8px; }
    .security-note { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #991b1b; line-height: 1.5; margin-bottom: 24px; }
    .footer { border-top: 1px solid #e5e7eb; padding: 20px 28px; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand">MessMate</h1>
      <p class="tagline">Campus Dining & Kitchen Synchronization Platform</p>
    </div>
    <div class="content">
      <h2 class="title">${actionInfo.title}</h2>
      <p class="desc">
        ${userName ? `Hello <strong>${userName}</strong>,<br>` : ''}
        ${actionInfo.subtitle}
      </p>

      <div class="code-box">
        <div class="code-label">One-Time Verification Code</div>
        <div class="code-value">${otpCode}</div>
        <div class="code-expiry">Expires in 10 minutes (valid once)</div>
      </div>

      <div class="security-note">
        <strong>Security Notice:</strong> Never share this 6-digit code with anyone. MessMate staff will never ask for your verification code or password. If you did not initiate this request, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      This is an automated system email sent to ${toEmail}.<br>
      MessMate &bull; Zero Food Waste &bull; Transparent Dining Ledger
    </div>
  </div>
</body>
</html>
`;

  const textContent = `
MessMate - ${actionInfo.title}
=====================================================

${actionInfo.subtitle}

YOUR 6-DIGIT VERIFICATION CODE: ${otpCode}

This code is valid for 10 minutes.
Security Warning: Never share this code with anyone.

Sent to: ${toEmail}
`;

  // 1. Try Resend API if RESEND_API_KEY is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const resendSender = process.env.RESEND_FROM || 'MessMate <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: resendSender,
          to: [toEmail],
          subject: `${otpCode} is your MessMate verification code`,
          html: htmlContent,
          text: textContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Email Service] Successfully sent OTP via Resend to ${toEmail} (ID: ${data.id})`);
        return { success: true };
      } else {
        const errorJson: any = await res.json().catch(() => null);
        const errorMsg = errorJson?.message || 'Resend delivery failed';
        console.error('[Email Service] Resend API error:', res.status, errorMsg);
        
        // Check for free tier single-recipient restriction
        if (errorMsg.includes('You can only send testing emails to your own email address')) {
          console.warn(`[Email Service Notice]: Resend free testing tier only delivers to the account owner email.`);
        }
      }
    } catch (err) {
      console.error('[Email Service] Error sending email via Resend:', err);
    }
  }

  // 2. Try standard SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: `${otpCode} is your MessMate verification code`,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[Email Service] Successfully delivered OTP via SMTP (${process.env.SMTP_HOST}) to ${toEmail}`);
      return { success: true };
    } catch (err) {
      console.error('[Email Service] SMTP delivery failed:', err);
    }
  }

  // 3. Fallback: Log to secure server console only (NEVER returned to client UI)
  console.log(`========================================================`);
  console.log(`[SECURE EMAIL DISPATCH - SERVER LOG ONLY]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`Purpose:   ${purpose}`);
  console.log(`Code:      ${otpCode} (Valid for 10 minutes)`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Note: To deliver to real inboxes, set SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY in environment.`);
  console.log(`========================================================`);

  return { success: true };
}
