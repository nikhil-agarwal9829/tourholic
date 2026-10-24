import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  bookingReference: string;
  user: mongoose.Types.ObjectId;
  tour: mongoose.Types.ObjectId;
  departureSchedule?: mongoose.Types.ObjectId;
  departureDate: string;
  travelers: number;
  pricePerTraveler: number;
  totalPrice: number;
  currency: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  paymentDueAt: Date;
  paymentReference?: string;
  paymentMethod?: string;
  paidAt?: Date;
  paymentReconciledBy?: mongoose.Types.ObjectId;
  paymentReconciledAt?: Date;
  paymentReconciliationNotes?: string;
  outstandingBalance?: number;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  cancellationPolicySnapshot?: string;
  refundAmount?: number;
  refundedAt?: Date;
  refundReason?: string;
  lastPaymentReminderSentAt?: Date;
  paymentReminderCount?: number;
  guestName?: string;
  guestEmail?: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
      index: true,
    },
    departureSchedule: {
      type: Schema.Types.ObjectId,
      ref: "TourDeparture",
    },
    departureDate: {
      type: String,
      required: true,
    },
    travelers: {
      type: Number,
      required: true,
      min: [1, "At least 1 traveler is required"],
    },
    pricePerTraveler: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "unpaid",
      index: true,
    },
    paymentDueAt: {
      type: Date,
      required: true,
      index: true,
    },
    outstandingBalance: Number,
    paymentReference: String,
    paymentMethod: String,
    paidAt: Date,
    paymentReconciledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    paymentReconciledAt: Date,
    paymentReconciliationNotes: String,
    cancelledAt: Date,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: String,
    cancellationPolicySnapshot: String,
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: Date,
    refundReason: String,
    lastPaymentReminderSentAt: Date,
    paymentReminderCount: {
      type: Number,
      default: 0,
    },
    guestName: String,
    guestEmail: String,
    specialRequests: String,
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ user: 1, tour: 1, departureDate: 1, createdAt: -1 });
BookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });
BookingSchema.index({ paymentDueAt: 1, paymentStatus: 1, bookingStatus: 1 });
BookingSchema.index({ departureDate: 1 });
BookingSchema.index({ createdAt: -1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
