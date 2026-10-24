import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  booking: mongoose.Types.ObjectId;
  bookingReference: string;
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentReference: string;
  status: "completed" | "pending" | "failed" | "refunded";
  reconciledBy: mongoose.Types.ObjectId;
  reconciledAt: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Payment must belong to a booking"],
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Payment must be associated with a user"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be greater than zero"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true,
    },
    paymentReference: {
      type: String,
      required: [true, "Unique transaction reference is required"],
      unique: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["completed", "pending", "failed", "refunded"],
      default: "completed",
      index: true,
    },
    reconciledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Auditing administrator is required"],
    },
    reconciledAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    notes: {
      type: String,
      required: [true, "Audit reconciliation note is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ paymentReference: 1 }, { unique: true });
PaymentSchema.index({ booking: 1, createdAt: -1 });
PaymentSchema.index({ user: 1, createdAt: -1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
