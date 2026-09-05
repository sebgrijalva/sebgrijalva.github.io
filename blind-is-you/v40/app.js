import { reviewPair } from "./review.js";
import {
  BUILD,
  EXPEDITIONS,
  QUESTIONS,
  TIMING,
  randomSeed,
  iso,
  copy,
} from "./state.js";
import { storage } from "./storage.js";
import { bindTap, waitForBoardTap, inputAudit } from "./input.js";
import { Renderer } from "./renderer.js";
import {
  PROTOCOLS,
  generatePair,
  scoreTrial,
  classifyError,
  resumeDecision,
  runGeneratorAudit,
  runCounterbalanceAudit,
  runPairPurityAudit,
} from "./engine.js";
import { updateAtlas } from "./analysis.js";
const $ = (s) => document.querySelector(s),
  renderer = new Renderer();
let session = null,
  aborter = null;
const q = QUESTIONS;
function sleep(ms) {
  const signal = aborter?.signal;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("cancelled"));
    const cancel = () => {
      clearTimeout(timer);
      reject(new Error("cancelled"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    signal?.addEventListener("abort", cancel, { once: true });
  });
}

function guard(p) {
  Promise.resolve(p).catch((e) => {
    if (String(e?.message || e) !== "cancelled") console.error(e);
  });
}
function setScreen(name) {
  $("#home").classList.toggle("hidden", name !== "home");
  $("#instrument").classList.toggle("hidden", name !== "instrument");
}
function setTop(kicker, title, detail = "") {
  $("#kicker").textContent = kicker;
  $("#phase").textContent = title;
  $("#detail").textContent = detail;
}
function metric(items) {
  $("#metrics").innerHTML = items.map((x) => `<span>${x}</span>`).join("");
}
function progress(done, total) {
  $("#progress").innerHTML = Array.from(
    { length: total },
    (_, i) =>
      `<i class="${i < done ? "done" : i === done ? "current" : ""}"></i>`,
  ).join("");
}
function persist() {
  if (session) storage.setActive(session);
}
function atlas() {
  return storage.atlas();
}
function renderAtlas() {
  const a = atlas(),
    cards = $("#atlasCards");
  cards.innerHTML = "";
  for (const id of EXPEDITIONS) {
    const p = PROTOCOLS[id],
      entry = a[id]?.protocolVersion === p.id ? a[id] : null,
      el = document.createElement("article");
    el.className = "atlas-card";
    el.dataset.id = id;
    el.innerHTML = `<div class="constellation constellation-${id}" aria-hidden="true"></div><div class="eyebrow">${id.toUpperCase()}</div><h2>${q[id]}</h2><p>${entry?.summary || "Your first trace begins with a question."}</p><div class="evidence">${entry?.evidence || "UNEXPLORED"} · ${entry?.validPairs || 0} observations</div><button type="button" class="primary">Begin exploration ↗</button>`;
    bindTap(el.querySelector("button"), () => guard(startExpedition(id)));
    cards.appendChild(el);
  }
  $("#resume").classList.toggle("hidden", !storage.getActive());
}
function showHome() {
  aborter?.abort();
  $("#modal").classList.add("hidden");
  aborter = null;
  session = storage.getActive();
  setScreen("home");
  renderAtlas();
}
function modal(kicker, title, body, actions) {
  return new Promise((resolve, reject) => {
    const signal = aborter?.signal;
    const cancel = () => reject(new Error("cancelled"));
    signal?.addEventListener("abort", cancel, { once: true });
    const m = $("#modal");
    $("#modalKicker").textContent = kicker;
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = body;
    const a = $("#modalActions");
    a.innerHTML = "";
    for (const x of actions) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = x.primary ? "primary" : "secondary";
      b.textContent = x.label;
      bindTap(b, () => {
        signal?.removeEventListener("abort", cancel);
        m.classList.add("hidden");
        resolve(x.value);
      });
      a.appendChild(b);
    }
    m.classList.remove("hidden");
    a.querySelector("button")?.focus();
  });
}
async function startExpedition(id) {
  aborter?.abort();
  aborter = new AbortController();
  session = {
    build: BUILD,
    id: `session-${randomSeed()}`,
    explorationId: id,
    protocolVersion: PROTOCOLS[id].id,
    phase: "orient",
    calibrationLoad: 4,
    calibrationTrial: 0,
    pairIndex: 0,
    pairs: [],
    trials: [],
    counterbalanceState: (atlas()[id]?.validPairs || 0) % 2,
    calibrationSeed: randomSeed(),
    startedAt: iso(),
  };
  persist();
  setScreen("instrument");
  await orient();
}
async function orient() {
  const id = session.explorationId;
  const copy = {
    focus:
      "You will remember objects and locations. Sometimes, after they vanish, one remembered object will be marked for protection.",
    structure:
      "You will remember location sequences. Some follow a simple translation grammar; others are deliberately scrambled.",
    breath:
      "You will remember location sequences. Sometimes extra unmarked time appears after the third item.",
    noise:
      "You will remember location sequences. Sometimes two left/right responses interrupt the retention interval.",
  }[id];
  await modal(
    "EXPEDITION",
    id.toUpperCase(),
    `<p>${q[id]}</p><p>${copy}</p><p>First, try three short sequences to find a comfortable starting point.</p>`,
    [{ label: "Calibrate", value: 1, primary: true }],
  );
  session.phase = "calibrate";
  persist();
  await calibration();
}
async function calibration() {
  setScreen("instrument");
  while (session.calibrationTrial < 3) {
    const span = session.calibrationLoad;
    setTop(
      "CALIBRATE",
      "TUNE THE FIELD",
      "Remember the locations in order. Take your time when reconstructing.",
    );
    metric([`${span} locations`]);
    progress(session.calibrationTrial, 3);
    const spec = {
      gridSize: 5,
      target: makeCalibration(span, session.calibrationTrial),
      presentationTiming: {
        flashMs: TIMING.flash,
        gapMs: TIMING.gap,
        retentionMs: TIMING.calibrationRetention,
      },
    };
    const response = await runSerial(spec);
    const correct = spec.target.every(
      (p, i) => p.r === response[i]?.r && p.c === response[i]?.c,
    );
    const ceiling =
      session.explorationId === "focus" || session.explorationId === "structure"
        ? 5
        : 7;
    session.calibrationLoad = Math.max(
      3,
      Math.min(ceiling, session.calibrationLoad + (correct ? 1 : -1)),
    );
    session.calibrationTrial++;
    persist();
  }
  session.phase = "explore";
  session.frozenLoad = session.calibrationLoad;
  persist();
  await explore();
}
function makeCalibration(span, i) {
  let x = ((session.calibrationSeed || 0x4b1d5eed) + i * 2654435761) >>> 0;
  const cells = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) cells.push({ r, c });
  for (let k = cells.length - 1; k > 0; k--) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    const j = (x >>> 0) % (k + 1);
    [cells[k], cells[j]] = [cells[j], cells[k]];
  }
  return cells.slice(0, span);
}
async function explore() {
  const total = 6;
  while (session.pairIndex < total) {
    let p, recs, startIndex;
    if (
      session.currentPair &&
      session.currentPair.pairIndex === session.pairIndex
    ) {
      p = session.currentPair.spec;
      recs = session.currentPair.records || [];
      startIndex = session.currentPair.nextIndex || recs.length;
    } else {
      p = generatePair(session.explorationId, {
        pairSeed: randomSeed(),
        calibratedLoad: session.frozenLoad,
        counterbalanceState: session.counterbalanceState + session.pairIndex,
      });
      session.currentPair = {
        pairIndex: session.pairIndex,
        spec: p,
        records: [],
        nextIndex: 0,
      };
      persist();
      recs = [];
      startIndex = 0;
    }
    for (let j = startIndex; j < 2; j++) {
      const condition = p.order[j],
        spec = p.trials[condition];
      setTop(
        `${session.explorationId.toUpperCase()} · PAIR ${session.pairIndex + 1}/${total}`,
        j === 0 ? "FIRST CONDITION" : "SECOND CONDITION",
        "Watch, hold the trace, then reconstruct.",
      );
      metric([
        `load ${session.frozenLoad}`,
        condition === "focus" ? "prioritized" : condition,
      ]);
      progress(session.pairIndex, total);
      const rec = await runMeasured(spec, p.pairSeed, p.order);
      recs.push(rec);
      session.currentPair.records = recs;
      session.currentPair.nextIndex = j + 1;
      session.trials.push(rec.trialId);
      storage.addTrial(rec);
      persist();
      if (j === 0) {
        renderer.clear();
        renderer.overlayText('<div class="neutral-mark">·</div>');
        await sleep(TIMING.feedback);
      }
    }
    const valid = recs.every((r) => r.analysisEligible);
    const pairRecord = {
      pairId: `${session.id}-p${session.pairIndex}`,
      explorationId: session.explorationId,
      protocolVersion: PROTOCOLS[session.explorationId].id,
      pairSeed: p.pairSeed,
      calibratedLoad: session.frozenLoad,
      conditionA: recs[0].trialId,
      conditionB: recs[1].trialId,
      order: p.order,
      valid,
      exclusionReason: valid ? null : "interference-failure",
      pairedOutcome: PROTOCOLS[session.explorationId].pairOutcome(recs),
      records: recs,
    };
    storage.addPair(pairRecord);
    session.pairs.push(pairRecord);
    delete session.currentPair;
    session.pairIndex++;
    persist();
    await pairReveal(pairRecord);
  }
  await finishSession();
}
async function runMeasured(spec, pairSeed, conditionOrder) {
  let response;
  const started = performance.now();
  if (spec.explorationId === "focus") response = await runFocus(spec);
  else if (spec.explorationId === "noise") response = await runNoise(spec);
  else response = await runSerial(spec);
  const scored = scoreTrial(spec, response);
  let confidence = null,
    confidencePrompted = false;
  if (((pairSeed + spec.trialSeed) >>> 0) % 3 === 0) {
    confidencePrompted = true;
    confidence = await confidenceProbe();
  }
  const analysisEligible =
    spec.explorationId !== "noise" || scored.interferenceValid !== false;
  return {
    build: BUILD,
    protocolVersion: spec.protocolVersion,
    explorationId: spec.explorationId,
    construct: spec.construct,
    factor: spec.factor,
    condition: spec.condition,
    pairSeed,
    conditionOrder,
    probeGlyph: spec.probeGlyph || null,
    trialId: `${session.id}-${session.pairIndex}-${spec.condition}`,
    trialSeed: spec.trialSeed,
    practice: false,
    measured: true,
    analysisEligible,
    exclusionReason: analysisEligible ? null : "failed-interference",
    calibrationLoad: session.frozenLoad,
    calibrationSource: "trace",
    gridSize: spec.gridSize,
    memoryLoad: spec.memoryLoad,
    maintainedObjects: spec.objects?.length || null,
    initial: spec.objects || spec.target,
    target: spec.target,
    response: copy(response),
    correct: scored.correct,
    serialPositionResults: scored.serialPositionResults || null,
    firstErrorPosition: scored.firstErrorPosition || null,
    errorClass: classifyError(spec, response),
    errorDistance: null,
    updateCount: 0,
    operations: [],
    interferenceParameters: spec.interferenceParameters || null,
    interferenceResponses: response.interference || null,
    confidence,
    confidencePrompted,
    presentationTiming: spec.presentationTiming,
    responseTiming: { totalMs: Math.round(performance.now() - started) },
    viewport: { w: innerWidth, h: innerHeight },
    devicePixelRatio,
    pointerType: "pointer-events",
    recordedAt: iso(),
  };
}
async function ready() {
  renderer.clear();
  await modal(
    "TAKE YOUR TIME",
    "Ready to observe?",
    "<p>Watch the field. When the trace disappears, tap the remembered locations. Recall has no time limit.</p>",
    [{ label: "Show the trace", value: 1, primary: true }],
  );
  $("#phase").textContent = "OBSERVE";
}
async function runSerial(spec) {
  await ready();
  renderer.grid(spec.gridSize);
  renderer.clear();
  for (let i = 0; i < spec.target.length; i++) {
    renderer.pulse(spec.target[i]);
    await sleep(spec.presentationTiming.flashMs);
    renderer.clear();
    if (
      spec.explorationId === "breath" &&
      spec.condition === "breath" &&
      i + 1 === spec.pauseAfter
    )
      await sleep(spec.presentationTiming.pauseExtraMs);
    else await sleep(spec.presentationTiming.gapMs || TIMING.gap);
  }
  await sleep(spec.presentationTiming.retentionMs || 120);
  $("#phase").textContent = "RECONSTRUCT";
  const out = [];
  for (let i = 0; i < spec.target.length; i++) {
    renderer.overlayText(`<div class="recall-index">${i + 1}</div>`);
    out.push(await waitForBoardTap(renderer.board, aborter.signal));
    renderer.pulse(out[out.length - 1], String(i + 1));
  }
  renderer.clear();
  return out;
}
async function runFocus(spec) {
  await ready();
  renderer.grid(spec.gridSize);
  renderer.clear();
  for (const o of spec.objects) renderer.glyph(o.location, o.id);
  await sleep(TIMING.flash * 2);
  renderer.clear();
  await sleep(
    Math.max(
      0,
      spec.presentationTiming.retentionMs - spec.presentationTiming.retroMs,
    ),
  );
  renderer.overlayText(
    spec.condition === "focus"
      ? `<div class="retro-glyph">${glyph(spec.retroCue)}</div>`
      : '<div class="neutral-mark">·</div>',
  );
  await sleep(TIMING.retro);
  $("#phase").textContent = "LOCATE";
  renderer.overlayText(
    `<div class="probe"><span>${glyph(spec.probeGlyph)}</span><small>tap its original location</small></div>`,
  );
  return await waitForBoardTap(renderer.board, aborter.signal);
}
async function runNoise(spec) {
  await ready();
  renderer.grid(spec.gridSize);
  renderer.clear();
  for (const p of spec.target) {
    renderer.pulse(p);
    await sleep(TIMING.flash);
    renderer.clear();
    await sleep(TIMING.gap);
  }
  const interference = [],
    retentionStart = performance.now();
  if (spec.condition === "noise") {
    for (const [i, dir] of spec.interferenceParameters.arrows.entries()) {
      const offset =
        spec.presentationTiming.retentionMs * (i === 0 ? 0.2 : 0.55);
      await sleep(Math.max(0, offset - (performance.now() - retentionStart)));
      const result = await arrowProbe(
        dir,
        spec.interferenceParameters.deadlineMs,
      );
      interference.push(result);
    }
  }
  const remaining =
    spec.presentationTiming.retentionMs - (performance.now() - retentionStart);
  if (remaining > 0) await sleep(remaining);
  $("#phase").textContent = "RECONSTRUCT";
  const locations = [];
  for (let i = 0; i < spec.target.length; i++) {
    renderer.overlayText(`<div class="recall-index">${i + 1}</div>`);
    locations.push(await waitForBoardTap(renderer.board, aborter.signal));
    renderer.pulse(locations.at(-1), String(i + 1));
  }
  renderer.clear();
  return { locations, interference };
}
async function arrowProbe(answer, deadline = TIMING.deadline) {
  return new Promise((resolve, reject) => {
    const signal = aborter.signal;
    renderer.overlayText(
      `<div class="arrow-task"><div class="arrow-target" aria-label="Match ${answer}">${answer === "left" ? "←" : "→"}</div><div class="arrows"><button aria-label="Left" data-side="left">←</button><button aria-label="Right" data-side="right">→</button></div></div>`,
      true,
    );
    let done = false;
    const t0 = performance.now();
    const clean = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      if (done) return;
      done = true;
      clean();
      reject(new Error("cancelled"));
    };
    const finish = (side) => {
      if (done) return;
      done = true;
      clean();
      renderer.clear();
      resolve({
        answer,
        side,
        correct: side === answer,
        rtMs: Math.round(performance.now() - t0),
      });
    };
    const timer = setTimeout(() => finish(null), deadline);
    signal.addEventListener("abort", cancel, { once: true });
    for (const b of renderer.overlay.querySelectorAll("button"))
      bindTap(b, () => finish(b.dataset.side));
  });
}

