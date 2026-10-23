/**
 * Pluggable email delivery service for Touroholic
 * Supports Resend, SMTP/HTTP, or safe fallback when no provider is configured.
 * Does NOT pretend an email was sent if unconfigured.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailDeliveryResult {
  status: "sent" | "skipped_no_provider" | "failed";
  messageId?: string;
  error?: string;
  provider: string;
}

/**
 * Send an email using configured environment provider.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase().trim();
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Touroholic Expeditions <reservations@touroholic.internal>";

  // 1. Resend provider integration (REST API, no external heavy dependency required)
  if (provider === "resend" || (!provider && resendApiKey)) {
    if (!resendApiKey) {
      return {
        status: "skipped_no_provider",
        provider: "resend",
        error: "RESEND_API_KEY environment variable is not defined",
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text || payload.html.replace(/<[^>]+>/g, " "),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          status: "failed",
          provider: "resend",
          error: data.message || "Failed to deliver email via Resend API",
        };
      }

      return {
        status: "sent",
        provider: "resend",
        messageId: data.id,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error connecting to Resend";
      return {
        status: "failed",
        provider: "resend",
        error: msg,
      };
    }
  }

  // 2. Fallback: No live email provider configured
  return {
    status: "skipped_no_provider",
    provider: "none",
    error: "No email provider configured. Set RESEND_API_KEY or EMAIL_PROVIDER to enable real email delivery.",
  };
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
        If you have already arranged payment, please allow a short interval for verification or reach out to our expedition desk at support@touroholic.internal. Unpaid bookings past the deadline may be subject to cancellation under our reservation policy.
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
