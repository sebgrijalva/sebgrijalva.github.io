const assert = require("node:assert/strict");
const { chromium } = require(
  require.resolve("playwright", {
    paths: [
      process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd(),
      process.cwd(),
    ],
  }),
);
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-zygote"],
  });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    (process.env.GAME_BASE_URL || "http://localhost:4173") +
      "/zero-is-you/?test=1",
  );
  await page.waitForFunction(() => window.__ZERO__);
  await page.screenshot({ path: "/tmp/zero-home.png" });
  await page.evaluate(() => __ZERO__.open(__ZERO__.levels[0].id));
  const initial = await page.evaluate(() => __ZERO__.snapshot());
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("z");
  assert.deepEqual(
    (await page.evaluate(() => __ZERO__.snapshot())).state,
    initial.state,
  );
  await page.screenshot({ path: "/tmp/zero-play.png" });
  await page.setViewportSize({ width: 915, height: 412 });
  assert.equal(await page.locator("canvas").getAttribute("height"), "320");
  assert(await page.locator("#controls").isVisible());
  await page.screenshot({ path: "/tmp/zero-landscape.png" });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(
    (process.env.GAME_BASE_URL || "http://localhost:4173") +
      "/blind-is-you/?test=1",
  );
  await page.getByRole("button", { name: "Begin exploration" }).first().tap();
  await page.getByRole("button", { name: "Calibrate", exact: true }).tap();
  for (let i = 0; i < 3; i++) {
    const load = await page.evaluate(
      () => __BIY4__.getSession().calibrationLoad,
    );
    await page.getByRole("button", { name: "Show the trace" }).tap();
    await page.waitForFunction(
      () => document.querySelector("#phase").textContent === "RECONSTRUCT",
    );
    for (let k = 0; k < load; k++) await page.locator(".cell").nth(k).tap();
  }
  // First focus pair, actual touch responses, result withheld until both trials finish.
  for (let i = 0; i < 2; i++) {
    const trial = await page.evaluate(() => __BIY4__.getCurrentTrial());
    assert(trial);
    await page.getByRole("button", { name: "Show the trace" }).tap();
    await page.waitForFunction(
      () => document.querySelector("#phase").textContent === "LOCATE",
    );
    await page
      .locator(`.cell[data-r="${trial.target.r}"][data-c="${trial.target.c}"]`)
      .tap();
    if (
      await page.getByRole("button", { name: "sure", exact: true }).isVisible()
    )
      await page.getByRole("button", { name: "sure", exact: true }).tap();
  }
  await page.waitForSelector(".trace-comparison");
  assert.equal(await page.locator(".trace-grid").count(), 2);
  await page.screenshot({ path: "/tmp/blind-review.png" });
  const pairIndex = await page.evaluate(() => __BIY4__.getSession().pairIndex);
  assert.equal(pairIndex, 1);
  await page
    .getByRole("button", { name: "Return to atlas", exact: true })
    .tap();
  await page
    .getByRole("button", { name: "Resume unfinished expedition" })
    .tap();
  assert.equal(await page.evaluate(() => __BIY4__.getSession().pairIndex), 1);
  await page
    .getByRole("button", { name: "Return to atlas", exact: true })
    .tap();
  // Exit during encoding, start a different expedition: no delayed continuation.
  await page.getByRole("button", { name: "Begin exploration" }).nth(1).tap();
  await page.getByRole("button", { name: "Calibrate", exact: true }).tap();
  await page.getByRole("button", { name: "Show the trace" }).tap();
  await page.getByRole("button", { name: "Exit", exact: true }).tap();
  await page.waitForTimeout(800);
  assert(await page.locator("#home").isVisible());
  assert(!(await page.locator("#modal").isVisible()));
  // Exercise repaired interruption protocol with displayed arrow targets.
  await page.evaluate(() => {
    const protocol = __BIY4__.PROTOCOLS.noise;
    localStorage.setItem(
      "biy_v40_active",
      JSON.stringify({
        build: "4.1.0",
        id: "browser-noise",
        explorationId: "noise",
        protocolVersion: protocol.id,
        phase: "explore",
        frozenLoad: 3,
        calibrationLoad: 3,
        pairIndex: 0,
        pairs: [],
        trials: [],
        counterbalanceState: 0,
      }),
    );
  });
  await page.reload();
  await page.evaluate(() => {
    window.observedArrows = [];
    new MutationObserver(() => {
      const target = document.querySelector(".arrow-target");
      if (target && !target.dataset.seen) {
        target.dataset.seen = "1";
        window.observedArrows.push(target.textContent);
        const side = target.textContent === "←" ? "left" : "right";
        document
          .querySelector(`[data-side="${side}"]`)
          .dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
          );
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page
    .getByRole("button", { name: "Resume unfinished expedition" })
    .tap();
  for (let i = 0; i < 2; i++) {
    const trial = await page.evaluate(() => __BIY4__.getCurrentTrial());
    await page.getByRole("button", { name: "Show the trace" }).tap();
    await page.waitForFunction(
      () => document.querySelector("#phase").textContent === "RECONSTRUCT",
    );
    for (const p of trial.target)
      await page.locator(`.cell[data-r="${p.r}"][data-c="${p.c}"]`).tap();
    if (
      await page.getByRole("button", { name: "sure", exact: true }).isVisible()
    )
      await page.getByRole("button", { name: "sure", exact: true }).tap();
  }
  await page.waitForSelector(".trace-comparison");
  assert.equal(await page.evaluate(() => observedArrows.length), 2);
  assert(await page.evaluate(() => __BIY4__.getSession().pairs[0].valid));
  assert(
    await page.evaluate(() =>
      __BIY4__.getSession().pairs[0].records.every((r) => r.correct),
    ),
  );
  const audit = await page.evaluate(() => __BIY4__.runInputAudit());
  assert(audit.deliberate && audit.swipeRejected && audit.duplicatePrevented);
  assert.deepEqual(errors, []);
  console.log(
    "Browser passed: zero undo/landscape, touch calibration, matched focus pair, review/resume, exit cancellation, input deduplication.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
