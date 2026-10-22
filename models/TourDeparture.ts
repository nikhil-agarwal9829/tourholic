import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITourDeparture extends Document {
  tour: mongoose.Types.ObjectId;
  startDate: string;
  endDate: string;
  capacity: number;
  reservedSeats: number;
  status: "open" | "limited" | "sold_out" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const TourDepartureSchema = new Schema<ITourDeparture>(
  {
    tour: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Departure must belong to a tour"],
      index: true,
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: String,
      required: [true, "End date is required"],
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, "Capacity must be at least 1"],
    },
    reservedSeats: {
      type: Number,
      default: 0,
      min: [0, "Reserved seats cannot be negative"],
    },
    status: {
      type: String,
      enum: ["open", "limited", "sold_out", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

TourDepartureSchema.index({ tour: 1, startDate: 1 });

export const TourDeparture: Model<ITourDeparture> =
  mongoose.models.TourDeparture ||
  mongoose.model<ITourDeparture>("TourDeparture", TourDepartureSchema);
