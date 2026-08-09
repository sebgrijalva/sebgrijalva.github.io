import { PlatformerScene as BasePlatformerScene } from "./platformer-v17.js?v=18";
import { Vec2 } from "./engine.js?v=15";

const M = globalThis.Matter;
if (!M) throw new Error("Matter.js 0.20.0 did not load");
const { Bodies, Body, Composite, Constraint, Query } = M;
const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const BUILD_PARTS = new Set(["block", "wheel", "rocket"]);
const CHEM_NAMES = { fire: "FIRE", ice: "ICE", lightning: "BOLT" };

export class PlatformerScene extends BasePlatformerScene {
  constructor() {
    super();
    this.buildMode = false;
    this.buildPart = "block";
    this.buildParts = [];
    this.buildConstraints = [];
    this.machineRunning = false;
    this.chemistry = [];
    this.relics = [];
    this.relicIds = new Set();
    this.masteredWorlds = new Set();
    this.masteryActive = false;
    this.reactionSolved = 0;
    this.launchPads = [];
    this.v18Time = 0;
  }

  mount(engine) {
    this.masteredWorlds = new Set(engine.store.get("v18MasteredWorlds", []));
    super.mount(engine);
  }

  resetMap(playSound = true) {
    this.buildMode = false;
    this.buildPart = "block";
    this.buildParts = [];
    this.buildConstraints = [];
    this.machineRunning = false;
    this.chemistry = [];
    this.relics = [];
    this.launchPads = [];
    this.reactionSolved = 0;
    super.resetMap(playSound);
    if (!this.physics || !this.hero) return;
    this.loadRelics();
    this.addChemistry();
    this.addRelics();
    this.masteryActive = this.masteredWorlds.has(this.mapIndex) || this.relicIds.size >= 3;
    this.announce(this.masteryActive ? "World Mastery active. Explore, invent, and reach the boss." : "Three hidden relics. Powers can change the world. Build anything useful.", 5.5);
  }

  loadRelics() {
    this.relicIds = new Set(this.engine?.store.get(`v18Relics-${this.mapIndex}`, []) || []);
    if (this.relicIds.size >= 3) {
      this.masteredWorlds.add(this.mapIndex);
      this.engine?.store.set("v18MasteredWorlds", [...this.masteredWorlds]);
    }
  }

  addChemistry() {
    const s = this.dpr || 1;
    const G = this.groundY;
    const fireXs = [1120, 1050, 980];
    const iceXs = [2820, 2580, 2380];
    const boltXs = [3600, 3450, 4020];
    const bridgeRanges = [[2860, 3100], [2630, 2860], [2460, 2710]];

    const fire = { id: `fire-${this.mapIndex}`, kind: "fire", required: "fire", x: fireXs[this.mapIndex] * s, y: G - 96 * s, solved: false, wrong: 0, body: null };
    fire.body = this.addBody(Bodies.rectangle(fire.x, fire.y, 44 * s, 192 * s, {
      isStatic: true, label: "chem-fire-gate", friction: .92, restitution: .05
    }), "chem", fire, false);

    const ice = { id: `ice-${this.mapIndex}`, kind: "ice", required: "ice", x: iceXs[this.mapIndex] * s, y: G - 72 * s, solved: false, wrong: 0, body: null, bridgeRange: bridgeRanges[this.mapIndex] };
    ice.body = this.addBody(Bodies.circle(ice.x, ice.y, 42 * s, {
      isStatic: true, isSensor: true, label: "chem-ice-well"
    }), "chem", ice, false);

    const bolt = { id: `lightning-${this.mapIndex}`, kind: "lightning", required: "lightning", x: boltXs[this.mapIndex] * s, y: G - 96 * s, solved: false, wrong: 0, body: null };
    bolt.body = this.addBody(Bodies.circle(bolt.x, bolt.y, 42 * s, {
      isStatic: true, isSensor: true, label: "chem-lightning-coil"
    }), "chem", bolt, false);

    this.chemistry = [fire, ice, bolt];
  }

