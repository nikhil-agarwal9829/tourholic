# Touroholic — Curated Small-Group Tour Discovery and Booking Platform

**Touroholic** is a modern, responsive, full-stack tour discovery and booking platform inspired by Natours. Built with an editorial travel aesthetic, it features deep forest-green accents, warm sand palettes, robust MongoDB schemas, rule-based explainable recommendations, authentication sessions, and end-to-end booking workflows.

---

## 1. Implemented Features Summary

### A. Discovery & Editorial Experience
- **Homepage (`/`)**:
  - Editorial hero section with high-resolution photography and live expedition search panel (destinations, travel style, max budget).
  - Featured tours, popular destinations (Banff, Amalfi, Kyoto, Serengeti), and travel category spotlights.
  - **Explainable Rule-Based Recommendations**: Displays personalized suggestions with clear reasons (e.g., *"Within your $1,200 budget"*, *"Top-rated expedition (4.9★)"*).
  - **Why Choose Us**: Transparent values (intimate groups capped at 8–12, veteran local guides, eco-friendly stays).
  - **Verified Traveler Reviews**: Authentic traveler testimonials with star ratings.
  - **Newsletter Subscription**: Email validation and instant subscriber feedback.

- **Tour Catalog & Exploration (`/tours`)**:
  - Live query search by title, destination, or country.
  - Multi-criteria filtering: category, difficulty (Easy, Medium, Difficult), duration (1–3, 4–7, 8+ days), and min/max budget range.
  - Dynamic sorting by featured/newest, highest rating, popularity, and price (low-to-high, high-to-low).
  - Active filter badges with individual dismissals and a "Reset All" option.
  - Responsive mobile drawer and loading skeletons.

- **Tour Details (`/tours/[slug]`)**:
  - Editorial header, quick metrics (duration, max group size, location, rating), and photo gallery.
  - Day-by-day collapsible/stepped itinerary with checkpoint descriptions.
  - Clear inclusions ("What's Included") and exclusions ("What's Excluded").
  - Cancellation terms and flexibility guarantees.
  - Sticky interactive booking panel on desktop with real-time price calculations based on selected departures and guest count.
  - Traveler review form with star picker and duplicate review prevention.

### B. Booking & Reservation Workflow
- **Checkout (`/checkout`)**:
  - Server-side price calculation snapshot preventing client tampering.
  - Capacity and seat availability checks against real departure schedules.
  - Explicit demo/unpaid reservation support (pay later without upfront credit card requirements).
  - Instant generation of human-readable booking reference codes (e.g., `TRH-2026-3B12B0`).
- **Traveler Dashboard (`/my-bookings`)**:
  - Detailed listing of all user bookings with timestamps, guest count, and pricing snapshots.
  - Real-time booking status (`confirmed`, `cancelled`) and payment status (`unpaid`, `paid`).
  - Safe booking cancellation workflow with server validation that immediately releases spots back to the tour departure schedule.

### C. Authentication & Profile
- **Authentication Pages (`/login`, `/register`, `/forgot-password`)**:
  - Secure bcrypt password hashing with salt generation.
  - HttpOnly JWT session cookies (`touroholic_session`) with 7-day expiration.
  - Live password complexity validator (minimum 8 characters, uppercase, and numeric checks).
  - Convenient 1-click Demo Traveler & Demo Admin login buttons for zero-friction evaluation.
- **User Profile (`/profile`)**:
  - View account credentials, role badges, and direct shortcuts to bookings.
  - Update display name and change password with current password verification.

### D. Operations & Concierge
- **Admin Dashboard (`/admin`)**:
  - High-level KPIs: Active Tours, Total Bookings, Registered Explorers, and Gross Booking Value.
  - Recent reservations inspection table.
  - Modal form to publish new tours directly to the catalog.
- **Interactive Concierge Widget**:
  - Floating travel assistant with FAQ buttons (booking steps, cancellation terms, budget filters, login support, and concierge contacts).

---

## 2. Project Structure

