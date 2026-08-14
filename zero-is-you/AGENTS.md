# ZERO IS YOU implementation rules

- The design specs are executable requirements. Preserve deterministic turn semantics, visible rules, free undo, no time pressure, pixel-only rendering, synthesized audio, local-only persistence, and phone-first usability.
- Existing ZERO levels are compatibility fixtures. Expansion work must not change their behavior.
- NIL IS YOU extends ZERO rather than replacing it. `IS` remains directional world-rule semantics; `SAME` is mathematical equivalence. Facts externalize knowledge but never require off-screen recall.
- Never use generated images as game assets unless the user explicitly requests image generation. Implement visuals in the renderer/CSS/SVG or repository assets.
- Swipe is the primary Android movement control. Do not restore a D-pad unless explicitly requested.
- Before deploying: `npm test` from `zero-is-you/`, then verify base-level compatibility where engine semantics changed.
- Deploy to `/zero-is-you/` in this repository and verify the GitHub Pages workflow plus the deployed artifact before reporting success.
