import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { Tour as TourModel } from "../models/Tour";
import { resolveDestinationCoordinates } from "../lib/geo/destinations";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export async function migrateTourLocations() {
  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is not defined.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully to DB:", mongoose.connection.name);

  const tours = await TourModel.find({});
  console.log(`Found ${tours.length} tours in collection.`);

  let updatedCount = 0;
  let unresolvedCount = 0;
  const unresolvedTours: string[] = [];

  for (const tour of tours) {
    let coordinates: [number, number] | null = null;

    // 1. Check existing coordinates from location or startLocation
    const existingCoords = tour.location?.coordinates || tour.startLocation?.coordinates;
    if (
      Array.isArray(existingCoords) &&
      existingCoords.length === 2 &&
      typeof existingCoords[0] === "number" &&
      typeof existingCoords[1] === "number" &&
      !isNaN(existingCoords[0]) &&
      !isNaN(existingCoords[1])
    ) {
      coordinates = [existingCoords[0], existingCoords[1]];
    }

    // 2. If coordinates are missing, resolve from destination / city / state
    if (!coordinates) {
      const searchKey = tour.destination || tour.city || tour.state || tour.name;
      const resolved = resolveDestinationCoordinates(searchKey);
      if (resolved) {
        coordinates = resolved.coordinates;
        console.log(`Resolved missing coordinates for "${tour.name}": [${coordinates.join(", ")}] (${resolved.name})`);
      }
    }

    if (coordinates) {
      const desc = tour.startLocation?.description || `${tour.destination}, ${tour.country}`;
      const addr = tour.startLocation?.address || tour.destination;

      tour.location = {
        type: "Point",
        coordinates,
        description: desc,
        address: addr,
      };

      tour.startLocation = {
        type: "Point",
        coordinates,
        description: desc,
        address: addr,
      };

      await tour.save();
      updatedCount++;
    } else {
      unresolvedCount++;
      unresolvedTours.push(tour.name);
      console.warn(`Could not resolve coordinates for tour: "${tour.name}" (Destination: "${tour.destination}")`);
    }
  }

  console.log(`\nLocation Migration Summary:`);
  console.log(`- Successfully updated/verified: ${updatedCount} tours`);
  console.log(`- Unresolved missing coordinates: ${unresolvedCount} tours`);
  if (unresolvedTours.length > 0) {
    console.log(`  Unresolved: ${unresolvedTours.join(", ")}`);
  }

  // 3. Create or verify 2dsphere indexes
  console.log("\nCreating and verifying MongoDB 2dsphere indexes...");
  try {
    const locIdx = await TourModel.collection.createIndex({ location: "2dsphere" });
    console.log(`- 2dsphere index created on 'location': ${locIdx}`);

    const startLocIdx = await TourModel.collection.createIndex({ startLocation: "2dsphere" });
    console.log(`- 2dsphere index created on 'startLocation': ${startLocIdx}`);

    const allIndexes = await TourModel.collection.indexes();
    console.log(`Current collection indexes:`, allIndexes.map((i) => i.name));
  } catch (idxErr) {
    console.error("Error creating 2dsphere index in MongoDB Atlas:", idxErr);
    throw idxErr;
  }

  await mongoose.disconnect();
  console.log("Migration completed successfully and database disconnected.");
}

if (require.main === module) {
  migrateTourLocations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