async function confidenceProbe() {
  return modal(
    "KNOWING",
    "How sure were you?",
    "<p>Optional confidence probe. It is not a score.</p>",
    [
      { label: "uncertain", value: "uncertain" },
      { label: "fairly sure", value: "fairly-sure" },
      { label: "sure", value: "sure", primary: true },
    ],
  );
}
async function pairReveal(p) {
  const d = p.pairedOutcome.delta,
    txt = !p.valid
      ? "An interruption response was missed. Keep this observation, but leave it out of the comparison."
      : d === 0
        ? "Both conditions had the same complete-recall outcome. Look at where the traces agree and diverge."
        : d > 0
          ? "Recall was complete only in the changed condition. One pair is an observation, not a conclusion."
          : "Recall was complete only in the comparison condition. One pair is an observation, not a conclusion.";
  await modal(
    "TWO TRACES",
    "What stayed with you?",
    `<p>${txt}</p>${reviewPair(p)}<p class="reflection">${p.explorationId === "focus" ? "Did attention preserve the location you needed?" : "Notice: a lost location, a swapped order, or a whole pattern?"}</p>`,
    [{ label: "Continue exploring", value: 1, primary: true }],
  );
}

async function finishSession() {
  const id = session.explorationId,
    p = PROTOCOLS[id],
    a = updateAtlas(atlas(), id, p.id, session.pairs, p.summarize.bind(p));
  storage.setAtlas(a);
  session.phase = "reveal";
  session.completedAt = iso();
  storage.addSession({ ...session });
  storage.clearActive();
  const summary = a[id].summary;
  await modal(
    "EXPEDITION COMPLETE",
    id.toUpperCase(),
    `<p>${summary}</p><p><b>${a[id].evidence}</b> · ${a[id].validPairs} valid pairs accumulated for ${p.id}.</p>`,
    [{ label: "Return to Atlas", value: 1, primary: true }],
  );
  session = null;
  showHome();
}
function glyph(id) {
  return (
    { diamond: "◆", ring: "◎", cross: "✦", hex: "⬢", kite: "◈" }[id] || "◆"
  );
}
async function resume() {
  aborter?.abort();
  aborter = new AbortController();
  session = storage.getActive();
  if (!session) return;
  setScreen("instrument");
  if (resumeDecision(session) === "restart") {
    await modal(
      "PROTOCOL CHANGED",
      "RESTART REQUIRED",
      "<p>The incomplete pair belongs to an older protocol version. Completed history is preserved, but this session cannot resume under a new protocol.</p>",
      [{ label: "Restart expedition", value: 1, primary: true }],
    );
    storage.clearActive();
    return startExpedition(session.explorationId);
  }
  if (session.phase === "calibrate") return calibration();
  if (session.phase === "explore") return explore();
  return orient();
}
function exportJSON() {
  const data = storage.exportAll(
      Object.fromEntries(
        Object.entries(PROTOCOLS).map(([k, v]) => [k, v.metadata]),
      ),
    ),
    blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `blind-is-you-v4-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function bindStatic() {
  if ($("#leaveDialog")) bindTap($("#leaveDialog"), showHome);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") showHome();
  });
  bindTap($("#resume"), () => guard(resume()));
  bindTap($("#export"), exportJSON);
  bindTap($("#exit"), showHome);
}
function exposeDebug() {
  if (new URLSearchParams(location.search).get("test") !== "1") return;
  window.__BIY4__ = {
    BUILD,
    PROTOCOLS,
    generatePair,
    scoreTrial,
    classifyError,
    getSession: () => session,
    getCurrentTrial: () =>
      session?.currentPair?.spec?.trials?.[
        session.currentPair.spec.order[session.currentPair.nextIndex]
      ] || null,
    getCurrentPair: () => session?.currentPair || null,
    runGeneratorAudit,
    runCounterbalanceAudit,
    runPairPurityAudit,
    runInputAudit: inputAudit,
    runBrowserAudit: () => ({
      viewport: { w: innerWidth, h: innerHeight },
      touch: navigator.maxTouchPoints,
      input: inputAudit(),
      atlasCards: document.querySelectorAll(".atlas-card").length,
      storageKeys: Object.keys(localStorage).filter((k) =>
        k.startsWith("biy_v40_"),
      ),
    }),
  };
}
bindStatic();
exposeDebug();
showHome();
