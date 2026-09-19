# Rally — Day 002

A single-player Three.js table tennis game in a warmly lit indoor club. Static, self-hosted assets; GitHub Pages repository `rally-table-tennis`. No accounts, backend, remote assets, or multiplayer.

## Experience
The opening view shows a detailed regulation-proportioned table in a custom architectural environment. One click starts a match to 11, win by two. Mouse, touch, or keyboard move the paddle; contact is assisted when aligned. Shot placement responds to lateral paddle motion. Flat, topspin, and backspin change trajectories. Three finite-speed AI levels. Pause, restart, sound toggle, in-game instructions, and best-rally persistence.

## Architecture and implementation sequence
1. `src/physics.js`: fixed-step metre-based gravity, drag, spin, net and table collision, valid bounce tracking, serves, point and match rules. Prove bounce, net, service rotation and deuce with `tests/physics.test.js` before rendering.
2. `src/scene.js`: Three.js room, regulation table, woven net, layered paddles, dynamic ball shadow, short motion trail, lighting and camera. Bundle pinned Three.js into `game.js` using esbuild; no runtime network dependency.
3. `src/main.js`, `index.html`, `style.css`: input, AI, state transitions, synthesized sound, responsive HUD and opening screen. Mobile touch reserves lower screen for unobscured movement.
4. Browser tests: play rallies with actual pointer events, miss and score, pause/resume/restart, complete a match; desktop/mobile screenshots; no runtime errors. Run forge local gate, commit without co-author trailers, deploy and verify live.

## Realism boundaries
Physical scale, gravity, restitution, aerodynamic curvature, valid bounces and service sequence; assisted paddle height and shot trajectory keep a browser mouse/touch game accessible. This is a stylized simulation, not a claim of professional biomechanical accuracy. AI is represented by a paddle rather than a humanoid avatar.

## Done
Playable first-to-11 match, believable rally motion and sound, detailed coherent scene, touch and keyboard support, passing physics and browser checks, live deployed URL and manual X draft.
