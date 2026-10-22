import { Tour } from "@/types";

export const INDIAN_TOURS: Tour[] = [
  {
    _id: "in-tour-01",
    id: "in-tour-01",
    name: "Mumbai City & Coastal Escape",
    slug: "mumbai-city-coastal-escape",
    summary:
      "Explore Mumbai's colonial architecture, Marine Drive promenades, Bollywood heritage, and coastal ferry rides to Elephanta Caves.",
    description:
      "Experience the pulse of India's commercial and creative capital. From the historic Gateway of India and the UNESCO-listed Victoria Terminus to the bustling markets of Colaba and sunset vistas along Marine Drive, this 3-day guided expedition showcases Mumbai's dynamic spirit. Includes a private boat journey to the 5th-century rock-cut Elephanta Caves, street food heritage walk with certified culinary guides, and boutique stays in South Mumbai.",
    category: "cultural",
    duration: 3,
    maxGroupSize: 12,
    difficulty: "easy",
    price: 349,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Colaba, Mumbai, Maharashtra, India",
      coordinates: [72.8347, 18.9220],
      address: "Gateway of India Jetty, Apollo Bandar, Colaba, Mumbai",
    },
    itinerary: [
      {
        day: 1,
        title: "South Mumbai Heritage & Gateway of India",
        description:
          "Private walking tour of Victorian Gothic and Art Deco ensembles, Kala Ghoda art precinct, and sunset aperitif along Marine Drive.",
      },
      {
        day: 2,
        title: "Elephanta Island Rock Caves & Bazaars",
        description:
          "Morning ferry across Mumbai Harbour to the UNESCO rock-cut Shiva sculptures, followed by afternoon textile and spices walk in Crawford Market.",
      },
      {
        day: 3,
        title: "Dharavi Community Craft Walk & Bandra Seaside",
        description:
          "Respectful community-led enterprise walk through local artisan quarters, visiting Bandra's Portuguese chapels and seaside promenades.",
      },
    ],
    included: [
      "2 nights in boutique South Mumbai hotel",
      "Private licensed local heritage guide",
      "Elephanta Caves ferry tickets & monument admissions",
      "Daily breakfast and curated culinary tastings",
    ],
    excluded: [
      "Flights to Mumbai (BOM)",
      "Alcoholic beverages",
      "Personal shopping expenses",
      "Travel insurance",
    ],
    highlights: [
      "Private harbor cruise to 5th-century Elephanta Caves",
      "Architectural heritage tour of UNESCO Victorian Gothic district",
      "Sunset chai & street food tasting at Chowpatty",
      "Intimate group capped at 12 travelers",
    ],
    cancellationPolicy: "Free cancellation up to 14 days before departure for a full refund.",
    isPublished: true,
    featured: true,
    destination: "Mumbai",
    state: "Maharashtra",
    city: "Mumbai",
    country: "India",
    tags: ["mumbai", "maharashtra", "city", "coastal", "heritage", "elephanta", "street food"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-02",
    id: "in-tour-02",
    name: "Delhi Heritage Discovery",
    slug: "delhi-heritage-discovery",
    summary:
      "Step into centuries of Mughal and imperial history across Old Delhi bazaars, Humayun's Tomb, Qutub Minar, and Lutyens' avenues.",
    description:
      "Immerse yourself in the layered capital of India. Navigate the aromatic spice lanes of Chandni Chowk by cycle rickshaw, marvel at the sandstone majesty of Jama Masjid and the Red Fort, and discover the serene gardens of Humayun's Tomb—the architectural precursor to the Taj Mahal. Experience the tranquil Lotus Temple and Qutub Minar with expert historians.",
    category: "heritage",
    duration: 3,
    maxGroupSize: 12,
    difficulty: "easy",
    price: 299,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1592635196078-9fe3d54f2377?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Connaught Place, New Delhi, India",
      coordinates: [77.2167, 28.6315],
      address: "Inner Circle, Connaught Place, New Delhi",
    },
    itinerary: [
      {
        day: 1,
        title: "Old Delhi Bazaars & Mughal Splendors",
        description:
          "Rickshaw ride through Chandni Chowk spice markets, Jama Masjid courtyard, and views of the monumental Red Fort.",
      },
      {
        day: 2,
        title: "Humayun's Tomb & Sufi Nizamuddin Walk",
        description:
          "Explore the Persian gardens of Humayun's Tomb, followed by an evening Sufi qawwali experience at Nizamuddin Dargah.",
      },
      {
        day: 3,
        title: "Qutub Minar, Mehrauli Ruins & Modern Delhi",
        description:
          "Visit the 12th-century victory tower of Qutub Minar, the Iron Pillar of Delhi, and drive through India Gate and Rajpath.",
      },
    ],
    included: [
      "2 nights in boutique heritage hotel",
      "Private AC transport with professional driver",
      "Certified Delhi history docent",
      "Old Delhi food crawl tastings and daily breakfasts",
    ],
    excluded: [
      "Domestic or international airfares",
      "Camera fees at historic monuments",
      "Personal gratuities",
    ],
    highlights: [
      "Cycle rickshaw navigation through 300-year-old spice markets",
      "Sunset photography at UNESCO Humayun's Tomb",
      "Architectural survey of the 73-meter Qutub Minar",
      "Traditional Awadhi dinner in an imperial haveli setting",
    ],
    cancellationPolicy: "Free cancellation up to 7 days before departure for a full refund.",
    isPublished: true,
    featured: true,
    destination: "New Delhi",
    state: "Delhi",
    city: "New Delhi",
    country: "India",
    tags: ["delhi", "new delhi", "heritage", "mughal", "qutub minar", "cultural", "history"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-03",
    id: "in-tour-03",
    name: "Kashmir Valley Expedition",
    slug: "kashmir-valley-expedition",
    summary:
      "Glacial alpine meadows, Dal Lake houseboats, shikara rides, and Himalayan pine valleys of Gulmarg and Pahalgam.",
    description:
      "Discover the legendary beauty of the Kashmir Valley. Wake up to mist rising over Dal Lake aboard handcrafted cedarwood houseboats, glide through floating flower markets on traditional shikaras, and ride the Gulmarg Gondola toward snow-clad peaks. Walk through saffron fields in Pampore and pine-fringed riverbanks in Pahalgam.",
    category: "nature",
    duration: 6,
    maxGroupSize: 10,
    difficulty: "medium",
    price: 799,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Srinagar, Jammu and Kashmir, India",
      coordinates: [74.7973, 34.0837],
      address: "Boulevard Road, Ghat No. 7, Dal Lake, Srinagar",
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival in Srinagar & Dal Lake Shikara",
        description:
          "Check in to luxury cedarwood houseboat, followed by evening shikara cruise through lotus waterways and floating gardens.",
      },
      {
        day: 2,
        title: "Mughal Gardens & Old City Crafts",
        description:
          "Visit Shalimar and Nishat Bagh royal gardens; meet master Pashmina shawl and walnut-wood carvers in historic Srinagar.",
      },
      {
        day: 3,
        title: "Gulmarg Alpine Meadows & Gondola",
        description:
          "Scenic mountain drive to Gulmarg; ride Phase II of the highest cable car in the world towards Apharwat Peak.",
      },
      {
        day: 4,
        title: "Pahalgam Valley of the Shepherds",
        description:
          "Journey through saffron town of Pampore along Lidder River into Pahalgam's pine-fringed alpine trails.",
      },
      {
        day: 5,
        title: "Betaab & Aru Valleys Nature Walk",
        description:
          "Gentle hike across pristine riverbanks and nomadic Gujjar meadows with panoramic Himalayan views.",
      },
      {
        day: 6,
        title: "Morning Floating Market & Departure",
        description:
          "Dawn shikara ride to Dal Lake's historic floating vegetable market before airport transfer.",
      },
    ],
    included: [
      "3 nights deluxe Dal Lake houseboat + 2 nights Pahalgam mountain resort",
      "Private 4x4 vehicle throughout the tour",
      "Shikara rides on Dal Lake",
      "All breakfasts and traditional Wazwan dinners",
    ],
    excluded: [
      "Gulmarg Gondola tickets (purchasable on site)",
      "Horse/pony rides in Pahalgam",
      "Flights to Srinagar (SXR)",
    ],
    highlights: [
      "Stay on a handcrafted vintage cedarwood houseboat",
      "Floating market sunrise photography on Dal Lake",
      "Ascend to 13,780 ft at Apharwat Peak on Gulmarg Gondola",
      "Authentic multi-course Kashmiri Wazwan feast",
    ],
    cancellationPolicy: "Free cancellation up to 14 days prior to departure.",
    isPublished: true,
    featured: true,
    destination: "Kashmir",
    state: "Jammu and Kashmir",
    city: "Srinagar",
    country: "India",
    tags: ["kashmir", "srinagar", "gulmarg", "pahalgam", "nature", "mountains", "himalayas", "houseboat"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-04",
    id: "in-tour-04",
    name: "Varkala Cliff & Beach Retreat",
    slug: "varkala-cliff-beach-retreat",
    summary:
      "Dramatic red laterite cliffs over the Arabian Sea, yoga sanctuaries, tranquil coastal beaches, and rejuvenating Ayurvedic wellness.",
    description:
      "Unwind on the iconic cliffs of Varkala, perched high above pristine golden sands and the azure Arabian Sea. This relaxed retreat combines morning cliffside yoga sessions, traditional Ayurvedic wellness treatments, walks along quiet black-sand beaches, and cliffside seafood dining overlooking dramatic sunsets.",
    category: "beach",
    duration: 4,
    maxGroupSize: 10,
    difficulty: "easy",
    price: 449,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "North Cliff, Varkala, Kerala, India",
      coordinates: [76.7073, 8.7369],
      address: "North Cliff Walkway, Helipad Area, Varkala",
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival on the Red Cliffs of Varkala",
        description:
          "Check in to ocean-view cliff resort. Afternoon orientation walk and sunset yoga overlooking the Arabian Sea.",
      },
      {
        day: 2,
        title: "Ayurvedic Rejuvenation & Papanasam Beach",
        description:
          "Traditional Abhyanga oil massage session with qualified Ayurvedic doctor. Afternoon swim at mineral-rich Papanasam Beach.",
      },
      {
        day: 3,
        title: "Kappil Beach & Edava Backwater Estuary",
        description:
          "Coastal open-top jeep transfer to Kappil where the calm backwaters meet the rolling ocean waves.",
      },
      {
        day: 4,
        title: "Janardhana Swamy Temple & Farewell",
        description:
          "Visit the 2,000-year-old cliffside temple, morning meditation, and departure transfers to Trivandrum (TRV).",
      },
    ],
    included: [
      "3 nights in cliffside boutique eco-resort",
      "Daily guided morning yoga & breathwork",
      "1 comprehensive Ayurvedic consultation & therapy",
      "Organic coastal breakfasts & fresh juices",
    ],
    excluded: [
      "Airport transfers outside Trivandrum",
      "Optional water sport activities",
      "Travel insurance",
    ],
    highlights: [
      "Daily sunset cliff yoga with panoramic ocean horizons",
      "Certified authentic Kerala Ayurvedic massage therapy",
      "Discover the rare meeting of backwater lagoon and open sea at Kappil",
      "Fresh coconut water and farm-to-table coastal cuisine",
    ],
    cancellationPolicy: "Free cancellation up to 7 days before departure.",
    isPublished: true,
    featured: true,
    destination: "Varkala",
    state: "Kerala",
    city: "Varkala",
    country: "India",
    tags: ["varkala", "kerala", "beach", "relaxation", "yoga", "ayurveda", "coastal", "cliffs"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-05",
    id: "in-tour-05",
    name: "Kerala Backwaters Journey",
    slug: "kerala-backwaters-journey",
    summary:
      "Cruise through tranquil palm-fringed canals, paddy fields, and serene lagoons aboard a traditional eco-friendly kettuvallam houseboat.",
    description:
      "Drift into serenity through the emerald waterways of God's Own Country. Board a handcrafted thatched kettuvallam in Alappuzha (Alleppey) and cruise along tranquil canal networks lined with swaying coconut palms, village duck farms, and lush paddy fields. Savor freshly prepared Keralite cuisine with aromatic spices, fresh coconut water, and local culinary delicacies.",
    category: "nature",
    duration: 4,
    maxGroupSize: 8,
    difficulty: "easy",
    price: 520,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Finishing Point Jetty, Alappuzha, Kerala, India",
      coordinates: [76.3400, 9.4900],
      address: "Finishing Point Road, Alappuzha, Kerala",
    },
    itinerary: [
      {
        day: 1,
        title: "Embarkation on Luxury Kettuvallam",
        description:
          "Board your private wooden houseboat; glide past Vembanad Lake while savoring a traditional Kerala banana leaf lunch.",
      },
      {
        day: 2,
        title: "Narrow Canal Canoe Expedition",
        description:
          "Transfer to hand-rowed village canoes to explore quiet sub-canals, coir rope making workshops, and toddy palm groves.",
      },
      {
        day: 3,
        title: "Kumarakom Bird Sanctuary & Village Walk",
        description:
          "Dawn birdwatching along mangrove shores; observe egrets, herons, and migratory teals; check in to lake resort.",
      },
      {
        day: 4,
        title: "Kochi Spice Market & Farewell",
        description:
          "Scenic transfer to Fort Kochi to see Chinese fishing nets and historic spice warehouses before departure.",
      },
    ],
    included: [
      "1 night private luxury houseboat + 2 nights lakeside boutique heritage villa",
      "All meals onboard cooked by private chef",
      "Canoe village exploration with local guide",
      "Fort Kochi heritage walking tour",
    ],
    excluded: [
      "Flights to Kochi (COK)",
      "Alcoholic drinks",
      "Personal tips for boat crew",
    ],
    highlights: [
      "Private chartered cruise through serene Alleppey backwaters",
      "Authentic multi-course Sadhya feast served on banana leaves",
      "Guided canoe safari into narrow village waterways inaccessible to big boats",
      "Sunset over the vast expanses of Vembanad Lake",
    ],
    cancellationPolicy: "Free cancellation up to 14 days before departure.",
    isPublished: true,
    featured: true,
    destination: "Kerala Backwaters",
    state: "Kerala",
    city: "Alappuzha",
    country: "India",
    tags: ["kerala", "alappuzha", "alleppey", "backwaters", "houseboat", "nature", "cultural"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-06",
    id: "in-tour-06",
    name: "Goa Beaches & Old Goa",
    slug: "goa-beaches-old-goa",
    summary:
      "Portuguese baroque cathedrals, Latin Quarter heritage lanes of Fontainhas, golden sand beaches, and coastal spice plantations.",
    description:
      "Experience the captivating blend of Portuguese legacy and tropical coastal culture. Wander through the cobbled alleys and pastel villas of Fontainhas in Panaji, explore the Basilica of Bom Jesus and Se Cathedral in Old Goa, and tour an organic spice farm in Ponda. Spend afternoons enjoying sunsets on pristine beaches in South Goa.",
    category: "beach",
    duration: 4,
    maxGroupSize: 12,
    difficulty: "easy",
    price: 480,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1587922546307-776227941871?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Panaji, Goa, India",
      coordinates: [73.8300, 15.4989],
      address: "Fontainhas Latin Quarter, Panaji, Goa",
    },
    itinerary: [
      {
        day: 1,
        title: "Fontainhas Heritage Walk & Latin Quarter",
        description:
          "Walking tour of brightly colored 18th-century Portuguese bungalows, traditional bakeries, and Mandovi River sunset.",
      },
      {
        day: 2,
        title: "UNESCO Old Goa Cathedrals & Spice Plantation",
        description:
          "Visit Basilica of Bom Jesus and Se Cathedral; tour Sahakari organic spice plantation with traditional Goan lunch.",
      },
      {
        day: 3,
        title: "Pristine South Goa Beaches (Palolem & Agonda)",
        description:
          "Relax along crescent-shaped bays fringed with coconut palms; optional dolphin spotting boat trip.",
      },
      {
        day: 4,
        title: "Cabo de Rama Fort & Departure",
        description:
          "Clifftop panoramic views over the ocean from the historic Portuguese fort before airport drop-off.",
      },
    ],
    included: [
      "3 nights in boutique coastal heritage resort",
      "Private AC van for all transfers and sightseeing",
      "Organic spice plantation tour with lunch",
      "Professional heritage guide for Old Goa & Fontainhas",
    ],
    excluded: [
      "Flights to Goa (GOI / GOX)",
      "Water sports and motorized boat rentals",
      "Beverages and personal expenses",
    ],
    highlights: [
      "Photogenic walk through Fontainhas, Asia's only preserved Latin Quarter",
      "Historical tour of the sacred UNESCO Basilica of Bom Jesus",
      "Scented herb, cardamom, and vanilla tour at a working spice farm",
      "Sunset cocktails overlooking Palolem beach cove",
    ],
    cancellationPolicy: "Free cancellation up to 10 days before departure.",
    isPublished: true,
    featured: false,
    destination: "Goa",
    state: "Goa",
    city: "Panaji",
    country: "India",
    tags: ["goa", "beach", "cultural", "heritage", "portuguese", "panaji", "fontainhas"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-07",
    id: "in-tour-07",
    name: "Jaipur Royal Heritage Trail",
    slug: "jaipur-royal-heritage-trail",
    summary:
      "The Pink City's majestic Amber Fort, honeycomb facades of Hawa Mahal, City Palace courtyards, and vibrant gemstone bazaars.",
    description:
      "Journey into royal Rajput heritage across Jaipur. Marvel at the sprawling Amber Fort perched above Maota Lake, photograph the intricate terracotta facade of the Hawa Mahal (Palace of Winds), and stroll through the royal quarters of the City Palace. Explore ancient astronomical instruments at Jantar Mantar and shop for hand-block printed textiles and blue pottery.",
    category: "heritage",
    duration: 3,
    maxGroupSize: 12,
    difficulty: "easy",
    price: 380,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1603288967329-87327885b141?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Jaipur, Rajasthan, India",
      coordinates: [75.8200, 26.9200],
      address: "Badi Chaupar, Old Pink City, Jaipur",
    },
    itinerary: [
      {
        day: 1,
        title: "Amber Fort & Nahargarh Sunset",
        description:
          "Private jeep ascent to Amber Fort's Sheesh Mahal (Mirror Palace); evening panoramic sunset over Jaipur from Nahargarh Fort.",
      },
      {
        day: 2,
        title: "City Palace, Jantar Mantar & Hawa Mahal",
        description:
          "Morning facade photography at Palace of Winds, private tour of City Palace galleries, and Jantar Mantar sundials.",
      },
      {
        day: 3,
        title: "Artisans of Sanganer & Blue Pottery",
        description:
          "Hands-on block printing workshop with artisan families and shopping in Johari Bazaar before farewells.",
      },
    ],
    included: [
      "2 nights in converted heritage Haveli hotel",
      "Private AC transport with English-speaking driver",
      "Licensed Jaipur historian guide",
      "Hands-on textile printing workshop & entry tickets",
    ],
    excluded: [
      "Flights to Jaipur (JAI)",
      "Elephant or camel rides",
      "Camera permits",
    ],
    highlights: [
      "Private access to the dazzling mirror work of Sheesh Mahal",
      "Golden hour views from Nahargarh Fort over the Pink City",
      "Authentic Rajasthani Dal Baati Churma royal dinner",
      "Curated shopping tour for ethically crafted blue pottery and textiles",
    ],
    cancellationPolicy: "Free cancellation up to 7 days before departure.",
    isPublished: true,
    featured: true,
    destination: "Jaipur",
    state: "Rajasthan",
    city: "Jaipur",
    country: "India",
    tags: ["jaipur", "rajasthan", "heritage", "amber fort", "palaces", "cultural", "pink city"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-08",
    id: "in-tour-08",
    name: "Agra Taj Mahal & Mughal Heritage",
    slug: "agra-taj-mahal-mughal-heritage",
    summary:
      "Sunrise over the iconic marble wonder of the Taj Mahal, the red sandstone Agra Fort, and the abandoned royal city of Fatehpur Sikri.",
    description:
      "Witness the poetry in white marble at the Taj Mahal as dawn casts golden light over its domes and reflecting pools. Continue to the imposing Agra Fort, the seat of Mughal emperors, and journey to the ghost city of Fatehpur Sikri, an extraordinary 16th-century capital preserved in red sandstone.",
    category: "heritage",
    duration: 2,
    maxGroupSize: 12,
    difficulty: "easy",
    price: 260,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Agra, Uttar Pradesh, India",
      coordinates: [78.0421, 27.1751],
      address: "Taj East Gate Road, Tajganj, Agra",
    },
    itinerary: [
      {
        day: 1,
        title: "Agra Fort & Mehtab Bagh Sunset",
        description:
          "Check in to boutique hotel; explore the royal halls of Agra Fort; enjoy sunset views of the Taj Mahal across the Yamuna River from Mehtab Bagh.",
      },
      {
        day: 2,
        title: "Dawn at the Taj Mahal & Fatehpur Sikri",
        description:
          "Skip-the-line sunrise entry into the Taj Mahal with expert architectural guide; afternoon excursion to UNESCO Fatehpur Sikri.",
      },
    ],
    included: [
      "1 night in 4-star hotel near Taj Mahal",
      "Skip-the-line monument admissions with certified guide",
      "All transfers between Agra monuments and Fatehpur Sikri",
      "Breakfast and Mughlai culinary lunch",
    ],
    excluded: [
      "Train/flight connections to Agra",
      "Video camera commercial fees",
      "Personal tipping",
    ],
    highlights: [
      "Beat the crowds with early dawn access inside the Taj Mahal",
      "Sunset reflections of the marble dome across the Yamuna from Mehtab Bagh",
      "Walk the vast courtyards of Akbar's deserted capital at Fatehpur Sikri",
      "Live marble Pietra Dura inlay artisan demonstration",
    ],
    cancellationPolicy: "Free cancellation up to 5 days before departure.",
    isPublished: true,
    featured: false,
    destination: "Agra",
    state: "Uttar Pradesh",
    city: "Agra",
    country: "India",
    tags: ["agra", "taj mahal", "uttar pradesh", "mughal", "heritage", "fatehpur sikri"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-09",
    id: "in-tour-09",
    name: "Rishikesh River & Himalayan Retreat",
    slug: "rishikesh-river-himalayan-retreat",
    summary:
      "White-water rafting along the holy Ganges, Himalayan foothills hiking, evening Ganga Aarti ceremonies, and riverside yoga.",
    description:
      "Nestled where the emerald Ganges tumbles out of the Himalayas, Rishikesh is the yoga capital of the world and a premier adventure sanctuary. Combine exhilarating Class III-IV white-water rafting through Himalayan gorges with peaceful ashram visits, cliffside meditation, and the stirring evening Ganga Aarti prayer ceremony at Triveni Ghat.",
    category: "adventure",
    duration: 4,
    maxGroupSize: 10,
    difficulty: "medium",
    price: 395,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1600100397608-f010e4708761?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Tapovan, Rishikesh, Uttarakhand, India",
      coordinates: [78.3253, 30.1293],
      address: "Badrinath Road, Tapovan, Rishikesh, Uttarakhand",
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival in Tapovan & Ganga Aarti",
        description:
          "Check in to riverside eco-resort; cross the iconic suspension bridges; witness the mesmerizing flame-lit Ganga Aarti ceremony at Parmarth Niketan.",
      },
      {
        day: 2,
        title: "16-Km Ganges White-Water Rafting",
        description:
          "Paddle through thrilling rapids including Roller Coaster, Golf Course, and Club House with certified river guides; cliff jumping and body surfing.",
      },
      {
        day: 3,
        title: "Kunjapuri Himalayan Sunrise Trek",
        description:
          "Early morning drive to Kunjapuri Devi Temple (5,400 ft) for sunrise over the snow-covered Garhwal Himalayan peaks; downhill walk through mountain villages.",
      },
      {
        day: 4,
        title: "Sound Healing & Beatles Ashram Tour",
        description:
          "Morning Tibetan singing bowl sound bath; explore the historic Maharishi Mahesh Yogi (Beatles) Ashram murals before departures.",
      },
    ],
    included: [
      "3 nights in deluxe riverside cottage",
      "Full 16-km river rafting expedition with top-tier safety gear",
      "Guided sunrise trek to Kunjapuri Temple",
      "Daily vegetarian sattvic meals and yoga sessions",
    ],
    excluded: [
      "Transport to Rishikesh (Dehradun airport DED)",
      "Personal trekking equipment",
      "Bungee jumping or flying fox add-ons",
    ],
    highlights: [
      "World-class white-water rafting on the emerald Ganges rapids",
      "Breathtaking 360-degree sunrise view of Himalayan snow peaks from Kunjapuri",
      "Spiritual evening prayer ceremonies by the riverbanks",
      "Walk through the iconic 1968 Beatles Ashram meditation pods",
    ],
    cancellationPolicy: "Free cancellation up to 7 days before departure.",
    isPublished: true,
    featured: true,
    destination: "Rishikesh",
    state: "Uttarakhand",
    city: "Rishikesh",
    country: "India",
    tags: ["rishikesh", "uttarakhand", "adventure", "spiritual", "ganges", "rafting", "yoga", "himalayas"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-10",
    id: "in-tour-10",
    name: "Manali Mountain Escape",
    slug: "manali-mountain-escape",
    summary:
      "Towering deodar cedar forests, snow-capped Pir Panjal peaks, Solang Valley alpine meadows, and serene Beas River waterfalls.",
    description:
      "Escape into the mountain grandeur of Himachal Pradesh. From the cedar-surrounded Hadimba Temple and rustic stone villages of Old Manali to the soaring heights of Solang Valley and the high-altitude pass towards Atal Tunnel, this expedition offers crisp mountain air, pine forest trails, and panoramic Himalayan vistas.",
    category: "nature",
    duration: 5,
    maxGroupSize: 10,
    difficulty: "medium",
    price: 590,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Old Manali, Himachal Pradesh, India",
      coordinates: [77.1700, 32.2400],
      address: "Club House Road, Old Manali, Himachal Pradesh",
    },
    itinerary: [
      {
        day: 1,
        title: "Welcome to Old Manali",
        description:
          "Arrive at alpine pine chalet; stroll through old cobblestone lanes, craft cafes, and visit ancient 16th-century wooden Hadimba Temple.",
      },
      {
        day: 2,
        title: "Jogini Waterfall & Vashisht Hot Springs",
        description:
          "Scenic hike through apple orchards and pine woods to the cascading Jogini Falls; soak in natural sulfur baths in Vashisht village.",
      },
      {
        day: 3,
        title: "Solang Valley Alpine Adventures",
        description:
          "Explore the vast glacial meadows of Solang; optional paragliding and zorbing with snow-dusted peaks rising in all directions.",
      },
      {
        day: 4,
        title: "Atal Tunnel & Sissu Valley Drive",
        description:
          "Drive through the world-famous 9-km Atal Tunnel into Lahaul's dramatic rain-shadow valley to witness the thunderous Sissu Waterfall.",
      },
      {
        day: 5,
        title: "Naggar Castle Heritage & Farewell",
        description:
          "Visit the medieval timber-and-stone Naggar Castle and Nicholas Roerich Art Gallery before transfers to Kullu airport.",
      },
    ],
    included: [
      "4 nights in boutique wooden chalet facing snow peaks",
      "All inter-valley 4x4 private transfers",
      "Licensed Himalayan mountain trail guide",
      "Hearty mountain breakfasts and fireside dinners",
    ],
    excluded: [
      "Flights to Kullu-Manali (KUU) or Volvo bus fares",
      "Personal adventure sports (paragliding/skiing)",
      "Winter gear rental",
    ],
    highlights: [
      "Trek to the thunderous Jogini Waterfall through deodar forests",
      "Drive across the engineering marvel of the Atal Tunnel into Lahaul Valley",
      "Panoramic views of Rohtang and Pir Panjal Himalayan ranges",
      "Cozy evenings by stone fireplaces with local Himachali cuisine",
    ],
    cancellationPolicy: "Free cancellation up to 14 days before departure.",
    isPublished: true,
    featured: false,
    destination: "Manali",
    state: "Himachal Pradesh",
    city: "Manali",
    country: "India",
    tags: ["manali", "himachal pradesh", "nature", "mountains", "himalayas", "solang", "adventure"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-11",
    id: "in-tour-11",
    name: "Varanasi Spiritual & Ganges Experience",
    slug: "varanasi-spiritual-ganges-experience",
    summary:
      "Dawn boat rides along ancient ghats, evocative evening Ganga Aarti, silk weavers' quarters, and Buddhist sanctuary of Sarnath.",
    description:
      "Step into one of the world's oldest continually inhabited cities. Watch sunrise illuminate thousands of pilgrims along Dashashwamedh and Assi Ghats from a wooden rowing boat on the sacred river. Wander ancient labyrinthine alleys, observe master Banarasi silk weavers at their looms, and visit Sarnath, where the Buddha preached his first sermon.",
    category: "spiritual",
    duration: 3,
    maxGroupSize: 10,
    difficulty: "easy",
    price: 310,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Assi Ghat, Varanasi, Uttar Pradesh, India",
      coordinates: [83.0064, 25.2885],
      address: "Assi Ghat Steps, Varanasi, Uttar Pradesh",
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival & Grand Dashashwamedh Aarti",
        description:
          "Check in to riverside heritage palace hotel; evening VIP wooden boat view of the mesmerizing Maha Ganga Aarti with brass incense lamps.",
      },
      {
        day: 2,
        title: "Dawn Rowboat & Ancient Galis (Alleys)",
        description:
          "5:30 AM rowing boat along all 84 ghats from Assi to Manikarnika; guided heritage walk through medieval galis tasting Banarasi kachori and lassi.",
      },
      {
        day: 3,
        title: "Buddhist Sarnath & Silk Weaving Guilds",
        description:
          "Excursion to the Dhamek Stupa in Sarnath where Gautama Buddha gave his first sermon; visit traditional handloom silk cooperatives.",
      },
    ],
    included: [
      "2 nights in boutique heritage haveli by the ghats",
      "2 private boat excursions (sunrise rowing + evening Aarti)",
      "Expert cultural historian guide for all walks",
      "Excursion to Sarnath with entry admissions and breakfast",
    ],
    excluded: [
      "Flights to Varanasi (VNS)",
      "Temple donations and priest rituals",
      "Personal souvenir shopping",
    ],
    highlights: [
      "Sunrise wooden boat journey capturing morning rituals across the sacred ghats",
      "Unobstructed boat viewing of the synchronized evening fire Aarti",
      "Walk in the peaceful footsteps of the Buddha at historic Sarnath",
      "Exclusive access to master weavers of handwoven Banarasi gold-zari sarees",
    ],
    cancellationPolicy: "Free cancellation up to 7 days before departure.",
    isPublished: true,
    featured: true,
    destination: "Varanasi",
    state: "Uttar Pradesh",
    city: "Varanasi",
    country: "India",
    tags: ["varanasi", "uttar pradesh", "spiritual", "cultural", "ganges", "ghats", "sarnath"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "in-tour-12",
    id: "in-tour-12",
    name: "Darjeeling Himalayan Tea & Mountain Tour",
    slug: "darjeeling-himalayan-tea-mountain-tour",
    summary:
      "Sunrise over Mount Kanchenjunga from Tiger Hill, historic Toy Train rides, manicured tea estates, and Buddhist monasteries.",
    description:
      "Perched amidst rolling emerald hills facing the world's third highest mountain peak, Darjeeling is a captivating hill station steeped in tea history. Witness first light strike Kanchenjunga at Tiger Hill, ride the UNESCO-listed Darjeeling Himalayan Toy Train through loops and batasia spirals, and pluck first-flush tea leaves with local estate workers.",
    category: "nature",
    duration: 4,
    maxGroupSize: 10,
    difficulty: "easy",
    price: 470,
    currency: "USD",
    ratingsAverage: 0,
    ratingsQuantity: 0,
    imageCover:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1622308644420-a6162a4fa980?auto=format&fit=crop&w=800&q=80",
    ],
    startLocation: {
      description: "Chowrasta Mall Road, Darjeeling, West Bengal, India",
      coordinates: [88.2663, 27.0410],
      address: "The Mall, Chowrasta, Darjeeling, West Bengal",
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival in Queen of the Hills",
        description:
          "Scenic mountain drive from Bagdogra airport; check in to colonial heritage tea bungalow; evening stroll along Chowrasta Mall.",
      },
      {
        day: 2,
        title: "Tiger Hill Sunrise & Himalayan Railway",
        description:
          "Dawn panorama of Mount Kanchenjunga and Mount Everest from Tiger Hill (8,482 ft); ride the historic steam Toy Train over Batasia Loop.",
      },
      {
        day: 3,
        title: "Happy Valley Tea Estate & Tea Tasting",
        description:
          "Walk through terraced tea bushes, observe orthodox tea processing machinery, and participate in a guided sommelier tea tasting session.",
      },
      {
        day: 4,
        title: "Ghoom Monastery & Himalayan Mountaineering Institute",
        description:
          "Visit 1875 Ghoom Monastery and the Everest expedition museum before transfers to Bagdogra (IXB).",
      },
    ],
    included: [
      "3 nights in colonial heritage tea planter bungalow",
      "UNESCO Darjeeling Himalayan Railway Joyride steam ticket",
      "Full estate tour & professional tea cupping masterclass",
      "All transfers in private mountain jeep with guide",
    ],
    excluded: [
      "Flights to Bagdogra (IXB)",
      "Personal tea purchases",
      "Camera permits inside monasteries",
    ],
    highlights: [
      "Iconic dawn light illuminating Mount Kanchenjunga's 8,586m peaks",
      "Ride the world's most famous narrow-gauge steam Toy Train",
      "Sample rare first-flush Muscatel organic teas at source",
      "Peaceful prayer flag rituals at historic Tibetan Ghoom Monastery",
    ],
    cancellationPolicy: "Free cancellation up to 10 days before departure.",
    isPublished: true,
    featured: true,
    destination: "Darjeeling",
    state: "West Bengal",
    city: "Darjeeling",
    country: "India",
    tags: ["darjeeling", "west bengal", "nature", "tea", "mountains", "himalayas", "kanchenjunga"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
];
