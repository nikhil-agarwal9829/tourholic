/**
 * Curated destination registry for geospatial resolution.
 * Coordinates are formatted strictly in GeoJSON standard: [longitude, latitude].
 * Source: Official city-center WGS 84 geographic coordinates.
 */

export interface Destination {
  name: string;
  country: string;
  region?: string;
  aliases: string[];
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  key: string;
}

export interface KnownDestination {
  name: string;
  aliases: string[];
  coordinates: [number, number]; // [longitude, latitude]
  type: "city" | "state" | "region" | "country";
  parentRegion?: string;
  country: string;
}

export interface ResolvedDestination {
  name: string;
  country: string;
  region?: string;
  coordinates: [number, number]; // [longitude, latitude]
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  type: "city" | "state" | "region" | "country";
  key: string;
}

/**
 * Registry of 50 famous travel destinations (30 Indian, 20 International)
 * backed by verified city-centre coordinates in GeoJSON [longitude, latitude] format.
 */
export const DESTINATIONS_REGISTRY: Destination[] = [
  // ==========================================
  // --- 30 INDIAN DESTINATIONS ---
  // ==========================================
  {
    name: "Delhi",
    country: "India",
    region: "Delhi",
    aliases: ["delhi", "new delhi", "nct", "dilli"],
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
    key: "delhi",
  },
  {
    name: "Noida",
    country: "India",
    region: "Uttar Pradesh",
    aliases: ["noida", "greater noida", "sector 18", "gautam buddha nagar"],
    location: { type: "Point", coordinates: [77.3910, 28.5355] },
    key: "noida",
  },
  {
    name: "Gurugram",
    country: "India",
    region: "Haryana",
    aliases: ["gurugram", "gurgaon", "cyber city"],
    location: { type: "Point", coordinates: [77.0266, 28.4595] },
    key: "gurugram",
  },
  {
    name: "Mumbai",
    country: "India",
    region: "Maharashtra",
    aliases: ["mumbai", "bombay", "marine drive"],
    location: { type: "Point", coordinates: [72.8777, 19.0760] },
    key: "mumbai",
  },
  {
    name: "Pune",
    country: "India",
    region: "Maharashtra",
    aliases: ["pune", "poona"],
    location: { type: "Point", coordinates: [73.8567, 18.5204] },
    key: "pune",
  },
  {
    name: "Udaipur",
    country: "India",
    region: "Rajasthan",
    aliases: ["udaipur", "city of lakes", "lake pichola"],
    location: { type: "Point", coordinates: [73.7125, 24.5854] },
    key: "udaipur",
  },
  {
    name: "Jaipur",
    country: "India",
    region: "Rajasthan",
    aliases: ["jaipur", "pink city", "amber fort"],
    location: { type: "Point", coordinates: [75.7873, 26.9124] },
    key: "jaipur",
  },
  {
    name: "Agra",
    country: "India",
    region: "Uttar Pradesh",
    aliases: ["agra", "taj mahal", "taj mahal agra"],
    location: { type: "Point", coordinates: [78.0081, 27.1767] },
    key: "agra",
  },
  {
    name: "Varanasi",
    country: "India",
    region: "Uttar Pradesh",
    aliases: ["varanasi", "banaras", "kashi"],
    location: { type: "Point", coordinates: [82.9739, 25.3176] },
    key: "varanasi",
  },
  {
    name: "Srinagar",
    country: "India",
    region: "Jammu and Kashmir",
    aliases: ["srinagar", "dal lake", "kashmir valley"],
    location: { type: "Point", coordinates: [74.7973, 34.0837] },
    key: "srinagar",
  },
  {
    name: "Jammu",
    country: "India",
    region: "Jammu and Kashmir",
    aliases: ["jammu", "city of temples", "katra"],
    location: { type: "Point", coordinates: [74.8570, 32.7266] },
    key: "jammu",
  },
  {
    name: "Manali",
    country: "India",
    region: "Himachal Pradesh",
    aliases: ["manali", "kullu manali", "solang"],
    location: { type: "Point", coordinates: [77.1887, 32.2396] },
    key: "manali",
  },
  {
    name: "Shimla",
    country: "India",
    region: "Himachal Pradesh",
    aliases: ["shimla", "simla", "mall road shimla"],
    location: { type: "Point", coordinates: [77.1734, 31.1048] },
    key: "shimla",
  },
  {
    name: "Chandigarh",
    country: "India",
    region: "Chandigarh",
    aliases: ["chandigarh", "the beautiful city", "mohali"],
    location: { type: "Point", coordinates: [76.7794, 30.7333] },
    key: "chandigarh",
  },
  {
    name: "Amritsar",
    country: "India",
    region: "Punjab",
    aliases: ["amritsar", "golden temple", "harmandir sahib"],
    location: { type: "Point", coordinates: [74.8723, 31.6340] },
    key: "amritsar",
  },
  {
    name: "Dehradun",
    country: "India",
    region: "Uttarakhand",
    aliases: ["dehradun", "doon valley", "mussoorie"],
    location: { type: "Point", coordinates: [78.0322, 30.3165] },
    key: "dehradun",
  },
  {
    name: "Rishikesh",
    country: "India",
    region: "Uttarakhand",
    aliases: ["rishikesh", "yoga capital", "lakshman jhula"],
    location: { type: "Point", coordinates: [78.2676, 30.0869] },
    key: "rishikesh",
  },
  {
    name: "Nainital",
    country: "India",
    region: "Uttarakhand",
    aliases: ["nainital", "lake district of india", "naini lake"],
    location: { type: "Point", coordinates: [79.4591, 29.3919] },
    key: "nainital",
  },
  {
    name: "Lucknow",
    country: "India",
    region: "Uttar Pradesh",
    aliases: ["lucknow", "city of nawabs"],
    location: { type: "Point", coordinates: [80.9462, 26.8467] },
    key: "lucknow",
  },
  {
    name: "Varkala",
    country: "India",
    region: "Kerala",
    aliases: ["varkala", "varkala cliff", "varkala beach"],
    location: { type: "Point", coordinates: [76.7073, 8.7369] },
    key: "varkala",
  },
  {
    name: "Kochi",
    country: "India",
    region: "Kerala",
    aliases: ["kochi", "cochin", "fort kochi", "ernakulam"],
    location: { type: "Point", coordinates: [76.2673, 9.9312] },
    key: "kochi",
  },
  {
    name: "Alappuzha",
    country: "India",
    region: "Kerala",
    aliases: ["alappuzha", "alleppey", "kerala backwaters"],
    location: { type: "Point", coordinates: [76.3388, 9.4981] },
    key: "alappuzha",
  },
  {
    name: "Bengaluru",
    country: "India",
    region: "Karnataka",
    aliases: ["bengaluru", "bangalore", "silicon valley of india"],
    location: { type: "Point", coordinates: [77.5946, 12.9716] },
    key: "bengaluru",
  },
  {
    name: "Chennai",
    country: "India",
    region: "Tamil Nadu",
    aliases: ["chennai", "madras", "marina beach"],
    location: { type: "Point", coordinates: [80.2707, 13.0827] },
    key: "chennai",
  },
  {
    name: "Hyderabad",
    country: "India",
    region: "Telangana",
    aliases: ["hyderabad", "city of pearls", "secunderabad"],
    location: { type: "Point", coordinates: [78.4867, 17.3850] },
    key: "hyderabad",
  },
  {
    name: "Kolkata",
    country: "India",
    region: "West Bengal",
    aliases: ["kolkata", "calcutta", "city of joy"],
    location: { type: "Point", coordinates: [88.3639, 22.5726] },
    key: "kolkata",
  },
  {
    name: "Goa/Panaji",
    country: "India",
    region: "Goa",
    aliases: ["goa", "panaji", "panjim", "old goa", "north goa", "south goa"],
    location: { type: "Point", coordinates: [73.8300, 15.4989] },
    key: "goa",
  },
  {
    name: "Darjeeling",
    country: "India",
    region: "West Bengal",
    aliases: ["darjeeling", "queen of the hills"],
    location: { type: "Point", coordinates: [88.2627, 27.0410] },
    key: "darjeeling",
  },
  {
    name: "Ahmedabad",
    country: "India",
    region: "Gujarat",
    aliases: ["ahmedabad", "amdavad", "gandhinagar"],
    location: { type: "Point", coordinates: [72.5714, 23.0225] },
    key: "ahmedabad",
  },
  {
    name: "Jodhpur",
    country: "India",
    region: "Rajasthan",
    aliases: ["jodhpur", "blue city", "mehrangarh"],
    location: { type: "Point", coordinates: [73.0243, 26.2389] },
    key: "jodhpur",
  },

  // ==========================================
  // --- 20 INTERNATIONAL DESTINATIONS ---
  // ==========================================
  {
    name: "Dubai",
    country: "United Arab Emirates",
    region: "Dubai",
    aliases: ["dubai", "burj khalifa", "uae dubai"],
    location: { type: "Point", coordinates: [55.2708, 25.2048] },
    key: "dubai-uae",
  },
  {
    name: "Abu Dhabi",
    country: "United Arab Emirates",
    region: "Abu Dhabi",
    aliases: ["abu dhabi", "sheikh zayed", "uae abu dhabi"],
    location: { type: "Point", coordinates: [54.3773, 24.4539] },
    key: "abu-dhabi-uae",
  },
  {
    name: "Singapore",
    country: "Singapore",
    region: "Singapore",
    aliases: ["singapore", "marina bay", "changi"],
    location: { type: "Point", coordinates: [103.8198, 1.3521] },
    key: "singapore",
  },
  {
    name: "Bangkok",
    country: "Thailand",
    region: "Bangkok",
    aliases: ["bangkok", "krung thep", "siam"],
    location: { type: "Point", coordinates: [100.5018, 13.7563] },
    key: "bangkok-thailand",
  },
  {
    name: "Phuket",
    country: "Thailand",
    region: "Phuket",
    aliases: ["phuket", "patong", "kata beach"],
    location: { type: "Point", coordinates: [98.3923, 7.8804] },
    key: "phuket-thailand",
  },
  {
    name: "Kuala Lumpur",
    country: "Malaysia",
    region: "Federal Territory",
    aliases: ["kuala lumpur", "kl", "petronas"],
    location: { type: "Point", coordinates: [101.6869, 3.1390] },
    key: "kuala-lumpur-malaysia",
  },
  {
    name: "Bali/Denpasar",
    country: "Indonesia",
    region: "Bali",
    aliases: ["bali", "denpasar", "ubud", "kuta", "seminyak"],
    location: { type: "Point", coordinates: [115.2167, -8.6500] },
    key: "bali-indonesia",
  },
  {
    name: "Kathmandu",
    country: "Nepal",
    region: "Bagmati",
    aliases: ["kathmandu", "thamel", "nepal valley"],
    location: { type: "Point", coordinates: [85.3240, 27.7172] },
    key: "kathmandu-nepal",
  },
  {
    name: "Colombo",
    country: "Sri Lanka",
    region: "Western Province",
    aliases: ["colombo", "galle face", "ceylon"],
    location: { type: "Point", coordinates: [79.8612, 6.9271] },
    key: "colombo-sri-lanka",
  },
  {
    name: "Male",
    country: "Maldives",
    region: "Kaafu Atoll",
    aliases: ["male", "maldives", "malé"],
    location: { type: "Point", coordinates: [73.5093, 4.1755] },
    key: "male-maldives",
  },
  {
    name: "London",
    country: "United Kingdom",
    region: "England",
    aliases: ["london", "big ben", "westminster"],
    location: { type: "Point", coordinates: [-0.1278, 51.5074] },
    key: "london-uk",
  },
  {
    name: "Paris",
    country: "France",
    region: "Île-de-France",
    aliases: ["paris", "eiffel tower", "city of light"],
    location: { type: "Point", coordinates: [2.3522, 48.8566] },
    key: "paris-france",
  },
  {
    name: "Rome",
    country: "Italy",
    region: "Lazio",
    aliases: ["rome", "roma", "colosseum"],
    location: { type: "Point", coordinates: [12.4964, 41.9028] },
    key: "rome-italy",
  },
  {
    name: "Amsterdam",
    country: "Netherlands",
    region: "North Holland",
    aliases: ["amsterdam", "canals amsterdam"],
    location: { type: "Point", coordinates: [4.9041, 52.3676] },
    key: "amsterdam-netherlands",
  },
  {
    name: "Zurich",
    country: "Switzerland",
    region: "Zurich",
    aliases: ["zurich", "zürich", "swiss alps"],
    location: { type: "Point", coordinates: [8.5417, 47.3769] },
    key: "zurich-switzerland",
  },
  {
    name: "Istanbul",
    country: "Türkiye",
    region: "Istanbul",
    aliases: ["istanbul", "constantinople", "bosphorus", "turkey istanbul"],
    location: { type: "Point", coordinates: [28.9784, 41.0082] },
    key: "istanbul-turkiye",
  },
  {
    name: "Tokyo",
    country: "Japan",
    region: "Tokyo",
    aliases: ["tokyo", "shinjuku", "shibuya"],
    location: { type: "Point", coordinates: [139.6917, 35.6895] },
    key: "tokyo-japan",
  },
  {
    name: "Seoul",
    country: "South Korea",
    region: "Seoul Capital Area",
    aliases: ["seoul", "gangnam", "korea seoul"],
    location: { type: "Point", coordinates: [126.9780, 37.5665] },
    key: "seoul-south-korea",
  },
  {
    name: "Sydney",
    country: "Australia",
    region: "New South Wales",
    aliases: ["sydney", "sydney opera house", "bondi"],
    location: { type: "Point", coordinates: [151.2093, -33.8688] },
    key: "sydney-australia",
  },
  {
    name: "New York City",
    country: "United States",
    region: "New York",
    aliases: ["new york", "new york city", "nyc", "manhattan"],
    location: { type: "Point", coordinates: [-74.0060, 40.7128] },
    key: "new-york-city-usa",
  },
];

