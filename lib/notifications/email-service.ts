/**
 * Brevo Transactional Email Service for Touroholic
 * Supports both Brevo Official REST API and Brevo SMTP Relay (smtp-relay.brevo.com:587).
 * Strictly protects credentials and never logs or leaks API keys.
 */

import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailPayload {
  to: string | EmailRecipient;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailDeliveryResult {
  status: "sent" | "skipped_no_provider" | "failed";
  messageId?: string;
  error?: string;
  provider: "brevo" | "none";
}

export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  deliveryMode: "smtp" | "rest";
}

/**
 * Returns canonical production application URL, falling back safely on Vercel deployment URLs or localhost
 */
export function getAppUrl(): string {
  let appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  if (!appUrl.startsWith("http://") && !appUrl.startsWith("https://")) {
    appUrl = `https://${appUrl}`;
  }

  return appUrl.replace(/\/$/, "");
}

/**
 * Safely parse credentials from process.env or fallback to local smtp_server.txt if provided.
 * Never logs or prints the API key.
 */
export function getBrevoConfig(): BrevoConfig | null {
  let apiKey = process.env.BREVO_API_KEY?.trim() || "";
  let senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "";
  let senderName = process.env.BREVO_SENDER_NAME?.trim() || "Touroholic Expeditions";
  let smtpHost = process.env.SMTP_SERVER?.trim() || process.env.SMTP_HOST?.trim() || "";
  let smtpPort = parseInt(process.env.SMTP_PORT?.trim() || "587", 10);
  let smtpUser = process.env.SMTP_LOGIN?.trim() || process.env.SMTP_USER?.trim() || "";
  let smtpPass = process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim() || "";

  // Check smtp_server.txt if env variables are not fully configured
  try {
    const candidates = [
      path.join(process.cwd(), "smtp_server.txt"),
      "G:\\tour-managment\\smtp_server.txt",
    ];
    for (const filepath of candidates) {
      if (fs.existsSync(/*turbopackIgnore: true*/ filepath)) {
        const content = fs.readFileSync(/*turbopackIgnore: true*/ filepath, "utf8");
        if (content && content.trim().length > 0) {
          const lines = content.split(/\r?\n/);
          let nextKey: "server" | "port" | "login" | null = null;

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith("#")) continue;

            const lower = line.toLowerCase();
            if (lower === "smtp server" || lower === "server" || lower === "host") {
              nextKey = "server";
              continue;
            }
            if (lower === "port") {
              nextKey = "port";
              continue;
            }
            if (lower === "login" || lower === "username" || lower === "user") {
              nextKey = "login";
              continue;
            }

            if (nextKey === "server") {
              if (!smtpHost) smtpHost = line;
              nextKey = null;
              continue;
            }
            if (nextKey === "port") {
              if (!smtpPort || smtpPort === 587) smtpPort = parseInt(line, 10) || 587;
              nextKey = null;
              continue;
            }
            if (nextKey === "login") {
              if (!smtpUser) smtpUser = line;
              if (!senderEmail && line.includes("@")) senderEmail = line;
              nextKey = null;
              continue;
            }

            if (line.includes("=")) {
              const [k, ...vParts] = line.split("=");
              const key = k.trim().toUpperCase();
              const val = vParts.join("=").trim().replace(/^["']|["']$/g, "");
              if (key === "BREVO_API_KEY" || key === "API_KEY" || key === "SMTP_KEY" || key === "PASSWORD" || key === "SMTP_PASS") {
                if (!apiKey) apiKey = val;
                if (!smtpPass) smtpPass = val;
              } else if (key === "BREVO_SENDER_EMAIL" || key === "SENDER_EMAIL" || key === "USER" || key === "LOGIN" || key === "SMTP_USER") {
                if (!senderEmail) senderEmail = val;
                if (!smtpUser) smtpUser = val;
              } else if (key === "BREVO_SENDER_NAME" || key === "SENDER_NAME") {
                if (val) senderName = val;
              } else if (key === "SMTP_SERVER" || key === "SMTP_HOST") {
                if (!smtpHost) smtpHost = val;
              } else if (key === "SMTP_PORT") {
                if (!smtpPort) smtpPort = parseInt(val, 10) || 587;
              }
            } else if (line.startsWith("xsmtpsib-") || line.startsWith("xkeysib-")) {
              if (!apiKey) apiKey = line;
              if (!smtpPass) smtpPass = line;
            } else if (line.includes("@") && !senderEmail) {
              senderEmail = line;
              if (!smtpUser) smtpUser = line;
            }
          }
        }
      }
    }
  } catch {
    // Safe non-blocking fallback
  }

  // Ensure default host for Brevo SMTP if we have SMTP credentials
  if ((apiKey.startsWith("xsmtpsib-") || smtpPass.startsWith("xsmtpsib-")) && !smtpHost) {
    smtpHost = "smtp-relay.brevo.com";
  }

  if (!apiKey && !smtpPass) {
    return null;
  }
  if (!senderEmail && !smtpUser) {
    return null;
  }

  // Determine delivery mode
  // If the key is an SMTP relay key (starts with xsmtpsib-) or explicit SMTP host is set:
  const isSmtp =
    apiKey.startsWith("xsmtpsib-") ||
    smtpPass.startsWith("xsmtpsib-") ||
    (smtpHost && (smtpUser || senderEmail) && (smtpPass || apiKey));

  const deliveryMode: "smtp" | "rest" = isSmtp ? "smtp" : "rest";

  return {
    apiKey: apiKey || smtpPass,
    senderEmail: senderEmail || smtpUser,
    senderName,
    smtpHost: smtpHost || "smtp-relay.brevo.com",
    smtpPort: smtpPort || 587,
    smtpUser: smtpUser || senderEmail,
    smtpPass: smtpPass || apiKey,
    deliveryMode,
  };
}

