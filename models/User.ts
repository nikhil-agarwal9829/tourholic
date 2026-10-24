import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  photo?: string;
  role: "user" | "admin";
  active: boolean;
  emailVerified: boolean;
  verificationTokenHash?: string;
  verificationTokenExpiresAt?: Date;
  lastVerificationEmailSentAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: Date;
  lastPasswordResetEmailSentAt?: Date;
  favoriteTours: mongoose.Types.ObjectId[];
  travelPreferences?: {
    homeCountry?: string;
    homeCity?: string;
    preferredCountries?: string[];
    preferredDestinations?: string[];
    preferredCategories?: string[];
    destinationScope?: "india" | "international" | "both";
    minBudget?: number;
    maxBudget?: number;
    preferredDuration?: number;
    preferredTravelMonth?: number;
    onboardingCompleted: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    photo: {
      type: String,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationTokenHash: {
      type: String,
      select: false,
      index: true,
    },
    verificationTokenExpiresAt: {
      type: Date,
    },
    lastVerificationEmailSentAt: {
      type: Date,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      index: true,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
    },
    lastPasswordResetEmailSentAt: {
      type: Date,
    },
    favoriteTours: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tour",
      },
    ],
    travelPreferences: {
      homeCountry: { type: String, trim: true },
      homeCity: { type: String, trim: true },
      preferredCountries: [{ type: String, trim: true }],
      preferredDestinations: [{ type: String, trim: true }],
      preferredCategories: [{ type: String, trim: true }],
      destinationScope: {
        type: String,
        enum: ["india", "international", "both"],
        default: "both",
      },
      minBudget: { type: Number, min: 0 },
      maxBudget: { type: Number, min: 0 },
      preferredDuration: { type: Number, min: 1 },
      preferredTravelMonth: { type: Number, min: 1, max: 12 },
      onboardingCompleted: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as { passwordHash?: string }).passwordHash;
        delete (ret as { verificationTokenHash?: string }).verificationTokenHash;
        delete (ret as { passwordResetTokenHash?: string }).passwordResetTokenHash;
        return ret;
      },
    },
  }
);

// Prevent mongoose model overwrite in serverless environment
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
