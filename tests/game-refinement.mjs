import assert from "node:assert/strict";
import fs from "node:fs";
import { clueFeedback } from "../zero-is-you/feedback.js";
import { LEVELS } from "../zero-is-you/levels-v11-runtime.js";
import { valueToken } from "../zero-is-you/constraints-v11.js";
import {
  runGeneratorAudit,
  runCounterbalanceAudit,
  runPairPurityAudit,
  runSimulationAudit,
} from "../blind-is-you/v40/engine.js";
import { reviewPair } from "../blind-is-you/v40/review.js";
for (const l of LEVELS.filter((l) => l.lockPuzzle)) {
  assert(
    clueFeedback({ socketValues: {} }, l).every((c) => c.status === "pending"),
  );
  const socketValues = Object.fromEntries(
    Object.entries(l.solution).map(([k, v]) => [k, valueToken(v)]),
  );
  assert(
    clueFeedback({ socketValues }, l).every((c) => c.status === "true"),
    l.title,
  );
}
assert.equal(
  clueFeedback(
    { socketValues: { A: "THREE", B: "FOUR" } },
    {
      goal: {
        slots: ["A", "B"],
        constraints: [{ kind: "sum", vars: ["A", "B"], value: 8 }],
      },
    },
  )[0].status,
  "false",
);
assert(runGeneratorAudit(500).ok);
assert(runCounterbalanceAudit().ok);
assert(runPairPurityAudit(100).ok);
assert(runSimulationAudit().ok);
const review = reviewPair({
  records: [
    {
      condition: "quiet",
      gridSize: 5,
      target: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
      ],
      response: [
        { r: 0, c: 1 },
        { r: 0, c: 0 },
      ],
    },
  ],
});
assert.match(review, /<b>1<\/b><i>2<\/i>/);
assert.match(review, /<b>2<\/b><i>1<\/i>/);
const active = fs.readFileSync("zero-is-you/game-v12.js", "utf8");
assert.match(active, /TILE\s*=\s*32/);
assert.match(active, /w:\s*384,\s*h:\s*448/);
assert.doesNotMatch(active, /undo\.length>200/);
assert.match(fs.readFileSync("zero-is-you/index.html", "utf8"), /game-v12.js/);
assert.match(
  fs.readFileSync("blind-is-you/index.html", "utf8"),
  /data-biy-version="4.1.0"/,
);
console.log(
  "Refinement: clue truth, memory generators, counterbalance, ideal recall, and trace reconstruction passed.",
);
