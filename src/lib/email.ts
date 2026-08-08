import nodemailer from "nodemailer";

// Retrieve SMTP settings from environment variables
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM_EMAIL || "noreply@gohyred.ai";

// Create Nodemailer transporter lazily when needed
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(
      "[SMTP] SMTP credentials not fully configured in environment variables. Email notifications will be skipped."
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

interface SendEmailParams {
  to: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactNotification({
  to,
  name,
  email,
  subject,
  message,
}: SendEmailParams): Promise<boolean> {
  const client = getTransporter();
  if (!client) {
    return false;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded-lg: 8px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">New Contact Us Inquiry</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Name:</td>
          <td style="padding: 8px 0; color: #4b5563;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
          <td style="padding: 8px 0; color: #4b5563;">
            <a href="mailto:${email}" style="color: #4f46e5; text-decoration: none;">${escapeHtml(email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td>
          <td style="padding: 8px 0; color: #4b5563;">${escapeHtml(subject)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Submitted:</td>
          <td style="padding: 8px 0; color: #4b5563;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} (IST)</td>
        </tr>
      </table>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #f3f4f6;">
        <h4 style="margin-top: 0; color: #374151;">Message:</h4>
        <p style="margin-bottom: 0; color: #4b5563; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(message)}</p>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      
      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-bottom: 0;">
        This is an automated notification from your Gohyred platform.
      </p>
    </div>
  `;

  try {
    const info = await client.sendMail({
      from: `Gohyred Support <${smtpFrom}>`,
      to,
      subject: `[Contact Us] ${subject}`,
      html: htmlContent,
      replyTo: email,
    });

    console.log(`[SMTP] Contact Us email sent successfully. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[SMTP] Failed to send contact notification email:", error);
    return false;
  }
}

// Simple HTML escaping helper to prevent HTML injection in emails
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
