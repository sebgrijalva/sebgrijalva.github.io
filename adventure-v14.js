import { AdventureScene as BaseAdventureScene } from "./adventure.js?v=13";
import { Vec2, TAU } from "./engine.js?v=14";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function pointSegment(p, a, b) {
  const ab = Vec2.sub(b, a), ap = Vec2.sub(p, a);
  const t = clamp(Vec2.dot(ap, ab) / (Vec2.dot(ab, ab) || 1), 0, 1);
  const q = new Vec2(a.x + ab.x * t, a.y + ab.y * t);
  return { distance: distance(p, q), point: q };
}

export class AdventureScene extends BaseAdventureScene {
  constructor() {
    super();
    this.villains = [];
    this.projectiles = [];
    this.particles = [];
    this.selectedPower = "fire";
    this.powerCooldown = 0;
    this.eraseMode = false;
  }

  emitState() {
    this.onStateChange?.({
      activeKind: this.activeKind,
      activeName: this.activeKind === "hero" ? this.heroConfig.name : this.shipConfig.name,
      mapName: this.mapNames[this.mapIndex],
      selectedTool: this.selectedTool,
      selectedPower: this.selectedPower,
      eraseMode: this.eraseMode,
      villainCount: this.villains.filter(v => !v.dead).length,
      unlocked: [...this.unlocked],
      message: this.message
    });
  }

  selectPower(power) {
    if (!["fire", "ice", "lightning"].includes(power)) return;
    this.selectedPower = power;
    this.emitState();
  }

  toggleErase() {
    this.eraseMode = !this.eraseMode;
    this.awaitingGrapple = false;
    this.announce(this.eraseMode ? "Eraser ready: tap an object or villain" : "Eraser put away", 2.2);
    return this.eraseMode;
  }

  resetMap(playSound = true) {
    super.resetMap(playSound);
    this.villains = this.makeVillains();
    this.projectiles = [];
    this.particles = [];
  }

  makeVillains() {
    const s = this.dpr || 1, G = this.groundY;
    const layouts = [
      [["skeleton",720,95],["monster",1180,210],["skeleton",1690,370]],
      [["monster",620,90],["skeleton",1110,210],["monster",1650,370]],
      [["skeleton",650,100],["monster",1260,230],["skeleton",1780,370]]
    ];
    return layouts[this.mapIndex].map(([type,x,offset], index) => {
      const monster = type === "monster", spawn = new Vec2(x * s, G - offset * s);
      return { id:`${this.mapIndex}-${index}-${type}`, type, p:spawn.clone(), spawn, v:new Vec2(),
        r:(monster?32:25)*s, hp:monster?4:3, maxHp:monster?4:3, speed:(monster?92:125)*s,
        facing:-1, grounded:false, frozen:0, stunned:0, dead:false, respawn:0,
        think:Math.random()*1.5, portalCooldown:0 };
    });
  }

  throwPower() {
    if (this.powerCooldown > 0) return;
    const entity = this.activeEntity();
    const aim = this.input.length() > .18 ? this.input.clone().normalize() : new Vec2(entity.facing, -.08).normalize();
    const specs = {
      fire:{speed:650,radius:13,life:3.2,color:"#f97316",bounces:2},
      ice:{speed:560,radius:14,life:3.5,color:"#67e8f9",bounces:0},
      lightning:{speed:920,radius:10,life:1.1,color:"#fde047",bounces:0}
    };
    const spec = specs[this.selectedPower];
    this.projectiles.push({
      p:entity.p.clone().add(aim.clone().mul(entity.r + 22*this.dpr)),
      v:aim.clone().mul(spec.speed*this.dpr), r:spec.radius*this.dpr,
      life:spec.life, power:this.selectedPower, color:spec.color, bounces:spec.bounces, trail:[]
    });
    this.powerCooldown = this.selectedPower === "lightning" ? .42 : .55;
    this.engine.audio.unlock();
    this.engine.audio.ping(this.selectedPower === "fire" ? 180 : this.selectedPower === "ice" ? 480 : 760,
      .09, .025, this.selectedPower === "lightning" ? "square" : "triangle");
  }

  onCanvasDown(screenPoint) {
    if (!this.eraseMode) return super.onCanvasDown(screenPoint);
    this.engine.audio.unlock();
    this.eraseAt(new Vec2(screenPoint.x + this.camera.x, screenPoint.y + this.camera.y));
  }

