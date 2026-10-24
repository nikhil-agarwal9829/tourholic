import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "booking_confirmation"
  | "payment_reminder"
  | "payment_confirmation"
  | "booking_cancellation"
  | "payment_deadline_approaching"
  | "payment_overdue"
  | "refund_status_update"
  | "email_verification"
  | "password_reset"
  | "general";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  channel: "in_app" | "email" | "both";
  emailDeliveryStatus: "not_attempted" | "sent" | "skipped_no_provider" | "failed";
  emailDeliveryError?: string;
  providerMessageId?: string;
  attemptCount: number;
  lastAttemptAt?: Date;
  errorSummary?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "booking_confirmation",
        "payment_reminder",
        "payment_confirmation",
        "booking_cancellation",
        "payment_deadline_approaching",
        "payment_overdue",
        "refund_status_update",
        "email_verification",
        "password_reset",
        "general",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    channel: {
      type: String,
      enum: ["in_app", "email", "both"],
      default: "both",
    },
    emailDeliveryStatus: {
      type: String,
      enum: ["not_attempted", "sent", "skipped_no_provider", "failed"],
      default: "not_attempted",
    },
    emailDeliveryError: {
      type: String,
    },
    providerMessageId: {
      type: String,
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    lastAttemptAt: {
      type: Date,
    },
    errorSummary: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
