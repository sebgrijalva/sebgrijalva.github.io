import assert from "node:assert/strict";
import MatterPackage from "matter-js";

globalThis.Matter = MatterPackage;
const { MatterAdventureScene } = await import("../matter-adventure.js?smoke=1");

const memory = new Map();
const mockEngine = {
  store: {
    get(key, fallback) { return memory.has(key) ? memory.get(key) : fallback; },
    set(key, value) { memory.set(key, value); }
  },
  pointer: { on() {} },
  audio: { unlock() {}, ping() {} }
};

const scene = new MatterAdventureScene();
scene.resize(900, 650, 1);
scene.mount(mockEngine);

assert.equal(scene.physics.world.bodies.length > 30, true, "Matter world should contain the full map");
assert.equal(scene.hero.body.label, "hero");
assert.equal(scene.ship.body.label, "ship");
assert.equal(scene.villains.length, 3);

const startX = scene.hero.body.position.x;
scene.setInput(1, 0);
for (let index = 0; index < 20; index += 1) scene.update(1 / 60);
assert.equal(scene.hero.body.position.x > startX, true, "Matter force should move the hero");

scene.throwPower();
assert.equal(scene.projectiles.length, 1, "Power should create a Matter sensor body");
for (let index = 0; index < 5; index += 1) scene.update(1 / 60);

const beforeErase = scene.marbles.length;
const marble = scene.marbles[0];
scene.toggleErase();
scene.onCanvasDown({
  x: marble.body.position.x - scene.camera.x,
  y: marble.body.position.y - scene.camera.y
});
assert.equal(scene.marbles.length, beforeErase - 1, "Eraser should remove a Matter body");

const beforeMap = scene.mapIndex;
scene.cycleMap();
assert.equal(scene.mapIndex, (beforeMap + 1) % scene.mapNames.length);
assert.equal(scene.physics.world.bodies.length > 30, true, "Map reset should rebuild the Matter world");

console.log(`Matter.js smoke test passed with ${scene.physics.world.bodies.length} bodies.`);