  update(dt) {
    super.update(dt);
    if (!dt || !this.hero || !this.ship) return;
    this.powerCooldown = Math.max(0, this.powerCooldown - dt);
    const active = this.activeEntity();
    this.updateVillains(dt, active);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
  }

  updateVillains(dt, active) {
    for (const villain of this.villains) {
      if (villain.dead) {
        villain.respawn -= dt;
        if (villain.respawn <= 0) {
          villain.dead=false; villain.hp=villain.maxHp; villain.frozen=0; villain.stunned=0;
          villain.p=villain.spawn.clone(); villain.v.set(0,0);
          this.spawnPoof(villain.p, villain.type === "skeleton" ? "#e5e7eb" : "#84cc16", 12);
        }
        continue;
      }
      villain.frozen=Math.max(0,villain.frozen-dt); villain.stunned=Math.max(0,villain.stunned-dt); villain.think-=dt;
      const delta=Vec2.sub(active.p,villain.p), near=Math.abs(delta.x)<720*this.dpr;
      if (near && villain.frozen<=0 && villain.stunned<=0) {
        villain.v.x += Math.sign(delta.x||1)*villain.speed*dt;
        villain.facing=Math.sign(delta.x||villain.facing);
        if (villain.grounded && villain.think<=0 && (Math.abs(delta.y)>80*this.dpr || Math.random()<.35)) {
          villain.v.y -= (villain.type === "skeleton" ? 430 : 350)*this.dpr;
          villain.think=.8+Math.random()*1.5;
        }
      }
      if (villain.frozen>0) villain.v.mul(Math.pow(.90,dt*60));
      villain.v.y+=980*this.dpr*dt; villain.v.mul(Math.pow(.991,dt*60));
      villain.p.x+=villain.v.x*dt; villain.p.y+=villain.v.y*dt; villain.grounded=false;
      this.collideWorld(villain, villain.type === "monster" ? .25 : .38); this.clampEntity(villain);
      this.collideVillainPlayer(villain,active);
    }
  }

  collideVillainPlayer(villain, active) {
    const d=Vec2.sub(active.p,villain.p), len=d.length()||.001, min=active.r+villain.r;
    if (villain.dead || len>=min) return;
    const n=d.mul(1/len); active.p.add(n.clone().mul(min-len+1));
    active.v.add(n.clone().mul(210*this.dpr)); villain.v.add(n.clone().mul(-130*this.dpr));
  }

  updateProjectiles(dt) {
    const alive=[];
    for (const p of this.projectiles) {
      p.life-=dt; p.trail.push(p.p.clone()); if(p.trail.length>9)p.trail.shift();
      if(p.power!=="lightning")p.v.y+=190*this.dpr*dt; p.p.add(p.v.clone().mul(dt));
      let removed=p.life<=0||p.p.x<0||p.p.x>this.worldW||p.p.y>this.worldH;
      for(const villain of this.villains) if(!removed&&!villain.dead&&distance(p.p,villain.p)<=p.r+villain.r){this.hitVillain(villain,p);removed=true;}
      if(!removed) for(const platform of this.platforms){
        const hit=pointSegment(p.p,platform.a,platform.b);
        if(hit.distance<p.r+platform.thickness*.5){
          if(p.power==="fire"&&p.bounces>0){const n=Vec2.sub(p.p,hit.point).normalize(),vn=Vec2.dot(p.v,n);p.v.sub(n.clone().mul(1.65*vn));p.p.add(n.mul(p.r+platform.thickness*.5-hit.distance+2));p.bounces--;}
          else{removed=true;this.spawnPoof(p.p,p.color,6);} break;
        }
      }
      if(!removed)alive.push(p);
    }
    this.projectiles=alive;
  }

  hitVillain(villain,p) {
    const direction=p.v.clone().normalize();
    if(p.power==="fire"){villain.hp-=2;villain.v.add(direction.mul(300*this.dpr));this.spawnPoof(villain.p,"#f97316",14);}
    else if(p.power==="ice"){villain.hp-=1;villain.frozen=3.2;villain.v.mul(.25);this.spawnPoof(villain.p,"#67e8f9",12);}
    else{
      villain.hp-=1;villain.stunned=1.5;this.spawnPoof(villain.p,"#fde047",10);
      const chain=this.villains.filter(o=>!o.dead&&o!==villain&&distance(o.p,villain.p)<270*this.dpr).sort((a,b)=>distance(a.p,villain.p)-distance(b.p,villain.p))[0];
      if(chain){chain.hp--;chain.stunned=1.1;this.particles.push({kind:"bolt",a:villain.p.clone(),b:chain.p.clone(),life:.22,maxLife:.22,color:"#fde047"});if(chain.hp<=0)this.defeatVillain(chain);}
    }
    if(villain.hp<=0)this.defeatVillain(villain);
  }

