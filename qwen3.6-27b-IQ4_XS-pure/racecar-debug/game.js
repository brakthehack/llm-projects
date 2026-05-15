// ============================================================
// GAME - Animation loop with physics, input, and game states
// ============================================================

let cameraZ = 0;                     // current position along track
let playerX = 0;                     // lateral position (road-width units)
let speed = 0;                       // current speed in units/s
let lastFrameTime = null;            // previous frame timestamp
let animationRunning = false;        // guard against multiple starts
let gameRunning = false;             // true while race is active
let gameStartTime = 0;               // performance.now() when race started
let elapsedTime = 0;                 // elapsed seconds since start
let carRotation = 0;                 // car sprite rotation angle in radians
let carBank = 0;                      // visual lean into turns (radians)

// Keyboard state map
const keysDown = {};

/**
 * Initialize the game: set up canvas, wire input handlers.
 */
function init() {
  const canvas = document.getElementById('gameCanvas');
  canvas.width = CFG.W;
  canvas.height = CFG.H;

  // Wire keyboard input
  document.addEventListener('keydown', (e) => {
    keysDown[e.code] = true;
  });
  document.addEventListener('keyup', (e) => {
    keysDown[e.code] = false;
  });

  // Wire start button
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }
}

/**
 * Start a new game: generate track, reset state, begin animation.
 */
function startGame() {
  // Generate a ~60s track: at average ~10000 units/s → 600000 units → 3000 segments
  const numSegments = Math.ceil(CFG.TRACK_DURATION * CFG.MAX_SPEED * 0.7 / CFG.SEG_LEN);
  generateCurvedTrack(numSegments);

  // Reset game state
  cameraZ = 0;
  playerX = 0;
  speed = 0;
  lastFrameTime = null;
  gameStartTime = 0;
  elapsedTime = 0;
  carRotation = 0;

  carBank = 0;
  animationRunning = true;
  gameRunning = true;

  // Hide overlay
  document.getElementById('overlay').classList.add('hidden');

  // Clear off-road indicator
  const offroadEl = document.getElementById('offroad-indicator');
  if (offroadEl) offroadEl.classList.add('hidden');

  requestAnimationFrame(render);
}

/**
 * Show game-over overlay with the given title and message.
 */
function showGameOver(title, message) {
  gameRunning = false;
  animationRunning = false;

  const overlay = document.getElementById('overlay');
  overlay.querySelector('h1').textContent = title;
  overlay.querySelector('p').textContent = message;

  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.textContent = 'RESTART';
  }

  overlay.classList.remove('hidden');
}

/**
 * Update game state: physics, input, position.
 * @param {number} dt - delta time in seconds since last frame
 */
