import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  tour: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    tour: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Review must have a rating between 1 and 5"],
    },
    review: {
      type: String,
      required: [true, "Review text cannot be empty"],
      trim: true,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate review per user per tour
ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
