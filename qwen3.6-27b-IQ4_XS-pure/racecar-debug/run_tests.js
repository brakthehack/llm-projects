// Test runner for Node.js using jsdom — loads all source files as a single script
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Create a DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <canvas id="gameCanvas"></canvas>
  <canvas id="minimap" width="120" height="120"></canvas>
  <div id="overlay">
    <h1>RACE CAR SIMULATOR</h1>
    <p>Description</p>
    <button class="start-btn" id="startBtn">START RACE</button>
  </div>
  <div id="speed-display">Speed: 0 km/h</div>
  <div id="time-display">Time: 0:00</div>
  <div id="progress-display">Progress: 0%</div>
  <div id="offroad-indicator" class="hidden">OFF ROAD!</div>
  <div id="speed-bar-container"><div id="speed-bar"></div></div>
</body></html>`);

// Set up global objects
global.document = dom.window.document;
global.window = dom.window;

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Load all source files in dependency order and eval them together
const files = ['config.js', 'track.js', 'project.js', 'render.js', 'game.js', 'test.js'];
let combined = '';
for (const file of files) {
  combined += fs.readFileSync(path.join(__dirname, file), 'utf8') + '\n';
}

// Eval in the jsdom context
dom.window.eval(combined);