/**
 * Universal sender using Brevo's official transactional REST API or Brevo SMTP Relay
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const config = getBrevoConfig();

  if (!config) {
    return {
      status: "skipped_no_provider",
      provider: "none",
      error:
        "No email provider configured. Brevo email service is missing BREVO_API_KEY or BREVO_SENDER_EMAIL in environment.",
    };
  }

  const recipientEmail = typeof payload.to === "string" ? payload.to : payload.to.email;
  const recipientName = typeof payload.to === "string" ? undefined : payload.to.name;

  if (!recipientEmail || !recipientEmail.includes("@")) {
    return {
      status: "failed",
      provider: "brevo",
      error: "Invalid recipient email address",
    };
  }

  const plainText = payload.text || payload.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // Mode 1: Brevo SMTP Relay (via nodemailer)
  if (config.deliveryMode === "smtp") {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost || "smtp-relay.brevo.com",
        port: config.smtpPort || 587,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser || config.senderEmail,
          pass: config.smtpPass || config.apiKey,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await transporter.sendMail({
        from: `"${config.senderName}" <${config.senderEmail}>`,
        to: recipientName ? `"${recipientName}" <${recipientEmail}>` : recipientEmail,
        subject: payload.subject,
        html: payload.html,
        text: plainText,
      });

      return {
        status: "sent",
        provider: "brevo",
        messageId: info.messageId || `brevo-smtp-${Date.now()}`,
      };
    } catch (smtpErr: unknown) {
      const rawError = smtpErr instanceof Error ? smtpErr.message : "SMTP delivery failed";
      return {
        status: "failed",
        provider: "brevo",
        error: rawError,
      };
    }
  }

  // Mode 2: Brevo Official REST API (via fetch)
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": config.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: config.senderName,
          email: config.senderEmail,
        },
        to: [
          {
            email: recipientEmail,
            name: recipientName || recipientEmail.split("@")[0],
          },
        ],
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: plainText,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg =
        data?.message ||
        data?.error ||
        `Brevo API responded with HTTP ${response.status} (${response.statusText})`;

      // If REST API failed with "Key not found" (e.g. key is an SMTP key or invalid for REST),
      // attempt fallback to Brevo SMTP Relay if credentials match
      if (
        errMsg.toLowerCase().includes("key not found") ||
        response.status === 401
      ) {
        if (config.apiKey.startsWith("xsmtpsib-") || config.smtpPass?.startsWith("xsmtpsib-") || config.smtpHost) {
          try {
            const fallbackTransporter = nodemailer.createTransport({
              host: config.smtpHost || "smtp-relay.brevo.com",
              port: config.smtpPort || 587,
              secure: false,
              auth: {
                user: config.smtpUser || config.senderEmail,
                pass: config.smtpPass || config.apiKey,
              },
              tls: { rejectUnauthorized: false },
            });

            const info = await fallbackTransporter.sendMail({
              from: `"${config.senderName}" <${config.senderEmail}>`,
              to: recipientName ? `"${recipientName}" <${recipientEmail}>` : recipientEmail,
              subject: payload.subject,
              html: payload.html,
              text: plainText,
            });

            return {
              status: "sent",
              provider: "brevo",
              messageId: info.messageId || `brevo-smtp-fallback-${Date.now()}`,
            };
          } catch {
            // Fall through to error return below
          }
        }
      }

      return {
        status: "failed",
        provider: "brevo",
        error: errMsg,
      };
    }

    return {
      status: "sent",
      provider: "brevo",
      messageId: data.messageId || `brevo-${Date.now()}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error contacting Brevo API";
    return {
      status: "failed",
      provider: "brevo",
      error: msg,
    };
  }
}

/**
 * 1. Email Verification Template & Sender
 */