function update(dt) {
  if (!gameRunning) return;

  // Track elapsed time
  elapsedTime += dt;

  // --- Acceleration / Braking ---
  const up = keysDown['ArrowUp'] || keysDown['KeyW'];
  const down = keysDown['ArrowDown'] || keysDown['KeyS'];
  const left = keysDown['ArrowLeft'] || keysDown['KeyA'];
  const right = keysDown['ArrowRight'] || keysDown['KeyD'];

  if (up && speed < CFG.MAX_SPEED) {
    speed += CFG.ACCEL_RATE * dt;
  } else if (down && speed > 0) {
    speed += CFG.BRAKE_RATE * dt;
  } else if (!up && !down && speed > 0) {
    speed += CFG.DECEL_RATE * dt;
  }

  // --- Off-road penalty ---
  const offRoad = Math.abs(playerX) > 1.0;
  if (offRoad) {
    speed += CFG.OFF_ROAD_DECEL * dt;
    speed = Math.min(speed, CFG.OFF_ROAD_MAX);
  }

  // Clamp speed to [0, MAX_SPEED]
  speed = Math.max(0, Math.min(speed, CFG.MAX_SPEED));

  // --- Steering ---
  if (left) {
    playerX -= CFG.STEER_SPEED * dt;
  }
  if (right) {
    playerX += CFG.STEER_SPEED * dt;
  }

  // --- Centrifugal force (quadratic speed dependence) ---
  const currentSeg = findSeg(cameraZ);
  if (currentSeg && speed > 0) {
    playerX += currentSeg.curve * CFG.CENTRIFUGAL * (speed / CFG.MAX_SPEED) ** 2 * dt;
  }

  // --- Car banking: lean into turns proportional to curve * speed^2 ---
  if (currentSeg && speed > 0) {
    const speedRatio = speed / CFG.MAX_SPEED;
    const targetBank = -currentSeg.curve * 0.0325 * speedRatio ** 2;
    carBank += (targetBank - carBank) * Math.min(1, dt * 10);
  } else {
    carBank *= Math.max(0, 1 - dt * 8);
  }
  const steeringOffset = left ? -0.08 : right ? 0.08 : 0;
  carRotation = carBank + steeringOffset;

  // --- Advance camera ---
  cameraZ += speed * dt;

  // --- Check game-over conditions ---
  const maxZ = segments.length * CFG.SEG_LEN;

  // Win: completed the track (check before crash)
  if (cameraZ >= maxZ) {
    cameraZ = maxZ;
    speed = 0;
    showGameOver('FINISHED!', `Track completed in ${elapsedTime.toFixed(1)}s!`);
    return;
  }

  // Crash: drove too far off road
  if (Math.abs(playerX) > 2.0) {
    showGameOver('CRASHED!', `You drove off the road after ${elapsedTime.toFixed(1)}s.`);
    return;
  }
}

/**
 * Update HUD elements from current game state.
 */
function updateHUD() {
  const maxZ = segments.length * CFG.SEG_LEN;
  const progress = maxZ > 0 ? Math.min(cameraZ / maxZ, 1.0) : 0;

  // Speed display (map to km/h)
  const speedKmh = Math.round(speed / CFG.MAX_SPEED * 300);
  document.getElementById('speed-display').textContent = `Speed: ${speedKmh} km/h`;

  // Time display
  const mins = Math.floor(elapsedTime / 60);
  const secs = Math.floor(elapsedTime % 60);
  document.getElementById('time-display').textContent =
    `Time: ${mins}:${secs.toString().padStart(2, '0')}`;

  // Progress display
  document.getElementById('progress-display').textContent =
    `Progress: ${Math.round(progress * 100)}%`;

  // Speed bar
  const speedBar = document.getElementById('speed-bar');
  if (speedBar) {
    speedBar.style.height = `${(speed / CFG.MAX_SPEED) * 100}%`;
  }

  // Off-road indicator
  const offroadEl = document.getElementById('offroad-indicator');
  if (offroadEl) {
    if (Math.abs(playerX) > 1.0) {
      offroadEl.classList.remove('hidden');
    } else {
      offroadEl.classList.add('hidden');
    }
  }
}

/**
 * Render a single frame: road, car, minimap, HUD.
 * @param {number} timestamp - performance.now() timestamp in ms
 */
function render(timestamp) {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const miniCanvas = document.getElementById('minimap');
  const ctxMini = miniCanvas.getContext('2d');

  // Compute delta time and update physics (only while animating)
  if (lastFrameTime !== null && animationRunning) {
    const dt = (timestamp - lastFrameTime) / 1000;
    update(Math.min(dt, 0.1));  // clamp dt to avoid spiral of death
  }
  lastFrameTime = timestamp;

  // Render the scene with current camera position, player offset, and car rotation
  renderScene(segments, playerX, CFG.CAM_H, cameraZ, carRotation, ctx);

  // Draw minimap
  drawMinimap(segments, cameraZ, playerX, ctxMini);

  // Update HUD
  updateHUD();

  // Request next frame while animation is still running
  if (animationRunning) {
    requestAnimationFrame(render);
  }
}

// Boot
init();
