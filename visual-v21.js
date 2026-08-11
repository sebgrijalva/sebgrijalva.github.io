const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = (v, g) => Math.round(v / g) * g;

const BIOMES = [
  {
    name: "Emerald Valley",
    sky: ["#081a2a", "#174c64", "#3b8b89", "#f0c986"],
    mist: "#bff4d1", sun: "#ffe6a1", accent: "#84f39a", rim: "#b9ffd2",
    far: ["#102d3a", "#174a4b", "#276b52", "#3e8457"],
    ground: ["#8acb68", "#47724a", "#3a3f32", "#241f1d"],
    shadow: "#0b1720"
  },
  {
    name: "Storm Harbor",
    sky: ["#0b1728", "#344b65", "#7c6a75", "#e6a56f"],
    mist: "#d8e5ea", sun: "#ffd28a", accent: "#ffc96b", rim: "#ffe3aa",
    far: ["#1a2a38", "#283c49", "#3d5058", "#5e6263"],
    ground: ["#7d8a8d", "#48565d", "#2c353e", "#151b23"],
    shadow: "#0a111b"
  },
  {
    name: "Cloud Fortress",
    sky: ["#101028", "#38356f", "#7665a9", "#efbddd"],
    mist: "#eee9ff", sun: "#e8e6ff", accent: "#9fe8ff", rim: "#ded8ff",
    far: ["#25244e", "#3d376b", "#5d4e8a", "#7e70a7"],
    ground: ["#c8b9de", "#75678f", "#483a61", "#241d35"],
    shadow: "#0d0c1f"
  }
];

const HERO_IDLE = [
  "....oooo....",
  "...ovvvvo...",
  "..ovvvvvvo..",
  "..osssssso..",
  "..osxssxso..",
  "..osssssso..",
  "...osssso...",
  "....oooo....",
  "...cmmmmo...",
  "..ccmmmmao..",
  ".ccmmmmmmao.",
  ".commmammoo.",
  "..ommmmmmmo.",
  "..ommmmmmo..",
  "...ommmmo...",
  "...ob..bo...",
  "...ob..bo...",
  "..oob..boo..",
  "..oo....oo.."
];
const HERO_RUN1 = [
  "....oooo....","...ovvvvo...","..ovvvvvvo..","..osssssso..","..osxssxso..","..osssssso..","...osssso...","....oooo....",
  "..ccmmmmo...",".ccmmmmmaoo.",".commmmmmao.","..ommmammoo.","..ommmmmmmo.","...ommmmmo..","...ob...bo..","..oob...bo..","..oo....bo..","........oo..","............"
];
const HERO_RUN2 = [
  "....oooo....","...ovvvvo...","..ovvvvvvo..","..osssssso..","..osxssxso..","..osssssso..","...osssso...","....oooo....",
  "...cmmmmo...","..ccmmmmaoo.",".ccmmmmmmao.","..ommmammoo.","..ommmmmmmo.","...ommmmmo..","..ob...ob...","..ob...boo..","..ob....oo..","..oo........","............"
];
const HERO_JUMP = [
  "....oooo....","...ovvvvo...","..ovvvvvvo..","..osssssso..","..osxssxso..","..osssssso..","...osssso...","....oooo....",
  "..ccmmmmo...",".ccmmmmmaoo.",".commmmmmao.","..ommmammoo.","..ommmmmmmo.","...ommmmmo..","..oob..boo..",".oob....boo.","..oo....oo..","............","............"
];

const SKELETON = [
  "....oooo....","...owwwwo...","..owwwwwwo..","..owxwwxwo..","..owwwwwwo..","...owwwo....","....oo......",
  "...owwwo....","..owowowo...",".ow.oww.wo..","....owwo....","....owwo....","...ow..wo...","..ow....wo..","..o......o.."
];
const MONSTER = [
  "..o......o..",".og......go.",".oggoooooggo","..ogggggggo.",".ogggggggggo","oggyggggygggo","ogggggggggggo","oggggttgggggo",".ogggttggggo.","..ogggggggo..","..oooggooo...",".oo......oo..","oo........oo."
];

