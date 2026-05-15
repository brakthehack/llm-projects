// ============================================================
// TRACK GENERATION - Procedural curved track
// ============================================================

let segments = [];

/**
 * Append a single segment to the segments array.
 * @param {number} curve  - lateral curvature (0 = straight)
 * @param {number} y1     - world Y of the near endpoint
 * @param {number} y2     - world Y of the far endpoint
 * @param {number} cumX   - cumulative lateral offset for minimap
 */
function addSeg(curve, y1, y2, cumX) {
  const n = segments.length;
  segments.push({
    idx: n,
    curve: curve,
    cumX: cumX || 0,
    sprites: [],
    dark: Math.floor(n / CFG.RUMBLE_LEN) % 2 === 0,
    p1: { wx: 0, wy: y1, wz: n * CFG.SEG_LEN },
    p2: { wx: 0, wy: y2, wz: (n + 1) * CFG.SEG_LEN },
  });
}

/**
 * Generate a flat, straight track with the given number of segments.
 * Kept for backward compatibility with tests.
 */
function generateStraightTrack(numSegments) {
  segments = [];
  for (let i = 0; i < numSegments; i++) {
    addSeg(0, 0, 0, 0);
  }
}

/**
 * Generate a procedurally curved track.
 *
 * Curve is computed from layered sine waves with an intensity envelope:
 *   - Gentle start and end, more intense in the middle
 *   - Multiple frequency layers for varied turn patterns
 *   - Smooth transitions (no discontinuities)
 *
 * @param {number} numSegments - number of segments to generate
 */
function generateCurvedTrack(numSegments) {
  segments = [];

  // Layered sine wave parameters: [amplitude, frequency, phase]
  const layers = [
    [3.0, 0.7,   0.0],
    [1.5, 2.3,   1.2],
    [0.8, 5.1,   2.7],
    [0.4, 9.7,   0.5],
  ];

  // Maximum envelope amplitude
  const MAX_AMPLITUDE = 4.0;

  let cumX = 0;

  for (let i = 0; i < numSegments; i++) {
    // Intensity envelope: sin(pi * i / N) — gentle start/end, intense middle
    const envelope = Math.sin(Math.PI * i / numSegments);

    // Compute curve from layered sine waves
    let curve = 0;
    for (let k = 0; k < layers.length; k++) {
      const [amp, freq, phase] = layers[k];
      curve += amp * Math.sin(2 * Math.PI * freq * i / numSegments + phase);
    }

    // Scale by envelope and clamp to max amplitude
    curve *= envelope;
    curve = Math.max(-MAX_AMPLITUDE, Math.min(MAX_AMPLITUDE, curve));

    // Accumulate lateral offset for minimap rendering
    cumX += curve;

    addSeg(curve, 0, 0, cumX);
  }
}
