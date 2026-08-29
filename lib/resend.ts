import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/** Fire-and-log — never let a notification failure block the caller's response. */
export async function notifyOwner(subject: string, html: string) {
  if (!resend || !process.env.RESEND_FROM_EMAIL || !process.env.NOTIFY_EMAIL) {
    console.warn("Resend not configured — skipping email:", subject);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.NOTIFY_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}

/** Fire-and-log — never let a notification failure block the caller's response. */
export async function notifyClient(to: string, subject: string, html: string) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend not configured — skipping client email:", subject);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send client email:", err);
  }
}
