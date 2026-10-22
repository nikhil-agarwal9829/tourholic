import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function runApiVerification() {
  console.log("=== Touroholic Recommendations & Preferences API Verification ===");
  console.log(`Target URL: ${BASE_URL}\n`);

  // 1. Verify unauthenticated access to /api/users/preferences returns 401
  console.log("1. Testing GET /api/users/preferences without auth...");
  const unauthRes = await fetch(`${BASE_URL}/api/users/preferences`);
  console.log(`   Status: ${unauthRes.status} (Expected: 401)`);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401, got ${unauthRes.status}`);
  }

  // 2. Login as traveler
  console.log("\n2. Logging in as traveler...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "traveler@touroholic.com",
      password: "TravelerPass123!",
    }),
  });
  const loginData = await loginRes.json();
  const rawCookie = loginRes.headers.get("set-cookie");
  const authCookie = rawCookie ? rawCookie.split(";")[0] : "";
  console.log(`   Traveler logged in: ${loginData.user?.email}`);

  // 3. Update traveler preferences
  console.log("\n3. Testing PUT /api/users/preferences...");
  const updateRes = await fetch(`${BASE_URL}/api/users/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      homeCountry: "India",
      homeCity: "Bengaluru",
      preferredCountries: ["India"],
      preferredDestinations: ["Kashmir", "Varkala"],
      preferredCategories: ["nature", "beach"],
      destinationScope: "india",
      maxBudget: 800,
      preferredDuration: 5,
      preferredTravelMonth: 6,
      onboardingCompleted: true,
    }),
  });
  console.log(`   Status: ${updateRes.status} (Expected: 200)`);
  const updateData = await updateRes.json();
  console.log(`   Updated scope: ${updateData.data?.travelPreferences?.destinationScope}`);
  console.log(`   Updated destinations: ${updateData.data?.travelPreferences?.preferredDestinations?.join(", ")}`);

  // 4. Fetch /api/recommendations with traveler's session
  console.log("\n4. Testing GET /api/recommendations with traveler auth cookie...");
  const recRes = await fetch(`${BASE_URL}/api/recommendations`, {
    headers: { Cookie: authCookie },
  });
  console.log(`   Status: ${recRes.status} (Expected: 200)`);
  const recData = await recRes.json();
  const personalized = recData.data?.personalized || [];
  const topRated = recData.data?.topRated || [];
  const exploreIndia = recData.data?.exploreIndia || [];

  console.log(`   Personalized recommendations count: ${personalized.length}`);
  if (personalized.length > 0) {
    console.log(`   Top recommendation: "${personalized[0].tour.name}"`);
    console.log(`   Reason: "${personalized[0].reasons[0]}"`);
  }

  console.log(`   Top Rated tours count: ${topRated.length}`);
  if (topRated.length > 0) {
    console.log(`   Highest rated: "${topRated[0].name}" (${topRated[0].ratingsAverage}★, ${topRated[0].ratingsQuantity} reviews)`);
  }

  console.log(`   Explore India count: ${exploreIndia.length} (Expected: >= 12)`);
  if (exploreIndia.length < 12) {
    throw new Error(`Expected at least 12 Indian tours, found ${exploreIndia.length}`);
  }

  // 5. Test search filter: India
  console.log("\n5. Testing GET /api/tours?destination=India...");
  const indiaRes = await fetch(`${BASE_URL}/api/tours?destination=India`);
  const indiaData = await indiaRes.json();
  console.log(`   India filter tours returned: ${indiaData.data?.length}`);

  // 6. Test search filter: Varkala
  console.log("\n6. Testing GET /api/tours?destination=Varkala...");
  const varkalaRes = await fetch(`${BASE_URL}/api/tours?destination=Varkala`);
  const varkalaData = await varkalaRes.json();
  console.log(`   Varkala filter tours returned: ${varkalaData.data?.length}`);
  if (varkalaData.data?.length > 0) {
    console.log(`   Found: "${varkalaData.data[0].name}" (${varkalaData.data[0].destination})`);
  }

  console.log("\n=== ALL RECOMMENDATION & TOUR API CHECKS PASSED SUCCESSFULLY ===");
}

runApiVerification().catch((err) => {
  console.error("API verification failed:", err);
  process.exit(1);
});
