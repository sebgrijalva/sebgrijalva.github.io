# ZERO IS YOU implementation rules

- The design specs are executable requirements. Preserve deterministic turn semantics, visible rules, free undo, no time pressure, pixel-only rendering, synthesized audio, local-only persistence, and phone-first usability.
- Existing ZERO levels are compatibility fixtures. Expansion work must not change their behavior unless a deliberate challenge-pack replacement is covered by tests.
- NIL IS YOU extends ZERO rather than replacing it. `IS` remains directional world-rule semantics; `SAME` is mathematical equivalence. Facts externalize knowledge but never require off-screen recall.
- Never use generated images as game assets unless the user explicitly requests image generation. Screenshots are diagnostic input. Implement visuals in JavaScript canvas/CSS/SVG or existing repository assets.
- Native gameplay art density is 32×32 logical pixels per tile/sprite on the unchanged 12×8 puzzle grid. Do not regress to 16×16 art or fake 32px by merely CSS-scaling a 16px renderer.
- Portrait Android is the primary target: 384×448 logical canvas, 384×256 board, swipe movement, readable rule tiles, thumb-sized HTML controls. Do not restore a D-pad unless explicitly requested.
- Puzzle difficulty must come from reasoning and spatial manipulation, not larger arithmetic. Required tiles must not be placed for an obvious one-push solution; challenge levels should require multiple reasoning/manipulation steps and meaningful decoys.
- Prefer direct ES modules for the active build. Do not reintroduce blob-import/packed-loader indirection unless there is a tested, necessary reason.
- Before deploying: run the ZERO package tests, renderer contract checks, and compatibility checks where engine semantics changed. The root Pages test command must include the ZERO checks so failure blocks deployment.
- Deploy to `/zero-is-you/` in this repository, wait for the GitHub Pages workflow to succeed, and inspect the deployed artifact before reporting success.