  addRelics() {
    const s = this.dpr || 1;
    const G = this.groundY;
    const layouts = [
      [[1510, -285], [2980, -95], [3810, -425]],
      [[1280, -300], [2740, -95], [3650, -430]],
      [[1120, -310], [2580, -100], [4190, -455]]
    ];
    this.relics = layouts[this.mapIndex].map(([x, y], index) => {
      const id = `${this.mapIndex}-${index}`;
      const relic = { id, index, p: new Vec2(x * s, G + y * s), collected: this.relicIds.has(id), body: null, pulse: Math.random() * TAU };
      if (!relic.collected) {
        relic.body = this.addBody(Bodies.circle(relic.p.x, relic.p.y, 31 * s, {
          isStatic: true, isSensor: true, label: "relic"
        }), "relic", relic, false);
      }
      return relic;
    });
  }

  currentRelics() { return this.relicIds.size; }
  chemistryStatus() { return this.chemistry.map(item => item.solved); }

  handlePair(specialBody, otherBody) {
    const special = specialBody?.plugin?.game;
    const other = otherBody?.plugin?.game;
    if (special?.kind === "chem" && other?.kind === "projectile") {
      this.reactChemistry(special.ref, other.ref);
      this.removeProjectile(other.ref);
      return;
    }
    if (special?.kind === "relic" && ["hero", "ship"].includes(other?.kind)) {
      this.collectRelic(special.ref);
      return;
    }
    if (special?.kind === "launchpad" && ["hero", "ship"].includes(other?.kind)) {
      this.launchEntity(otherBody, special.ref);
      return;
    }
    super.handlePair(specialBody, otherBody);
  }

  reactChemistry(node, projectile) {
    if (!node || node.solved || !projectile || projectile.dead) return;
    if (projectile.power !== node.required) {
      node.wrong = .45;
      this.announce(`${CHEM_NAMES[node.required]} reacts here. Try that power.`, 1.5);
      return;
    }
    node.solved = true;
    this.reactionSolved += 1;
    node.wrong = 0;
    this.removeBody(node.body);
    node.body = null;
    this.spawnPoof(new Vec2(node.x, node.y), projectile.color || "#fff", 22);
    this.shake(7 * this.dpr, .18);
    this.engine?.audio.unlock();
    this.engine?.audio.ping(node.kind === "fire" ? 230 : node.kind === "ice" ? 650 : 980, .12, .035, "triangle");

    if (node.kind === "fire") {
      for (const villain of this.villains || []) {
        if (villain.dead || !villain.body) continue;
        const dx = villain.body.position.x - node.x;
        const dy = villain.body.position.y - node.y;
        const length = Math.hypot(dx, dy);
        if (length < 310 * this.dpr && length > 1) {
          Body.applyForce(villain.body, villain.body.position, {
            x: dx / length * .006 * villain.body.mass,
            y: -Math.abs(dy / length) * .004 * villain.body.mass - .003 * villain.body.mass
          });
        }
      }
      this.announce("The fire barrier burned away. Route opened!", 2.4);
    } else if (node.kind === "ice") {
      const [x1, x2] = node.bridgeRange;
      const bridge = {
        a: new Vec2(x1 * this.dpr, this.groundY - 18 * this.dpr),
        b: new Vec2(x2 * this.dpr, this.groundY - 18 * this.dpr),
        thickness: 30 * this.dpr,
        material: "ice",
        erasable: true,
        v18Ice: true
      };
      this.platforms.push(bridge);
      this.platformBody(bridge);
      node.bridge = bridge;
      this.announce("Ice bridge formed. That pit is now a shortcut!", 2.4);
    } else {
      const pad = { p: new Vec2(node.x + 150 * this.dpr, this.groundY - 44 * this.dpr), r: 46 * this.dpr, cooldown: 0, body: null };
      pad.body = this.addBody(Bodies.rectangle(pad.p.x, pad.p.y, 105 * this.dpr, 28 * this.dpr, {
        isStatic: true, isSensor: true, label: "launchpad"
      }), "launchpad", pad, false);
      this.launchPads.push(pad);
      this.announce("Storm launcher online. Step on it and fly!", 2.4);
    }
  }

  launchEntity(body, pad) {
    if (!body || !pad || pad.cooldown > 0) return;
    pad.cooldown = .75;
    Body.setVelocity(body, {
      x: Math.max(body.velocity.x, 12.5 * this.dpr),
      y: -18.5 * this.dpr
    });
    this.spawnPoof(pad.p, "#fde047", 12);
    this.shake(3 * this.dpr, .1);
  }