export async function sendVerificationEmail(params: {
  toEmail: string;
  userName?: string;
  verificationToken: string;
}): Promise<EmailDeliveryResult> {
  const appUrl = getAppUrl();
  const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(params.verificationToken)}`;
  const displayName = params.userName || "Fellow Explorer";

  const subject = "Verify your email address — Touroholic Expeditions";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; color: #1c2421; background-color: #fbfaf8; border: 1px solid #e8e3d8; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #124e3f; margin: 0; font-size: 26px; font-weight: 700;">Touroholic Expeditions</h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Account Verification</p>
      </div>

      <p style="font-size: 16px; margin-bottom: 12px;">Welcome, <strong>${displayName}</strong>!</p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Thank you for creating your Touroholic account. Please verify your email address to activate your membership and unlock expedition reservations.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" style="background-color: #124e3f; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(18, 78, 63, 0.2);">
          Verify My Email Address
        </a>
      </div>

      <p style="font-size: 12px; color: #6b7280; line-height: 1.5; border-top: 1px solid #e8e3d8; padding-top: 16px;">
        Or copy and paste this link in your browser:<br />
        <a href="${verificationUrl}" style="color: #124e3f; word-break: break-all;">${verificationUrl}</a>
      </p>

      <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; text-align: center;">
        This verification link will expire in 24 hours. If you did not create a Touroholic account, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `
Welcome to Touroholic Expeditions!

Please verify your email address by visiting the link below:
${verificationUrl}