const SHIP = [
  "..............lllll...........",
  "...........oollllllloo.........",
  ".......ooooosssssssssoooo.......",
  "....ooommmmmsssssssssmmmmooo....",
  "..oommmmmmmmmssssssmmmmmmmmmoo..",
  ".ommmmmmmmmmmmmmmmmmmmmmmmmmmmo.",
  "ommmmmmaammmmmmmmmmmmmmaammmmmmo",
  ".ommmmmmmmmmmmmmmmmmmmmmmmmmmmo.",
  "..ooommmmmmmmmmmmmmmmmmmmmmooo..",
  ".....ooommmmmmmmmmmmmmmmooo.....",
  "........ooommmmmmmmmmooo........",
  "...........ooorrrooo............"
];

function spriteMetrics(rows) {
  return { w: Math.max(...rows.map(r => r.length)), h: rows.length };
}
function drawSprite(ctx, rows, palette, scale, x, y, flip = false, alpha = 1) {
  const { w, h } = spriteMetrics(rows);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(snap(x, scale), snap(y, scale));
  if (flip) ctx.scale(-1, 1);
  ctx.translate(-w * scale * .5, -h * scale * .5);
  for (let yy = 0; yy < h; yy++) {
    const row = rows[yy];
    for (let xx = 0; xx < row.length; xx++) {
      const c = row[xx];
      if (c === ".") continue;
      const color = palette[c];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(xx * scale, yy * scale, scale, scale);
    }
  }
  ctx.restore();
}

function cloudBlock(ctx, x, y, w, color, g) {
  const h = Math.max(g * 2, w * .18);
  ctx.fillStyle = color;
  const q = v => snap(v, g);
  ctx.fillRect(q(x), q(y), q(w), q(h));
  ctx.fillRect(q(x + w*.12), q(y-h*.45), q(w*.28), q(h*.65));
  ctx.fillRect(q(x + w*.34), q(y-h*.72), q(w*.32), q(h*.9));
  ctx.fillRect(q(x + w*.62), q(y-h*.38), q(w*.22), q(h*.62));
}

function glowRect(ctx, x, y, w, h, color, alpha=.2) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const grd = ctx.createRadialGradient(x+w/2,y+h/2,0,x+w/2,y+h/2,Math.max(w,h));
  grd.addColorStop(0, color);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grd;
  ctx.fillRect(x-w, y-h, w*3, h*3);
  ctx.restore();
}

function drawDither(ctx, scene, p) {
  const g = Math.max(2, Math.round((scene.dpr || 1) * 2));
  ctx.save();
  ctx.globalAlpha = .055;
  ctx.fillStyle = p.rim;
  for (let y = Math.round(scene.height*.17); y < scene.height*.72; y += g*4) {
    for (let x = (y/g)%2 ? g*2 : 0; x < scene.width; x += g*4) ctx.fillRect(x,y,g,g);
  }
  ctx.restore();
}