  collectRelic(relic) {
    if (!relic || relic.collected) return;
    relic.collected = true;
    this.relicIds.add(relic.id);
    this.removeBody(relic.body);
    relic.body = null;
    this.engine?.store.set(`v18Relics-${this.mapIndex}`, [...this.relicIds]);
    this.spawnPoof(relic.p, "#fef08a", 24);
    this.engine?.audio.unlock();
    this.engine?.audio.ping(760 + this.relicIds.size * 90, .13, .035, "triangle");
    if (this.relicIds.size >= 3) {
      this.masteredWorlds.add(this.mapIndex);
      this.engine?.store.set("v18MasteredWorlds", [...this.masteredWorlds]);
      this.masteryActive = true;
      this.shake(10 * this.dpr, .28);
      this.announce("WORLD MASTERED! Overdrive is permanently active here.", 4);
    } else {
      this.announce(`Relic ${this.relicIds.size}/3 found. Two routes may still hide secrets.`, 2.6);
    }
  }

  toggleBuildMode() {
    this.buildMode = !this.buildMode;
    this.awaitingGrapple = false;
    if (this.buildMode) this.eraseMode = false;
    this.announce(this.buildMode ? "Inventor mode: choose a part, then tap the world." : "Inventor mode closed.", 2.2);
    return this.buildMode;
  }

  selectBuildPart(part) {
    if (!BUILD_PARTS.has(part)) return;
    this.buildPart = part;
    this.buildMode = true;
    this.eraseMode = false;
    const names = { block: "Chassis block", wheel: "Free wheel", rocket: "Rocket motor" };
    this.announce(`${names[part]} selected. Tap to place.`, 1.5);
  }

  toggleMachine() {
    if (!this.buildParts.length) {
      this.announce("Build a machine first.", 1.5);
      return false;
    }
    this.machineRunning = !this.machineRunning;
    this.announce(this.machineRunning ? "Machine GO! Wheels and rockets are live." : "Machine stopped.", 1.8);
    return this.machineRunning;
  }

  clearBuild() {
    for (const constraint of this.buildConstraints) Composite.remove(this.physics.world, constraint, true);
    for (const part of this.buildParts) this.removeBody(part.body);
    this.buildConstraints = [];
    this.buildParts = [];
    this.machineRunning = false;
    this.announce("Contraption cleared.", 1.3);
  }

  onCanvasDown(screenPoint) {
    if (this.buildMode) {
      this.engine?.audio.unlock();
      const point = new Vec2(screenPoint.x + this.camera.x, screenPoint.y + this.camera.y);
      this.placeBuildPart(point);
      return;
    }
    super.onCanvasDown(screenPoint);
  }

  placeBuildPart(point) {
    if (!this.physics || this.buildParts.length >= 18) {
      if (this.buildParts.length >= 18) this.announce("18 parts is enough engineering for one machine.", 1.7);
      return;
    }
    const s = this.dpr || 1;
    const p = new Vec2(clamp(point.x, 80 * s, this.worldW - 80 * s), clamp(point.y, 80 * s, this.worldH - 120 * s));
    let body;
    if (this.buildPart === "wheel") {
      body = Bodies.circle(p.x, p.y, 27 * s, { label: "build-wheel", density: .002, friction: 1.15, frictionAir: .012, restitution: .2 });
    } else if (this.buildPart === "rocket") {
      body = Bodies.rectangle(p.x, p.y, 70 * s, 28 * s, { label: "build-rocket", density: .0017, friction: .5, frictionAir: .018, restitution: .12, chamfer: { radius: 8 * s } });
    } else {
      body = Bodies.rectangle(p.x, p.y, 86 * s, 38 * s, { label: "build-block", density: .0023, friction: .85, frictionAir: .012, restitution: .1, chamfer: { radius: 7 * s } });
    }
    const part = { type: this.buildPart, p: new Vec2(), v: new Vec2(), body: null, r: this.buildPart === "wheel" ? 27 * s : 42 * s };
    this.addBody(body, "build-part", part, true);
    this.linkDynamic(part, body);

    let nearest = null;
    let nearestDistance = Infinity;
    for (const existing of this.buildParts) {
      if (!existing.body) continue;
      const d = dist(existing.body.position, body.position);
      if (d < nearestDistance && d < 165 * s) { nearest = existing; nearestDistance = d; }
    }
    if (nearest) this.attachBuildParts(nearest, part);
    this.buildParts.push(part);
    this.engine?.audio.ping(this.buildPart === "wheel" ? 360 : this.buildPart === "rocket" ? 520 : 280, .055, .018, "triangle");
  }

