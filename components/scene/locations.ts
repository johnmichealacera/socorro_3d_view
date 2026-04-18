import { LocationData } from "./types";

/**
 * Socorro, Surigao del Norte – real geographic layout
 *
 * The town sits on the EASTERN coast of Bucas Grande Island.
 * The bay (Pacific side) is to the EAST (+X in scene).
 * Inland hills rise to the WEST (−X in scene).
 * Scale: 1 scene unit ≈ 10 m.  Origin = Municipal Hall.
 *
 * Approximate real-world offsets from Municipal Hall
 * (GPS center ≈ 9.621°N 125.967°E):
 *
 *   Church          ~90m W, ~80m N   →  (−9, 0, −8)
 *   Market          ~50m E, ~60m S   →  ( 5, 0,  6)
 *   Port/Pier       ~260m E (shore)  →  (26, 0,  4)
 *   Elementary Sch  ~10m E, ~150m N  →  ( 1, 0,−15)
 *   High School     ~80m E, ~220m S  →  ( 8, 0, 22)
 *   Plaza           ~30m W, ~40m N   →  (−3, 0, −4)
 *   Hospital/RHU    ~20m E, ~90m N   →  ( 2, 0, −9)
 *   SOEMCO          ~40m E, ~90m S   →  ( 4, 0,  9)
 *   Palawan Pawnshop~40m E, ~10m N   →  ( 4, 0, −1)
 *   Sofeco Store    ~50m E, ~15m S   →  ( 5, 0,  1.5)
 *   Sofeco Hardware ~40m E, ~35m S   →  ( 4, 0,  3.5)
 */
