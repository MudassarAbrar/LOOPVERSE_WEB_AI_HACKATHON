import { Resend } from 'resend';
import { getDb, saveDb } from './db.ts';
import { EmailLog } from '../src/types/index.ts';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'ExamSlot Virtual University <onboarding@mudassirbaig.me>';

export function sendEmail({
  to,
  subject,
  body,
  link,
  type
}: {
  to: string;
  subject: string;
  body: string;
  link?: string;
  type: EmailLog['type'];
}): EmailLog {
  const emailLog: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    to,
    subject,
    body,
    link,
    type,
    timestamp: new Date().toISOString(),
    read: false
  };

  const db = getDb();
  db.emails.unshift(emailLog);
  if (db.emails.length > 100) db.emails.pop();
  saveDb();

  console.log(`[EMAIL DISPATCH] To: ${to} | Subject: ${subject} | Link: ${link || 'N/A'}`);

  // Dispatch real email via Resend API if API Key is configured
  if (resend) {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Virtual University ExamSlot Portal</h2>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">${body}</p>
        ${
          link
            ? `<div style="margin: 28px 0; text-align: center;">
                <a href="${link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Access Action Link</a>
              </div>
              <p style="color: #64748b; font-size: 12px; word-break: break-all;">Direct Link: <a href="${link}">${link}</a></p>`
            : ''
        }
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">ExamSlot Notification System &copy; 2026 Virtual University.</p>
      </div>
    `;

    resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html: htmlBody,
    }).then(res => {
      if (res.error) {
        console.error('[RESEND ERROR]', res.error);
      } else {
        console.log('[RESEND SUCCESS] Sent email ID:', res.data?.id);
      }
    }).catch(err => {
      console.error('[RESEND DISPATCH FAILED]', err);
    });
  }

  return emailLog;
}

export function getEmailsForUser(email?: string): EmailLog[] {
  const db = getDb();
  if (!email) return db.emails;
  return db.emails.filter(e => e.to.toLowerCase() === email.toLowerCase());
}

export function markEmailRead(id: string): boolean {
  const db = getDb();
  const mail = db.emails.find(e => e.id === id);
  if (mail) {
    mail.read = true;
    saveDb();
    return true;
  }
  return false;
}
