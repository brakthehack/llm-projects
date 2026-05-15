// ============================================================
// PROJECTION - 3D to 2D screen projection (pure functions)
// ============================================================

/**
 * Transform a world-space point into camera-relative coordinates.
 * Returns a new object; does not mutate the input.
 */
function transformToCamera(p, camX, camY, camZ) {
  return {
    cx: p.wx - camX,
    cy: p.wy - camY,
    cz: p.wz - camZ,
  };
}

/**
 * Check whether a camera-relative point is behind or at the camera plane.
 */
function isBehindCamera(cz) {
  return cz <= 0.01;
}

/**
 * Project a camera-relative point onto the 2D screen.
 * Returns a new projected object; does not mutate the input.
 */
function projectToScreen(camPoint) {
  const scale = CFG.CAM_DEPTH / camPoint.cz;
  return {
    scale: scale,
    sx: Math.round(CFG.W / 2 + scale * camPoint.cx * CFG.W / 2),
    sy: Math.round(CFG.H / 2 - scale * camPoint.cy * CFG.H / 2),
    sw: Math.round(scale * CFG.ROAD_W / 2 * CFG.W / 2),
  };
}

/**
 * Full projection pipeline for a single world-space point.
 * Returns a new projected object or null if behind the camera.
 */
function project(p, camX, camY, camZ) {
  const cam = transformToCamera(p, camX, camY, camZ);
  if (isBehindCamera(cam.cz)) {
    return null;
  }
  return projectToScreen(cam);
}

/**
 * Find the segment index for a given world Z position.
 */
function findSeg(z) {
  return segments[Math.floor(z / CFG.SEG_LEN) % segments.length];
}