function drawSky(scene, ctx) {
  const p = BIOMES[scene.mapIndex % 3];
  const w = scene.width, h = scene.height, s = scene.dpr || 1;
  const gradient = ctx.createLinearGradient(0,0,0,h);
  p.sky.forEach((c,i) => gradient.addColorStop(i/(p.sky.length-1),c));
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,w,h);

  const orbX = (scene.mapIndex===1 ? .76 : scene.mapIndex===2 ? .22 : .72) * w;
  const orbY = (scene.mapIndex===2 ? .16 : .18) * h;
  glowRect(ctx, orbX-32*s, orbY-32*s, 64*s,64*s,p.sun,.42);
  ctx.fillStyle = p.sun;
  const r = (scene.mapIndex===2 ? 16 : 20)*s;
  ctx.fillRect(snap(orbX-r,s*2),snap(orbY-r,s*2),snap(r*2,s*2),snap(r*2,s*2));
  ctx.fillStyle = scene.mapIndex===2 ? "rgba(81,67,135,.45)" : "rgba(255,255,255,.28)";
  ctx.fillRect(snap(orbX-r*.45,s*2),snap(orbY-r*.7,s*2),snap(r*.75,s*2),snap(r*.28,s*2));

  const t = scene.elapsed || 0;
  for (let layer=0; layer<4; layer++) {
    const factor = [.025,.055,.095,.16][layer];
    const y = h * [.2,.3,.39,.49][layer];
    const size = (78-layer*9)*s;
    const alpha = [.16,.21,.29,.37][layer];
    const color = `rgba(255,255,255,${alpha})`;
    for (let i=-2;i<8;i++) {
      let x = i*size*1.2 - ((scene.camera?.x||0)*factor + t*factor*5)%(size*1.2);
      cloudBlock(ctx,x,y+Math.sin(i*1.7+layer)*8*s,size,color,Math.max(2*s,2));
    }
  }

  if (scene.mapIndex===2) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = .15;
    ctx.fillStyle = "#b8a8ff";
    for (let i=0;i<8;i++) {
      const x = ((i*147*s - (scene.camera?.x||0)*.03)%(w+180*s))-70*s;
      const y = (40 + (i*23)%110)*s;
      ctx.fillRect(snap(x,3*s),snap(y,3*s),snap(90*s,3*s),snap(3*s,3*s));
    }
    ctx.restore();
  }

  if (scene.mapIndex===1) {
    ctx.save();
    ctx.globalAlpha = .16;
    ctx.fillStyle = "#e9f4f7";
    for (let i=0;i<30;i++) {
      const x = ((i*91*s - t*8 - (scene.camera?.x||0)*.04)%(w+40*s))-20*s;
      const y = ((i*47*s + t*22)%(h*.6));
      ctx.fillRect(snap(x,2*s),snap(y,2*s),1*s,5*s);
    }
    ctx.restore();
  }

  drawDither(ctx,scene,p);
}

