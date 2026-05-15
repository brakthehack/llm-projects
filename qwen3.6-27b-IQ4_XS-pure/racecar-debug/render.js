// ============================================================
// RENDERING - All drawing functions
// ============================================================

const COLORS = {
  SKY_TOP: '#0a1628', SKY_HORIZON: '#4a90d9',
  GRASS_L: '#10aa10', GRASS_D: '#009a00',
  ROAD_L: '#6b6b6b', ROAD_D: '#696969',
  RUMBLE_R: '#cc0000', RUMBLE_W: '#ffffff',
  LANE: '#cccccc',
};

/**
 * Draw a filled quadrilateral (trapezoid) on the canvas.
 */
function poly(ctx, x1, y1, w1, x2, y2, w2, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1 - w1, y1);
  ctx.lineTo(x1 + w1, y1);
  ctx.lineTo(x2 + w2, y2);
  ctx.lineTo(x2 - w2, y2);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw the sky: gradient from dark top through horizon to ground color.
 */
function drawSky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.H);
  g.addColorStop(0, COLORS.SKY_TOP);
  g.addColorStop(0.5, COLORS.SKY_HORIZON);
  g.addColorStop(1.0, '#2a7a2a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  // Sun
  const sx = CFG.W * 0.78, sy = CFG.H * 0.1;
  ctx.fillStyle = 'rgba(255,224,100,0.15)';
  ctx.beginPath(); ctx.arc(sx, sy, 60, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe87c';
  ctx.beginPath(); ctx.arc(sx, sy, 25, 0, Math.PI * 2); ctx.fill();
}

/**
 * Draw a single road segment given its two projected endpoints.
 * Each endpoint is { sx, sy, sw } from project().
 */
function drawSegment(ctx, seg, p1, p2) {
  const dark = seg.dark;

  // Grass (full canvas width on both sides of road)
  poly(ctx, CFG.W / 2, p2.sy, CFG.W / 2, CFG.W / 2, p1.sy, CFG.W / 2, dark ? COLORS.GRASS_D : COLORS.GRASS_L);

  // Rumble strips
  const rw1 = p1.sw * 1.15, rw2 = p2.sw * 1.15;
  poly(ctx, p1.sx, p1.sy, rw1, p2.sx, p2.sy, rw2, dark ? COLORS.RUMBLE_W : COLORS.RUMBLE_R);

  // Road surface
  poly(ctx, p1.sx, p1.sy, p1.sw, p2.sx, p2.sy, p2.sw, dark ? COLORS.ROAD_D : COLORS.ROAD_L);

  // Lane markings
  if (!dark) {
    const lw1 = Math.max(1, p1.sw * 0.015), lw2 = Math.max(1, p2.sw * 0.015);
    const lo1 = p1.sw * 0.33, lo2 = p2.sw * 0.33;
    poly(ctx, p1.sx - lo1, p1.sy, lw1, p2.sx - lo2, p2.sy, lw2, COLORS.LANE);
    poly(ctx, p1.sx + lo1, p1.sy, lw1, p2.sx + lo2, p2.sy, lw2, COLORS.LANE);
  } else {
    const cw1 = Math.max(1, p1.sw * 0.01), cw2 = Math.max(1, p2.sw * 0.01);
    poly(ctx, p1.sx, p1.sy, cw1, p2.sx, p2.sy, cw2, '#ffff00');
  }
}


/**
 * Draw a third-person rear-view car sprite, centered at screen-bottom.
 * @param {CanvasRenderingContext2D} ctx - canvas context
 * @param {number} rotation - steering angle in radians (positive = right)
 */
function drawCar(ctx, rotation) {
  const cx = CFG.W / 2;
  const cy = CFG.H - 60;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Car body (wider for proper third-person rear view)
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(-40, -25, 80, 50);

  // Rear bumper detail
  ctx.fillStyle = '#990000';
  ctx.fillRect(-36, 15, 72, 8);

  // Windshield (front of car, smaller since it's the far side)
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(-30, -25, 60, 12);

  // Rear lights
  ctx.fillStyle = '#ff3300';
  ctx.fillRect(-38, 18, 10, 5);
  ctx.fillRect(28, 18, 10, 5);

  // Wheels (left and right)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-46, -20, 6, 14);
  ctx.fillRect(40, -20, 6, 14);
  ctx.fillRect(-46, 8, 6, 14);
  ctx.fillRect(40, 8, 6, 14);

  ctx.restore();
}

/**
 * Draw the minimap: curved track outline and current position dot.
 * @param {Array} segments  - track segment array
 * @param {number} cameraZ  - current camera Z position along track
 * @param {number} playerX  - lateral offset of the player (road-width units)
 * @param {CanvasRenderingContext2D} ctxMini - minimap canvas context
 */
function drawMinimap(segments, cameraZ, playerX, ctxMini) {
  const mw = 120, mh = 120;
  ctxMini.clearRect(0, 0, mw, mh);

  // Background
  ctxMini.fillStyle = 'rgba(30, 60, 30, 0.8)';
  ctxMini.fillRect(0, 0, mw, mh);

  if (segments.length === 0) return;

  // Total track length in world units
  const trackLen = segments.length * CFG.SEG_LEN;

  const pad = 15;
  const drawH = mh - 2 * pad;

  // Compute min/max cumX for normalization
  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < segments.length; i++) {
    const cx = segments[i].cumX || 0;
    if (cx < minX) minX = cx;
    if (cx > maxX) maxX = cx;
  }
  const rangeX = (maxX - minX) || 1;

  // Sample every Nth segment for performance
  const step = Math.max(1, Math.floor(segments.length / (drawH * 2)));

  // Draw the track as a curved line
  ctxMini.strokeStyle = '#888';
  ctxMini.lineWidth = 3;
  ctxMini.beginPath();
  for (let i = 0; i < segments.length; i += step) {
    const cx = segments[i].cumX || 0;
    const normX = pad + ((cx - minX) / rangeX) * (mw - 2 * pad);
    const y = pad + (i / segments.length) * drawH;
    if (i === 0) {
      ctxMini.moveTo(normX, y);
    } else {
      ctxMini.lineTo(normX, y);
    }
  }
  // Ensure we draw to the end
  const lastIdx = segments.length - 1;
  const lastCx = segments[lastIdx].cumX || 0;
  const lastNormX = pad + ((lastCx - minX) / rangeX) * (mw - 2 * pad);
  ctxMini.lineTo(lastNormX, mh - pad);
  ctxMini.stroke();

  // Current position dot (longitudinal + lateral offset)
  const progress = Math.min(cameraZ / trackLen, 1.0);
  const dotY = pad + progress * drawH;

  // Compute player's lateral position on minimap
  const segIdx = Math.floor(cameraZ / CFG.SEG_LEN) % segments.length;
  const baseCx = segments[segIdx].cumX || 0;
  const playerOffset = playerX * rangeX * 0.5;
  const dotCx = baseCx + playerOffset;
  const dotNormX = pad + ((dotCx - minX) / rangeX) * (mw - 2 * pad);

  ctxMini.fillStyle = '#ff3300';
  ctxMini.beginPath();
  ctxMini.arc(dotNormX, dotY, 5, 0, Math.PI * 2);
  ctxMini.fill();
}

