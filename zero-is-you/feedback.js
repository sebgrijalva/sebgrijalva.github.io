import {
  tokenValue,
  constraintHolds,
  constraintText,
} from "./constraints-v11.js";
// Evaluate only fully placed clues: feedback externalizes state without revealing solutions.
export function clueFeedback(state, level) {
  const assignment = Object.fromEntries(
    (level.goal?.slots || []).map((k) => [
      k,
      tokenValue(state.socketValues?.[k]),
    ]),
  );
  return (level.goal?.constraints || []).map((c) => {
    const vars = c.vars || [c.a, c.b, c.var].filter(Boolean);
    const complete = vars.every((k) => assignment[k] !== null);
    return {
      text: constraintText(c),
      status: complete
        ? constraintHolds(c, assignment)
          ? "true"
          : "false"
        : "pending",
    };
  });
}