function drawEmeraldLandmarks(scene,ctx,p,g) {
  const s = scene.dpr||1, G = scene.groundY, cam = scene.camera?.x||0;
  ctx.save();
  ctx.translate(-cam*.08,0);
  for(let x=-200*s;x<scene.worldW+500*s;x+=520*s){
    ctx.fillStyle=p.far[0];
    ctx.fillRect(x,G-335*s,38*s,335*s);
    ctx.fillRect(x+180*s,G-335*s,38*s,335*s);
    ctx.fillRect(x+30*s,G-335*s,150*s,28*s);
    ctx.fillStyle=p.far[1];
    ctx.fillRect(x+46*s,G-301*s,118*s,14*s);
    for(let k=0;k<5;k++) ctx.fillRect(x+(52+k*23)*s,G-(282-k%2*10)*s,8*s,190*s);
    ctx.fillStyle="rgba(158,246,202,.20)";
    ctx.fillRect(x+192*s,G-300*s,4*s,225*s);
    ctx.fillRect(x+197*s,G-290*s,2*s,210*s);
  }
  ctx.restore();
  ctx.save();ctx.translate(-cam*.19,0);
  for(let x=-100*s;x<scene.worldW+300*s;x+=170*s){
    const hh=(85+((x/s/170)%4)*20)*s;
    ctx.fillStyle=p.far[2]; ctx.fillRect(x,G-hh,18*s,hh);
    ctx.fillStyle=p.far[3];
    ctx.fillRect(x-22*s,G-hh-28*s,62*s,22*s);ctx.fillRect(x-12*s,G-hh-44*s,42*s,18*s);
  }
  ctx.restore();
}
function drawHarborLandmarks(scene,ctx,p,g) {
  const s=scene.dpr||1,G=scene.groundY,cam=scene.camera?.x||0;
  ctx.save();ctx.translate(-cam*.07,0);
  ctx.fillStyle="rgba(22,45,58,.62)";ctx.fillRect(-1000*s,G-95*s,scene.worldW+2000*s,95*s);
  for(let x=0;x<scene.worldW;x+=430*s){
    ctx.fillStyle=p.far[0];ctx.fillRect(x,G-260*s,42*s,260*s);ctx.fillRect(x-9*s,G-270*s,60*s,12*s);
    ctx.fillStyle=p.accent;ctx.globalAlpha=.55;ctx.fillRect(x+13*s,G-240*s,16*s,7*s);ctx.globalAlpha=1;
    ctx.strokeStyle=p.far[1];ctx.lineWidth=8*s;ctx.beginPath();ctx.moveTo(x+38*s,G-205*s);ctx.lineTo(x+210*s,G-310*s);ctx.lineTo(x+228*s,G-100*s);ctx.stroke();
  }
  ctx.restore();
  ctx.save();ctx.translate(-cam*.18,0);
  for(let x=-180*s;x<scene.worldW+400*s;x+=160*s){
    const hh=(65+((x/s/160)%5)*19)*s;ctx.fillStyle=p.far[2];ctx.fillRect(x,G-hh,92*s,hh);
    ctx.fillStyle="rgba(255,207,126,.22)";for(let y=G-hh+12*s;y<G-14*s;y+=18*s){ctx.fillRect(x+12*s,y,7*s,4*s);ctx.fillRect(x+34*s,y,7*s,4*s);}
  }
  ctx.restore();
}
function drawCloudLandmarks(scene,ctx,p,g) {
  const s=scene.dpr||1,G=scene.groundY,cam=scene.camera?.x||0;
  ctx.save();ctx.translate(-cam*.08,0);
  for(let x=-100*s;x<scene.worldW+500*s;x+=620*s){
    ctx.fillStyle=p.far[0];ctx.fillRect(x+80*s,G-390*s,74*s,300*s);ctx.fillRect(x+57*s,G-405*s,120*s,20*s);
    ctx.fillStyle=p.far[1];ctx.fillRect(x+100*s,G-500*s,34*s,110*s);ctx.fillRect(x+92*s,G-507*s,50*s,10*s);
    ctx.fillStyle="rgba(220,221,255,.16)";for(let k=0;k<6;k++)ctx.fillRect(x+(96+(k%2)*35)*s,G-(370-k*42)*s,9*s,18*s);
  }
  ctx.restore();
  ctx.save();ctx.translate(-cam*.17,0);
  for(let x=-280*s;x<scene.worldW+500*s;x+=350*s){
    ctx.fillStyle=p.far[2];ctx.fillRect(x,G-160*s,220*s,28*s);ctx.fillRect(x+36*s,G-190*s,135*s,34*s);ctx.fillRect(x+78*s,G-220*s,68*s,36*s);
    ctx.fillStyle="rgba(190,225,255,.2)";ctx.fillRect(x+110*s,G-245*s,4*s,80*s);
  }
  ctx.restore();
}

function drawFarWorld(scene,ctx) {
  const p=BIOMES[scene.mapIndex%3],s=scene.dpr||1,G=scene.groundY,cam=scene.camera?.x||0;
  const g=Math.max(2*s,2);
  for(let layer=0;layer<3;layer++){
    ctx.save();ctx.translate(-cam*[.04,.1,.17][layer],0);ctx.fillStyle=p.far[layer];
    ctx.beginPath();ctx.moveTo(-900*s,scene.worldH);
    for(let x=-900*s;x<scene.worldW+900*s;x+=92*s){
      const wave=Math.sin((x/s)*.006+layer)*25*s;const peak=((Math.floor(x/(92*s))+layer)%4===0?48:0)*s;
      ctx.lineTo(snap(x,g),snap(G-(280-layer*70)*s-wave-peak,g));
    }
    ctx.lineTo(scene.worldW+900*s,scene.worldH);ctx.closePath();ctx.fill();ctx.restore();
  }
  if(scene.mapIndex===0)drawEmeraldLandmarks(scene,ctx,p,g);
  else if(scene.mapIndex===1)drawHarborLandmarks(scene,ctx,p,g);
  else drawCloudLandmarks(scene,ctx,p,g);
  const fog=ctx.createLinearGradient(0,G-260*s,0,G+20*s);fog.addColorStop(0,"rgba(255,255,255,0)");fog.addColorStop(.65,p.mist+"22");fog.addColorStop(1,p.mist+"08");ctx.fillStyle=fog;ctx.fillRect(0,G-280*s,scene.width,300*s);
}

