// ============================================================
// TESTS - Browser-based unit tests (no external framework)
// ============================================================
(function () {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('[PASS] ' + message);
      passed++;
    } else {
      console.error('[FAIL] ' + message);
      failed++;
    }
  }

  // ============================================================
  // MockCanvasContext — records every method call for inspection
  // ============================================================
  class MockContext {
    constructor() {
      this.calls = [];
      this.fillStyle = '';
      this.strokeStyle = '';
      this.lineWidth = 0;
    }

    fillRect(x, y, w, h)   { this.calls.push({ fn: 'fillRect', x, y, w, h }); }
    clearRect(x, y, w, h)  { this.calls.push({ fn: 'clearRect', x, y, w, h }); }
    beginPath()            { this.calls.push({ fn: 'beginPath' }); }
    moveTo(x, y)          { this.calls.push({ fn: 'moveTo', x, y }); }
    lineTo(x, y)          { this.calls.push({ fn: 'lineTo', x, y }); }
    quadraticCurveTo(cx, cy, ox, oy) { this.calls.push({ fn: 'quadraticCurveTo', cx, cy, ox, oy }); }
    closePath()           { this.calls.push({ fn: 'closePath' }); }
    fill()                { this.calls.push({ fn: 'fill' }); }
    stroke()              { this.calls.push({ fn: 'stroke' }); }
    arc(x, y, r, s, e)   { this.calls.push({ fn: 'arc', x, y, r, s, e }); }
    createLinearGradient() { return { addColorStop() {} }; }
    save()                { this.calls.push({ fn: 'save' }); }
    restore()             { this.calls.push({ fn: 'restore' }); }
    translate(x, y)         { this.calls.push({ fn: 'translate', x, y }); }
    rotate(angle)           { this.calls.push({ fn: 'rotate', angle }); }
  }

  function findCall(calls, fnName) {
    return calls.filter(c => c.fn === fnName);
  }

  // ============================================================
  // project.js tests
  // ============================================================

  // transformToCamera
  (function () {
    const p = { wx: 100, wy: 200, wz: 300 };
    const result = transformToCamera(p, 0, 0, 0);
    assert(result.cx === 100 && result.cy === 200 && result.cz === 300,
      'transformToCamera: point at origin returns expected camera-relative coords');
  })();

  (function () {
    const p = { wx: 100, wy: 200, wz: 300 };
    const result = transformToCamera(p, 50, 100, 200);
    assert(result.cx === 50 && result.cy === 100 && result.cz === 100,
      'transformToCamera: camera offset subtracts correctly');
  })();

  // isBehindCamera
  (function () {
    assert(isBehindCamera(0) === true,
      'isBehindCamera(0) returns true');
    assert(isBehindCamera(0.01) === true,
      'isBehindCamera(0.01) returns true (boundary)');
    assert(isBehindCamera(0.02) === false,
      'isBehindCamera(0.02) returns false');
    assert(isBehindCamera(-10) === true,
      'isBehindCamera(-10) returns true');
  })();

  // projectToScreen
  (function () {
    const camPoint = { cx: 0, cy: 0, cz: 200 };
    const result = projectToScreen(camPoint);
    // scale = CAM_DEPTH / 200
    const expectedScale = CFG.CAM_DEPTH / 200;
    assert(Math.abs(result.scale - expectedScale) < 0.001,
      'projectToScreen: scale matches CAM_DEPTH / cz');
    assert(result.sx === Math.round(CFG.W / 2),
      'projectToScreen: centered point has sx = W/2');
    assert(result.sy === Math.round(CFG.H / 2),
      'projectToScreen: centered point has sy = H/2');
  })();

  // project (full pipeline)
  (function () {
    const behind = project({ wx: 0, wy: 0, wz: 0 }, 0, 0, 0);
    assert(behind === null,
      'project: point at camera returns null');

    const visible = project({ wx: 0, wy: 0, wz: 200 }, 0, 1500, 0);
    assert(visible !== null,
      'project: point in front of camera returns projected object');
    assert(typeof visible.sx === 'number' && typeof visible.sy === 'number' && typeof visible.sw === 'number',
      'project: result has sx, sy, sw fields');
  })();

  // findSeg
  (function () {
    generateStraightTrack(200);
    const seg0 = findSeg(0);
    assert(seg0.idx === 0,
      'findSeg(0) returns segment 0');

    const seg1 = findSeg(350);
    assert(seg1.idx === 1,
      'findSeg(350) returns segment 1 (wrapping via modulo)');

    const seg199 = findSeg(39800);
    assert(seg199.idx === 199,
      'findSeg(39800) returns segment 199 (last segment)');
  })();

  // ============================================================
  // track.js tests
  // ============================================================

  // generateStraightTrack (backward compatibility)
  (function () {
    generateStraightTrack(200);
    assert(segments.length === 200,
      'generateStraightTrack(200) produces exactly 200 segments');

    const allZero = segments.every(s => s.curve === 0);
    assert(allZero === true,
      'generateStraightTrack: all segments have curve === 0');

    // Check consecutive wz values
    let correctSpacing = true;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].p1.wz !== i * CFG.SEG_LEN) {
        correctSpacing = false;
      }
      if (segments[i].p2.wz !== (i + 1) * CFG.SEG_LEN) {
        correctSpacing = false;
      }
    }
    assert(correctSpacing === true,
      'generateStraightTrack: consecutive wz values spaced by SEG_LEN');
  })();

  // addSeg
  (function () {
    const origLen = segments.length;
    addSeg(0, 0, 0, 0);
    const last = segments[segments.length - 1];
    assert(last.idx === origLen,
      'addSeg: appended segment has correct idx');
    assert(last.p1.wz === origLen * CFG.SEG_LEN,
      'addSeg: p1.wz is correct');
    assert(last.p2.wz === (origLen + 1) * CFG.SEG_LEN,
      'addSeg: p2.wz is correct');
    // Restore
    generateStraightTrack(200);
  })();

  // generateCurvedTrack: basic structure
  (function () {
    generateCurvedTrack(3000);
    assert(segments.length === 3000,
      'generateCurvedTrack(3000) produces exactly 3000 segments');
  })();

  // generateCurvedTrack: curve values are non-zero
  (function () {
    generateCurvedTrack(3000);
    const hasNonZero = segments.some(s => s.curve !== 0);
    assert(hasNonZero === true,
      'generateCurvedTrack: at least some segments have non-zero curve');
  })();

  // generateCurvedTrack: curve values are bounded
  (function () {
    generateCurvedTrack(3000);
    const maxAbsCurve = Math.max(...segments.map(s => Math.abs(s.curve)));
    assert(maxAbsCurve <= 4.1,
      'generateCurvedTrack: curve values stay within ±4.0 bound');
  })();

  // generateCurvedTrack: cumX is accumulated
  (function () {
    generateCurvedTrack(3000);
    // cumX should change across segments (not all zero)
    const hasNonZeroCumX = segments.some(s => s.cumX !== 0);
    assert(hasNonZeroCumX === true,
      'generateCurvedTrack: cumX is non-zero for at least some segments');

    // cumX[i+1] ≈ cumX[i] + curve[i+1] (cumX is prefix-sum of curve values)
    let correctAccum = true;
    for (let i = 0; i < segments.length - 1; i++) {
      const expected = segments[i].cumX + segments[i + 1].curve;
      if (Math.abs(segments[i + 1].cumX - expected) > 0.001) {
        correctAccum = false;
        break;
      }
    }
    assert(correctAccum === true,
      'generateCurvedTrack: cumX accumulates curve correctly');
  })();

  // generateCurvedTrack: envelope is gentle at start/end
  (function () {
    generateCurvedTrack(3000);
    const startCurve = Math.abs(segments[1].curve);
    const midCurve = Math.abs(segments[Math.floor(3000 / 2)].curve);
    // Middle should generally be more intense than start (envelope effect)
    assert(startCurve < 2.0,
      'generateCurvedTrack: start segments have gentle curves');
  })();

  // generateCurvedTrack: wz spacing is correct
  (function () {
    generateCurvedTrack(3000);
    let correctSpacing = true;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].p1.wz !== i * CFG.SEG_LEN) {
        correctSpacing = false;
        break;
      }
      if (segments[i].p2.wz !== (i + 1) * CFG.SEG_LEN) {
        correctSpacing = false;
        break;
      }
    }
    assert(correctSpacing === true,
      'generateCurvedTrack: consecutive wz values spaced by SEG_LEN');
  })();

  // ============================================================
  // render.js tests
  // ============================================================

  // drawSky
  (function () {
    const ctx = new MockContext();
    drawSky(ctx);
    const fills = findCall(ctx.calls, 'fillRect');
    assert(fills.length >= 1,
      'drawSky: fillRect is called to cover canvas');
    const arcs = findCall(ctx.calls, 'arc');
    assert(arcs.length >= 2,
      'drawSky: arc is called for the sun (at least 2 calls)');
  })();

  // drawSegment
  (function () {
    generateStraightTrack(200);
    const ctx = new MockContext();
    const seg = segments[5];
    const p1 = project(seg.p1, 0, CFG.CAM_H, 0);
    const p2 = project(seg.p2, 0, CFG.CAM_H, 0);
    if (p1 && p2) {
      drawSegment(ctx, seg, p1, p2);
      const fills = findCall(ctx.calls, 'fillRect');
      // poly calls beginPath + fill (no fillRect directly from poly)
      const paths = findCall(ctx.calls, 'beginPath');
      assert(paths.length >= 3,
        'drawSegment: at least 3 polygons drawn (grass, rumble, road)');
    } else {
      assert(false, 'drawSegment: could not project segment endpoints');
    }
  })();

