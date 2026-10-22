import * as dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({ path: ".env.local" });
dotenv.config();

// Ensure Cloudinary is initialized
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Minimal 1x1 transparent PNG data URI for safe, lightweight testing
const SAMPLE_TEST_PNG_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

interface IntegrationReport {
  mongoReachable: boolean;
  cloudinaryReachable: boolean;
  uploadSuccess: boolean;
  dbSaveSuccess: boolean;
  dbVerifySuccess: boolean;
  dbCleanupSuccess: boolean;
  cloudinaryCleanupSuccess: boolean;
  error?: string;
}

async function runIntegrationTest() {
  console.log("=================================================");
  console.log("Touroholic Integration Test (Cloudinary & Mongo)");
  console.log("=================================================");

  const report: IntegrationReport = {
    mongoReachable: false,
    cloudinaryReachable: false,
    uploadSuccess: false,
    dbSaveSuccess: false,
    dbVerifySuccess: false,
    dbCleanupSuccess: false,
    cloudinaryCleanupSuccess: false,
  };

  const testRunId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let uploadedPublicId: string | null = null;
  let savedDocId: mongoose.Types.ObjectId | null = null;
  let TestModel: mongoose.Model<any> | null = null;

  try {
    // 1. Check Cloudinary Authentication
    console.log("\n[Step 1] Verifying Cloudinary credentials...");
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      console.log("  ⚠️ Cloudinary credentials missing from environment.");
    } else {
      const ping = await cloudinary.api.ping();
      if (ping?.status === "ok") {
        report.cloudinaryReachable = true;
        console.log("  ✓ Cloudinary authenticated successfully via ping.");
      }
    }

    // 2. Check MongoDB Connectivity
    console.log("\n[Step 2] Verifying MongoDB Atlas connectivity...");
    if (!process.env.MONGODB_URI) {
      console.log("  ⚠️ MONGODB_URI missing from environment.");
    } else {
      try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
        const pingRes = await mongoose.connection.db?.admin().ping();
        if (pingRes?.ok === 1) {
          report.mongoReachable = true;
          console.log("  ✓ MongoDB Atlas connected and responded to ping.");
        }
      } catch (err: any) {
        console.log(`  ❌ MongoDB unreachable: ${err.message}`);
        console.log("     (Note: Ensure your IP is added to MongoDB Atlas Network Access whitelist)");
      }
    }

    // 3. Cloudinary Upload Test
    if (report.cloudinaryReachable) {
      console.log("\n[Step 3] Uploading temporary test image to Cloudinary (touroholic/integration-tests)...");
      const uploadRes = await cloudinary.uploader.upload(SAMPLE_TEST_PNG_BASE64, {
        folder: "touroholic/integration-tests",
        public_id: testRunId,
        tags: ["integration_test", "temporary"],
      });

      uploadedPublicId = uploadRes.public_id;
      report.uploadSuccess = Boolean(uploadRes.secure_url);
      console.log(`  ✓ Image uploaded successfully. Format: ${uploadRes.format}, Bytes: ${uploadRes.bytes}`);

      // 4. MongoDB Persistence Test (if Mongo is reachable)
      if (report.mongoReachable) {
        console.log("\n[Step 4] Storing image record in temporary MongoDB test collection...");
        const testSchema = new Schema(
          {
            testRunId: { type: String, required: true },
            imageUrl: { type: String, required: true },
            publicId: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
          { collection: "_integration_tests" }
        );

        TestModel = mongoose.models.IntegrationTest || mongoose.model("IntegrationTest", testSchema);

        const createdDoc = await TestModel.create({
          testRunId,
          imageUrl: uploadRes.secure_url,
          publicId: uploadRes.public_id,
        });

        savedDocId = createdDoc._id;
        report.dbSaveSuccess = true;
        console.log("  ✓ Image record persisted in MongoDB.");

        console.log("\n[Step 5] Reading record back from MongoDB and verifying data integrity...");
        const fetched = await TestModel.findById(savedDocId);
        if (
          fetched &&
          fetched.imageUrl === uploadRes.secure_url &&
          fetched.publicId === uploadRes.public_id
        ) {
          report.dbVerifySuccess = true;
          console.log("  ✓ Data integrity verified. Saved URL and public ID match.");
        }
      } else {
        console.log("\n[Step 4 & 5] Skipping database persistence step because MongoDB is unreachable.");
      }
    }
  } catch (error: any) {
    report.error = error.message;
    console.error("  ❌ Test error:", error.message);
  } finally {
    // Cleanup Phase: ALWAYS executed
    console.log("\n[Cleanup Phase]");

    // 1. Delete MongoDB Test Record
    if (TestModel && savedDocId) {
      try {
        await TestModel.findByIdAndDelete(savedDocId);
        report.dbCleanupSuccess = true;
        console.log("  ✓ Temporary MongoDB test document deleted.");
      } catch (cleanErr: any) {
        console.error("  ⚠️ Failed to delete MongoDB test document:", cleanErr.message);
      }
    }

    // Disconnect Mongoose
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // 2. Delete Cloudinary Test Image
    if (uploadedPublicId) {
      try {
        const destroyRes = await cloudinary.uploader.destroy(uploadedPublicId);
        if (destroyRes.result === "ok") {
          report.cloudinaryCleanupSuccess = true;
          console.log("  ✓ Temporary Cloudinary test asset destroyed.");
        }
      } catch (cleanErr: any) {
        console.error("  ⚠️ Failed to delete Cloudinary test asset:", cleanErr.message);
      }
    }
  }

  console.log("\n=================================================");
  console.log("Integration Test Results Summary:");
  console.log(`- Cloudinary Authentication:     ${report.cloudinaryReachable ? "PASS" : "FAIL"}`);
  console.log(`- Cloudinary Upload:             ${report.uploadSuccess ? "PASS" : "FAIL"}`);
  console.log(`- Cloudinary Cleanup:            ${report.cloudinaryCleanupSuccess ? "PASS" : "FAIL"}`);
  console.log(`- MongoDB Connectivity:          ${report.mongoReachable ? "PASS" : "FAIL (IP Whitelist needed)"}`);
  console.log(`- MongoDB Persistence:           ${report.dbSaveSuccess ? "PASS" : "SKIPPED"}`);
  console.log(`- MongoDB Cleanup:               ${report.dbCleanupSuccess ? "PASS" : "SKIPPED"}`);
  console.log("=================================================");
}

runIntegrationTest();
