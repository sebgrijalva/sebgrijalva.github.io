# Game refinement: Zero v12 / Blind v4.1

The games have different jobs. Zero externalizes mathematical structure through movable rules and constraints. Blind makes changes in remembering inspectable through paired observations. Neither should equate intelligence with speed or arithmetic size.

## Zero

The active entry is now `zero-is-you/game-v12.js`, a direct ES module. It uses the established v11 level/engine interfaces. Existing 60 puzzles and ten Fact Forge puzzles retain their semantics and saved completion IDs. The older builders remain only for compatibility checks and their existing level dependencies.

Named islands replace percentile-like menu labels. Low-contrast terrain gives manipulable objects priority. Portrait retains the native 384×448 canvas and 32px tiles; landscape puts clues alongside the board. Each completely assigned constraint visibly reports true/false; incomplete clues remain neutral. This provides consequences without revealing candidate solutions. Undo has no artificial history cap. Completion includes a reasoning prompt and a next-puzzle route.

## Blind

The canonical homepage now serves Memory Atlas directly. Deployment must not overwrite it from old compressed archives. The four protocols and existing v40 local storage keys remain. The home presents questions; after both trials, two reconstructions reveal location/order differences. A ready gesture precedes encoding; recall is untimed.

Abort signals cancel encoding delays, recall, dialogs and arrow deadlines. Pair progress persists before review so resume cannot duplicate a finished pair. Arrow interruption now displays its target and uses fixed slots inside the same retention window as quiet trials. Noise protocol version advances to v2; prior v1 observations are preserved but not pooled into the repaired protocol's atlas.

## Validation

`npm test` runs the existing platformer smoke check, Zero compatibility/renderer/constraint tests and memory generator, counterbalance, scoring and review checks. The platformer test requires the existing deployment decode of `platformer-v16.js.gz.b64`.

`tests/games-browser.cjs` uses Playwright against a running server (default port 4173). Set `PLAYWRIGHT_EXECUTABLE_PATH` if needed; `GAME_BASE_URL` selects a deployed site. It checks mobile touch recall, paired review, resume, cancellation, input deduplication, exact Zero undo, and landscape layout. Diagnostic screenshots go to `/tmp`.

This is a refinement of the two named games, not a replacement of the separate platformer. No claim of measured learning gains or playtested difficulty is made. Next design work should be based on observed player paths, especially whether early lock puzzles need a gentler conceptual introduction.