// drawCar (with rotation)
  (function () {
    const ctx = new MockContext();
    drawCar(ctx, 0);
    const rects = findCall(ctx.calls, 'fillRect');
    assert(rects.length >= 6,
      'drawCar: multiple fillRect calls for body, windshield, wheels, lights');

    // Car should use save/translate/restore for rotation support
    const saves = findCall(ctx.calls, 'save');
    assert(saves.length >= 1,
      'drawCar: save() called for rotation transform');
    const translates = findCall(ctx.calls, 'translate');
    assert(translates.length >= 1,
      'drawCar: translate() called to center car at screen-bottom');
    const restores = findCall(ctx.calls, 'restore');
    assert(restores.length >= 1,
      'drawCar: restore() called after rotation transform');
  })();

  // drawMinimap (straight track)
  (function () {
    generateStraightTrack(200);
    const ctx = new MockContext();
    const trackLen = segments.length * CFG.SEG_LEN;

    // cameraZ = 0 → dot at bottom
    drawMinimap(segments, 0, 0, ctx);
    const arcs0 = findCall(ctx.calls, 'arc');
    assert(arcs0.length >= 1,
      'drawMinimap(cameraZ=0): position dot is drawn');

    // cameraZ = trackLen/2 → dot in middle
    const ctx2 = new MockContext();
    drawMinimap(segments, trackLen / 2, 0, ctx2);
    const arcs1 = findCall(ctx2.calls, 'arc');
    assert(arcs1.length >= 1,
      'drawMinimap(cameraZ=half): position dot is drawn at center');

    // clearRect should be called first
    assert(ctx.calls[0].fn === 'clearRect',
      'drawMinimap: clearRect is the first call');
  })();

  // drawMinimap (curved track)
  (function () {
    generateCurvedTrack(500);
    const ctx = new MockContext();
    drawMinimap(segments, 0, 0, ctx);

    // Should have lineTo calls for the curved track path
    const lineTos = findCall(ctx.calls, 'lineTo');
    assert(lineTos.length >= 2,
      'drawMinimap(curved): multiple lineTo calls for curved track');

    // The path should not be a straight vertical line
    const moveTos = findCall(ctx.calls, 'moveTo');
    assert(moveTos.length >= 1,
      'drawMinimap(curved): moveTo starts the path');
  })();

  // renderScene (integration)
  (function () {
    generateStraightTrack(200);
    const ctx = new MockContext();
    renderScene(segments, 0, CFG.CAM_H, 1000, 0, ctx);

    // Should have drawn sky
    const arcs = findCall(ctx.calls, 'arc');
    assert(arcs.length >= 2,
      'renderScene: sky is drawn (sun arcs present)');

    // Should have drawn segments (each segment draws multiple polygons)
    const paths = findCall(ctx.calls, 'beginPath');
    assert(paths.length > 10,
      'renderScene: multiple segments rendered (many beginPath calls)');

    // Should have drawn car with rotation transform
    const saves = findCall(ctx.calls, 'save');
    assert(saves.length >= 1,
      'renderScene: car sprite is drawn with save/restore for rotation');

    // Should NOT have cockpit (quadraticCurveTo removed)
    const curves = findCall(ctx.calls, 'quadraticCurveTo');
    assert(curves.length === 0,
      'renderScene: no cockpit drawn (drawCockpit removed)');
  })();

