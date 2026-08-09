import assert from "node:assert/strict";
import MatterPackage from "matter-js";

globalThis.Matter = MatterPackage;
const { PlatformerScene } = await import("../platformer-v18.js?smoke=18");

const memory = new Map();
const engine = {
  store: {
    get(key, fallback) { return memory.has(key) ? memory.get(key) : fallback; },
    set(key, value) { memory.set(key, value); }
  },
  pointer: { on() {} },
  audio: { unlock() {}, ping() {} }
};

const scene = new PlatformerScene();
scene.resize(900, 650, 1);
scene.mount(engine);

assert.equal(scene.marbles.length, 0, "v18 must remain marble-free");
assert.equal(scene.chemistry.length, 3, "Each world should have three elemental reaction sites");
assert.equal(scene.relics.length, 3, "Each world should contain three relics");
assert.equal(Boolean(scene.boss?.body), true, "v17 boss must survive the v18 extension");

const iceNode = scene.chemistry.find(node => node.kind === "ice");
const platformCount = scene.platforms.length;
scene.reactChemistry(iceNode, { power: "ice", color: "#67e8f9", dead: false });
assert.equal(iceNode.solved, true);
assert.equal(scene.platforms.length, platformCount + 1, "Ice should create a real Matter platform");

const boltNode = scene.chemistry.find(node => node.kind === "lightning");
scene.reactChemistry(boltNode, { power: "lightning", color: "#fde047", dead: false });
assert.equal(scene.launchPads.length, 1, "Lightning should create a launch route");

scene.selectBuildPart("block");
scene.placeBuildPart({ x: 500, y: scene.groundY - 120 });
scene.selectBuildPart("wheel");
scene.placeBuildPart({ x: 530, y: scene.groundY - 80 });
scene.selectBuildPart("rocket");
scene.placeBuildPart({ x: 570, y: scene.groundY - 120 });
assert.equal(scene.buildParts.length, 3, "Inventor lab should create Matter bodies");
assert.equal(scene.buildConstraints.length >= 2, true, "Nearby parts should auto-snap with Matter constraints");
scene.toggleMachine();
assert.equal(scene.machineRunning, true, "Contraption should have a GO state");

for (const relic of [...scene.relics]) scene.collectRelic(relic);
assert.equal(scene.currentRelics(), 3);
assert.equal(scene.masteryActive, true, "Three relics should unlock persistent world mastery");
assert.equal(memory.get("v18MasteredWorlds").includes(scene.mapIndex), true);

const startX = scene.hero.body.position.x;
scene.setInput(1, 0);
for (let i = 0; i < 25; i += 1) scene.update(1 / 60);
assert.equal(scene.hero.body.position.x > startX, true, "Hero should still move under Matter physics");

const gradient = { addColorStop() {} };
const ctx = new Proxy({}, {
  get(target, prop) {
    if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => gradient;
    if (prop === "measureText") return () => ({ width: 0 });
    if (!(prop in target)) target[prop] = () => {};
    return target[prop];
  },
  set(target, prop, value) { target[prop] = value; return true; }
});
scene.render(ctx);

console.log(`v18 smoke test passed: ${scene.buildParts.length} machine parts, ${scene.currentRelics()}/3 relics, chemistry ${scene.chemistryStatus().join(",")}.`);
