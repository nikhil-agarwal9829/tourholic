/**
 * Curated destination registry for geospatial resolution.
 * Coordinates are formatted strictly in GeoJSON standard: [longitude, latitude].
 */

export interface KnownDestination {
  name: string;
  aliases: string[];
  coordinates: [number, number]; // [longitude, latitude]
  type: "city" | "state" | "region" | "country";
  parentRegion?: string;
  country: string;
}

export const KNOWN_DESTINATIONS: KnownDestination[] = [
  // --- Indian States & Territories ---
  {
    name: "Haryana",
    aliases: ["haryana", "state of haryana", "hr"],
    coordinates: [76.0856, 29.0588], // Representative center of Haryana
    type: "state",
    country: "India",
  },
  {
    name: "Delhi",
    aliases: ["delhi", "new delhi", "nct", "nct of delhi", "dilli"],
    coordinates: [77.2090, 28.6139],
    type: "city",
    parentRegion: "Delhi",
    country: "India",
  },
  {
    name: "Agra",
    aliases: ["agra", "taj mahal agra"],
    coordinates: [78.0421, 27.1751],
    type: "city",
    parentRegion: "Uttar Pradesh",
    country: "India",
  },
  {
    name: "Jaipur",
    aliases: ["jaipur", "pink city"],
    coordinates: [75.8200, 26.9200],
    type: "city",
    parentRegion: "Rajasthan",
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
    name: "Rishikesh",
    aliases: ["rishikesh", "hrishikesh"],
    coordinates: [78.3253, 30.1293],
    type: "city",
    parentRegion: "Uttarakhand",
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
    name: "Manali",
    aliases: ["manali", "kullu manali"],
    coordinates: [77.1700, 32.2400],
    type: "city",
    parentRegion: "Himachal Pradesh",
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
    name: "Kashmir",
    aliases: ["kashmir", "srinagar", "kashmir valley", "jammu and kashmir", "j&k"],
    coordinates: [74.7973, 34.0837],
    type: "region",
    parentRegion: "Jammu and Kashmir",
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
    name: "Mumbai",
    aliases: ["mumbai", "bombay"],
    coordinates: [72.8347, 18.9220],
    type: "city",
    parentRegion: "Maharashtra",
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
    name: "Goa",
    aliases: ["goa", "panaji", "old goa"],
    coordinates: [73.8300, 15.4989],
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
    name: "Kerala Backwaters",
    aliases: ["kerala backwaters", "alappuzha", "alleppey"],
    coordinates: [76.3400, 9.4900],
    type: "region",
    parentRegion: "Kerala",
    country: "India",
  },
  {
    name: "Varkala",
    aliases: ["varkala", "varkala cliff", "varkala beach"],
    coordinates: [76.7073, 8.7369],
    type: "city",
    parentRegion: "Kerala",
    country: "India",
  },
  {
    name: "Varanasi",
    aliases: ["varanasi", "banaras", "kashi"],
    coordinates: [83.0064, 25.2885],
    type: "city",
    parentRegion: "Uttar Pradesh",
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
    name: "Darjeeling",
    aliases: ["darjeeling", "darjiling"],
    coordinates: [88.2663, 27.0410],
    type: "city",
    parentRegion: "West Bengal",
    country: "India",
  },
  {
    name: "West Bengal",
    aliases: ["west bengal", "wb", "bengal"],
    coordinates: [87.8550, 22.9868],
    type: "state",
    country: "India",
  },
  {
    name: "Chennai",
    aliases: ["chennai", "madras"],
    coordinates: [80.2707, 13.0827],
    type: "city",
    parentRegion: "Tamil Nadu",
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
    name: "India",
    aliases: ["india", "bharat", "in"],
    coordinates: [78.9629, 20.5937],
    type: "country",
    country: "India",
  },

  // --- Global Tour Destinations ---
  {
    name: "Banff",
    aliases: ["banff", "canadian rockies", "alberta"],
    coordinates: [-115.5708, 51.1784],
    type: "city",
    country: "Canada",
  },
  {
    name: "Amalfi Coast",
    aliases: ["amalfi", "amalfi coast", "positano", "campania"],
    coordinates: [14.2681, 40.8518],
    type: "region",
    country: "Italy",
  },
  {
    name: "Kyoto",
    aliases: ["kyoto", "kansai"],
    coordinates: [135.7681, 35.0116],
    type: "city",
    country: "Japan",
  },
  {
    name: "Serengeti",
    aliases: ["serengeti", "serengeti national park", "mara"],
    coordinates: [34.8333, -2.3333],
    type: "region",
    country: "Tanzania",
  },
  {
    name: "Patagonia",
    aliases: ["patagonia", "el chaltén", "fitz roy"],
    coordinates: [-72.8860, -49.3315],
    type: "region",
    country: "Argentina",
  },
  {
    name: "Bali",
    aliases: ["bali", "ubud", "uluwatu"],
    coordinates: [115.2625, -8.5069],
    type: "region",
    country: "Indonesia",
  },
  {
    name: "Iceland",
    aliases: ["iceland", "ring road", "reykjavik"],
    coordinates: [-21.9426, 64.1466],
    type: "country",
    country: "Iceland",
  },
  {
    name: "Machu Picchu",
    aliases: ["machu picchu", "cusco", "inca trail"],
    coordinates: [-72.5450, -13.1631],
    type: "region",
    country: "Peru",
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
    name: "Queenstown",
    aliases: ["queenstown", "fiordland"],
    coordinates: [168.6626, -45.0312],
    type: "city",
    country: "New Zealand",
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
 * Normalizes query string for destination matching.
 * Cleans punctuation, removes common country suffixes (e.g. ", India"),
 * and strips redundant whitespace.
 */
export function normalizeDestinationQuery(query: string): string {
  if (!query) return "";
  return query
    .toLowerCase()
    .replace(/,\s*(india|bharat|canada|italy|japan|tanzania|argentina|peru|turkey|switzerland|new zealand|morocco)/gi, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves a destination name or query to its representative geographic coordinates.
 * Coordinates are returned strictly as [longitude, latitude].
 */
export function resolveDestinationCoordinates(
  query: string
): { name: string; coordinates: [number, number]; type: string; country: string } | null {
  if (!query || !query.trim()) return null;
  const normalized = normalizeDestinationQuery(query);

  // 1. Direct alias match
  for (const dest of KNOWN_DESTINATIONS) {
    if (dest.name.toLowerCase() === normalized) {
      return {
        name: dest.name,
        coordinates: dest.coordinates,
        type: dest.type,
        country: dest.country,
      };
    }
    if (dest.aliases.some((a) => a === normalized)) {
      return {
        name: dest.name,
        coordinates: dest.coordinates,
        type: dest.type,
        country: dest.country,
      };
    }
  }

  // 2. Substring or token match
  for (const dest of KNOWN_DESTINATIONS) {
    if (
      normalized.includes(dest.name.toLowerCase()) ||
      dest.aliases.some((a) => normalized.includes(a))
    ) {
      return {
        name: dest.name,
        coordinates: dest.coordinates,
        type: dest.type,
        country: dest.country,
      };
    }
  }

  return null;
}