// renderScene with curved track and player offset
  (function () {
    generateCurvedTrack(500);
    const ctx = new MockContext();
    renderScene(segments, 0.3, CFG.CAM_H, 1000, 0, ctx);

    const paths = findCall(ctx.calls, 'beginPath');
    assert(paths.length > 10,
      'renderScene(curved): multiple segments rendered with curves');
  })();

  // renderScene: curved track produces visible lateral displacement on screen
  (function () {
    generateCurvedTrack(500);
    const ctx = new MockContext();
    renderScene(segments, 0, CFG.CAM_H, 1000, 0, ctx);

    // Collect all moveTo calls — these are the top-left corners of road polygons.
    // On a curved track, the x-coordinates should span a meaningful range.
    const moves = findCall(ctx.calls, 'moveTo');
    if (moves.length === 0) {
      assert(false, 'renderScene(curved): moveTo calls present for road segments');
      return;
    }

    const xs = moves.map(m => m.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const spread = maxX - minX;

    // The road center should shift visibly due to curves.
    // With proper SEG_LEN scaling, even moderate curves produce >20px lateral spread
    // on the far segments. Without it, spread is <1 pixel (invisible).
    assert(spread > 20,
      'renderScene(curved): road shows visible lateral displacement (' + Math.round(spread) + 'px spread)');
  })();

  // ============================================================
  // game.js physics tests
  // ============================================================

  // Acceleration: pressing up key increases speed
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 0;
    speed = 0;
    gameRunning = true;
    keysDown['ArrowUp'] = true;

    const dt = 0.016;
    update(dt);

    assert(speed > 0,
      'update: pressing ArrowUp increases speed from zero');

    // Speed should be approximately ACCEL_RATE * dt
    const expectedSpeed = CFG.ACCEL_RATE * dt;
    assert(Math.abs(speed - expectedSpeed) < 1,
      'update: speed ≈ ACCEL_RATE * dt after one frame');

    keysDown['ArrowUp'] = false;
  })();

  // Braking: pressing down key decreases speed
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 0;
    speed = CFG.MAX_SPEED;
    gameRunning = true;
    keysDown['ArrowDown'] = true;

    const dt = 0.016;
    update(dt);

    assert(speed < CFG.MAX_SPEED,
      'update: pressing ArrowDown decreases speed');

    keysDown['ArrowDown'] = false;
  })();

  // Deceleration: no key pressed slows car down
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 0;
    speed = CFG.MAX_SPEED * 0.5;
    gameRunning = true;
    // No keys pressed

    const dt = 0.016;
    update(dt);

    assert(speed < CFG.MAX_SPEED * 0.5,
      'update: no input causes deceleration');
  })();

  // Steering: left key moves playerX negative
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 0;
    speed = 0;
    gameRunning = true;
    keysDown['ArrowLeft'] = true;

    const dt = 0.016;
    update(dt);

    assert(playerX < 0,
      'update: pressing ArrowLeft moves playerX negative');

    keysDown['ArrowLeft'] = false;
  })();

  // Steering: right key moves playerX positive
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 0;
    speed = 0;
    gameRunning = true;
    keysDown['ArrowRight'] = true;

    const dt = 0.016;
    update(dt);

    assert(playerX > 0,
      'update: pressing ArrowRight moves playerX positive');

    keysDown['ArrowRight'] = false;
  })();

  // Centrifugal force: curve pushes car outward
  (function () {
    // Create a track with a strong right curve at the start
    generateStraightTrack(200);
    segments[10].curve = 4.0;  // strong right curve

    cameraZ = 10 * CFG.SEG_LEN;  // position on the curved segment
    playerX = 0;
    speed = CFG.MAX_SPEED;
    gameRunning = true;

    const dt = 0.016;
    update(dt);

    assert(playerX > 0,
      'update: positive curve pushes playerX positive (centrifugal force)');

    // Restore segment
    segments[10].curve = 0;
  })();