/**
 * Extended regional and state representative entities to maintain full
 * backward compatibility for regional search queries (e.g. Haryana, Rajasthan, Peru, etc.).
 */
export const EXTENDED_REGIONS: KnownDestination[] = [
  {
    name: "Haryana",
    aliases: ["haryana", "state of haryana", "hr"],
    coordinates: [76.0856, 29.0588],
    type: "state",
    country: "India",
  },
  {
    name: "Rajasthan",
    aliases: ["rajasthan", "raj"],
    coordinates: [74.2179, 27.0238],
    type: "state",
    country: "India",
  },
  {
    name: "Uttarakhand",
    aliases: ["uttarakhand", "uttaranchal", "uk"],
    coordinates: [79.0193, 30.0668],
    type: "state",
    country: "India",
  },
  {
    name: "Himachal Pradesh",
    aliases: ["himachal", "himachal pradesh", "hp"],
    coordinates: [77.1734, 31.1048],
    type: "state",
    country: "India",
  },
  {
    name: "Punjab",
    aliases: ["punjab", "pb"],
    coordinates: [75.3412, 31.1471],
    type: "state",
    country: "India",
  },
  {
    name: "Uttar Pradesh",
    aliases: ["uttar pradesh", "up"],
    coordinates: [80.9462, 26.8467],
    type: "state",
    country: "India",
  },
  {
    name: "Kerala",
    aliases: ["kerala", "god's own country"],
    coordinates: [76.2711, 10.8505],
    type: "state",
    country: "India",
  },
  {
    name: "Maharashtra",
    aliases: ["maharashtra", "mh"],
    coordinates: [75.7139, 19.7515],
    type: "state",
    country: "India",
  },
  {
    name: "Karnataka",
    aliases: ["karnataka", "ka"],
    coordinates: [75.7139, 15.3173],
    type: "state",
    country: "India",
  },
  {
    name: "Tamil Nadu",
    aliases: ["tamil nadu", "tn"],
    coordinates: [78.6569, 11.1271],
    type: "state",
    country: "India",
  },
  {
    name: "West Bengal",
    aliases: ["west bengal", "wb"],
    coordinates: [87.8550, 22.9868],
    type: "state",
    country: "India",
  },
  {
    name: "Gujarat",
    aliases: ["gujarat", "gj"],
    coordinates: [71.1924, 22.2587],
    type: "state",
    country: "India",
  },
  {
    name: "India",
    aliases: ["india", "bharat", "in"],
    coordinates: [78.9629, 20.5937],
    type: "country",
    country: "India",
  },
  {
    name: "Machu Picchu",
    aliases: ["machu picchu", "cusco", "inca trail"],
    coordinates: [-72.5450, -13.1631],
    type: "region",
    country: "Peru",
  },
  {
    name: "Serengeti",
    aliases: ["serengeti", "tanzania safari", "great migration"],
    coordinates: [34.8333, -2.3333],
    type: "region",
    country: "Tanzania",
  },
  {
    name: "Amalfi Coast",
    aliases: ["amalfi", "amalfi coast", "positano"],
    coordinates: [14.6027, 40.6340],
    type: "region",
    country: "Italy",
  },
  {
    name: "Queenstown",
    aliases: ["queenstown", "fiordland", "new zealand south island"],
    coordinates: [168.6626, -45.0312],
    type: "city",
    country: "New Zealand",
  },
  {
    name: "Iceland",
    aliases: ["iceland", "ring road", "reykjavik"],
    coordinates: [-21.9426, 64.1466],
    type: "country",
    country: "Iceland",
  },
  {
    name: "Cappadocia",
    aliases: ["cappadocia", "goreme"],
    coordinates: [34.8287, 38.6431],
    type: "region",
    country: "Turkey",
  },
  {
    name: "Swiss Alps",
    aliases: ["swiss alps", "zermatt", "lucerne"],
    coordinates: [7.7491, 45.9763],
    type: "region",
    country: "Switzerland",
  },
  {
    name: "Marrakech",
    aliases: ["marrakech", "sahara", "morocco"],
    coordinates: [-7.9811, 31.6295],
    type: "city",
    country: "Morocco",
  },
];

