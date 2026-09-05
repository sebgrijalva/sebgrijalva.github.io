// Retained filename for existing CI callers; contract follows the active public release.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const game=fs.readFileSync('zero-is-you/game-v12.js','utf8');
assert.match(game,/levels-v11-runtime\.js/);assert.match(game,/engine-v11\.js/);assert.match(game,/clueFeedback/);
const index=fs.readFileSync('zero-is-you/index.html','utf8');
assert.match(index,/game-v12\.js\?v=12\.0/);
assert.doesNotMatch(index,/loader-v6|blob:/);
console.log('ZERO v12 direct module deployment contract passed');