  defeatVillain(villain) {
    if(villain.dead)return; villain.dead=true; villain.respawn=7; villain.v.set(0,0);
    this.spawnPoof(villain.p,villain.type==="skeleton"?"#e5e7eb":"#84cc16",24);
    this.announce(`${villain.type==="skeleton"?"Skeleton":"Monster"} poofed! It will rebuild soon.`,2.2);
  }

  spawnPoof(point,color,count=10) {
    for(let i=0;i<count;i++){const angle=Math.random()*TAU,speed=(80+Math.random()*220)*this.dpr;
      this.particles.push({kind:"dot",p:point.clone(),v:new Vec2(Math.cos(angle)*speed,Math.sin(angle)*speed),r:(3+Math.random()*5)*this.dpr,life:.45+Math.random()*.45,maxLife:.9,color});}
  }

  updateParticles(dt) {
    const alive=[]; for(const p of this.particles){p.life-=dt;if(p.life<=0)continue;if(p.kind==="dot"){p.v.y+=300*this.dpr*dt;p.p.add(p.v.clone().mul(dt));p.v.mul(Math.pow(.96,dt*60));}alive.push(p);} this.particles=alive;
  }

  eraseAt(point) {
    const limit=72*this.dpr; let best=null;
    const consider=(kind,item,index,d)=>{if(d<=limit&&(!best||d<best.d))best={kind,item,index,d};};
    this.marbles.forEach((x,i)=>consider("marble",x,i,distance(point,x.p)));
    this.villains.forEach((x,i)=>{if(!x.dead)consider("villain",x,i,distance(point,x.p));});
    this.bumpers.forEach((x,i)=>consider("bumper",x,i,distance(point,x.p)));
    this.spinners.forEach((x,i)=>consider("spinner",x,i,distance(point,x.p)));
    this.portals.forEach((x,i)=>consider("portal",x,i,distance(point,x.p)));
    this.platforms.slice(1).forEach((x,i)=>consider("platform",x,i+1,pointSegment(point,x.a,x.b).distance));
    if(!best){this.announce("Nothing close enough to erase",1.4);return;}
    if(best.kind==="portal")this.portals=this.portals.filter(x=>x.pair!==best.item.pair);
    else if(best.kind==="marble")this.marbles.splice(best.index,1);
    else if(best.kind==="villain")this.villains.splice(best.index,1);
    else if(best.kind==="bumper")this.bumpers.splice(best.index,1);
    else if(best.kind==="spinner")this.spinners.splice(best.index,1);
    else if(best.kind==="platform")this.platforms.splice(best.index,1);
    this.spawnPoof(point,"#f9a8d4",8); this.announce(`${best.kind} erased`,1.4);
  }

  render(ctx) {
    super.render(ctx);
    ctx.save(); ctx.translate(-this.camera.x,-this.camera.y);
    for(const v of this.villains)if(!v.dead)this.drawVillain(ctx,v);
    for(const p of this.projectiles)this.drawProjectile(ctx,p);
    for(const p of this.particles)this.drawParticle(ctx,p);
    ctx.restore();
    if(this.eraseMode){ctx.save();ctx.fillStyle="rgba(244,114,182,.16)";ctx.fillRect(0,0,this.width,this.height);ctx.fillStyle="rgba(131,24,67,.86)";ctx.font=`bold ${15*this.dpr}px system-ui`;ctx.textAlign="center";ctx.fillText("ERASER MODE: tap something",this.width/2,this.height-165*this.dpr);ctx.restore();}
  }

