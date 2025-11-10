export const mockRoutes = [
  {
    id: 1,
    name: "Solapur Central",
    // Route path with adjusted shifts
    routePath: [
      { lat: 17.669, lng: 75.8940 },  // Start (-0.0009 longitude = 100m west)
      { lat: 17.668, lng: 75.89375 }, // Point between start and midway (adjusted)
      { lat: 17.667, lng: 75.89345 }, // Midway (-0.00045 longitude = 50m west)
      { lat: 17.666, lng: 75.89345 }, // Point between midway and end (adjusted)
      { lat: 17.665, lng: 75.89345 }  // End (-0.00045 longitude = 50m west)
    ],
    // Checkpoints with shifts
    checkpoints: [
      { lat: 17.669, lng: 75.8940, name: "Route Start" },   // -0.0009 (100m west)
      { lat: 17.667, lng: 75.89345, name: "MidWay" },       // -0.00045 (50m west)
      { lat: 17.665, lng: 75.89345, name: "Route End" },    // -0.00045 (50m west)
    ],
    // Geofence adjusted to surround the shifted path
    geofence: [
      // Left side of corridor (heading south)
      { lat: 17.669, lng: 75.8930 },  // Start - west (adjusted)
      { lat: 17.667, lng: 75.89245 }, // Middle - west (adjusted)
      { lat: 17.665, lng: 75.89245 }, // End - west (adjusted)
      // Right side of corridor (in reverse - heading north)
      { lat: 17.665, lng: 75.89445 }, // End - east (adjusted)
      { lat: 17.667, lng: 75.89445 }, // Middle - east (adjusted)
      { lat: 17.669, lng: 75.8950 },  // Start - east (adjusted)
    ],
    routeLength: 0.5, // 0.5 km
    progress: 0.4,    // 40% complete
  },
];

export const mockAttendanceData = [
  { date: "2025-06-21", verified: 24, pending: 3, total: 27 },
  { date: "2025-06-20", verified: 26, pending: 2, total: 28 },
  { date: "2025-06-19", verified: 25, pending: 2, total: 27 },
  { date: "2025-06-18", verified: 22, pending: 5, total: 27 },
  { date: "2025-06-17", verified: 26, pending: 1, total: 27 },
  { date: "2025-06-16", verified: 24, pending: 3, total: 27 },
  { date: "2025-06-15", verified: 25, pending: 2, total: 27 },
];

export const mockSweeperList = [
  {
    id: 1,
    name: "Rajesh Kumar",
    zone: "Central",
    status: "active",
    today: "present",
    verifications: 3,
  },
  {
    id: 2,
    name: "Navneet Singh",
    zone: "North",
    status: "inactive",
    today: "absent",
    verifications: 0,
  },
  {
    id: 3,
    name: "Amit Patil",
    zone: "East",
    status: "active",
    today: "present",
    verifications: 5,
  },
  {
    id: 4,
    name: "Sunit Jadhav",
    zone: "West",
    status: "active",
    today: "present",
    verifications: 2,
  },
  {
    id: 5,
    name: "Ravi Sharma",
    zone: "South",
    status: "active",
    today: "present",
    verifications: 4,
  },
];