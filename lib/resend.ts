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

/**
 * Fire-and-log by default — the webhook's receipt email ignores the return
 * value so a Resend hiccup never blocks payment processing. The "email
 * client" button in the editor does check it, since the owner needs to know
 * whether the client actually received the link.
 */
export async function notifyClient(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend not configured — skipping client email:", subject);
    return false;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send client email:", err);
    return false;
  }
}