  drawVillain(ctx,v) {
    ctx.save();ctx.translate(v.p.x,v.p.y);ctx.scale(v.facing||1,1);
    if(v.frozen>0){ctx.globalAlpha=.72;ctx.shadowColor="#67e8f9";ctx.shadowBlur=20*this.dpr;}if(v.stunned>0){ctx.shadowColor="#fde047";ctx.shadowBlur=18*this.dpr;}
    if(v.type==="skeleton"){
      ctx.strokeStyle="#f1f5f9";ctx.lineWidth=5*this.dpr;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(0,-7*this.dpr);ctx.lineTo(0,22*this.dpr);ctx.moveTo(-15*this.dpr,4*this.dpr);ctx.lineTo(15*this.dpr,4*this.dpr);ctx.moveTo(0,20*this.dpr);ctx.lineTo(-12*this.dpr,36*this.dpr);ctx.moveTo(0,20*this.dpr);ctx.lineTo(12*this.dpr,36*this.dpr);ctx.stroke();
      ctx.fillStyle="#f8fafc";ctx.beginPath();ctx.arc(0,-20*this.dpr,15*this.dpr,0,TAU);ctx.fill();ctx.fillStyle="#172033";ctx.beginPath();ctx.arc(-5*this.dpr,-22*this.dpr,3*this.dpr,0,TAU);ctx.arc(5*this.dpr,-22*this.dpr,3*this.dpr,0,TAU);ctx.fill();ctx.fillRect(-5*this.dpr,-13*this.dpr,10*this.dpr,3*this.dpr);
    }else{
      ctx.fillStyle="#84cc16";ctx.beginPath();ctx.roundRect(-28*this.dpr,-25*this.dpr,56*this.dpr,52*this.dpr,20*this.dpr);ctx.fill();ctx.fillStyle="#bef264";ctx.beginPath();ctx.arc(-10*this.dpr,-10*this.dpr,9*this.dpr,0,TAU);ctx.arc(10*this.dpr,-10*this.dpr,9*this.dpr,0,TAU);ctx.fill();ctx.fillStyle="#172033";ctx.beginPath();ctx.arc(-10*this.dpr,-10*this.dpr,3*this.dpr,0,TAU);ctx.arc(10*this.dpr,-10*this.dpr,3*this.dpr,0,TAU);ctx.fill();ctx.strokeStyle="#365314";ctx.lineWidth=3*this.dpr;ctx.beginPath();ctx.arc(0,5*this.dpr,12*this.dpr,0,Math.PI);ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.fillStyle="rgba(15,23,42,.25)";ctx.fillRect(-25*this.dpr,-52*this.dpr,50*this.dpr,6*this.dpr);ctx.fillStyle=v.frozen>0?"#67e8f9":"#ef4444";ctx.fillRect(-25*this.dpr,-52*this.dpr,50*this.dpr*(v.hp/v.maxHp),6*this.dpr);ctx.restore();
  }

  drawProjectile(ctx,p) {
    ctx.save();ctx.lineCap="round";for(let i=1;i<p.trail.length;i++){ctx.globalAlpha=i/p.trail.length*.45;ctx.strokeStyle=p.color;ctx.lineWidth=p.r*.55;ctx.beginPath();ctx.moveTo(p.trail[i-1].x,p.trail[i-1].y);ctx.lineTo(p.trail[i].x,p.trail[i].y);ctx.stroke();}ctx.globalAlpha=1;ctx.shadowColor=p.color;ctx.shadowBlur=18*this.dpr;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.p.x,p.p.y,p.r,0,TAU);ctx.fill();ctx.fillStyle="rgba(255,255,255,.85)";ctx.beginPath();ctx.arc(p.p.x-p.r*.3,p.p.y-p.r*.3,p.r*.3,0,TAU);ctx.fill();ctx.restore();
  }

  drawParticle(ctx,p) {
    ctx.save();ctx.globalAlpha=Math.max(0,p.life/(p.maxLife||p.life));if(p.kind==="bolt"){ctx.strokeStyle=p.color;ctx.lineWidth=5*this.dpr;ctx.shadowColor=p.color;ctx.shadowBlur=14*this.dpr;ctx.beginPath();ctx.moveTo(p.a.x,p.a.y);ctx.lineTo((p.a.x+p.b.x)/2+(Math.random()-.5)*20*this.dpr,(p.a.y+p.b.y)/2+(Math.random()-.5)*20*this.dpr);ctx.lineTo(p.b.x,p.b.y);ctx.stroke();}else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.p.x,p.p.y,p.r,0,TAU);ctx.fill();}ctx.restore();
  }
}