  attachBuildParts(anchor, part) {
    const s = this.dpr || 1;
    const dx = part.body.position.x - anchor.body.position.x;
    const dy = part.body.position.y - anchor.body.position.y;
    const main = Constraint.create({
      bodyA: anchor.body,
      pointA: { x: dx, y: dy },
      bodyB: part.body,
      pointB: { x: 0, y: 0 },
      length: 0,
      stiffness: .82,
      damping: .12,
      label: "v18-snap"
    });
    Composite.add(this.physics.world, main);
    this.buildConstraints.push(main);
    if (part.type !== "wheel") {
      const brace = Constraint.create({
        bodyA: anchor.body,
        pointA: { x: dx, y: dy - 12 * s },
        bodyB: part.body,
        pointB: { x: 0, y: -12 * s },
        length: 0,
        stiffness: .72,
        damping: .1,
        label: "v18-brace"
      });
      Composite.add(this.physics.world, brace);
      this.buildConstraints.push(brace);
    }
  }

  removeBuildPart(part) {
    if (!part?.body) return;
    const body = part.body;
    for (const constraint of [...this.buildConstraints]) {
      if (constraint.bodyA === body || constraint.bodyB === body) {
        Composite.remove(this.physics.world, constraint, true);
        this.buildConstraints = this.buildConstraints.filter(item => item !== constraint);
      }
    }
    this.removeBody(body);
    part.body = null;
    this.buildParts = this.buildParts.filter(item => item !== part);
  }

  eraseAt(point) {
    const buildHit = Query.point(Composite.allBodies(this.physics.world), point)
      .map(body => ({ body, game: body?.plugin?.game }))
      .find(item => item.game?.kind === "build-part");
    if (buildHit) {
      this.removeBuildPart(buildHit.game.ref);
      this.spawnPoof(point, "#f9a8d4", 8);
      return;
    }
    super.eraseAt(point);
  }

  update(dt) {
    if (!dt) return;
    this.v18Time += dt;
    for (const node of this.chemistry) node.wrong = Math.max(0, node.wrong - dt);
    for (const pad of this.launchPads) pad.cooldown = Math.max(0, pad.cooldown - dt);

    if (this.machineRunning) {
      for (const part of this.buildParts) {
        if (!part.body) continue;
        if (part.type === "wheel") {
          Body.setAngularVelocity(part.body, .28 * this.dpr);
          Body.applyForce(part.body, part.body.position, { x: .0007 * part.body.mass * this.dpr, y: 0 });
        } else if (part.type === "rocket") {
          const a = part.body.angle;
          const force = .0025 * part.body.mass * this.dpr;
          Body.applyForce(part.body, part.body.position, { x: Math.cos(a) * force, y: Math.sin(a) * force });
        }
      }
    }

    if (this.masteryActive && this.activeEntity?.()?.body) {
      const active = this.activeEntity().body;
      if (Math.abs(this.input?.x || 0) > .12) {
        Body.applyForce(active, active.position, { x: this.input.x * .00032 * active.mass * this.dpr, y: 0 });
      }
      this.powerCooldown = Math.max(0, (this.powerCooldown || 0) - dt * .28);
    }

    super.update(dt);
    for (const part of this.buildParts) if (part.body) this.syncRef(part);
  }