This link is valid for 24 hours. If you did not sign up for Touroholic, please ignore this email.
  `.trim();

  return sendEmail({
    to: { email: params.toEmail, name: params.userName },
    subject,
    html,
    text,
  });
}

/**
 * 2. Booking Confirmation Template & Sender
 */
export async function sendBookingConfirmationEmail(params: {
  toEmail: string;
  customerName?: string;
  bookingReference: string;
  tourName: string;
  destination: string;
  departureDate: string;
  travelers: number;
  totalPrice: number;
  currency: string;
  bookingStatus: string;
  paymentStatus: string;
  paymentDueAt?: Date;
}): Promise<EmailDeliveryResult> {
  const appUrl = getAppUrl();
  const bookingsUrl = `${appUrl}/my-bookings`;
  const displayName = params.customerName || "Valued Explorer";

  const deadlineFormatted = params.paymentDueAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(new Date(params.paymentDueAt)) + " UTC"
    : "Standard departure terms apply";

  const subject = `Reservation Confirmed: Expedition ${params.bookingReference}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; color: #1c2421; background-color: #fbfaf8; border: 1px solid #e8e3d8; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #124e3f; margin: 0; font-size: 26px; font-weight: 700;">Touroholic Expeditions</h1>
        <p style="color: #124e3f; font-size: 13px; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Reservation Confirmed</p>
      </div>

      <p style="font-size: 16px;">Dear <strong>${displayName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your reservation for <strong>${params.tourName}</strong> has been confirmed. Below are your reservation details:
      </p>

      <div style="background-color: #ffffff; border: 1px solid #e2dcce; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Booking Reference:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #124e3f; font-family: monospace;">${params.bookingReference}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Expedition:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${params.tourName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Destination:</td>
            <td style="padding: 6px 0; font-weight: 500; text-align: right;">${params.destination}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Departure Date:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${params.departureDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Guests:</td>
            <td style="padding: 6px 0; font-weight: 500; text-align: right;">${params.travelers} traveler(s)</td>
          </tr>
          <tr style="border-top: 1px dashed #e5e7eb;">
            <td style="padding: 12px 0 6px 0; color: #6b7280; font-size: 15px;">Total Investment:</td>
            <td style="padding: 12px 0 6px 0; font-weight: 700; font-size: 18px; text-align: right; color: #124e3f;">
              ${params.currency} $${params.totalPrice.toLocaleString()}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Payment Status:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; text-transform: uppercase; color: ${params.paymentStatus === "paid" ? "#047857" : "#b45309"};">
              ${params.paymentStatus}
            </td>
          </tr>
          ${
            params.paymentStatus !== "paid"
              ? `<tr>
                  <td style="padding: 6px 0; color: #dc2626; font-weight: 600;">Payment Due Date:</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #dc2626;">${deadlineFormatted}</td>
                </tr>`
              : ""
          }
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${bookingsUrl}" style="background-color: #124e3f; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 600; border-radius: 8px; display: inline-block;">
          View Reservation in My Bookings
        </a>
      </div>

      <p style="font-size: 12px; color: #6b7280; border-top: 1px solid #e8e3d8; padding-top: 16px;">
        Questions or special requirements? Contact our expedition curators at reservations@touroholic.internal.
      </p>
    </div>
  `;

  const text = `
Touroholic Expeditions - Booking Confirmed
Booking Reference: ${params.bookingReference}
Expedition: ${params.tourName} (${params.destination})
Departure: ${params.departureDate}
Travelers: ${params.travelers}
Total: ${params.currency} $${params.totalPrice}
Payment Status: ${params.paymentStatus}

View your reservation at: ${bookingsUrl}
  `.trim();

  return sendEmail({
    to: { email: params.toEmail, name: params.customerName },
    subject,
    html,
    text,
  });
}

/**
 * 3. Verified Payment Confirmation Template & Sender
 */
export async function sendPaymentConfirmationEmail(params: {
  toEmail: string;
  customerName?: string;
  bookingReference: string;
  tourName: string;
  amountReceived: number;
  currency: string;
  paymentReference: string;
  paymentMethod: string;
  reconciledAt: Date;
}): Promise<EmailDeliveryResult> {
  const appUrl = getAppUrl();
  const bookingsUrl = `${appUrl}/my-bookings`;
  const displayName = params.customerName || "Valued Traveler";

  const verifiedDateStr = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(params.reconciledAt)) + " UTC";

  const subject = `Payment Confirmed: Expedition ${params.bookingReference}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; color: #1c2421; background-color: #fbfaf8; border: 1px solid #e8e3d8; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #047857; margin: 0; font-size: 26px; font-weight: 700;">Payment Verified</h1>
        <p style="color: #52605b; font-size: 13px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Official Payment Receipt</p>
      </div>

      <p style="font-size: 16px;">Dear <strong>${displayName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        We have verified and recorded your payment for <strong>${params.tourName}</strong>. Your reservation is fully paid and confirmed.
      </p>

      <div style="background-color: #ffffff; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Booking Reference:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #124e3f; font-family: monospace;">${params.bookingReference}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Transaction Reference:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; font-family: monospace;">${params.paymentReference}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Payment Method:</td>
            <td style="padding: 6px 0; font-weight: 500; text-align: right;">${params.paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Date Verified:</td>
            <td style="padding: 6px 0; font-weight: 500; text-align: right;">${verifiedDateStr}</td>
          </tr>
          <tr style="border-top: 1px dashed #e5e7eb;">
            <td style="padding: 12px 0 6px 0; color: #6b7280; font-size: 15px;">Amount Paid:</td>
            <td style="padding: 12px 0 6px 0; font-weight: 700; font-size: 18px; text-align: right; color: #047857;">
              ${params.currency} $${params.amountReceived.toLocaleString()}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Outstanding Balance:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #047857;">$0.00 (Fully Paid)</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${bookingsUrl}" style="background-color: #124e3f; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 600; border-radius: 8px; display: inline-block;">
          View Booking Receipt
        </a>
      </div>

      <p style="font-size: 12px; color: #6b7280; border-top: 1px solid #e8e3d8; padding-top: 16px;">
        Thank you for traveling with Touroholic Expeditions. We look forward to hosting you on this journey.
      </p>
    </div>
  `;

  const text = `
Touroholic Expeditions - Payment Confirmed
Booking Reference: ${params.bookingReference}
Transaction Reference: ${params.paymentReference}
Payment Method: ${params.paymentMethod}
Amount Verified: ${params.currency} $${params.amountReceived}
Balance Due: $0.00 (Fully Paid)

View reservation at: ${bookingsUrl}
  `.trim();

  return sendEmail({
    to: { email: params.toEmail, name: params.customerName },
    subject,
    html,
    text,
  });
}

/**
 * 4. Password Reset Template & Sender
 */
export async function sendPasswordResetEmail(params: {
  toEmail: string;
  userName?: string;
  resetToken: string;
}): Promise<EmailDeliveryResult> {
  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(params.resetToken)}`;
  const displayName = params.userName || "Traveler";

  const subject = "Reset your password — Touroholic Expeditions";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; color: #1c2421; background-color: #fbfaf8; border: 1px solid #e8e3d8; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #124e3f; margin: 0; font-size: 26px; font-weight: 700;">Touroholic Expeditions</h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; text-transform: uppercase;">Password Reset Request</p>
      </div>

      <p style="font-size: 16px;">Hello <strong>${displayName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        We received a request to reset your password. Click the button below to choose a new password:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #124e3f; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px; display: inline-block;">
          Reset My Password
        </a>
      </div>

      <p style="font-size: 12px; color: #6b7280; line-height: 1.5; border-top: 1px solid #e8e3d8; padding-top: 16px;">
        Or copy and paste this link in your browser:<br />
        <a href="${resetUrl}" style="color: #124e3f; word-break: break-all;">${resetUrl}</a>
      </p>

      <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; text-align: center;">
        This reset link will expire in 1 hour. If you did not request a password reset, no action is needed.
      </p>
    </div>
  `;

  const text = `
Touroholic Expeditions - Password Reset Request

Please visit the link below to reset your password:
${resetUrl}

This link is valid for 1 hour. If you did not request a password reset, please ignore this email.
  `.trim();

  return sendEmail({
    to: { email: params.toEmail, name: params.userName },
    subject,
    html,
    text,
  });
}

/**
 * Format Payment Reminder Email HTML
 */
export function buildPaymentReminderEmail(params: {
  customerName: string;
  bookingReference: string;
  tourName: string;
  departureDate: string;
  amountDue: number;
  currency: string;
  paymentDueAt: Date;
  bookingUrl: string;
}): { subject: string; html: string; text: string } {
  const deadlineString = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(params.paymentDueAt) + " UTC";

  const subject = `Urgent: Payment Reminder for Expedition ${params.bookingReference}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1c2421; background-color: #fbfaf8; border: 1px solid #e8e3d8; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #124e3f; margin: 0; font-size: 24px;">Touroholic Expeditions</h1>
        <p style="color: #52605b; font-size: 14px; margin-top: 4px;">Payment Pending Notification</p>
      </div>

      <p style="font-size: 16px;">Dear <strong>${params.customerName}</strong>,</p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #374151;">
        This is a friendly reminder that your reservation for <strong>${params.tourName}</strong> has a pending balance due. To guarantee your reservation and secured seats, payment must be received before the deadline below.
      </p>

      <div style="background-color: #ffffff; border: 1px solid #e2dcce; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Booking Reference:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #124e3f;">${params.bookingReference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Expedition:</td>
            <td style="padding: 8px 0; font-weight: 500; text-align: right;">${params.tourName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Departure Date:</td>
            <td style="padding: 8px 0; font-weight: 500; text-align: right;">${params.departureDate}</td>
          </tr>
          <tr style="border-top: 1px dashed #e5e7eb;">
            <td style="padding: 12px 0 8px 0; color: #6b7280; font-size: 15px;">Amount Due:</td>
            <td style="padding: 12px 0 8px 0; font-weight: 700; font-size: 18px; text-align: right; color: #b45309;">
              ${params.currency} $${params.amountDue.toLocaleString()}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">Payment Deadline:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #dc2626;">${deadlineString}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.bookingUrl}" style="background-color: #124e3f; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 600; border-radius: 8px; display: inline-block;">
          View Reservation & Complete Payment
        </a>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        If you have already arranged payment, please allow a short interval for verification or reach out to our expedition desk at support@touroholic.internal.
      </p>
    </div>
  `;

  const text = `
Touroholic Expeditions - Payment Reminder
Booking Reference: ${params.bookingReference}
Expedition: ${params.tourName}
Departure Date: ${params.departureDate}
Amount Due: ${params.currency} $${params.amountDue}
Payment Deadline: ${deadlineString}

Please complete your payment at: ${params.bookingUrl}
  `.trim();

  return { subject, html, text };
}

/**
 * Format Cancellation Email HTML
 */
export function buildCancellationEmail(params: {
  customerName: string;
  bookingReference: string;
  tourName: string;
  departureDate: string;
  totalPrice: number;
  currency: string;
  cancellationReason: string;
  isPaid: boolean;
}): { subject: string; html: string; text: string } {
  const subject = `Reservation Cancelled: Expedition ${params.bookingReference}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1c2421; background-color: #fbfaf8; border: 1px solid #e8e3d8; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #991b1b; margin: 0; font-size: 24px;">Reservation Cancelled</h1>
        <p style="color: #52605b; font-size: 14px; margin-top: 4px;">Touroholic Expeditions</p>
      </div>

      <p style="font-size: 16px;">Dear <strong>${params.customerName}</strong>,</p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #374151;">
        Your reservation for <strong>${params.tourName}</strong> (Ref: <code>${params.bookingReference}</code>) departing on <strong>${params.departureDate}</strong> has been cancelled.
      </p>

      <div style="background-color: #ffffff; border: 1px solid #fecaca; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b; font-size: 15px;">Cancellation Details:</h3>
        <p style="font-size: 14px; margin: 4px 0; color: #4b5563;"><strong>Reason:</strong> ${params.cancellationReason}</p>
        <p style="font-size: 14px; margin: 4px 0; color: #4b5563;"><strong>Original Total:</strong> ${params.currency} $${params.totalPrice.toLocaleString()}</p>
        <p style="font-size: 14px; margin: 4px 0; color: #4b5563;">
          <strong>Payment / Refund Status:</strong> ${
            params.isPaid
              ? "Your payment is recorded. Our finance team is reviewing your reservation for eligible manual refund reconciliation under our cancellation terms."
              : "No payment was collected for this reservation."
          }
        </p>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        Standard Touroholic Cancellation Policy applies. If you have questions regarding this cancellation, please contact reservations@touroholic.internal.
      </p>
    </div>
  `;

  const text = `
Touroholic Expeditions - Reservation Cancelled
Booking Reference: ${params.bookingReference}
Expedition: ${params.tourName}
Departure: ${params.departureDate}
Reason: ${params.cancellationReason}
Status: ${params.isPaid ? "Payment recorded. Manual refund reconciliation pending." : "Unpaid reservation cancelled."}
  `.trim();

  return { subject, html, text };
}