/**
 * Render a complete scene from far to near.
 * @param {Array} segments  - array of track segment objects
 * @param {number} playerX  - lateral offset of the player (in road-width units)
 * @param {number} cameraY  - camera height above road center
 * @param {number} cameraZ  - camera position along the track (world Z)
 * @param {number} carRotation - steering angle in radians for car sprite rotation
 * @param {CanvasRenderingContext2D} ctx - canvas context
 */
function renderScene(segments, playerX, cameraY, cameraZ, carRotation, ctx) {
  // Clear canvas
  ctx.clearRect(0, 0, CFG.W, CFG.H);

  // Draw sky + ground gradient (covers full canvas behind road)
  drawSky(ctx);

  if (segments.length === 0) return;

  // Camera position in world space
  const camX = playerX * CFG.ROAD_W;
  const camY = cameraY;
  const camZ = cameraZ || 0;
  // Determine which segment the camera is on (base index)
  const baseSegmentIndex = Math.floor((cameraZ || 0) / CFG.SEG_LEN) % segments.length;


  // Determine the cumulative curve at the camera's position.
  const baseCumX = segments[baseSegmentIndex].cumX || 0;

  // Clamp draw distance so we don't read past the end of the track
  const maxDrawDist = segments.length - baseSegmentIndex;
  const drawDist = Math.min(CFG.DRAW_DIST, maxDrawDist);

  // Render from far to near (painter's algorithm)
  for (let n = drawDist - 1; n >= 0; n--) {
    const segIndex = (baseSegmentIndex + n) % segments.length;
    const seg = segments[segIndex];

    // Curve offset: difference in cumulative curves, scaled down so the road stays on-screen.
    // Raw cumX grows to ~3300 over the track; multiplied by SEG_LEN (200) that's 660,000 units,
    // which projects far off-screen during turns. The render scale factor keeps visible curvature
    // while bounding max screen offset to ~236px (half-width is 480px).
    const RENDER_SCALE = 0.075;
    const nearOffset = (seg.cumX - baseCumX) * CFG.SEG_LEN * RENDER_SCALE;
    const farOffset = (seg.cumX + seg.curve - baseCumX) * CFG.SEG_LEN * RENDER_SCALE;

    const p1 = project(seg.p1, camX - nearOffset, camY, camZ);
    const p2 = project(seg.p2, camX - farOffset, camY, camZ);

    if (!p1 || !p2) continue;

    drawSegment(ctx, seg, p1, p2);
  }
  // Draw third-person car sprite with rotation
  drawCar(ctx, carRotation || 0);
}