```
tour-managment/
├── app/
│   ├── page.tsx                     # Homepage (Hero, Search, Categories, Recommendations)
│   ├── layout.tsx                   # Root layout with fonts, Navbar, Footer, and Chatbot
│   ├── globals.css                  # Editorial color system, tokens, and custom scrollbars
│   ├── tours/
│   │   ├── page.tsx                 # Search & Filter Catalog page
│   │   └── [slug]/
│   │       └── page.tsx             # Complete Tour Details page
│   ├── checkout/
│   │   └── page.tsx                 # Reservation confirmation & checkout
│   ├── my-bookings/
│   │   └── page.tsx                 # User reservations & cancellation management
│   ├── profile/
│   │   └── page.tsx                 # User profile & password settings
│   ├── login/
│   │   └── page.tsx                 # Secure sign-in with quick demo shortcuts
│   ├── register/
│   │   └── page.tsx                 # User registration with password strength checks
│   ├── forgot-password/
│   │   └── page.tsx                 # Password recovery instructions
│   ├── admin/
│   │   └── page.tsx                 # Operations dashboard & KPI statistics
│   └── api/
│       ├── tours/                   # GET catalog & POST new tour (admin)
│       │   └── [slug]/              # GET tour details, departures, and reviews
│       ├── bookings/                # POST create reservation
│       │   ├── my/                  # GET user bookings
│       │   └── [id]/cancel/         # POST cancel reservation
│       ├── reviews/                 # GET reviews & POST new review
│       ├── recommendations/         # GET rule-based recommendations
│       ├── auth/
│       │   ├── login/               # POST credentials login
│       │   ├── register/            # POST user registration
│       │   ├── logout/              # POST clear session cookie
│       │   └── me/                  # GET current session
│       ├── users/me/                # PATCH update profile / change password
│       └── admin/stats/             # GET aggregated metrics & bookings
├── components/
│   ├── layout/                      # Navbar & Footer
│   ├── home/                        # Hero, CategoryGrid, WhyChooseUs, ReviewsSection
│   ├── tours/                       # TourCard, TourFilterSidebar, TourBookingWidget, TourReviewForm
│   └── chatbot/                     # TravelAssistantWidget (Concierge widget)
├── lib/
│   ├── db/mongodb.ts                # Serverless cached MongoDB Atlas connection helper
│   ├── auth/jwt.ts                  # JWT signing, cookie verification, and bcrypt hashing
│   ├── recommendations/engine.ts    # Explainable rule-based scoring engine
│   ├── data/sample-tours.ts         # 12 diverse sample tours, departures, and reviews
│   ├── tours/service.ts             # Service layer with MongoDB queries & sample fallback
│   └── utils.ts                     # Currency and date formatters, cn helper
├── models/
│   ├── User.ts                      # User schema with passwordHash protection
│   ├── Tour.ts                      # Tour schema with 2dsphere and compound indexes
│   ├── Review.ts                    # Review schema with unique compound index
│   ├── Booking.ts                   # Booking schema with pricing snapshots
│   └── TourDeparture.ts             # Departure schedule & seat capacity schema
├── scripts/
│   └── seed.ts                      # Database upsert seed script
└── tests/
    └── unit/
        ├── core.test.ts             # Price calculation, recommendation, & sanity tests
        └── auth-and-booking.test.ts # JWT verification & inventory capacity tests
```

---

## 3. Database Schema & Design Decisions

### A. Tours (`models/Tour.ts`)
- **Key Fields**: `name`, `slug` (unique index), `price`, `ratingsAverage`, `ratingsQuantity`, `duration`, `maxGroupSize`, `difficulty`, `category`, `startLocation` (GeoJSON Point), `itinerary`, `included`, `excluded`, `highlights`, `cancellationPolicy`, `isPublished`.
- **Indexes**:
  - `{ slug: 1 }` (unique lookup)
  - `{ startLocation: "2dsphere" }` (geospatial range discovery)
  - `{ price: 1, ratingsAverage: -1 }` (multi-criteria catalog sorting)
  - `{ category: 1, difficulty: 1 }` (fast faceted filtering)

