export type Difficulty = "easy" | "medium" | "difficult";
export type TourCategory =
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

export interface TravelPreferences {
  homeCountry?: string;
  homeCity?: string;
  preferredCountries?: string[];
  preferredDestinations?: string[];
  preferredCategories?: string[];
  destinationScope?: "india" | "international" | "both";
  minBudget?: number;
  maxBudget?: number;
  preferredDuration?: number;
  preferredTravelMonth?: number; // 1-12
  onboardingCompleted: boolean;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  description?: string;
  day?: number;
}

export interface TourGuide {
  id: string;
  name: string;
  role: "Lead Guide" | "Tour Guide";
  photo: string;
  bio?: string;
}

export interface Tour {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  category: TourCategory;
  duration: number; // in days
  maxGroupSize: number;
  difficulty: Difficulty;
  price: number;
  currency: string;
  ratingsAverage: number;
  ratingsQuantity: number;
  imageCover: string;
  coverImagePublicId?: string;
  images: string[];
  startLocation: {
    description: string;
    coordinates: [number, number];
    address?: string;
  };
  locations?: GeoLocation[];
  guides?: TourGuide[];
  itinerary: ItineraryDay[];
  included: string[];
  excluded: string[];
  highlights: string[];
  cancellationPolicy: string;
  isPublished: boolean;
  featured?: boolean;
  destination: string;
  country: string;
  state?: string;
  city?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TourDeparture {
  _id: string;
  id?: string;
  tour: string; // Tour ObjectId
  startDate: string;
  endDate: string;
  capacity: number;
  reservedSeats: number;
  status: "open" | "limited" | "sold_out" | "closed";
  createdAt?: string;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: "user" | "admin";
  photo?: string;
  active: boolean;
  favoriteTours: string[]; // Tour IDs
  travelPreferences?: TravelPreferences;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  _id: string;
  id?: string;
  tour: string; // Tour ID
  user: {
    _id: string;
    name: string;
    photo?: string;
  };
  rating: number;
  review: string;
  createdAt: string;
}

export interface Booking {
  _id: string;
  id?: string;
  bookingReference: string;
  tour: Tour | string;
  user: User | string;
  departureSchedule?: string;
  departureDate: string;
  travelers: number;
  pricePerTraveler: number;
  totalPrice: number;
  currency: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  paymentDueAt?: string;
  paymentReference?: string;
  guestName?: string;
  guestEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TourFilterParams {
  search?: string;
  destination?: string;
  category?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: string; // e.g. "1-3", "4-7", "8+"
  sort?: "price-asc" | "price-desc" | "rating" | "popular" | "newest";
  page?: number;
  limit?: number;
}

export interface RecommendationResult {
  tour: Tour;
  score: number;
  reasons: string[];
}