function drawGroundMass(scene,ctx) {
  const p=BIOMES[scene.mapIndex%3],s=scene.dpr||1,G=scene.groundY,g=Math.max(2*s,2);
  const grd=ctx.createLinearGradient(0,G,0,scene.worldH);p.ground.forEach((c,i)=>grd.addColorStop(i/(p.ground.length-1),c));ctx.fillStyle=grd;ctx.fillRect(0,G,scene.worldW,scene.worldH-G);
  ctx.fillStyle=p.ground[0];ctx.fillRect(0,G-7*s,scene.worldW,9*s);
  ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(0,G-7*s,scene.worldW,2*s);
  ctx.save();ctx.globalAlpha=.24;
  for(let x=10*s;x<scene.worldW;x+=29*s){
    const yy=G+(18+((x/s*13)%70))*s;ctx.fillStyle=((x/s)%58===0)?p.ground[1]:p.ground[3];ctx.fillRect(snap(x,g),snap(yy,g),snap((3+((x/s)%4))*s,g),snap(2*s,g));
  }
  ctx.restore();
  if(scene.mapIndex===0){ctx.fillStyle="#b4df7a";for(let x=8*s;x<scene.worldW;x+=19*s){const hh=(4+((x/s)%7))*s;ctx.fillRect(x,G-hh,2*s,hh);}}
  if(scene.mapIndex===1){ctx.strokeStyle="rgba(12,22,29,.28)";ctx.lineWidth=1*s;for(let x=0;x<scene.worldW;x+=32*s){ctx.beginPath();ctx.moveTo(x,G);ctx.lineTo(x+14*s,G+16*s);ctx.stroke();}}
  if(scene.mapIndex===2){ctx.fillStyle="rgba(184,232,255,.25)";for(let x=40*s;x<scene.worldW;x+=89*s){ctx.fillRect(x,G+8*s,3*s,28*s);ctx.fillRect(x-4*s,G+12*s,11*s,3*s);}}
}

function decoration(scene,ctx,item) {
  const s=scene.dpr||1,p=BIOMES[scene.mapIndex%3];
  ctx.save();ctx.translate(item.x,item.y);const k=(item.scale||s)/(s||1);ctx.scale(k,k);
  const q=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(snap(x*s,2*s),snap(y*s,2*s),snap(w*s,2*s),snap(h*s,2*s));};
  if(item.kind==="tree"){
    q(-5,-68,10,68,"#5a3925");q(-3,-65,4,61,"#8b5f38");q(-31,-83,62,17,"#255d42");q(-24,-101,49,22,"#377f50");q(-15,-116,31,19,"#6aa95e");q(5,-95,30,18,"#458f52");q(-34,-73,26,15,"#347548");q(-17,-107,7,4,"#b8df78");
  } else if(item.kind==="rock"){
    q(-24,-22,48,22,"#46555a");q(-18,-32,35,12,"#718083");q(-10,-38,20,7,"#a8b1aa");q(-15,-23,9,4,"#8fc06a");
  } else if(item.kind==="crate"){
    q(-23,-43,46,43,"#69462f");q(-20,-40,40,37,"#a56d43");q(-18,-36,36,5,"#d09b61");q(-17,-29,6,25,"#70472f");q(11,-29,6,25,"#70472f");q(-7,-24,14,5,"#cf985f");
  } else if(item.kind==="lamp"){
    q(-3,-78,6,78,"#273641");q(0,-82,25,5,"#273641");q(19,-91,13,14,"#ffcf79");q(22,-88,7,8,"#fff0af");glowRect(ctx,8*s,-105*s,50*s,50*s,p.accent,.18);
  } else if(item.kind==="crystal"){
    q(-4,-68,8,68,"#4e79a8");q(-12,-52,8,38,"#75c7ec");q(5,-45,10,31,"#9ae8ff");q(-2,-72,5,14,"#f3fbff");glowRect(ctx,-24*s,-70*s,50*s,74*s,p.accent,.2);
  } else if(item.kind==="column"){
    q(-18,-86,36,86,"#625678");q(-15,-82,30,78,"#9e91bc");q(-22,-92,44,9,"#d8cff0");q(-22,-7,44,7,"#d8cff0");q(-8,-76,4,66,"rgba(255,255,255,.22)");q(6,-76,3,66,"rgba(63,44,92,.3)");
  } else {
    q(-16,-22,32,22,p.far[2]);q(-10,-31,20,10,p.far[3]);
  }
  ctx.restore();
}