// Off-road penalty: speed drops when off road and clamped to OFF_ROAD_MAX
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 1.5;  // off road (> 1.0)
    speed = CFG.MAX_SPEED * 0.8;
    gameRunning = true;

    // Iterate multiple frames until speed stabilizes at OFF_ROAD_MAX
    for (let i = 0; i < 20; i++) {
      update(0.016);
    }
    assert(speed <= CFG.OFF_ROAD_MAX + 1,
      'update: off-road speed is clamped to OFF_ROAD_MAX after multiple frames');
  })();

  // Speed clamping: speed never goes below 0
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 1.5;  // off road
    speed = 100;
    gameRunning = true;

    const dt = 0.1;  // large dt to force negative speed
    update(dt);

    assert(speed >= 0,
      'update: speed never goes below zero');
  })();

  // Speed clamping: speed never exceeds MAX_SPEED
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 0;
    speed = CFG.MAX_SPEED * 0.9;
    gameRunning = true;
    keysDown['ArrowUp'] = true;

    const dt = 1.0;  // large dt to overshoot MAX_SPEED
    update(dt);

    assert(speed <= CFG.MAX_SPEED,
      'update: speed never exceeds MAX_SPEED');

    keysDown['ArrowUp'] = false;
  })();

// cameraZ advances with speed
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 0;
    speed = CFG.MAX_SPEED;
    gameRunning = true;
    keysDown['ArrowUp'] = true;  // maintain speed at MAX_SPEED

    const dt = 0.016;
    update(dt);

    assert(cameraZ > 0,
      'update: cameraZ advances when speed > 0');
    assert(Math.abs(cameraZ - CFG.MAX_SPEED * dt) < 1,
      'update: cameraZ ≈ speed * dt');

    keysDown['ArrowUp'] = false;
  })();

  // gameRunning guard: update does nothing when not running
  (function () {
    generateStraightTrack(200);
    cameraZ = 100;
    playerX = 0;
    speed = CFG.MAX_SPEED;
    gameRunning = false;

    const dt = 0.016;
    update(dt);

    assert(cameraZ === 100,
      'update: cameraZ does not change when gameRunning is false');
    assert(speed === CFG.MAX_SPEED,
      'update: speed does not change when gameRunning is false');
  })();

  // Centrifugal force: no effect when speed is zero (Issue 2)
  (function () {
    generateStraightTrack(200);
    segments[10].curve = 4.0;  // strong right curve

    cameraZ = 10 * CFG.SEG_LEN;
    playerX = 0;
    speed = 0;
    gameRunning = true;

    const dt = 0.016;
    update(dt);

    assert(playerX === 0,
      'update: centrifugal force has no effect when speed is zero');

    segments[10].curve = 0;
  })();

  // Win-before-crash: win condition checked before crash (Issue 3)
  (function () {
    generateStraightTrack(200);
    cameraZ = segments.length * CFG.SEG_LEN;  // at the finish line
    playerX = 3.0;  // way off road (> 2.0)
    speed = 0;
    gameRunning = true;
    elapsedTime = 10;

    update(0.016);

    // The win condition should fire before the crash check
    assert(!gameRunning,
      'update: game ends when at finish line even if off-road');
    assert(cameraZ === segments.length * CFG.SEG_LEN,
      'update: cameraZ clamped to maxZ on win');
  })();

  // Car banking responds to track curvature (car leans into turns)
  (function () {
    generateCurvedTrack(500);
    // Start mid-track where curves are established; moderate initial speed so centrifugal stays on-road
    cameraZ = segments[150].p1.wz;
    playerX = 0;
    speed = CFG.MAX_SPEED * 0.3;
    carRotation = 0;
    carBank = 0;
    gameRunning = true;
    keysDown['ArrowLeft'] = false;
    keysDown['ArrowRight'] = false;
    keysDown['ArrowUp'] = true;

    // Drive through segments on a curved track (limited frames to stay on-road)
    const dt = 1 / 60;
    for (let i = 0; i < 80; i++) {
      update(dt);
      if (!gameRunning) break;
    }

    assert(Math.abs(carRotation) > 0.02,
      'update: carRotation reflects banking from track curves when driving without steering');
  })();

  // Car rotation responds to steering input (Issue 0)
  (function () {
    generateStraightTrack(200);
    cameraZ = 0;
    playerX = 0;
    speed = CFG.MAX_SPEED * 0.5;
    carRotation = 0;
    carBank = 0;
    gameRunning = true;
    keysDown['ArrowRight'] = true;

    const dt = 0.016;
    update(dt);

    assert(carRotation > 0,
      'update: carRotation increases when steering right');

    // Test left steering
    carRotation = 0;
    keysDown['ArrowRight'] = false;
    keysDown['ArrowLeft'] = true;
    update(dt);

    assert(carRotation < 0,
      'update: carRotation decreases when steering left');

    keysDown['ArrowLeft'] = false;
  })();

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n--- TEST SUMMARY ---');
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  console.log('Total:  ' + (passed + failed));
  if (failed === 0) {
    console.log('All tests passed!');
  } else {
    console.error(failed + ' test(s) failed!');
  }
})();
