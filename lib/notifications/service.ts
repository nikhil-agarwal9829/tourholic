import mongoose from "mongoose";
import { Notification, NotificationType, INotification } from "@/models/Notification";
import {
  sendEmail,
  sendBookingConfirmationEmail,
  sendPaymentConfirmationEmail,
  buildPaymentReminderEmail,
  buildCancellationEmail,
  EmailDeliveryResult,
} from "./email-service";

export interface SendNotificationOptions {
  userId: string | mongoose.Types.ObjectId;
  bookingId?: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  channel?: "in_app" | "email" | "both";
  metadata?: Record<string, unknown>;
  emailOptions?: {
    recipientEmail: string;
    subject: string;
    html: string;
    text?: string;
  };
}

export interface NotificationResult {
  notification: INotification | null;
  emailResult: EmailDeliveryResult | null;
}

/**
 * Universal dispatcher for in-app and email notifications
 */
export async function dispatchNotification(
  opts: SendNotificationOptions
): Promise<NotificationResult> {
  const channel = opts.channel || "both";
  let emailResult: EmailDeliveryResult | null = null;
  let emailDeliveryStatus: "not_attempted" | "sent" | "skipped_no_provider" | "failed" = "not_attempted";
  let emailDeliveryError: string | undefined;

  // 1. Attempt email dispatch if channel includes email and recipient email provided
  if ((channel === "email" || channel === "both") && opts.emailOptions?.recipientEmail) {
    try {
      emailResult = await sendEmail({
        to: opts.emailOptions.recipientEmail,
        subject: opts.emailOptions.subject,
        html: opts.emailOptions.html,
        text: opts.emailOptions.text,
      });
      emailDeliveryStatus = emailResult.status;
      if (emailResult.error) {
        emailDeliveryError = emailResult.error;
      }
    } catch (err: unknown) {
      emailDeliveryStatus = "failed";
      emailDeliveryError = err instanceof Error ? err.message : "Email dispatch exception";
      emailResult = {
        status: "failed",
        provider: "none",
        error: emailDeliveryError,
      };
    }
  }

  // 2. Persist in-app notification to MongoDB if channel includes in_app
  let notification: INotification | null = null;
  try {
    const validUserId = mongoose.Types.ObjectId.isValid(opts.userId.toString())
      ? new mongoose.Types.ObjectId(opts.userId.toString())
      : undefined;

    if (validUserId) {
      notification = await Notification.create({
        user: validUserId,
        booking: opts.bookingId && mongoose.Types.ObjectId.isValid(opts.bookingId.toString())
          ? new mongoose.Types.ObjectId(opts.bookingId.toString())
          : undefined,
        type: opts.type,
        title: opts.title,
        message: opts.message,
        read: false,
        channel,
        emailDeliveryStatus,
        emailDeliveryError,
        providerMessageId: emailResult?.messageId,
        attemptCount: (channel === "email" || channel === "both") && opts.emailOptions?.recipientEmail ? 1 : 0,
        lastAttemptAt: channel === "email" || channel === "both" ? new Date() : undefined,
        errorSummary: emailDeliveryError,
        metadata: {
          ...opts.metadata,
          emailProvider: emailResult?.provider,
        },
      });
    }
  } catch (error) {
    console.error("Failed to persist in-app notification:", error);
  }

  return { notification, emailResult };
}

/**
 * Helper to dispatch Payment Reminder notification & email
 */
export async function sendPaymentReminderNotification(params: {
  userId: string | mongoose.Types.ObjectId;
  bookingId: string | mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  bookingReference: string;
  tourName: string;
  departureDate: string;
  amountDue: number;
  currency: string;
  paymentDueAt: Date;
  originUrl?: string;
}): Promise<NotificationResult> {
  const appOrigin = params.originUrl || process.env.NEXT_PUBLIC_APP_URL || "https://tourholic.vercel.app";
  const bookingUrl = `${appOrigin}/my-bookings`;

  const deadlineFormatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(params.paymentDueAt) + " UTC";

  const emailContent = buildPaymentReminderEmail({
    customerName: params.customerName,
    bookingReference: params.bookingReference,
    tourName: params.tourName,
    departureDate: params.departureDate,
    amountDue: params.amountDue,
    currency: params.currency,
    paymentDueAt: params.paymentDueAt,
    bookingUrl,
  });

  return dispatchNotification({
    userId: params.userId,
    bookingId: params.bookingId,
    type: "payment_reminder",
    title: `Payment Reminder: ${params.bookingReference}`,
    message: `Payment of ${params.currency} $${params.amountDue.toLocaleString()} for expedition "${params.tourName}" is due by ${deadlineFormatted}.`,
    channel: "both",
    metadata: {
      bookingReference: params.bookingReference,
      amountDue: params.amountDue,
      currency: params.currency,
      paymentDueAt: params.paymentDueAt,
    },
    emailOptions: {
      recipientEmail: params.customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    },
  });
}

/**
 * Helper to dispatch Cancellation notification & email
 */