function hero(scene,ctx,entity,config,active){
  if(!entity)return;const s=scene.dpr||1,p=BIOMES[scene.mapIndex%3],speed=Math.abs(entity.body?.velocity?.x||0),vy=entity.body?.velocity?.y||0;
  const scale=Math.max(1.75*s,1.75);let rows=HERO_IDLE;if(Math.abs(vy)>1.4*s)rows=HERO_JUMP;else if(speed>.7*s)rows=(Math.floor((scene.elapsed||0)*8)%2?HERO_RUN1:HERO_RUN2);
  const palette={o:"#171827",s:config.type==="alien"?"#a8e5a8":config.type==="robot"?"#d9e2e8":"#e5b38d",x:"#18243b",m:config.color||"#3b82f6",a:config.accent||"#facc15",v:"#87ecff",c:config.cape===false?(config.color||"#3b82f6"):"#d73566",b:"#23365c"};
  if(active){glowRect(ctx,entity.p.x-25*s,entity.p.y-35*s,50*s,70*s,p.rim,.12);ctx.strokeStyle="rgba(255,255,255,.72)";ctx.lineWidth=2*s;ctx.strokeRect(snap(entity.p.x-22*s,2*s),snap(entity.p.y-34*s,2*s),44*s,65*s);}
  drawSprite(ctx,rows,palette,scale,entity.p.x,entity.p.y-6*s,(entity.facing||1)<0,entity.body?.isSleeping?.8:1);
  ctx.save();ctx.globalAlpha=.22;ctx.fillStyle=p.shadow;ctx.fillRect(entity.p.x-15*s,entity.p.y+25*s,30*s,4*s);ctx.restore();
}

function ship(scene,ctx,entity,config,active){
  if(!entity)return;const s=scene.dpr||1,p=BIOMES[scene.mapIndex%3],scale=Math.max(1.45*s,1.45),flip=(entity.facing||1)<0,speed=Math.abs(entity.body?.velocity?.x||0);
  const palette={o:"#151724",m:config.color||"#ef4444",a:config.accent||"#e5e7eb",s:"#8eeaff",l:"#e7fbff",r:"#ff9348"};
  if(speed>1*s){ctx.save();const dir=flip?1:-1;ctx.globalCompositeOperation="screen";ctx.fillStyle="#ffb85c";for(let i=0;i<4;i++)ctx.fillRect(entity.p.x+dir*(28+i*7)*s,entity.p.y+(i%2?2:-2)*s,(8+i*2)*s,3*s);ctx.restore();}
  if(active)glowRect(ctx,entity.p.x-38*s,entity.p.y-25*s,76*s,50*s,p.rim,.1);
  drawSprite(ctx,SHIP,palette,scale,entity.p.x,entity.p.y,flip);
}

