# Rally — Table Tennis Club

Find your flow in a warmly lit 3D table tennis club. A single-player browser game built with Three.js, with three AI levels, spin, synthesized impact sounds and matches to 11.

**Day 002 of building something small every day.**

## Play

- Mouse: move left/right and toward/away from the table. Push upward into contact for pace; pull backward to soften a return. Diagonal brushing adds sidespin. Your racket never follows the ball automatically.
- Touch: slide in two dimensions below the table, using the same forward/back and diagonal strokes.
- Keyboard: arrows or WASD move the racket in two dimensions; Space serves; 1/2/3 selects natural/topspin/backspin rubber-angle bias. P or Escape pauses.
- First to 11, win by two. Service changes every two points, and every point after 10–10. A legal serve bounces on both halves. A legal net serve is replayed.
- Sound activates when a match starts; the sound button toggles it. Table and rubber impacts have distinct short plastic/wood resonances, scaled by collision strength. Best rally is stored locally when browser storage is available.

## Constraint

One detailed court, one human player and an AI paddle. No backend, accounts, downloads, external asset requests or multiplayer. Real-scale table, gravity, restitution, aerodynamic curvature and bounce rules provide believable movement. Human returns depend on incoming velocity, paddle normal/tangential velocity, contact offset and rubber-angle bias; they are not aimed at a guaranteed landing point. Overhit shots can go out. A contact-height allowance remains for accessible mouse/touch play, and the AI uses assisted trajectories. This is a stylized simulation, not a professional training simulator.

## Run / develop

Serve this folder with any static HTTP server (for example `python3 -m http.server 8080`), then open localhost:8080. The committed `game.js` is ready to serve.

To edit source: `npm ci`, `npm test`, `npm run build`. Three.js 0.180.0 and esbuild 0.25.10 are pinned. `src/physics.js` handles flight/rules; `src/stroke.js` handles hand motion and racket impacts; `src/audio.js` synthesizes impacts; `src/scene.js` builds the room/table; `src/main.js` manages play and UI. Every authored file is under 500 lines. Generated dependencies and the lockfile are excluded from that authoring rule.

Browser verification: with Playwright and Chromium available, start the HTTP server on port 8087 and run `node tests/interaction.mjs` and `node tests/mobile.mjs`. The tests use actual pointer, keyboard and touch events to check 2D motion, no automatic paddle jump, drives, sidespin, rallies and pause/resume. `tests/frame-driver.mjs` advances the unchanged game's RAF callback deterministically for software-rendered WebGL. The older `tests/browser.mjs` also covers full-match/restart flows.

Demo capture: `FFMPEG=/path/to/ffmpeg node tools/capture-demo.mjs /path/to/output /path/to/frames`. Requires Playwright. Creates a 15-second native 1920 × 1080, 30 fps H.264 MP4 with synchronized game impact audio. The unchanged game runs with scripted normal input at fixed simulation times; this avoids dropped frames on a slow renderer and is not a real-time performance benchmark. The same audio synthesis is used in-game and in the recording.

Capture resumes existing frames in short browser sessions, replaying the same seeded inputs with rasterization skipped until the resume point. Use a fresh frame directory for each game revision so captures never mix different builds.

Three.js rendering reference: https://threejs.org/docs/pages/WebGLRenderer.html

Capture references: https://playwright.dev/docs/api/class-page#page-screenshot and https://ffmpeg.org/ffmpeg.html

## Credits and licenses

Original procedural scene, game code and interface. Three.js is MIT licensed; its notice is preserved in `game.js.LEGAL.txt` and its full license in `THIRD_PARTY_LICENSES.txt`. No stock imagery, fonts, models or audio are fetched. Sound is synthesized locally.
