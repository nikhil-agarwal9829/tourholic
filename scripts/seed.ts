import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { SAMPLE_TOURS, SAMPLE_DEPARTURES, SAMPLE_REVIEWS } from "../lib/data/sample-tours";
import { Tour } from "../models/Tour";
import { User } from "../models/User";
import { Review } from "../models/Review";
import { TourDeparture } from "../models/TourDeparture";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function seedDatabase() {
  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is not defined.");
    console.error("Please add your MongoDB connection string in .env.local");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully!");

  console.log("Seeding admin and test users...");
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", 10);
  const userPasswordHash = await bcrypt.hash("TravelerPass123!", 10);

  const adminUser = await User.findOneAndUpdate(
    { email: "admin@touroholic.com" },
    {
      name: "Victoria Sterling (Curator)",
      email: "admin@touroholic.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      active: true,
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    },
    { upsert: true, new: true }
  );

  const testUser = await User.findOneAndUpdate(
    { email: "traveler@touroholic.com" },
    {
      name: "Marcus Thorne",
      email: "traveler@touroholic.com",
      passwordHash: userPasswordHash,
      role: "user",
      active: true,
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    { upsert: true, new: true }
  );

  console.log(`Users verified: ${adminUser.email}, ${testUser.email}`);

  console.log("Seeding tours...");
  const tourMap = new Map<string, mongoose.Types.ObjectId>();

  for (const tourData of SAMPLE_TOURS) {
    const { _id, ...tourDoc } = tourData;
    const upsertedTour = await Tour.findOneAndUpdate(
      { slug: tourDoc.slug },
      { ...tourDoc },
      { upsert: true, new: true }
    );
    tourMap.set(_id, upsertedTour._id as mongoose.Types.ObjectId);
  }
  console.log(`Successfully upserted ${SAMPLE_TOURS.length} tours.`);

  console.log("Seeding departures and schedules...");
  for (const dep of SAMPLE_DEPARTURES) {
    const realTourId = tourMap.get(dep.tour);
    if (realTourId) {
      await TourDeparture.findOneAndUpdate(
        { tour: realTourId, startDate: dep.startDate },
        {
          tour: realTourId,
          startDate: dep.startDate,
          endDate: dep.endDate,
          capacity: dep.capacity,
          reservedSeats: dep.reservedSeats,
          status: dep.status,
        },
        { upsert: true, new: true }
      );
    }
  }
  console.log(`Departures seeded.`);

  console.log("Seeding reviews...");
  for (const rev of SAMPLE_REVIEWS) {
    const realTourId = tourMap.get(rev.tour);
    if (realTourId) {
      await Review.findOneAndUpdate(
        { tour: realTourId, user: testUser._id },
        {
          tour: realTourId,
          user: testUser._id,
          rating: rev.rating,
          review: rev.review,
        },
        { upsert: true, new: true }
      );
    }
  }
  console.log(`Reviews seeded.`);

  console.log("Seeding completed successfully!");
  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
