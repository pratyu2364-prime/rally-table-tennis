# Verification — 2026-09-19

- `npm test`: 9 physics/rules tests pass, including both service directions, all spin/pace combinations, net collision, legal table bounces, misses, service rotation and win-by-two scoring.
- `npm run build`: pinned Three.js bundle builds successfully, with no runtime CDN imports.
- Forge local smoke gate passes: rendering, synthetic input, no uncaught exceptions or console errors.
- Desktop Chromium with SwiftShader: a six-shot rally using actual pointer events; spin keys; pause freezes ball state; resume; restart resets scores; a full 0–11 match ends correctly; rematch resets the game.
- Mobile Chromium, 390 × 844: no horizontal overflow; actual timed CDP touch drag moves the paddle; backspin selection; serving; pause/resume; no page errors. Verified independently with `node tests/mobile.mjs`.
- Inspected opening and playing screenshots at desktop and mobile sizes. Score panel is outside the desktop playing lane; full table fits the mobile playing view.

## Test environment findings

Software WebGL is much slower than a hardware GPU. Two initial full-match runs timed out at their wall-clock limits while scoring progressed; the final allowance is six minutes. The physics step remains 1/240 s. Simulation accepts up to 100 ms per rendered frame and room shadows are cached.

An instantaneous synthetic touch start/move/end sequence did not reliably deliver movement. Timed touch moves reproduce a real gesture and pass. The combined browser test now closes the desktop page before mobile checks to avoid rendering two courts concurrently.

## Limits

Browser mobile emulation was tested; physical iOS/Android devices were not available. Paddle contact, height and return trajectory are assisted. AI uses a paddle rather than a humanoid animation. Multiplayer is outside this build's scope.
