import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  action:
    | "booking_cancellation"
    | "payment_reminder_sent"
    | "payment_reconciliation"
    | "booking_status_change"
    | "refund_recorded"
    | "booking_update"
    | "scheduled_reminder_batch";
  targetType: "Booking" | "Tour" | "User" | "System";
  targetId: string;
  targetReference?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    actorEmail: {
      type: String,
      required: true,
      default: "system@touroholic.internal",
    },
    actorRole: {
      type: String,
      required: true,
      default: "system",
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Booking", "Tour", "User", "System"],
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetReference: {
      type: String,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ targetId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