export async function sendCancellationNotification(params: {
  userId: string | mongoose.Types.ObjectId;
  bookingId: string | mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  bookingReference: string;
  tourName: string;
  departureDate: string;
  totalPrice: number;
  currency: string;
  cancellationReason: string;
  isPaid: boolean;
}): Promise<NotificationResult> {
  const emailContent = buildCancellationEmail({
    customerName: params.customerName,
    bookingReference: params.bookingReference,
    tourName: params.tourName,
    departureDate: params.departureDate,
    totalPrice: params.totalPrice,
    currency: params.currency,
    cancellationReason: params.cancellationReason,
    isPaid: params.isPaid,
  });

  return dispatchNotification({
    userId: params.userId,
    bookingId: params.bookingId,
    type: "booking_cancellation",
    title: `Reservation Cancelled: ${params.bookingReference}`,
    message: `Your reservation for "${params.tourName}" has been cancelled. Reason: ${params.cancellationReason}.`,
    channel: "both",
    metadata: {
      bookingReference: params.bookingReference,
      cancellationReason: params.cancellationReason,
      isPaid: params.isPaid,
    },
    emailOptions: {
      recipientEmail: params.customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    },
  });
}

/**
 * Helper to dispatch Booking Confirmation notification & Brevo email
 */
export async function sendBookingConfirmationNotification(params: {
  userId: string | mongoose.Types.ObjectId;
  bookingId: string | mongoose.Types.ObjectId;
  customerName?: string;
  customerEmail: string;
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
}): Promise<NotificationResult> {
  const emailRes = await sendBookingConfirmationEmail({
    toEmail: params.customerEmail,
    customerName: params.customerName,
    bookingReference: params.bookingReference,
    tourName: params.tourName,
    destination: params.destination,
    departureDate: params.departureDate,
    travelers: params.travelers,
    totalPrice: params.totalPrice,
    currency: params.currency,
    bookingStatus: params.bookingStatus,
    paymentStatus: params.paymentStatus,
    paymentDueAt: params.paymentDueAt,
  });

  let notification: INotification | null = null;
  try {
    const validUserId = mongoose.Types.ObjectId.isValid(params.userId.toString())
      ? new mongoose.Types.ObjectId(params.userId.toString())
      : undefined;

    if (validUserId) {
      notification = await Notification.create({
        user: validUserId,
        booking: mongoose.Types.ObjectId.isValid(params.bookingId.toString())
          ? new mongoose.Types.ObjectId(params.bookingId.toString())
          : undefined,
        type: "booking_confirmation",
        title: `Reservation Confirmed: ${params.bookingReference}`,
        message: `Your booking for "${params.tourName}" departing on ${params.departureDate} is confirmed. Total: ${params.currency} $${params.totalPrice.toLocaleString()}.`,
        read: false,
        channel: "both",
        emailDeliveryStatus: emailRes.status,
        emailDeliveryError: emailRes.error,
        providerMessageId: emailRes.messageId,
        attemptCount: 1,
        lastAttemptAt: new Date(),
        metadata: {
          bookingReference: params.bookingReference,
          totalPrice: params.totalPrice,
          currency: params.currency,
        },
      });
    }
  } catch (err) {
    console.error("Failed to persist booking confirmation notification:", err);
  }

  return { notification, emailResult: emailRes };
}

/**
 * Helper to dispatch Verified Payment Confirmation notification & Brevo email
 */
export async function sendPaymentConfirmationNotification(params: {
  userId: string | mongoose.Types.ObjectId;
  bookingId: string | mongoose.Types.ObjectId;
  customerName?: string;
  customerEmail: string;
  bookingReference: string;
  tourName: string;
  amountReceived: number;
  currency: string;
  paymentReference: string;
  paymentMethod: string;
  reconciledAt: Date;
}): Promise<NotificationResult> {
  const emailRes = await sendPaymentConfirmationEmail({
    toEmail: params.customerEmail,
    customerName: params.customerName,
    bookingReference: params.bookingReference,
    tourName: params.tourName,
    amountReceived: params.amountReceived,
    currency: params.currency,
    paymentReference: params.paymentReference,
    paymentMethod: params.paymentMethod,
    reconciledAt: params.reconciledAt,
  });

  let notification: INotification | null = null;
  try {
    const validUserId = mongoose.Types.ObjectId.isValid(params.userId.toString())
      ? new mongoose.Types.ObjectId(params.userId.toString())
      : undefined;

    if (validUserId) {
      notification = await Notification.create({
        user: validUserId,
        booking: mongoose.Types.ObjectId.isValid(params.bookingId.toString())
          ? new mongoose.Types.ObjectId(params.bookingId.toString())
          : undefined,
        type: "payment_confirmation",
        title: `Payment Received: ${params.bookingReference}`,
        message: `Your payment of ${params.currency} $${params.amountReceived.toLocaleString()} for "${params.tourName}" has been verified (Ref: ${params.paymentReference}).`,
        read: false,
        channel: "both",
        emailDeliveryStatus: emailRes.status,
        emailDeliveryError: emailRes.error,
        providerMessageId: emailRes.messageId,
        attemptCount: 1,
        lastAttemptAt: new Date(),
        metadata: {
          paymentReference: params.paymentReference,
          amount: params.amountReceived,
          currency: params.currency,
        },
      });
    }
  } catch (err) {
    console.error("Failed to persist payment confirmation notification:", err);
  }

  return { notification, emailResult: emailRes };
}
