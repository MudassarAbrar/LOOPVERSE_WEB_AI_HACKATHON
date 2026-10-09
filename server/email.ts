import { getDb, saveDb } from './db.ts';
import { EmailLog } from '../src/types/index.ts';

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
