import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  bookingReference: string;
  user: mongoose.Types.ObjectId;
  tour: mongoose.Types.ObjectId;
  departureDate: string;
  travelers: number;
  pricePerTraveler: number;
  totalPrice: number;
  currency: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  paymentReference?: string;
  guestName?: string;
  guestEmail?: string;
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
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },
    paymentReference: String,
    guestName: String,
    guestEmail: String,
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ user: 1, createdAt: -1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
