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
    position: [8, 0, 22],
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
};
