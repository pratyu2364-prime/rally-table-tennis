# Rally — Table Tennis Club

Find your flow in a warmly lit 3D table tennis club. A single-player browser game built with Three.js, with three AI levels, spin, synthesized impact sounds and matches to 11.

**Day 002 of building something small every day.**

## Play

- Mouse: move horizontally to position your paddle. Contact and paddle height are assisted. Move sideways at contact to place the ball; hold a mouse button for more pace.
- Touch: slide below the table to move the paddle. Lift your finger for a softer return.
- Keyboard: left/right arrows or A/D move; Space serves; Shift adds pace; 1/2/3 selects flat/topspin/backspin. P or Escape pauses.
- First to 11, win by two. Service changes every two points, and every point after 10–10. A legal serve bounces on both halves. A legal net serve is replayed.
- Use the sound button to enable audio. Best rally is stored locally when browser storage is available.

## Constraint

One detailed court, one human player and an AI paddle. No backend, accounts, downloads, external asset requests or multiplayer. Real-scale table, gravity, restitution, aerodynamic curvature and bounce rules provide believable movement; assisted contacts and target-based shot trajectories make it playable with a mouse or phone. This is a stylized simulation, not a professional training simulator.

## Run / develop

Serve this folder with any static HTTP server (for example `python3 -m http.server 8080`), then open localhost:8080. The committed `game.js` is ready to serve.

To edit source: `npm ci`, `npm test`, `npm run build`. Three.js 0.180.0 and esbuild 0.25.10 are pinned. `src/physics.js` has no rendering dependency; `src/scene.js` builds the room and table procedurally; `src/main.js` manages input, audio, AI and UI. Every authored file is under 500 lines. Generated dependencies and the lockfile are excluded from that authoring rule.

Browser verification: with the daily-forge Playwright dependency available, start the HTTP server on port 8087 and run `node tests/browser.mjs`. Alternatively, install Playwright and its Chromium browser in your development environment. The test uses real pointer and touch input, plays a full match, checks pause/restart, and writes inspection screenshots into `/tmp`. It allows extra time for software-rendered WebGL.

Three.js rendering reference: https://threejs.org/docs/pages/WebGLRenderer.html

## Credits and licenses

Original procedural scene, game code and interface. Three.js is MIT licensed; its notice is preserved in `game.js.LEGAL.txt` and its full license in `THIRD_PARTY_LICENSES.txt`. No stock imagery, fonts, models or audio are fetched. Sound is synthesized locally.
