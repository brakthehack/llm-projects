// ============================================================
// CONFIG - All constants in one place
// ============================================================
const CFG = {
  // Canvas
  W: 960,
  H: 640,

  // Road geometry
  SEG_LEN: 200,        // world units per segment
  ROAD_W: 2000,        // road width in world units
  RUMBLE_LEN: 3,       // segments per rumble stripe cycle

  // Camera
  FOV: Math.PI / 3,
  CAM_DEPTH: null,     // computed below
  CAM_H: 1500,         // camera height above road center

  // Rendering
  DRAW_DIST: 150,      // segments to draw

  // Physics
  MAX_SPEED: 14000,
  MIN_SPEED: 2500,
  ACCEL_RATE: 9000,
  BRAKE_RATE: -18000,
  DECEL_RATE: -5000,
  OFF_ROAD_DECEL: -12000,
  OFF_ROAD_MAX: 2500,
  STEER_SPEED: 3.0,
  CENTRIFUGAL: 0.3,

  // Track
  TRACK_DURATION: 60,              // base seconds per track
  DURATION_SCALE_PER_TRACK: 1.15, // multiplier applied per difficulty level
};

// Compute derived values
CFG.CAM_DEPTH = 1 / Math.tan(CFG.FOV / 2);