  drawPlatform(ctx, platform) {
    if (!platform?.v18Ice) return super.drawPlatform(ctx, platform);
    const dx = platform.b.x - platform.a.x;
    const dy = platform.b.y - platform.a.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate((platform.a.x + platform.b.x) / 2, (platform.a.y + platform.b.y) / 2);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -platform.thickness / 2, 0, platform.thickness / 2);
    g.addColorStop(0, "rgba(224,247,255,.97)");
    g.addColorStop(.4, "#7dd3fc");
    g.addColorStop(1, "#2563eb");
    ctx.fillStyle = g;
    ctx.shadowColor = "rgba(125,211,252,.8)";
    ctx.shadowBlur = 14 * this.dpr;
    ctx.beginPath();
    ctx.roundRect(-length / 2, -platform.thickness / 2, length, platform.thickness, 8 * this.dpr);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.65)";
    ctx.lineWidth = 2 * this.dpr;
    ctx.beginPath(); ctx.moveTo(-length/2+12*this.dpr,-4*this.dpr); ctx.lineTo(length/2-12*this.dpr,-4*this.dpr); ctx.stroke();
    ctx.restore();
  }

  drawChemistry(ctx) {
    const s = this.dpr || 1;
    for (const node of this.chemistry) {
      if (node.solved) continue;
      ctx.save();
      ctx.translate(node.x, node.y);
      if (node.wrong > 0) { ctx.globalAlpha = .65 + Math.sin(this.v18Time * 45) * .25; }
      if (node.kind === "fire") {
        ctx.fillStyle = "#4a2d18"; ctx.fillRect(-22*s,-96*s,44*s,192*s);
        ctx.strokeStyle = "#d97706"; ctx.lineWidth = 6*s;
        for (let y=-78; y<80; y+=42) { ctx.beginPath(); ctx.moveTo(-20*s,y*s); ctx.lineTo(20*s,(y+18)*s); ctx.stroke(); }
        ctx.shadowColor="#fb923c";ctx.shadowBlur=18*s;ctx.fillStyle="#fb923c";ctx.beginPath();ctx.arc(0,-112*s,18*s,0,TAU);ctx.fill();
      } else if (node.kind === "ice") {
        const g=ctx.createRadialGradient(0,-8*s,4*s,0,0,42*s);g.addColorStop(0,"#fff");g.addColorStop(.38,"#bae6fd");g.addColorStop(1,"#0284c7");ctx.fillStyle=g;ctx.shadowColor="#7dd3fc";ctx.shadowBlur=18*s;ctx.beginPath();ctx.arc(0,0,42*s,0,TAU);ctx.fill();ctx.fillStyle="#e0f2fe";ctx.beginPath();ctx.moveTo(-16*s,-35*s);ctx.lineTo(0,-70*s);ctx.lineTo(16*s,-35*s);ctx.closePath();ctx.fill();
      } else {
        ctx.strokeStyle="#fde047";ctx.lineWidth=7*s;ctx.shadowColor="#fde047";ctx.shadowBlur=18*s;ctx.beginPath();ctx.arc(0,0,38*s,0,TAU);ctx.stroke();ctx.fillStyle="#fef08a";ctx.font=`900 ${42*s}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("ϟ",0,1*s);
      }
      ctx.shadowBlur=0;ctx.fillStyle="rgba(15,23,42,.82)";ctx.beginPath();ctx.roundRect(-48*s,55*s,96*s,27*s,10*s);ctx.fill();ctx.fillStyle="#fff";ctx.font=`900 ${12*s}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(CHEM_NAMES[node.required],0,69*s);
      ctx.restore();
    }
    for (const pad of this.launchPads) {
      ctx.save();ctx.translate(pad.p.x,pad.p.y);const pulse=1+Math.sin(this.v18Time*8)*.08;ctx.scale(pulse,1);ctx.fillStyle="#312e81";ctx.beginPath();ctx.roundRect(-53*s,-14*s,106*s,28*s,10*s);ctx.fill();ctx.strokeStyle="#fde047";ctx.lineWidth=4*s;ctx.stroke();ctx.fillStyle="#fde047";ctx.font=`900 ${18*s}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("LAUNCH",0,0);ctx.restore();
    }
  }

  drawRelics(ctx) {
    const s = this.dpr || 1;
    for (const relic of this.relics) {
      if (relic.collected) continue;
      const bob = Math.sin(this.v18Time * 3.4 + relic.pulse) * 9 * s;
      ctx.save();ctx.translate(relic.p.x,relic.p.y+bob);ctx.rotate(this.v18Time*.8+relic.index);ctx.shadowColor="#facc15";ctx.shadowBlur=26*s;const g=ctx.createLinearGradient(0,-30*s,0,30*s);g.addColorStop(0,"#fffde7");g.addColorStop(.35,"#fde047");g.addColorStop(1,"#f97316");ctx.fillStyle=g;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5;const r=(i%2?13:31)*s;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.restore();
    }
  }

  drawBuildParts(ctx) {
    const s = this.dpr || 1;
    for (const part of this.buildParts) {
      if (!part.body) continue;
      const b = part.body;
      ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
      if (part.type === "wheel") {
        const g=ctx.createRadialGradient(-7*s,-8*s,2*s,0,0,28*s);g.addColorStop(0,"#64748b");g.addColorStop(.55,"#1e293b");g.addColorStop(1,"#020617");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,27*s,0,TAU);ctx.fill();ctx.strokeStyle="#94a3b8";ctx.lineWidth=3*s;for(let i=0;i<6;i++){ctx.rotate(TAU/6);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(20*s,0);ctx.stroke();}ctx.fillStyle="#cbd5e1";ctx.beginPath();ctx.arc(0,0,7*s,0,TAU);ctx.fill();
      } else if (part.type === "rocket") {
        if (this.machineRunning) {ctx.fillStyle="#fb923c";ctx.shadowColor="#f97316";ctx.shadowBlur=14*s;ctx.beginPath();ctx.moveTo(-36*s,-9*s);ctx.lineTo((-68-Math.random()*16)*s,0);ctx.lineTo(-36*s,9*s);ctx.closePath();ctx.fill();ctx.shadowBlur=0;}
        const g=ctx.createLinearGradient(-35*s,-14*s,35*s,14*s);g.addColorStop(0,"#475569");g.addColorStop(.5,"#e2e8f0");g.addColorStop(1,"#64748b");ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(-35*s,-14*s,70*s,28*s,8*s);ctx.fill();ctx.fillStyle="#ef4444";ctx.beginPath();ctx.moveTo(35*s,0);ctx.lineTo(18*s,-14*s);ctx.lineTo(18*s,14*s);ctx.closePath();ctx.fill();
      } else {
        const g=ctx.createLinearGradient(0,-20*s,0,20*s);g.addColorStop(0,"#f59e0b");g.addColorStop(.45,"#b45309");g.addColorStop(1,"#78350f");ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(-43*s,-19*s,86*s,38*s,7*s);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.38)";ctx.lineWidth=2*s;ctx.stroke();ctx.fillStyle="#451a03";for(const x of [-28,28]){ctx.beginPath();ctx.arc(x*s,0,4*s,0,TAU);ctx.fill();}
      }
      ctx.restore();
    }
    for (const constraint of this.buildConstraints) {
      if (!constraint.bodyA || !constraint.bodyB) continue;
      const a = constraint.bodyA.position, b = constraint.bodyB.position;
      ctx.strokeStyle="rgba(74,222,128,.72)";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }

  drawMasteryAura(ctx) {
    if (!this.masteryActive) return;
    const active = this.activeEntity?.();
    if (!active?.p) return;
    const s=this.dpr||1;ctx.save();ctx.translate(active.p.x,active.p.y);ctx.strokeStyle="rgba(253,224,71,.52)";ctx.lineWidth=3*s;ctx.setLineDash([9*s,8*s]);ctx.rotate(this.v18Time*.75);ctx.beginPath();ctx.arc(0,0,active.r+18*s+Math.sin(this.v18Time*4)*4*s,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }

  render(ctx) {
    super.render(ctx);
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    this.drawChemistry(ctx);
    this.drawRelics(ctx);
    this.drawBuildParts(ctx);
    this.drawMasteryAura(ctx);
    ctx.restore();
    if (this.buildMode) {
      ctx.save();ctx.fillStyle="rgba(16,185,129,.08)";ctx.fillRect(0,0,this.width,this.height);ctx.fillStyle="rgba(6,78,59,.88)";ctx.beginPath();ctx.roundRect(this.width*.5-118*this.dpr,this.height-178*this.dpr,236*this.dpr,36*this.dpr,13*this.dpr);ctx.fill();ctx.fillStyle="#ecfdf5";ctx.font=`900 ${13*this.dpr}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(`INVENTOR: ${this.buildPart.toUpperCase()} · TAP TO PLACE`,this.width*.5,this.height-160*this.dpr);ctx.restore();
    }
  }
}
