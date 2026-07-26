import { Vec2, TAU } from "./engine.js?v=13";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const COLORS = ["#e76f51", "#f2c14e", "#52a78b", "#6487c8", "#a879c8", "#ee8f9e"];

function pointSegment(p, a, b) {
  const ab = Vec2.sub(b, a);
  const ap = Vec2.sub(p, a);
  const t = clamp(Vec2.dot(ap, ab) / (Vec2.dot(ab, ab) || 1), 0, 1);
  const q = new Vec2(a.x + ab.x * t, a.y + ab.y * t);
  return { distance: distance(p, q), point: q };
}

export class AdventureScene {
  constructor() {
    this.engine = null;
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.worldW = 2000;
    this.worldH = 1300;
    this.groundY = 1100;
    this.camera = new Vec2();
    this.mapIndex = 0;
    this.mapNames = ["Meadow", "Harbor", "Sky City"];
    this.input = new Vec2();
    this.jumpCooldown = 0;
    this.toolCooldown = 0;
    this.activeKind = "hero";
    this.selectedTool = null;
    this.awaitingGrapple = false;
    this.grapple = null;
    this.magnetTimer = 0;
    this.message = "Explore. Tools are hidden across the map.";
    this.messageTimer = 8;
    this.onStateChange = null;
    this.heroConfig = { name: "Tomás", type: "hero", color: "#3b82f6", accent: "#facc15", cape: true, emblem: "star", helmet: "visor" };
    this.shipConfig = { name: "Comet", hull: "rocket", color: "#ef4444", accent: "#e5e7eb", wings: "swept" };
    this.unlocked = new Set();
    this.platforms = [];
    this.bumpers = [];
    this.spinners = [];
    this.portals = [];
    this.pickups = [];
    this.marbles = [];
    this.hero = null;
    this.ship = null;
  }

  mount(engine) {
    this.engine = engine;
    this.heroConfig = engine.store.get("hero", this.heroConfig);
    this.shipConfig = engine.store.get("ship", this.shipConfig);
    this.unlocked = new Set(engine.store.get("unlocked", []));
    this.mapIndex = engine.store.get("mapIndex", 0) % this.mapNames.length;
    engine.pointer.on("down", e => this.onCanvasDown(e.point));
    this.resetMap(false);
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.worldW = Math.max(width * 2.35, 1900 * dpr);
    this.worldH = Math.max(height * 1.55, 1200 * dpr);
    this.groundY = this.worldH - 150 * dpr;
    if (this.hero) this.clampEntity(this.hero);
    if (this.ship) this.clampEntity(this.ship);
    this.buildMapGeometry();
  }

  setStateListener(listener) { this.onStateChange = listener; this.emitState(); }
  emitState() {
    this.onStateChange?.({
      activeKind: this.activeKind,
      activeName: this.activeKind === "hero" ? this.heroConfig.name : this.shipConfig.name,
      mapName: this.mapNames[this.mapIndex],
      selectedTool: this.selectedTool,
      unlocked: [...this.unlocked],
      message: this.message
    });
  }
  announce(text, seconds = 3.5) { this.message = text; this.messageTimer = seconds; this.emitState(); }

  updateHero(config) { this.heroConfig = { ...this.heroConfig, ...config }; this.engine.store.set("hero", this.heroConfig); this.emitState(); }
  updateShip(config) { this.shipConfig = { ...this.shipConfig, ...config }; this.engine.store.set("ship", this.shipConfig); this.emitState(); }
  setInput(x, y) { this.input.set(x, y); }
  selectTool(tool) { if (!this.unlocked.has(tool)) return; this.selectedTool = tool; this.awaitingGrapple = false; this.emitState(); }

  switchActive() {
    this.activeKind = this.activeKind === "hero" ? "ship" : "hero";
    this.grapple = null;
    this.announce(this.activeKind === "hero" ? `${this.heroConfig.name} is exploring` : `${this.shipConfig.name} is active`, 2);
  }

  cycleMap() {
    this.mapIndex = (this.mapIndex + 1) % this.mapNames.length;
    this.engine.store.set("mapIndex", this.mapIndex);
    this.resetMap(true);
    this.announce(`${this.mapNames[this.mapIndex]} discovered`, 3);
  }