### B. TourDepartures (`models/TourDeparture.ts`)
- **Decision**: Separated from the Tour document because each departure date has its own independent inventory, seat capacity, and reservation lifecycle.
- **Fields**: `tour` (ref Tour), `startDate`, `endDate`, `capacity`, `reservedSeats`, `status` (`open` | `limited` | `sold_out` | `closed`).

### C. Bookings (`models/Booking.ts`)
- **Decision**: **Historical Price Snapshot**. Never rely on the current Tour price for past reservations; tour prices may fluctuate, but a customer's confirmed booking price must remain immutable.
- **Fields**: `bookingReference` (unique), `user` (ref User), `tour` (ref Tour), `departureDate`, `travelers`, `pricePerTraveler`, `totalPrice`, `currency`, `bookingStatus` (`pending` | `confirmed` | `cancelled` | `completed`), `paymentStatus` (`unpaid` | `paid` | `failed`).

### D. Reviews (`models/Review.ts`)
- **Decision**: Unique compound index `{ tour: 1, user: 1 }` strictly enforces the business rule of **one review per user per tour**.
- Automatically updates the parent tour's `ratingsAverage` and `ratingsQuantity`.

---

## 4. Environment Variables

Create `.env.local` based on `.env.example`:

```bash
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/touroholic?retryWrites=true&w=majority

# Session & JWT Encryption Key
AUTH_SECRET=touroholic-jwt-super-secret-key-32-chars-minimum

# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional Image Provider (Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=
```

> **Note on Zero-Downtime Demo Mode**: If `MONGODB_URI` is omitted or not yet provided, the application automatically runs in a rich, non-blocking **development demo mode** with 12 pre-configured editorial expeditions, departures, and reviews.

---

## 5. Local Setup & Commands

### Prerequisites
- Node.js 18+ (tested with v22)
- npm 10+

### Steps
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run automated test suite**:
   ```bash
   npm test
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Verify production bundle build**:
   ```bash
   npm run build
   ```

5. **Seed MongoDB Atlas (once credentials are provided)**:
   ```bash
   npm run seed
   ```

---

## 6. Connecting MongoDB Atlas

1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster (e.g. M0 tier).
3. Under **Security → Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere, necessary for serverless environments like Vercel).
4. Under **Security → Database Access**, create a database user (e.g., `touroholic_admin`) with password.
5. Under **Database → Connect → Drivers**, copy the connection string.
6. Replace `<password>` with your database user password and set the database name to `touroholic`:
   ```
   MONGODB_URI=mongodb+srv://touroholic_admin:<password>@cluster0.xxxxx.mongodb.net/touroholic?retryWrites=true&w=majority
   ```
7. Run `npm run seed` to populate the 12 expeditions, departures, and demo accounts.

---

## 7. Cloudinary Image Provider Setup

1. Sign up at [Cloudinary](https://cloudinary.com/).
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the Cloudinary Console.
3. Paste these into your `.env.local` or Vercel Environment Variables.
4. Images hosted on `images.unsplash.com` and `res.cloudinary.com` are pre-whitelisted in `next.config.ts`.

---

## 8. GitHub & Vercel Deployment

1. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete Touroholic tour discovery and booking platform"
   git remote add origin https://github.com/<username>/touroholic.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com/) and click **Add New Project**.
   - Import your GitHub repository.
   - In **Environment Variables**, add:
     - `MONGODB_URI`
     - `AUTH_SECRET`
     - `NEXT_PUBLIC_APP_URL`
   - Click **Deploy**. Vercel will run `npm run build` and launch the application worldwide on the edge.

---

## 9. Test Results & Verification

- **Unit Test Suite**: 12/12 passing tests across `core.test.ts` and `auth-and-booking.test.ts`.
- **TypeScript**: Strict type checking passed with zero errors (`tsc` 0 errors).
- **Next.js Production Build**: 23/23 static and dynamic routes compiled successfully in 1.1s.
- **End-to-End Browser Flow**: Verified across homepage discovery, filter sidebar, tour details, reservation flow with booking reference generation, and `/my-bookings` dashboard.