export const LOCATIONS: LocationData[] = [
  {
    id: "municipal-hall",
    name: "Municipal Hall",
    description:
      "The seat of local government of Socorro. The Municipal Hall serves as the administrative center for all 22 barangays of the island municipality of Socorro, Surigao del Norte.",
    category: "government",
    position: [8, 15, -4],
    color: "#3B82F6",
    accentColor: "#93C5FD",
  },
  {
    id: "church",
    name: "St. Joseph Parish Church",
    description:
      "The Roman Catholic parish church of Socorro, dedicated to Saint Joseph. This historic stone church has been the spiritual center of the community, its bell tower a landmark visible from the bay.",
    category: "church",
    position: [-3, 10, -4],
    color: "#F97316",
    accentColor: "#FDBA74",
  },
  {
    id: "plaza",
    name: "Poblacion Town Plaza",
    description:
      "The public plaza and park at the heart of Socorro's poblacion. A beloved gathering place for the community, featuring a central gazebo, the Rizal monument, benches under shade trees, and a flagpole for civic ceremonies.",
    category: "plaza",
    position: [3, 10, -4],
    color: "#84CC16",
    accentColor: "#BEF264",
  },
  {
    id: "public-market",
    name: "Poblacion Public Market",
    description:
      "The main commercial market of Socorro where local vendors gather daily. Fresh seafood from the Dinagat Sound, tropical fruits, and local produce fill its stalls every morning.",
    category: "market",
    position: [15, 5, 6],
    color: "#EAB308",
    accentColor: "#FDE047",
  },
  {
    id: "plaza-store-1",
    name: "Sari-Sari Store 1",
    description:
      "A small variety store along the road across from the Poblacion Town Plaza. Sells snacks, drinks, and everyday household essentials for residents of the municipal proper.",
    category: "commercial",
    position: [0, 0, -1],
    color: "#BE185D",
    accentColor: "#FBCFE8",
  },
  {
    id: "plaza-store-2",
    name: "Sari-Sari Store 2",
    description:
      "A small variety store along the road across from the Poblacion Town Plaza. A convenient stop for residents and plaza visitors needing everyday goods.",
    category: "commercial",
    position: [5, 0, -1],
    color: "#9D174D",
    accentColor: "#F9A8D4",
  },
  {
    id: "plaza-carinderia-1",
    name: "Carinderia 1",
    description:
      "A local eatery (carinderia) across from the Poblacion Town Plaza offering affordable Filipino home-cooked meals. A popular lunch spot for municipal workers and plaza visitors.",
    category: "commercial",
    position: [1, 0, 1],
    color: "#B45309",
    accentColor: "#FCD34D",
  },
  {
    id: "plaza-carinderia-2",
    name: "Carinderia 2",
    description:
      "A local eatery (carinderia) across from the Poblacion Town Plaza serving daily specials of Filipino dishes. A go-to spot for a quick and filling meal in the heart of Socorro.",
    category: "commercial",
    position: [5, 0, 1],
    color: "#92400E",
    accentColor: "#FDE68A",
  },
  {
    id: "port",
    name: "Socorro Port & Pier",
    description:
      "The main port connecting Socorro to the rest of Surigao del Norte. Passenger ferries, fishing boats, and cargo vessels dock here daily, making it the economic lifeline of the island municipality.",
    category: "port",
    position: [26, 0, 4],
    color: "#06B6D4",
    accentColor: "#67E8F9",
  },
  {
    id: "elementary-school",
    name: "Socorro Central Elementary School",
    description:
      "The primary public school serving the children of Socorro's poblacion barangays. A DepEd institution dedicated to basic education for the youth of the island municipality.",
    category: "school",
    position: [-22, 5, -12],
    color: "#22C55E",
    accentColor: "#86EFAC",
  },
  {
    id: "high-school",
    name: "Socorro National High School",
    description:
      "The national high school of Socorro offering secondary education. Its campus serves students from all barangays of the municipality who commute or board nearby.",
    category: "school",
    position: [-4, 0, 24],
    color: "#10B981",
    accentColor: "#6EE7B7",
  },
  {
    id: "hospital",
    name: "Socorro Rural Health Unit",
    description:
      "The primary public health facility of Socorro, providing essential medical services to the island community. The Rural Health Unit offers consultations, maternal care, immunizations, and emergency services for all barangays.",
    category: "hospital",
    position: [-35, 5, -12],
    color: "#EF4444",
    accentColor: "#FCA5A5",
  },
  {
    id: "soemco",
    name: "SOEMCO Building",
    description:
      "The administrative office of the Socorro Electric Membership Cooperative (SOEMCO), the rural electric cooperative serving Socorro. Located just in front of the public market, it manages power distribution for the entire island municipality.",
    category: "commercial",
    position: [13, 5, 2],
    color: "#F59E0B",
    accentColor: "#FCD34D",
  },
  {
    id: "palawan-pawnshop",
    name: "Palawan Pawnshop",
    description:
      "A branch of Palawan Pawnshop & Pawnshop Group, one of the Philippines' largest microfinance networks. Provides affordable pawnbroking, remittance, and financial services to Socorro residents at the heart of the municipal proper.",
    category: "commercial",
    position: [-9, 5, 0],
    color: "#0EA5E9",
    accentColor: "#7DD3FC",
  },
  {
    id: "sofeco-store",
    name: "Sofeco Store",
    description:
      "The Socorro Farmers' Cooperative (Sofeco) general store, providing everyday goods and groceries to the community at cooperative prices. A trusted community institution at the heart of the municipal proper.",
    category: "commercial",
    position: [-9, -5, 3],
    color: "#16A34A",
    accentColor: "#86EFAC",
  },
  {
    id: "sofeco-hardware",
    name: "Sofeco Hardware",
    description:
      "The hardware division of the Socorro Farmers' Cooperative, supplying construction materials, tools, and agricultural supplies. Adjacent to the Sofeco Store at the heart of the municipal proper.",
    category: "commercial",
    position: [-6, 0, 0],
    color: "#78350F",
    accentColor: "#D97706",
  },
  {
    id: "crispy-king",
    name: "Crispy King",
    description:
      "A popular local fried chicken and fast food restaurant in Socorro's poblacion, located just south of the Public Market. A favorite stop for residents and visitors craving crispy chicken and affordable meals.",
    category: "commercial",
    position: [17, 0, 9],
    color: "#DC2626",
    accentColor: "#FCA5A5",
  },
  {
    id: "guils-pharmacy",
    name: "Guil's Pharmacy",
    description:
      "A local pharmacy behind C&R Mall serving Socorro's poblacion. Guil's Pharmacy provides prescription medicines, over-the-counter drugs, and basic health supplies to the community.",
    category: "commercial",
    position: [10, 0, 11],
    color: "#0891B2",
    accentColor: "#67E8F9",
  },
  {
    id: "cr-mall",
    name: "C&R Mall",
    description:
      "A small general merchandise store in Socorro's commercial strip, situated across the road from Crispy King. C&R Mall offers everyday goods, clothing, and household supplies to the local community.",
    category: "commercial",
    position: [12, 0, 8],
    color: "#059669",
    accentColor: "#6EE7B7",
  },
  {
    id: "snackan-ni-yojan",
    name: "Snackan ni Yojan",
    description:
      "A beloved local snack stop along the road to Puyangi Beach, run by Yojan. A go-to spot for freshly made local snacks and refreshments for beachgoers and Taruc Pool visitors passing through.",
    category: "commercial",
    position: [12, 0, 18],
    color: "#D97706",
    accentColor: "#FDE68A",
  },
  {
    id: "sonya-store",
    name: "Sonya Store",
    description:
      "A local general merchandise store in Socorro's poblacion, conveniently located just before J&T Express. Sonya Store serves the community with everyday goods and supplies.",
    category: "commercial",
    position: [4, 0, 12],
    color: "#A21CAF",
    accentColor: "#E879F9",
  },
  {
    id: "jnt",
    name: "J&T Express",
    description:
      "A J&T Express courier and delivery hub serving Socorro and Bucas Grande Island. Residents rely on this branch for sending and receiving parcels, packages, and online shopping deliveries across the Philippines.",
    category: "commercial",
    position: [0, 0, 13],
    color: "#F97316",
    accentColor: "#FDBA74",
  },
  {
    id: "bgfc",
    name: "Bucas Grande Foundation College",
    description:
      "A local private college serving the higher education needs of Socorro and the surrounding barangays of Bucas Grande Island. Bucas Grande Foundation College offers undergraduate programs for youth seeking quality education without leaving the island.",
    category: "school",
    position: [0, 0, 16],
    color: "#6366F1",
    accentColor: "#A5B4FC",
  },
  {
    id: "madhouse",
    name: "Madhouse",
    description:
      "A popular local hangout spot in Socorro, located along the road toward Puyangi Beach just past Snackan ni Yojan. A go-to place for locals to unwind and socialize.",
    category: "commercial",
    position: [12, 0, 25],
    color: "#7C3AED",
    accentColor: "#C4B5FD",
  },
  {
    id: "taruc-pool",
    name: "Taruc Swimming Pool",
    description:
      "A popular public swimming pool facility in Socorro, located along the road toward Puyangi Beach. The Taruc Swimming Pool serves as a recreational hub for families and youth, offering a refreshing escape from the tropical heat.",
    category: "recreation",
    position: [0, 0, 40],
    color: "#0EA5E9",
    accentColor: "#7DD3FC",
  },
  {
    id: "puyangi-beach",
    name: "Puyangi White Beach",
    description:
      "The crown jewel of Socorro's tourism, Puyangi White Beach boasts pristine white sand and crystal-clear waters. A beloved beach resort destination on Bucas Grande Island, it attracts visitors from across Surigao del Norte and beyond.",
    category: "beach",
    position: [28, 0, 62],
    color: "#F59E0B",
    accentColor: "#FDE68A",
  },
];

export const CATEGORY_ICONS: Record<LocationData["category"], string> = {
  government: "🏛️",
  market: "🏪",
  port: "⚓",
  school: "🏫",
  church: "⛪",
  plaza: "🌳",
  hospital: "🏥",
  commercial: "🏬",
  recreation: "🏊",
  beach: "🏖️",
};

export const CATEGORY_LABELS: Record<LocationData["category"], string> = {
  government: "Government",
  market: "Commerce",
  port: "Port & Transport",
  school: "Education",
  church: "Religion & Heritage",
  plaza: "Public Space",
  hospital: "Health Services",
  commercial: "Commercial",
  recreation: "Recreation",
  beach: "Beach & Tourism",
};