  resetMap(playSound = true) {
    this.buildMapGeometry();
    const s = this.dpr || 1;
    this.hero = { p: new Vec2(180 * s, this.groundY - 40 * s), v: new Vec2(), r: 27 * s, grounded: false, facing: 1 };
    this.ship = { p: new Vec2(330 * s, this.groundY - 50 * s), v: new Vec2(), r: 40 * s, grounded: false, facing: 1 };
    this.marbles = Array.from({ length: 14 }, (_, i) => ({
      p: new Vec2((450 + i * 85) * s, (180 + (i % 4) * 85) * s),
      v: new Vec2((Math.random() - .5) * 100 * s, 0),
      r: (14 + (i % 3) * 3) * s,
      color: COLORS[i % COLORS.length]
    }));
    this.camera.set(0, 0);
    this.grapple = null;
    this.magnetTimer = 0;
    if (playSound) this.engine.audio.ping(440, .12, .025, "triangle");
  }

  buildMapGeometry() {
    if (this.width < 10) return;
    const s = this.dpr || 1;
    const W = this.worldW;
    const G = this.groundY;
    this.platforms = [
      { a: new Vec2(0, G), b: new Vec2(W, G), thickness: 28 * s },
      { a: new Vec2(420 * s, G - 80 * s), b: new Vec2(700 * s, G - 220 * s), thickness: 16 * s },
      { a: new Vec2(830 * s, G - 160 * s), b: new Vec2(1110 * s, G - 160 * s), thickness: 16 * s },
      { a: new Vec2(1240 * s, G - 110 * s), b: new Vec2(1510 * s, G - 290 * s), thickness: 16 * s },
      { a: new Vec2(1630 * s, G - 320 * s), b: new Vec2(1880 * s, G - 320 * s), thickness: 16 * s }
    ];
    this.bumpers = [
      { p: new Vec2(760 * s, G - 55 * s), r: 35 * s, pulse: 0 },
      { p: new Vec2(1570 * s, G - 55 * s), r: 38 * s, pulse: 0 }
    ];
    this.spinners = [
      { p: new Vec2(1040 * s, G - 225 * s), r: 32 * s, angle: 0, speed: 2.6, pulse: 0 }
    ];
    this.portals = [
      { p: new Vec2(560 * s, G - 45 * s), r: 30 * s, pair: 1, color: "#8b5cf6", pulse: 0 },
      { p: new Vec2(1760 * s, G - 365 * s), r: 30 * s, pair: 1, color: "#8b5cf6", pulse: 0 }
    ];
    const mapTools = [
      [
        { tool: "magnet", p: new Vec2(990 * s, G - 245 * s), color: "#2563eb" },
        { tool: "grapple", p: new Vec2(1450 * s, G - 340 * s), color: "#f97316" },
        { tool: "thruster", p: new Vec2(1830 * s, G - 375 * s), color: "#ef4444" }
      ],
      [
        { tool: "grapple", p: new Vec2(690 * s, G - 270 * s), color: "#f97316" },
        { tool: "magnet", p: new Vec2(1220 * s, G - 210 * s), color: "#2563eb" },
        { tool: "thruster", p: new Vec2(1810 * s, G - 375 * s), color: "#ef4444" }
      ],
      [
        { tool: "thruster", p: new Vec2(690 * s, G - 270 * s), color: "#ef4444" },
        { tool: "grapple", p: new Vec2(1180 * s, G - 240 * s), color: "#f97316" },
        { tool: "magnet", p: new Vec2(1810 * s, G - 375 * s), color: "#2563eb" }
      ]
    ];
    this.pickups = mapTools[this.mapIndex].map(item => ({ ...item, r: 24 * s, pulse: 0, collected: this.unlocked.has(item.tool) }));
  }

  activeEntity() { return this.activeKind === "hero" ? this.hero : this.ship; }

