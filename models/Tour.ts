import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITour extends Document {
  name: string;
  slug: string;
  summary: string;
  description: string;
  category:
    | "adventure"
    | "nature"
    | "cultural"
    | "beaches"
    | "getaway"
    | "wildlife"
    | "beach"
    | "spiritual"
    | "heritage"
    | "relaxation"
    | "city";
  duration: number;
  maxGroupSize: number;
  difficulty: "easy" | "medium" | "difficult";
  price: number;
  currency: string;
  ratingsAverage: number;
  ratingsQuantity: number;
  imageCover: string;
  coverImagePublicId?: string;
  images: string[];
  startLocation: {
    type: string;
    coordinates: number[];
    description: string;
    address?: string;
  };
  locations: Array<{
    type: string;
    coordinates: number[];
    description?: string;
    day?: number;
  }>;
  guides?: Array<{
    id?: string;
    name: string;
    role: string;
    photo?: string;
    bio?: string;
  }>;
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  included: string[];
  excluded: string[];
  highlights: string[];
  cancellationPolicy: string;
  isPublished: boolean;
  featured: boolean;
  destination: string;
  country: string;
  state?: string;
  city?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TourSchema = new Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [100, "Tour name must have less than or equal to 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    category: {
      type: String,
      required: [true, "A tour must belong to a category"],
      enum: [
        "adventure",
        "nature",
        "cultural",
        "beaches",
        "getaway",
        "wildlife",
        "beach",
        "spiritual",
        "heritage",
        "relaxation",
        "city",
      ],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
      min: [1, "Duration must be at least 1 day"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
      min: [1, "Group size must be at least 1"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, or difficult",
      },
      index: true,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
      min: [0, "Price must be positive"],
      index: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val: number) => Math.round(val * 10) / 10,
      index: true,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    coverImagePublicId: String,
    images: [String],
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number], // [longitude, latitude]
      description: String,
      address: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        id: String,
        name: String,
        role: String,
        photo: String,
        bio: String,
      },
    ],
    itinerary: [
      {
        day: Number,
        title: String,
        description: String,
      },
    ],
    included: [String],
    excluded: [String],
    highlights: [String],
    cancellationPolicy: {
      type: String,
      default: "Free cancellation up to 14 days prior to departure.",
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    destination: {
      type: String,
      required: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      index: true,
    },
    city: {
      type: String,
      index: true,
    },
    tags: [
      {
        type: String,
        index: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes documented:
// 1. startLocation 2dsphere index for geospatial discovery
// 2. price & ratingsAverage compound index for price/rating filtering
// 3. category & difficulty compound index for search filtering
// 4. country, state, city index for destination matching
// 5. ratingsAverage & ratingsQuantity index for top-rated queries
TourSchema.index({ startLocation: "2dsphere" });
TourSchema.index({ price: 1, ratingsAverage: -1 });
TourSchema.index({ category: 1, difficulty: 1 });
TourSchema.index({ country: 1, state: 1, city: 1 });
TourSchema.index({ ratingsAverage: -1, ratingsQuantity: -1 });

export const Tour: Model<ITour> =
  mongoose.models.Tour || mongoose.model<ITour>("Tour", TourSchema);
