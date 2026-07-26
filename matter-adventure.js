import { AdventureScene as VisualAdventureScene } from "./adventure.js?v=15";
import { Vec2 } from "./engine.js?v=15";

const M = globalThis.Matter;
if (!M) throw new Error("Matter.js 0.20.0 did not load");

const { Engine, Bodies, Body, Composite, Constraint, Events, Query } = M;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const dynamicKinds = new Set(["hero", "ship", "marble", "villain"]);
const powerColors = { fire: "#fb6a3c", ice: "#67d7f5", lightning: "#fde047" };

function metadata(body) { return body?.plugin?.game || null; }
function middle(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

export class MatterAdventureScene extends VisualAdventureScene {
  constructor() {
    super();
    this.physics = null;
  }

  mount(engine) {
    this.engine = engine;
    this.heroConfig = engine.store.get("hero", this.heroConfig);
    this.shipConfig = engine.store.get("ship", this.shipConfig);
    this.unlocked = new Set(engine.store.get("unlocked", []));
    this.mapIndex = engine.store.get("mapIndex", 0) % this.mapNames.length;
    this.physics = Engine.create({ enableSleeping: false });
    this.physics.gravity.y = 1;
    this.physics.gravity.scale = .001;
    this.physics.positionIterations = 8;
    this.physics.velocityIterations = 6;
    this.physics.constraintIterations = 3;
    Events.on(this.physics, "collisionStart", event => this.handleCollisions(event.pairs));
    engine.pointer.on("down", event => this.onCanvasDown(event.point));
    this.resetMap(false);
  }

  resize(width, height, dpr) {
    const changed = width !== this.width || height !== this.height || dpr !== this.dpr;
    this.width = width;
    this.height = height;
    this.dpr = dpr || 1;
    this.worldW = Math.max(width * 2.35, 1900 * this.dpr);
    this.worldH = Math.max(height * 1.55, 1200 * this.dpr);
    this.groundY = this.worldH - 150 * this.dpr;
    if (changed && this.physics && this.hero) this.resetMap(false);
  }

  addBody(body, kind, ref, erasable = false) {
    body.plugin = body.plugin || {};
    body.plugin.game = { kind, ref, erasable };
    body.plugin.portalCooldown = 0;
    if (ref) ref.body = body;
    Composite.add(this.physics.world, body);
    return body;
  }

  removeBody(body) { if (body) Composite.remove(this.physics.world, body, true); }

  linkDynamic(ref, body) {
    ref.body = body;
    ref.p ||= new Vec2();
    ref.v ||= new Vec2();
    this.syncRef(ref);
    return ref;
  }

  syncRef(ref) {
    if (!ref?.body) return;
    ref.p.set(ref.body.position.x, ref.body.position.y);
    ref.v.set(ref.body.velocity.x, ref.body.velocity.y);
  }

  platformBody(platform) {
    const center = middle(platform.a, platform.b);
    const length = distance(platform.a, platform.b);
    const angle = Math.atan2(platform.b.y - platform.a.y, platform.b.x - platform.a.x);
    this.addBody(Bodies.rectangle(center.x, center.y, length, platform.thickness, {
      isStatic: true, angle, label: "platform", friction: .86, restitution: .12
    }), "platform", platform, platform !== this.platforms[0]);
  }

  resetMap(playSound = true) {
    if (!this.physics || this.width < 10) return;
    this.removeGrapple();
    Composite.clear(this.physics.world, false, true);
    this.buildMapGeometry();

    for (const platform of this.platforms) this.platformBody(platform);
    const wallData = [
      [-50 * this.dpr, this.worldH / 2, 100 * this.dpr, this.worldH * 2],
      [this.worldW + 50 * this.dpr, this.worldH / 2, 100 * this.dpr, this.worldH * 2],
      [this.worldW / 2, -60 * this.dpr, this.worldW * 2, 120 * this.dpr]
    ];
    for (const [x, y, width, height] of wallData) {
      this.addBody(Bodies.rectangle(x, y, width, height, { isStatic: true, label: "wall" }), "wall", null);
    }
    for (const bumper of this.bumpers) {
      this.addBody(Bodies.circle(bumper.p.x, bumper.p.y, bumper.r, {
        isStatic: true, label: "bumper", restitution: 1
      }), "bumper", bumper, true);
    }
    for (const spinner of this.spinners) {
      this.addBody(Bodies.circle(spinner.p.x, spinner.p.y, spinner.r, {
        isStatic: true, label: "spinner", restitution: .8
      }), "spinner", spinner, true);
    }
    for (const portal of this.portals) {
      this.addBody(Bodies.circle(portal.p.x, portal.p.y, portal.r, {
        isStatic: true, isSensor: true, label: "portal"
      }), "portal", portal, true);
    }
    for (const pickup of this.pickups) {
      pickup.body = null;
      if (!pickup.collected) {
        this.addBody(Bodies.circle(pickup.p.x, pickup.p.y, pickup.r + 8 * this.dpr, {
          isStatic: true, isSensor: true, label: "pickup"
        }), "pickup", pickup, true);
      }
    }

    const s = this.dpr;
    this.hero = this.linkDynamic(
      { p: new Vec2(), v: new Vec2(), r: 27 * s, grounded: false, facing: 1 },
      this.addBody(Bodies.circle(180 * s, this.groundY - 70 * s, 27 * s, {
        label: "hero", density: .0024, friction: .035, frictionAir: .035, restitution: .48
      }), "hero", null)
    );
    this.hero.body.plugin.game.ref = this.hero;

    this.ship = this.linkDynamic(
      { p: new Vec2(), v: new Vec2(), r: 41 * s, grounded: false, facing: 1 },
      this.addBody(Bodies.rectangle(330 * s, this.groundY - 80 * s, 82 * s, 48 * s, {
        label: "ship", chamfer: { radius: 15 * s }, density: .0018,
        friction: .03, frictionAir: .025, restitution: .42
      }), "ship", null)
    );
    this.ship.body.plugin.game.ref = this.ship;

    this.marbles = Array.from({ length: 14 }, (_, index) => {
      const marble = {
        p: new Vec2(), v: new Vec2(), r: (14 + index % 3 * 3) * s,
        color: ["#e76f51", "#f2c14e", "#52a78b", "#6487c8", "#a879c8", "#ee8f9e"][index % 6]
      };
      const body = this.addBody(Bodies.circle(
        (450 + index * 85) * s, (180 + index % 4 * 85) * s, marble.r,
        { label: "marble", density: .0015, friction: .005, frictionAir: .007, restitution: .9 }
      ), "marble", marble, true);
      Body.setVelocity(body, { x: (Math.random() - .5) * 3 * s, y: 0 });
      return this.linkDynamic(marble, body);
    });

    this.villains = this.makeVillains();
    for (const villain of this.villains) this.spawnVillainBody(villain);
    this.projectiles = [];
    this.particles = [];
    this.camera.set(0, 0);
    this.grapple = null;
    this.magnetTimer = 0;
    if (playSound) this.engine.audio.ping(440, .12, .025, "triangle");
    this.emitState();
  }

  spawnVillainBody(villain) {
    villain.dead = false;
    villain.hp = villain.maxHp;
    villain.frozen = 0;
    villain.stunned = 0;
    const body = this.addBody(Bodies.circle(villain.spawn.x, villain.spawn.y, villain.r, {
      label: "villain", density: .0018, friction: .04, frictionAir: .03, restitution: .42
    }), "villain", villain, true);
    this.linkDynamic(villain, body);
  }

  removeGrapple() {
    if (this.grapple?.constraint && this.physics) Composite.remove(this.physics.world, this.grapple.constraint, true);
    this.grapple = null;
  }

  switchActive() {
    this.activeKind = this.activeKind === "hero" ? "ship" : "hero";
    this.removeGrapple();
    this.announce(this.activeKind === "hero" ? `${this.heroConfig.name} is exploring` : `${this.shipConfig.name} is active`, 2);
  }

  toggleErase() {
    this.eraseMode = !this.eraseMode;
    this.awaitingGrapple = false;
    this.removeGrapple();
    this.announce(this.eraseMode ? "Eraser ready: tap anything removable" : "Eraser put away", 2.2);
    return this.eraseMode;
  }

  jump() {
    if (this.jumpCooldown > 0) return;
    const entity = this.activeEntity();
    Body.setVelocity(entity.body, {
      x: entity.body.velocity.x + entity.facing * 1.3 * this.dpr,
      y: entity.body.velocity.y - (this.activeKind === "hero" ? 12.5 : 9.5) * this.dpr
    });
    this.jumpCooldown = .38;
    this.engine.audio.unlock();
    this.engine.audio.ping(this.activeKind === "hero" ? 500 : 280, .08, .025, "triangle");
  }

  useTool() {
    if (!this.selectedTool || this.toolCooldown > 0) return;
    const entity = this.activeEntity();
    this.engine.audio.unlock();
    if (this.selectedTool === "magnet") {
      this.magnetTimer = 3.5;
      this.toolCooldown = .8;
      this.announce("Magnet field on: nearby marbles orbit you", 2.5);
    } else if (this.selectedTool === "thruster") {
      const x = Math.abs(this.input.x) > .15 ? this.input.x : entity.facing;
      const y = Math.abs(this.input.y) > .15 ? this.input.y : -.3;
      Body.setVelocity(entity.body, {
        x: entity.body.velocity.x + x * 13 * this.dpr,
        y: entity.body.velocity.y + y * 10 * this.dpr
      });
      this.toolCooldown = .7;
      this.announce("Thruster burst", 1.5);
    } else if (this.selectedTool === "grapple") {
      this.awaitingGrapple = true;
      this.announce("Tap somewhere on the map to grapple", 4);
    }
  }

  throwPower() {
    if (this.powerCooldown > 0) return;
    const entity = this.activeEntity();
    const power = this.selectedPower;
    const direction = new Vec2(
      Math.abs(this.input.x) > .12 ? this.input.x : entity.facing,
      Math.abs(this.input.y) > .12 ? this.input.y : -.12
    ).normalize();
    const radius = (power === "fire" ? 13 : power === "ice" ? 12 : 10) * this.dpr;
    const projectile = {
      power, color: powerColors[power], p: new Vec2(), v: new Vec2(), r: radius,
      life: power === "lightning" ? 1.2 : 2.2, bounces: 0, trail: [], dead: false
    };
    const x = entity.body.position.x + direction.x * (entity.r + radius + 10 * this.dpr);
    const y = entity.body.position.y + direction.y * (entity.r + radius + 10 * this.dpr);
    const body = this.addBody(Bodies.circle(x, y, radius, {
      label: "projectile", isSensor: true, frictionAir: 0, density: .0004
    }), "projectile", projectile, true);
    this.linkDynamic(projectile, body);
    Body.setVelocity(body, {
      x: direction.x * (power === "lightning" ? 22 : 16) * this.dpr,
      y: direction.y * (power === "lightning" ? 22 : 16) * this.dpr
    });
    this.projectiles.push(projectile);
    this.powerCooldown = power === "lightning" ? .45 : .32;
    this.engine.audio.unlock();
    this.engine.audio.ping(power === "fire" ? 180 : power === "ice" ? 640 : 900, .08, .025, power === "fire" ? "sawtooth" : "triangle");
  }

  onCanvasDown(screenPoint) {
    this.engine.audio.unlock();
    const point = new Vec2(screenPoint.x + this.camera.x, screenPoint.y + this.camera.y);
    if (this.eraseMode) return this.eraseAt(point);
    if (!this.awaitingGrapple) return;
    const entity = this.activeEntity();
    if (distance(point, entity.p) > 80 * this.dpr) {
      this.removeGrapple();
      const constraint = Constraint.create({
        pointA: { x: point.x, y: point.y }, bodyB: entity.body,
        length: Math.min(distance(point, entity.p) * .72, 430 * this.dpr),
        stiffness: .018, damping: .09, label: "grapple"
      });
      Composite.add(this.physics.world, constraint);
      this.grapple = { point, constraint, timer: 2.8 };
      this.toolCooldown = .5;
    }
    this.awaitingGrapple = false;
  }

  handleCollisions(pairs) {
    for (const pair of pairs) {
      this.handlePair(pair.bodyA, pair.bodyB);
      this.handlePair(pair.bodyB, pair.bodyA);
    }
  }

  handlePair(specialBody, otherBody) {
    const special = metadata(specialBody);
    const other = metadata(otherBody);
    if (!special || !other) return;
    if (special.kind === "pickup" && ["hero", "ship"].includes(other.kind)) this.collectPickup(special.ref);
    else if (special.kind === "portal" && dynamicKinds.has(other.kind)) this.teleport(special.ref, otherBody);
    else if (special.kind === "projectile" && other.kind === "villain") {
      this.hitMatterVillain(other.ref, special.ref);
      this.removeProjectile(special.ref);
    } else if (special.kind === "bumper" && dynamicKinds.has(other.kind)) {
      const dx = otherBody.position.x - specialBody.position.x;
      const dy = otherBody.position.y - specialBody.position.y;
      const length = Math.hypot(dx, dy) || 1;
      Body.setVelocity(otherBody, {
        x: otherBody.velocity.x + dx / length * 8 * this.dpr,
        y: otherBody.velocity.y + dy / length * 8 * this.dpr
      });
      special.ref.pulse = 1;
    } else if (special.kind === "spinner" && dynamicKinds.has(other.kind)) {
      const dx = otherBody.position.x - specialBody.position.x;
      const dy = otherBody.position.y - specialBody.position.y;
      const length = Math.hypot(dx, dy) || 1;
      Body.setVelocity(otherBody, {
        x: otherBody.velocity.x - dy / length * 8 * this.dpr,
        y: otherBody.velocity.y + dx / length * 8 * this.dpr - 2 * this.dpr
      });
      special.ref.pulse = 1;
    }
  }

  collectPickup(pickup) {
    if (!pickup || pickup.collected) return;
    pickup.collected = true;
    this.unlocked.add(pickup.tool);
    this.engine.store.set("unlocked", [...this.unlocked]);
    if (!this.selectedTool) this.selectedTool = pickup.tool;
    this.removeBody(pickup.body);
    pickup.body = null;
    this.announce(`${pickup.tool[0].toUpperCase()}${pickup.tool.slice(1)} discovered`, 3);
  }

  teleport(portal, body) {
    if ((body.plugin.portalCooldown || 0) > 0) return;
    const mate = this.portals.find(item => item !== portal && item.pair === portal.pair && item.body);
    if (!mate) return;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const direction = speed > .2 ? { x: body.velocity.x / speed, y: body.velocity.y / speed } : { x: 1, y: 0 };
    Body.setPosition(body, {
      x: mate.body.position.x + direction.x * (mate.r + 55 * this.dpr),
      y: mate.body.position.y + direction.y * (mate.r + 55 * this.dpr)
    });
    body.plugin.portalCooldown = .42;
    portal.pulse = mate.pulse = 1;
  }

  update(dt) {
    if (!dt || !this.hero || !this.ship) return;
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    this.toolCooldown = Math.max(0, this.toolCooldown - dt);
    this.powerCooldown = Math.max(0, this.powerCooldown - dt);
    this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    if (this.messageTimer > 0 && (this.messageTimer -= dt) <= 0) {
      this.message = "Explore. Build, bounce, combine tools, and outsmart the villains.";
      this.emitState();
    }
    for (const bumper of this.bumpers) bumper.pulse = Math.max(0, bumper.pulse - dt * 3);
    for (const spinner of this.spinners) {
      spinner.angle += spinner.speed * dt;
      spinner.pulse = Math.max(0, spinner.pulse - dt * 3);
      Body.setAngle(spinner.body, spinner.angle);
    }
    for (const portal of this.portals) portal.pulse = Math.max(0, portal.pulse - dt * 3);

    const active = this.activeEntity();
    const horizontal = this.activeKind === "hero" ? .0018 : .00135;
    const vertical = this.activeKind === "hero" ? .00045 : .00135;
    Body.applyForce(active.body, active.body.position, {
      x: this.input.x * horizontal * active.body.mass * this.dpr,
      y: this.input.y * vertical * active.body.mass * this.dpr
    });
    if (Math.abs(this.input.x) > .08) active.facing = Math.sign(this.input.x);
    if (this.activeKind === "ship" && this.input.y < -.12) {
      Body.applyForce(active.body, active.body.position, { x: 0, y: -.0012 * active.body.mass * this.dpr });
    }
    if (this.grapple && (this.grapple.timer -= dt) <= 0) this.removeGrapple();

    this.updateMatterVillains(dt);
    this.updateMatterProjectiles(dt);
    if (this.magnetTimer > 0) this.applyMatterMagnet(active.body);
    for (const ref of [this.hero, this.ship, ...this.marbles, ...this.villains.filter(v => !v.dead)]) {
      if (ref.body?.plugin) ref.body.plugin.portalCooldown = Math.max(0, (ref.body.plugin.portalCooldown || 0) - dt);
    }

    Engine.update(this.physics, dt * 1000);
    for (const ref of [this.hero, this.ship, ...this.marbles, ...this.villains.filter(v => !v.dead), ...this.projectiles]) this.syncRef(ref);
    this.limitVelocity(this.hero.body, 18, 25);
    this.limitVelocity(this.ship.body, 20, 24);
    this.updateParticles(dt);

    const targetX = clamp(active.p.x - this.width * .48, 0, Math.max(0, this.worldW - this.width));
    const targetY = clamp(active.p.y - this.height * .58, 0, Math.max(0, this.worldH - this.height));
    this.camera.x += (targetX - this.camera.x) * Math.min(1, dt * 5);
    this.camera.y += (targetY - this.camera.y) * Math.min(1, dt * 5);
  }

  limitVelocity(body, maxX, maxY) {
    const x = clamp(body.velocity.x, -maxX * this.dpr, maxX * this.dpr);
    const y = clamp(body.velocity.y, -maxY * this.dpr, maxY * this.dpr);
    if (x !== body.velocity.x || y !== body.velocity.y) Body.setVelocity(body, { x, y });
  }

  updateMatterVillains(dt) {
    const target = this.activeEntity().body;
    for (const villain of this.villains) {
      if (villain.dead) {
        villain.respawn -= dt;
        if (villain.respawn <= 0) this.spawnVillainBody(villain);
        continue;
      }
      villain.frozen = Math.max(0, villain.frozen - dt);
      villain.stunned = Math.max(0, villain.stunned - dt);
      villain.think -= dt;
      villain.body.frictionAir = villain.frozen > 0 ? .22 : .03;
      if (villain.frozen > 0 || villain.stunned > 0) continue;
      const dx = target.position.x - villain.body.position.x;
      if (Math.abs(dx) < 650 * this.dpr) {
        villain.facing = Math.sign(dx) || villain.facing;
        Body.applyForce(villain.body, villain.body.position, {
          x: Math.sign(dx) * (villain.type === "monster" ? .0014 : .0019) * villain.body.mass * this.dpr,
          y: 0
        });
      }
      if (villain.think <= 0) {
        villain.think = 1.1 + Math.random() * 1.8;
        if (Math.random() < .48) Body.setVelocity(villain.body, {
          x: villain.body.velocity.x + villain.facing * 1.2 * this.dpr,
          y: villain.body.velocity.y - (6.5 + Math.random() * 3) * this.dpr
        });
      }
    }
  }

  updateMatterProjectiles(dt) {
    for (const projectile of [...this.projectiles]) {
      if (projectile.dead || !projectile.body) continue;
      projectile.life -= dt;
      projectile.trail.push(projectile.p.clone());
      if (projectile.trail.length > 9) projectile.trail.shift();
      Body.applyForce(projectile.body, projectile.body.position, {
        x: 0, y: -projectile.body.mass * this.physics.gravity.y * this.physics.gravity.scale
      });
      const p = projectile.body.position;
      if (projectile.life <= 0 || p.x < -100 || p.x > this.worldW + 100 || p.y < -150 || p.y > this.worldH + 120) this.removeProjectile(projectile);
    }
  }

  removeProjectile(projectile) {
    if (!projectile || projectile.dead) return;
    projectile.dead = true;
    this.removeBody(projectile.body);
    projectile.body = null;
    this.projectiles = this.projectiles.filter(item => item !== projectile);
  }

  hitMatterVillain(villain, projectile) {
    if (!villain || villain.dead) return;
    villain.hp -= projectile.power === "fire" ? 2 : 1;
    if (projectile.power === "ice") villain.frozen = Math.max(villain.frozen, 2.6);
    if (projectile.power === "lightning") villain.stunned = Math.max(villain.stunned, 1.5);
    if (projectile.power === "fire") Body.setVelocity(villain.body, {
      x: villain.body.velocity.x + this.activeEntity().facing * 5 * this.dpr,
      y: villain.body.velocity.y - 4 * this.dpr
    });
    this.spawnPoof(villain.p, powerColors[projectile.power], 12);
    if (villain.hp <= 0) this.defeatMatterVillain(villain);
  }

  defeatMatterVillain(villain) {
    if (!villain || villain.dead) return;
    villain.dead = true;
    villain.respawn = 4.2;
    this.removeBody(villain.body);
    villain.body = null;
    this.spawnPoof(villain.p, villain.type === "monster" ? "#84cc16" : "#f8fafc", 18);
    this.announce(`${villain.type === "monster" ? "Monster" : "Skeleton"} poofed. It will rebuild soon.`, 2.5);
  }

  applyMatterMagnet(activeBody) {
    for (const marble of this.marbles) {
      const dx = activeBody.position.x - marble.body.position.x;
      const dy = activeBody.position.y - marble.body.position.y;
      const length = Math.hypot(dx, dy);
      if (length < 320 * this.dpr && length > 15 * this.dpr) {
        const force = (1 - length / (320 * this.dpr)) * .0018 * marble.body.mass * this.dpr;
        Body.applyForce(marble.body, marble.body.position, { x: dx / length * force, y: dy / length * force });
      }
    }
  }

  eraseAt(point) {
    const hits = Query.point(Composite.allBodies(this.physics.world), point)
      .map(body => ({ body, game: metadata(body) }))
      .filter(item => item.game?.erasable);
    if (!hits.length) return this.announce("Nothing removable there", 1.3);
    const priority = { villain: 0, projectile: 1, marble: 2, bumper: 3, spinner: 4, portal: 5, pickup: 6, platform: 7 };
    hits.sort((a, b) => (priority[a.game.kind] ?? 9) - (priority[b.game.kind] ?? 9));
    const { body, game } = hits[0];
    const ref = game.ref;
    if (game.kind === "villain") this.defeatMatterVillain(ref);
    else if (game.kind === "projectile") this.removeProjectile(ref);
    else if (game.kind === "marble") { this.removeBody(body); this.marbles = this.marbles.filter(item => item !== ref); }
    else if (game.kind === "portal") {
      for (const portal of this.portals.filter(item => item.pair === ref.pair)) this.removeBody(portal.body);
      this.portals = this.portals.filter(item => item.pair !== ref.pair);
    } else if (game.kind === "pickup") { this.removeBody(body); ref.body = null; ref.collected = true; }
    else {
      this.removeBody(body);
      if (game.kind === "bumper") this.bumpers = this.bumpers.filter(item => item !== ref);
      if (game.kind === "spinner") this.spinners = this.spinners.filter(item => item !== ref);
      if (game.kind === "platform") this.platforms = this.platforms.filter(item => item !== ref);
    }
    this.spawnPoof(point, "#f9a8d4", 8);
  }
}