function villain(scene,ctx,v){
  if(!v||v.dead)return;const s=scene.dpr||1,p=BIOMES[scene.mapIndex%3],boss=!!v.isBoss,scale=Math.max((boss?2.8:1.7)*s,boss?2.8:1.7),flip=(v.facing||1)<0;
  let rows=v.type==="skeleton"?SKELETON:MONSTER;
  const palette=v.type==="skeleton"
    ? {o:"#171827",w:v.frozen>0?"#b8fbff":"#ded7c7",x:v.stunned>0?"#ffe56d":"#301f35"}
    : {o:"#162019",g:v.frozen>0?"#8de7ff":scene.mapIndex===0?"#77b84a":scene.mapIndex===1?"#b17746":"#7460a9",y:"#ecf7c4",t:"#e8d7a5"};
  if(boss){glowRect(ctx,v.p.x-55*s,v.p.y-65*s,110*s,130*s,p.accent,.12);}
  drawSprite(ctx,rows,palette,scale,v.p.x,v.p.y-(boss?10*s:3*s),flip);
  if(v.maxHp){const w=(boss?72:40)*s,y=v.p.y-(boss?72:46)*s;ctx.fillStyle="#111523";ctx.fillRect(v.p.x-w/2,y,w,6*s);ctx.fillStyle=v.frozen>0?"#72eaf3":p.accent;ctx.fillRect(v.p.x-w/2+1*s,y+1*s,(w-2*s)*clamp(v.hp/v.maxHp,0,1),4*s);}
}

function foreground(scene,ctx){
  const p=BIOMES[scene.mapIndex%3],s=scene.dpr||1,w=scene.width,h=scene.height,t=scene.elapsed||0;
  ctx.save();
  ctx.globalAlpha=.18;ctx.fillStyle=p.shadow;
  if(scene.mapIndex===0){for(let x=-20*s;x<w+30*s;x+=33*s){const sway=Math.sin(t*1.7+x*.01)*3*s;ctx.fillRect(x,h-24*s+sway,3*s,24*s);ctx.fillRect(x-5*s,h-18*s+sway,12*s,3*s);}}
  else if(scene.mapIndex===1){for(let x=0;x<w;x+=74*s){ctx.fillRect(x,h-25*s,4*s,25*s);ctx.fillRect(x,h-25*s,32*s,4*s);}}
  else {for(let x=14*s;x<w;x+=88*s){ctx.fillRect(x,h-35*s,4*s,35*s);ctx.fillRect(x-6*s,h-38*s,16*s,4*s);}}
  ctx.restore();
  const vg=ctx.createRadialGradient(w*.5,h*.46,Math.min(w,h)*.25,w*.5,h*.46,Math.max(w,h)*.68);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(3,5,12,.28)");ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.globalAlpha=.035;ctx.fillStyle="#ffffff";const g=Math.max(2,Math.round(s*2));for(let i=0;i<38;i++){const x=((i*113+(t*7|0))%(w+20))-10;const y=((i*61+(t*3|0))%(h+20))-10;ctx.fillRect(snap(x,g),snap(y,g),g,g);}ctx.restore();
}

export function applyV21PixelArt(scene){
  if(!scene)throw new Error("v21 requires an initialized v19 scene");
  scene.visualVersion=21;
  scene.artDirection="hd2d-authored-pixel-diorama";
  const oldRender=scene.render?.bind(scene);
  scene.drawSky=function(ctx){drawSky(this,ctx);};
  scene.drawFarWorld=function(ctx){drawFarWorld(this,ctx);};
  scene.drawGroundMass=function(ctx){drawGroundMass(this,ctx);};
  scene.drawDecoration=function(ctx,item){decoration(this,ctx,item);};
  scene.drawHero=function(ctx,entity,config,active){hero(this,ctx,entity,config,active);};
  scene.drawShip=function(ctx,entity,config,active){ship(this,ctx,entity,config,active);};
  scene.drawVillain=function(ctx,v){villain(this,ctx,v);};
  if(oldRender){
    scene.render=function(ctx){
      ctx.imageSmoothingEnabled=false;
      oldRender(ctx);
      foreground(this,ctx);
    };
  }
  return scene;
}
