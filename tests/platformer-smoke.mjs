import assert from "node:assert/strict";
import MatterPackage from "matter-js";

globalThis.Matter = MatterPackage;
const { PlatformerScene } = await import("../platformer-v16.js?smoke=1");

const memory = new Map();
const mockEngine = {
  store: {
    get(key, fallback) { return memory.has(key) ? memory.get(key) : fallback; },
    set(key, value) { memory.set(key, value); }
  },
  pointer: { on() {} },
  audio: { unlock() {}, ping() {} }
};

const scene = new PlatformerScene();
scene.resize(900, 650, 1);
scene.mount(mockEngine);

assert.equal(scene.worldW > 4000, true, "Level should be a long side-scrolling world");
assert.equal(scene.marbles.length, 0, "Marbles should be removed");
assert.equal(scene.villains.length >= 8, true, "Level should contain a sequence of enemies");
assert.equal(scene.checkpoints.length, 2, "Level should have checkpoints");
assert.equal(Boolean(scene.goal?.body), true, "Level should have a Matter goal sensor");
assert.equal(scene.physics.world.bodies.length > 25, true, "Matter world should contain platforms, sensors, actors, and enemies");

const startX = scene.hero.body.position.x;
scene.setInput(1, 0);
for (let index = 0; index < 30; index += 1) scene.update(1 / 60);
assert.equal(scene.hero.body.position.x > startX, true, "Hero should move forward under Matter forces");

const firstVillain = scene.villains.find(villain => !villain.dead);
scene.defeatMatterVillain(firstVillain);
assert.equal(scene.kills, 1, "Defeating a villain should increment the kill score");
assert.equal(scene.bestKills, 1, "Best score should update");

const secondVillain = scene.villains.find(villain => !villain.dead);
scene.toggleErase();
scene.onCanvasDown({
  x: secondVillain.body.position.x - scene.camera.x,
  y: secondVillain.body.position.y - scene.camera.y
});
assert.equal(scene.kills, 1, "Erasing a villain should not count as a kill");

scene.activateCheckpoint(scene.checkpoints[0]);
assert.equal(scene.checkpointIndex, 1, "Checkpoint should activate");
scene.finishLevel();
assert.equal(scene.levelComplete, true, "Goal should clear the level");

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

const beforeMap = scene.mapIndex;
scene.cycleMap();
assert.equal(scene.mapIndex, (beforeMap + 1) % scene.mapNames.length, "Map button should advance worlds");
assert.equal(scene.marbles.length, 0, "New worlds should also contain no marbles");
assert.equal(scene.kills, 0, "New level should reset the current kill score");
assert.equal(scene.goal.body.label, "goal", "Goal sensor should rebuild on map change");

console.log(`Platformer smoke test passed with ${scene.physics.world.bodies.length} Matter bodies.`);