/**
 * Union of all known destinations including the 50 canonical cities
 * and extended regional/country representations.
 */
export const KNOWN_DESTINATIONS: KnownDestination[] = [
  ...DESTINATIONS_REGISTRY.map((d) => ({
    name: d.name,
    aliases: d.aliases,
    coordinates: d.location.coordinates,
    type: "city" as const,
    parentRegion: d.region,
    country: d.country,
  })),
  ...EXTENDED_REGIONS,
];

/**
 * Normalizes query string for destination matching.
 * Cleans punctuation, removes common country suffixes (e.g. ", India"),
 * and strips redundant whitespace.
 */
export function normalizeDestinationQuery(query: string): string {
  if (!query) return "";
  return query
    .toLowerCase()
    .replace(
      /,\s*(india|bharat|united arab emirates|uae|thailand|malaysia|indonesia|nepal|sri lanka|maldives|united kingdom|uk|france|italy|netherlands|switzerland|turkey|türkiye|japan|south korea|korea|australia|united states|usa|us|canada|peru|tanzania|morocco|new zealand)/gi,
      ""
    )
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves a destination name or search query to its representative geographic coordinates.
 * Coordinates are returned strictly in GeoJSON standard: [longitude, latitude].
 */
export function resolveDestinationCoordinates(query: string): ResolvedDestination | null {
  if (!query || !query.trim()) return null;
  const normalized = normalizeDestinationQuery(query);
  if (!normalized) return null;

  // 1. Direct match against canonical 50 Destinations registry (by key or name)
  for (const dest of DESTINATIONS_REGISTRY) {
    if (
      dest.key === normalized ||
      dest.name.toLowerCase() === normalized ||
      dest.aliases.some((a) => a === normalized)
    ) {
      return {
        name: dest.name,
        country: dest.country,
        region: dest.region,
        coordinates: dest.location.coordinates,
        location: dest.location,
        type: "city",
        key: dest.key,
      };
    }
  }

  // 2. Direct match against extended regions (e.g. Haryana, Rajasthan, etc.)
  for (const dest of EXTENDED_REGIONS) {
    if (
      dest.name.toLowerCase() === normalized ||
      dest.aliases.some((a) => a === normalized)
    ) {
      return {
        name: dest.name,
        country: dest.country,
        region: dest.parentRegion,
        coordinates: dest.coordinates,
        location: { type: "Point", coordinates: dest.coordinates },
        type: dest.type,
        key: dest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };
    }
  }

  // 3. Substring or token match against 50 Destinations registry
  for (const dest of DESTINATIONS_REGISTRY) {
    if (
      normalized.includes(dest.name.toLowerCase()) ||
      dest.aliases.some((a) => normalized.includes(a) || a.includes(normalized))
    ) {
      return {
        name: dest.name,
        country: dest.country,
        region: dest.region,
        coordinates: dest.location.coordinates,
        location: dest.location,
        type: "city",
        key: dest.key,
      };
    }
  }

  // 4. Substring or token match against extended regions
  for (const dest of EXTENDED_REGIONS) {
    if (
      normalized.includes(dest.name.toLowerCase()) ||
      dest.aliases.some((a) => normalized.includes(a))
    ) {
      return {
        name: dest.name,
        country: dest.country,
        region: dest.parentRegion,
        coordinates: dest.coordinates,
        location: { type: "Point", coordinates: dest.coordinates },
        type: dest.type,
        key: dest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };
    }
  }

  return null;
}

/**
 * Retrieves a destination from the canonical 50 destinations registry by its unique key.
 */
export function getDestinationByKey(key: string): Destination | undefined {
  if (!key) return undefined;
  const normalizedKey = key.trim().toLowerCase();
  return DESTINATIONS_REGISTRY.find(
    (d) => d.key === normalizedKey || d.name.toLowerCase() === normalizedKey
  );
}