  jump() {
    if (this.jumpCooldown > 0) return;
    const entity = this.activeEntity();
    entity.v.y -= (this.activeKind === "hero" ? 540 : 420) * this.dpr;
    entity.v.x += entity.facing * 45 * this.dpr;
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
      this.engine.audio.ping(220, .18, .025, "sine");
    } else if (this.selectedTool === "thruster") {
      const dx = Math.abs(this.input.x) > .15 ? this.input.x : entity.facing;
      const dy = Math.abs(this.input.y) > .15 ? this.input.y : -.25;
      entity.v.x += dx * 680 * this.dpr;
      entity.v.y += dy * 460 * this.dpr;
      this.toolCooldown = .7;
      this.announce("Thruster burst", 1.5);
      this.engine.audio.ping(130, .18, .035, "sawtooth");
    } else if (this.selectedTool === "grapple") {
      this.awaitingGrapple = true;
      this.announce("Tap somewhere on the map to grapple", 4);
      this.engine.audio.ping(560, .05, .02, "square");
    }
  }

  onCanvasDown(screenPoint) {
    this.engine.audio.unlock();
    if (!this.awaitingGrapple) return;
    const worldPoint = new Vec2(screenPoint.x + this.camera.x, screenPoint.y + this.camera.y);
    const entity = this.activeEntity();
    const delta = Vec2.sub(worldPoint, entity.p);
    if (delta.length() > 80 * this.dpr) {
      this.grapple = { point: worldPoint, timer: 2.5 };
      this.toolCooldown = .5;
      this.engine.audio.ping(660, .08, .025, "square");
    }
    this.awaitingGrapple = false;
  }

  update(dt) {
    if (!dt || !this.hero || !this.ship) return;
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    this.toolCooldown = Math.max(0, this.toolCooldown - dt);
    this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) { this.message = "Explore. Build, bounce, and combine tools."; this.emitState(); }
    }
    for (const b of this.bumpers) b.pulse = Math.max(0, b.pulse - dt * 3);
    for (const s of this.spinners) { s.angle += s.speed * dt; s.pulse = Math.max(0, s.pulse - dt * 3); }
    for (const p of this.portals) p.pulse = Math.max(0, p.pulse - dt * 3);
    for (const p of this.pickups) p.pulse = Math.max(0, p.pulse - dt * 2.5);

    const active = this.activeEntity();
    const accel = this.activeKind === "hero" ? 620 : 430;
    active.v.x += this.input.x * accel * this.dpr * dt;
    active.v.y += this.input.y * accel * .45 * this.dpr * dt;
    if (Math.abs(this.input.x) > .08) active.facing = Math.sign(this.input.x);

    if (this.grapple) {
      this.grapple.timer -= dt;
      const pull = Vec2.sub(this.grapple.point, active.p);
      const len = pull.length();
      if (len > 25 * this.dpr) active.v.add(pull.normalize().mul(900 * this.dpr * dt));
      if (this.grapple.timer <= 0 || len < 35 * this.dpr) this.grapple = null;
    }

    this.stepEntity(this.hero, dt, 1);
    this.stepEntity(this.ship, dt, .78);
    for (const marble of this.marbles) this.stepMarble(marble, dt);
    this.collideHeroShip();
    this.handlePickups(active);
    this.handlePortals(active);
    if (this.magnetTimer > 0) this.applyMagnet(active, dt);

    const targetX = clamp(active.p.x - this.width * .48, 0, Math.max(0, this.worldW - this.width));
    const targetY = clamp(active.p.y - this.height * .58, 0, Math.max(0, this.worldH - this.height));
    this.camera.x += (targetX - this.camera.x) * Math.min(1, dt * 5);
    this.camera.y += (targetY - this.camera.y) * Math.min(1, dt * 5);
  }

  stepEntity(entity, dt, bounce) {
    entity.v.y += 980 * this.dpr * dt;
    entity.v.mul(Math.pow(.993, dt * 60));
    entity.p.x += entity.v.x * dt;
    entity.p.y += entity.v.y * dt;
    entity.grounded = false;
    this.collideWorld(entity, bounce);
    this.clampEntity(entity);
  }

  stepMarble(m, dt) {
    m.v.y += 980 * this.dpr * dt;
    m.v.mul(Math.pow(.995, dt * 60));
    m.p.x += m.v.x * dt;
    m.p.y += m.v.y * dt;
    this.collideWorld(m, .84);
    this.clampEntity(m);
    for (const b of this.bumpers) this.collideBumper(m, b, 1.25);
    for (const s of this.spinners) this.collideSpinner(m, s);
  }

  collideWorld(entity, bounce) {
    for (const platform of this.platforms) {
      const hit = pointSegment(entity.p, platform.a, platform.b);
      const min = entity.r + platform.thickness * .5;
      if (hit.distance < min && hit.distance > .001) {
        const normal = Vec2.sub(entity.p, hit.point).normalize();
        entity.p.add(normal.clone().mul(min - hit.distance + .5));
        const vn = Vec2.dot(entity.v, normal);
        if (vn < 0) {
          entity.v.sub(normal.clone().mul((1 + bounce) * vn));
          if (normal.y < -.45) entity.grounded = true;
        }
      }
    }
    for (const b of this.bumpers) this.collideBumper(entity, b, 1.12);
    for (const s of this.spinners) this.collideSpinner(entity, s);
  }

  collideBumper(entity, bumper, power) {
    const d = Vec2.sub(entity.p, bumper.p);
    const len = d.length() || .001;
    const min = entity.r + bumper.r;
    if (len >= min) return;
    const n = d.mul(1 / len);
    entity.p.add(n.clone().mul(min - len + 1));
    entity.v.add(n.clone().mul(360 * power * this.dpr));
    bumper.pulse = 1;
  }

  collideSpinner(entity, spinner) {
    const d = Vec2.sub(entity.p, spinner.p);
    const len = d.length() || .001;
    const min = entity.r + spinner.r;
    if (len >= min) return;
    const n = d.mul(1 / len);
    const tangent = new Vec2(-n.y, n.x);
    entity.p.add(n.clone().mul(min - len + 1));
    entity.v.add(tangent.mul(250 * this.dpr)).add(n.clone().mul(80 * this.dpr));
    spinner.pulse = 1;
  }

  collideHeroShip() {
    const d = Vec2.sub(this.ship.p, this.hero.p);
    const len = d.length() || .001;
    const min = this.ship.r + this.hero.r;
    if (len >= min) return;
    const n = d.mul(1 / len);
    const overlap = (min - len) * .5;
    this.hero.p.add(n.clone().mul(-overlap));
    this.ship.p.add(n.clone().mul(overlap));
    const rel = Vec2.dot(Vec2.sub(this.ship.v, this.hero.v), n);
    if (rel < 0) {
      this.hero.v.add(n.clone().mul(rel * .6));
      this.ship.v.add(n.clone().mul(-rel * .6));
    }
  }

  clampEntity(entity) {
    entity.p.x = clamp(entity.p.x, entity.r, this.worldW - entity.r);
    entity.p.y = clamp(entity.p.y, entity.r, this.worldH - entity.r);
    if (entity.p.x <= entity.r && entity.v.x < 0) entity.v.x *= -.65;
    if (entity.p.x >= this.worldW - entity.r && entity.v.x > 0) entity.v.x *= -.65;
    if (entity.p.y <= entity.r && entity.v.y < 0) entity.v.y *= -.65;
    if (entity.p.y >= this.worldH - entity.r && entity.v.y > 0) entity.v.y *= -.65;
  }

  handlePickups(entity) {
    for (const pickup of this.pickups) {
      if (pickup.collected || distance(entity.p, pickup.p) > entity.r + pickup.r + 8 * this.dpr) continue;
      pickup.collected = true;
      pickup.pulse = 1;
      this.unlocked.add(pickup.tool);
      this.engine.store.set("unlocked", [...this.unlocked]);
      if (!this.selectedTool) this.selectedTool = pickup.tool;
      const labels = { magnet: "MAGNET", grapple: "GRAPPLE", thruster: "THRUSTER" };
      this.announce(`${labels[pickup.tool]} unlocked. Try combining it with ramps and portals.`, 5);
      this.engine.audio.ping(760, .18, .035, "triangle");
      this.emitState();
    }
  }

  handlePortals(entity) {
    if (entity.portalCooldown > 0) { entity.portalCooldown -= 1 / 30; return; }
    for (const portal of this.portals) {
      if (distance(entity.p, portal.p) > entity.r + portal.r * .45) continue;
      const mate = this.portals.find(p => p.pair === portal.pair && p !== portal);
      if (!mate) return;
      const direction = entity.v.length() > 15 ? entity.v.clone().normalize() : new Vec2(1, 0);
      entity.p = mate.p.clone().add(direction.clone().mul(entity.r + mate.r + 8 * this.dpr));
      entity.v.add(direction.mul(150 * this.dpr));
      entity.portalCooldown = .4;
      portal.pulse = mate.pulse = 1;
      this.engine.audio.ping(690, .08, .025, "triangle");
      return;
    }
  }

  applyMagnet(entity, dt) {
    for (const marble of this.marbles) {
      const d = Vec2.sub(entity.p, marble.p);
      const len = d.length();
      if (len < 340 * this.dpr && len > 18 * this.dpr) marble.v.add(d.normalize().mul(900 * this.dpr * dt));
    }
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = "#dcecf2";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.translate(-this.camera.x, -this.camera.y);
    this.drawMap(ctx);
    for (const platform of this.platforms) this.drawPlatform(ctx, platform);
    for (const pickup of this.pickups) if (!pickup.collected) this.drawPickup(ctx, pickup);
    for (const bumper of this.bumpers) this.drawBumper(ctx, bumper);
    for (const spinner of this.spinners) this.drawSpinner(ctx, spinner);
    for (const portal of this.portals) this.drawPortal(ctx, portal);
    if (this.grapple) this.drawGrapple(ctx);
    for (const marble of this.marbles) this.drawMarble(ctx, marble);
    this.drawShip(ctx, this.ship, this.shipConfig, this.activeKind === "ship");
    this.drawHero(ctx, this.hero, this.heroConfig, this.activeKind === "hero");
    ctx.restore();
  }

  drawMap(ctx) {
    const W = this.worldW, H = this.worldH, G = this.groundY;
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    if (this.mapIndex === 0) { gradient.addColorStop(0, "#dff4ff"); gradient.addColorStop(.65, "#f7f2d8"); gradient.addColorStop(1, "#b6d98d"); }
    else if (this.mapIndex === 1) { gradient.addColorStop(0, "#ccecff"); gradient.addColorStop(.62, "#f4e1bd"); gradient.addColorStop(1, "#91c9dc"); }
    else { gradient.addColorStop(0, "#bfe9ff"); gradient.addColorStop(.65, "#f4dcff"); gradient.addColorStop(1, "#d7c7a3"); }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    if (this.mapIndex === 0) {
      ctx.fillStyle = "rgba(90,160,80,.28)";
      for (const [x, y, rx, ry] of [[300, 870, 240, 90], [900, 960, 320, 120], [1600, 870, 330, 130]]) {
        ctx.beginPath(); ctx.ellipse(x * this.dpr, y * this.dpr, rx * this.dpr, ry * this.dpr, 0, 0, TAU); ctx.fill();
      }
      this.drawTree(ctx, 260 * this.dpr, G - 20 * this.dpr, 1.3 * this.dpr);
      this.drawTree(ctx, 1360 * this.dpr, G - 20 * this.dpr, 1.6 * this.dpr);
      this.drawHouse(ctx, 90 * this.dpr, G - 80 * this.dpr, this.dpr);
    } else if (this.mapIndex === 1) {
      ctx.fillStyle = "rgba(65,160,200,.32)";
      ctx.fillRect(0, G - 45 * this.dpr, W, H - G + 80 * this.dpr);
      this.drawLighthouse(ctx, 1800 * this.dpr, G - 390 * this.dpr, 1.3 * this.dpr);
      this.drawDock(ctx, 80 * this.dpr, G - 10 * this.dpr, 1.4 * this.dpr);
      this.drawBoat(ctx, 1160 * this.dpr, G + 30 * this.dpr, this.dpr);
    } else {
      this.drawCloud(ctx, 300 * this.dpr, 250 * this.dpr, 1.4 * this.dpr);
      this.drawCloud(ctx, 1000 * this.dpr, 180 * this.dpr, 1.15 * this.dpr);
      this.drawCloud(ctx, 1650 * this.dpr, 300 * this.dpr, 1.6 * this.dpr);
      this.drawBalloon(ctx, 260 * this.dpr, 680 * this.dpr, 1.1 * this.dpr);
      this.drawBalloon(ctx, 1450 * this.dpr, 570 * this.dpr, 1.25 * this.dpr);
    }

    ctx.globalAlpha = .12;
    ctx.strokeStyle = "#5f6470";
    ctx.lineWidth = this.dpr;
    const gap = 80 * this.dpr;
    for (let x = 0; x < W; x += gap) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  drawPlatform(ctx, platform) {
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(40,30,20,.18)";
    ctx.lineWidth = platform.thickness + 7 * this.dpr;
    ctx.beginPath(); ctx.moveTo(platform.a.x + 3 * this.dpr, platform.a.y + 5 * this.dpr); ctx.lineTo(platform.b.x + 3 * this.dpr, platform.b.y + 5 * this.dpr); ctx.stroke();
    ctx.strokeStyle = this.mapIndex === 1 ? "#8d6e4d" : "#9a6a3c";
    ctx.lineWidth = platform.thickness;
    ctx.beginPath(); ctx.moveTo(platform.a.x, platform.a.y); ctx.lineTo(platform.b.x, platform.b.y); ctx.stroke();
  }

  drawHero(ctx, entity, config, active) {
    if (!entity) return;
    ctx.save();
    ctx.translate(entity.p.x, entity.p.y);
    ctx.scale(entity.facing, 1);
    if (active) { ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 6 * this.dpr; ctx.beginPath(); ctx.arc(0, 0, entity.r + 8 * this.dpr, 0, TAU); ctx.stroke(); }
    if (config.cape) {
      ctx.fillStyle = config.accent;
      ctx.beginPath(); ctx.moveTo(-10 * this.dpr, -8 * this.dpr); ctx.quadraticCurveTo(-40 * this.dpr, 5 * this.dpr, -32 * this.dpr, 34 * this.dpr); ctx.lineTo(-5 * this.dpr, 20 * this.dpr); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = config.color;
    if (config.type === "robot") ctx.fillRect(-18 * this.dpr, -12 * this.dpr, 36 * this.dpr, 38 * this.dpr);
    else {
      ctx.beginPath(); ctx.roundRect(-18 * this.dpr, -12 * this.dpr, 36 * this.dpr, 38 * this.dpr, 12 * this.dpr); ctx.fill();
    }
    ctx.fillStyle = "#f2c7a5";
    if (config.type === "alien") ctx.fillStyle = "#9adf9c";
    if (config.type === "robot") ctx.fillStyle = "#cbd5e1";
    ctx.beginPath(); ctx.arc(0, -23 * this.dpr, 16 * this.dpr, 0, TAU); ctx.fill();
    ctx.fillStyle = config.helmet === "open" ? "transparent" : config.accent;
    if (config.helmet !== "open") { ctx.beginPath(); ctx.arc(0, -25 * this.dpr, 17 * this.dpr, Math.PI, TAU); ctx.fill(); }
    ctx.fillStyle = "#172033";
    if (config.helmet === "visor") ctx.fillRect(-11 * this.dpr, -28 * this.dpr, 22 * this.dpr, 7 * this.dpr);
    else { ctx.beginPath(); ctx.arc(-5 * this.dpr, -24 * this.dpr, 2.5 * this.dpr, 0, TAU); ctx.arc(5 * this.dpr, -24 * this.dpr, 2.5 * this.dpr, 0, TAU); ctx.fill(); }
    if (config.helmet === "antenna") { ctx.strokeStyle = config.accent; ctx.lineWidth = 3 * this.dpr; ctx.beginPath(); ctx.moveTo(0, -40 * this.dpr); ctx.lineTo(0, -52 * this.dpr); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -55 * this.dpr, 4 * this.dpr, 0, TAU); ctx.fill(); }
    ctx.fillStyle = config.accent;
    ctx.font = `bold ${18 * this.dpr}px system-ui`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(config.emblem === "bolt" ? "⚡" : config.emblem === "planet" ? "●" : "★", 0, 5 * this.dpr);
    ctx.fillStyle = config.color;
    ctx.fillRect(-17 * this.dpr, 23 * this.dpr, 12 * this.dpr, 16 * this.dpr);
    ctx.fillRect(5 * this.dpr, 23 * this.dpr, 12 * this.dpr, 16 * this.dpr);
    ctx.restore();
  }

  drawShip(ctx, entity, config, active) {
    if (!entity) return;
    ctx.save();
    ctx.translate(entity.p.x, entity.p.y);
    ctx.scale(entity.facing, 1);
    if (active) { ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 6 * this.dpr; ctx.beginPath(); ctx.arc(0, 0, entity.r + 8 * this.dpr, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = config.accent;
    if (config.wings === "swept") { ctx.beginPath(); ctx.moveTo(-8 * this.dpr, 5 * this.dpr); ctx.lineTo(-45 * this.dpr, 30 * this.dpr); ctx.lineTo(12 * this.dpr, 20 * this.dpr); ctx.closePath(); ctx.fill(); }
    else if (config.wings === "wide") { ctx.fillRect(-45 * this.dpr, 8 * this.dpr, 90 * this.dpr, 12 * this.dpr); }
    else { ctx.beginPath(); ctx.moveTo(-12 * this.dpr, 10 * this.dpr); ctx.lineTo(-30 * this.dpr, 33 * this.dpr); ctx.lineTo(20 * this.dpr, 20 * this.dpr); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = config.color;
    if (config.hull === "saucer") { ctx.beginPath(); ctx.ellipse(0, 0, 43 * this.dpr, 22 * this.dpr, 0, 0, TAU); ctx.fill(); }
    else if (config.hull === "rover") { ctx.beginPath(); ctx.roundRect(-38 * this.dpr, -18 * this.dpr, 76 * this.dpr, 42 * this.dpr, 14 * this.dpr); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(45 * this.dpr, 0); ctx.quadraticCurveTo(8 * this.dpr, -30 * this.dpr, -38 * this.dpr, -15 * this.dpr); ctx.lineTo(-38 * this.dpr, 18 * this.dpr); ctx.quadraticCurveTo(8 * this.dpr, 30 * this.dpr, 45 * this.dpr, 0); ctx.fill(); }
    ctx.fillStyle = "#9fe7ff";
    ctx.beginPath(); ctx.ellipse(8 * this.dpr, -9 * this.dpr, 15 * this.dpr, 10 * this.dpr, 0, 0, TAU); ctx.fill();
    if (config.hull === "rover") { ctx.fillStyle = "#263244"; ctx.beginPath(); ctx.arc(-25 * this.dpr, 24 * this.dpr, 10 * this.dpr, 0, TAU); ctx.arc(25 * this.dpr, 24 * this.dpr, 10 * this.dpr, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  drawMarble(ctx, marble) {
    const gradient = ctx.createRadialGradient(marble.p.x - marble.r * .35, marble.p.y - marble.r * .4, 2, marble.p.x, marble.p.y, marble.r);
    gradient.addColorStop(0, "#fff"); gradient.addColorStop(.18, marble.color); gradient.addColorStop(1, "#394d73");
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(marble.p.x, marble.p.y, marble.r, 0, TAU); ctx.fill();
  }

  drawPickup(ctx, pickup) {
    const bob = Math.sin(performance.now() / 350 + pickup.p.x) * 7 * this.dpr;
    ctx.save(); ctx.translate(pickup.p.x, pickup.p.y + bob);
    ctx.shadowColor = pickup.color; ctx.shadowBlur = 22 * this.dpr;
    ctx.fillStyle = "rgba(255,255,255,.94)"; ctx.beginPath(); ctx.arc(0, 0, pickup.r + 7 * this.dpr, 0, TAU); ctx.fill();
    ctx.fillStyle = pickup.color; ctx.beginPath(); ctx.arc(0, 0, pickup.r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.font = `bold ${22 * this.dpr}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(pickup.tool === "magnet" ? "U" : pickup.tool === "grapple" ? "↗" : "✦", 0, 0);
    ctx.restore();
  }

  drawBumper(ctx, bumper) {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bumper.p.x, bumper.p.y, bumper.r + 5 * this.dpr + bumper.pulse * 5 * this.dpr, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ec7b67"; ctx.beginPath(); ctx.arc(bumper.p.x, bumper.p.y, bumper.r + bumper.pulse * 4 * this.dpr, 0, TAU); ctx.fill();
  }

  drawSpinner(ctx, spinner) {
    ctx.save(); ctx.translate(spinner.p.x, spinner.p.y); ctx.rotate(spinner.angle);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, spinner.r + 4 * this.dpr, 0, TAU); ctx.fill();
    for (const color of ["#f4c15d", "#6bc2d5", "#ea7b68", "#88c76e"]) {
      ctx.rotate(Math.PI / 2); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8 * this.dpr, -6 * this.dpr, spinner.r - 2 * this.dpr, -4 * this.dpr); ctx.quadraticCurveTo(10 * this.dpr, 10 * this.dpr, 0, 18 * this.dpr); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 7 * this.dpr, 0, TAU); ctx.fill(); ctx.restore();
  }

  drawPortal(ctx, portal) {
    ctx.save(); ctx.translate(portal.p.x, portal.p.y); ctx.rotate(performance.now() / 900);
    ctx.strokeStyle = portal.color; ctx.lineWidth = 7 * this.dpr; ctx.beginPath(); ctx.arc(0, 0, portal.r + portal.pulse * 4 * this.dpr, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3 * this.dpr; ctx.beginPath(); ctx.arc(0, 0, portal.r - 10 * this.dpr, 0, TAU); ctx.stroke(); ctx.restore();
  }

  drawGrapple(ctx) {
    const active = this.activeEntity();
    ctx.strokeStyle = "#f97316"; ctx.lineWidth = 4 * this.dpr; ctx.setLineDash([10 * this.dpr, 8 * this.dpr]);
    ctx.beginPath(); ctx.moveTo(active.p.x, active.p.y); ctx.lineTo(this.grapple.point.x, this.grapple.point.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.arc(this.grapple.point.x, this.grapple.point.y, 7 * this.dpr, 0, TAU); ctx.fill();
  }

  drawTree(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = "#8c6946"; ctx.fillRect(-5, -30, 10, 30); ctx.fillStyle = "#77ad68"; for (const [a, b, r] of [[0, -42, 18], [-12, -34, 14], [13, -35, 13]]) { ctx.beginPath(); ctx.arc(a, b, r, 0, TAU); ctx.fill(); } ctx.restore(); }
  drawHouse(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = "#fff5ef"; ctx.fillRect(-30, -38, 60, 38); ctx.fillStyle = "#d97b65"; ctx.beginPath(); ctx.moveTo(-36, -38); ctx.lineTo(0, -70); ctx.lineTo(36, -38); ctx.closePath(); ctx.fill(); ctx.restore(); }
  drawLighthouse(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = "#fff"; ctx.fillRect(-16, -72, 32, 72); ctx.fillStyle = "#e97b67"; ctx.fillRect(-16, -58, 32, 10); ctx.fillRect(-16, -32, 32, 10); ctx.fillStyle = "#5d6b83"; ctx.fillRect(-22, -84, 44, 12); ctx.restore(); }
  drawDock(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = "#98724a"; ctx.fillRect(0, -12, 120, 12); for (const z of [5, 55, 105]) ctx.fillRect(z, 0, 8, 28); ctx.restore(); }
  drawBoat(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = "#e97b67"; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.lineTo(32, 24); ctx.lineTo(-35, 24); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(-12, -32, 24, 32); ctx.restore(); }
  drawCloud(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = "rgba(255,255,255,.88)"; for (const [a, b, r] of [[-18, 2, 18], [2, -6, 22], [25, 2, 18]]) { ctx.beginPath(); ctx.arc(a, b, r, 0, TAU); ctx.fill(); } ctx.restore(); }
  drawBalloon(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = "#e88572"; ctx.beginPath(); ctx.ellipse(0, -30, 24, 32, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = "#8b6a47"; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, 40); ctx.stroke(); ctx.fillStyle = "#cfa973"; ctx.fillRect(-10, 40, 20, 12); ctx.restore(); }
}
