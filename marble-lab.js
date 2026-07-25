import { Vec2, TAU } from "./engine.js";

const COLORS=["#e76f51","#f2c14e","#52a78b","#6487c8","#a879c8","#ee8f9e"];
const PORTALS=["#7f6eff","#58c7f1","#74d38d","#f4bf5c"];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Vec2.sub(a,b).length();
function pointSeg(p,a,b){const ab=Vec2.sub(b,a),ap=Vec2.sub(p,a),t=clamp(Vec2.dot(ap,ab)/(Vec2.dot(ab,ab)||1),0,1),q=new Vec2(a.x+ab.x*t,a.y+ab.y*t);return{d:dist(p,q),q};}

export class MarbleLab{
  constructor(){
    this.engine=null;this.width=1;this.height=1;this.tool="marble";this.profile="builder";
    this.gravityOn=true;this.gravity=new Vec2(0,920);this.marbles=[];this.segments=[];this.bumpers=[];
    this.spinners=[];this.portals=[];this.pads=[];this.preview=null;this.drag=null;this.color=0;
    this.sceneIndex=0;this.sceneNames=["Meadow","Harbor","Sky Park"];this.pendingPortal=null;this.nextPair=1;this.lastSound=0;
  }
  mount(e){
    this.engine=e;e.pointer.on("down",p=>this.onDown(p));e.pointer.on("move",p=>this.onMove(p));e.pointer.on("up",p=>this.onUp(p));
    this.seed();
    addEventListener("devicemotion",x=>{const a=x.accelerationIncludingGravity;if(!a||!this.gravityOn)return;const gx=clamp(-(a.x||0)*95,-650,650),gy=clamp((a.y||0)*95,-650,650);if(Math.abs(gx)+Math.abs(gy)>70)this.gravity.set(gx,gy);},{passive:true});
  }
  resize(w,h){
    const ow=this.width,oh=this.height;this.width=w;this.height=h;
    if(ow>1&&oh>1){const sx=w/ow,sy=h/oh;for(const m of this.marbles){m.p.x*=sx;m.p.y*=sy}for(const s of this.segments){s.a.x*=sx;s.a.y*=sy;s.b.x*=sx;s.b.y*=sy}for(const x of [...this.bumpers,...this.spinners,...this.portals,...this.pads]){x.p.x*=sx;x.p.y*=sy}}
    this.makePads();
  }
  setTool(x){this.tool=x}
  setProfile(x){this.profile=x;if(x==="little"){this.tool="marble";for(let i=0;i<6;i++)this.addMarble(this.width*(.2+Math.random()*.6),this.height*(.18+Math.random()*.25),30+Math.random()*10)}}
  toggleGravity(){this.gravityOn=!this.gravityOn;if(this.gravityOn)this.gravity.set(0,920);return this.gravityOn}
  cycleScene(){this.sceneIndex=(this.sceneIndex+1)%this.sceneNames.length;this.clear();return this.sceneNames[this.sceneIndex]}
  clear(){this.marbles=[];this.segments=[];this.bumpers=[];this.spinners=[];this.portals=[];this.pendingPortal=null;this.seed()}
  seed(){
    if(this.width<10)return;this.makePads();
    this.segments=[{a:new Vec2(this.width*.12,this.height*.58),b:new Vec2(this.width*.43,this.height*.70),t:13},{a:new Vec2(this.width*.57,this.height*.74),b:new Vec2(this.width*.88,this.height*.60),t:13}];
    this.bumpers=[{p:new Vec2(this.width*.5,this.height*.48),r:34,pulse:0}];
    this.spinners=[{p:new Vec2(this.width*.25,this.height*.33),r:30,a:0,s:2.8,pulse:0}];
    this.addPortalPair(new Vec2(this.width*.18,this.height*.80),new Vec2(this.width*.82,this.height*.83));
    for(let i=0;i<4;i++)this.addMarble(this.width*(.35+i*.08),this.height*(.16+Math.random()*.06),24+i*2);
  }
  makePads(){
    if(this.width<10)return;const layouts=[[[.2,.27,"boost"],[.74,.39,"chime"],[.5,.86,"slow"]],[[.25,.36,"boost"],[.67,.26,"chime"],[.79,.74,"slow"]],[[.2,.43,"chime"],[.62,.28,"boost"],[.82,.66,"slow"]]];
    this.pads=layouts[this.sceneIndex].map((v,i)=>({id:i+1,p:new Vec2(this.width*v[0],this.height*v[1]),kind:v[2],r:28,pulse:0}));
  }
  addMarble(x,y,r=28){
    this.marbles.push({p:new Vec2(x,y),v:new Vec2((Math.random()-.5)*80,(Math.random()-.5)*30),r:clamp(r,18,this.profile==="little"?42:34),c:COLORS[this.color++%COLORS.length],grab:false,cool:0,pad:null});
    if(this.marbles.length>80)this.marbles.shift();this.engine?.audio.ping(330+Math.random()*180,.06,.02,"sine");
  }
  addPortalPair(a,b){const id=this.nextPair++,c=PORTALS[(id-1)%PORTALS.length];this.portals.push({p:a.clone(),r:28,id,c,pulse:0},{p:b.clone(),r:28,id,c,pulse:0})}
  onDown({point}){
    this.engine.audio.unlock();if(this.tool==="eraser")return this.erase(point);
    const hit=[...this.marbles].reverse().find(m=>dist(point,m.p)<=m.r+8);
    if(hit&&this.tool==="marble"){hit.grab=true;hit.v.set(0,0);this.drag=hit;return}
    if(this.tool==="marble")this.addMarble(point.x,point.y,this.profile==="little"?38:27);
    else if(this.tool==="ramp")this.preview={a:point.clone(),b:point.clone(),t:14};
    else if(this.tool==="bumper"){this.bumpers.push({p:point.clone(),r:this.profile==="little"?42:34,pulse:1});this.engine.audio.ping(220,.09,.025,"triangle")}
    else if(this.tool==="spinner"){this.spinners.push({p:point.clone(),r:30,a:0,s:(Math.random()-.5)*7||2.5,pulse:1});this.engine.audio.ping(260,.08,.02,"triangle")}
    else if(this.tool==="portal"){
      if(this.pendingPortal==null){const id=this.nextPair++,c=PORTALS[(id-1)%PORTALS.length];this.portals.push({p:point.clone(),r:28,id,c,pulse:1});this.pendingPortal=id;this.engine.audio.ping(420,.06,.02,"triangle")}
      else{const id=this.pendingPortal,c=PORTALS[(id-1)%PORTALS.length];this.portals.push({p:point.clone(),r:28,id,c,pulse:1});this.pendingPortal=null;this.engine.audio.ping(540,.08,.024,"triangle")}
    }
  }
  onMove({point}){if(this.tool==="eraser")return this.erase(point);if(this.drag){const d=Vec2.sub(point,this.drag.p);this.drag.v=d.mul(18);this.drag.p=point.clone()}if(this.preview)this.preview.b=point.clone()}
  onUp(){if(this.drag){this.drag.grab=false;this.drag=null}if(this.preview){if(dist(this.preview.a,this.preview.b)>34)this.segments.push(this.preview);this.preview=null}}
  erase(p){
    this.marbles=this.marbles.filter(m=>dist(m.p,p)>m.r+22);this.bumpers=this.bumpers.filter(x=>dist(x.p,p)>x.r+22);this.spinners=this.spinners.filter(x=>dist(x.p,p)>x.r+20);this.segments=this.segments.filter(s=>pointSeg(p,s.a,s.b).d>30);
    const q=this.portals.find(x=>dist(x.p,p)<=x.r+18);if(q)this.portals=this.portals.filter(x=>x.id!==q.id);
  }
  sound(v,bright=false){const n=performance.now();if(n-this.lastSound<45||Math.abs(v)<85)return;this.lastSound=n;this.engine.audio.ping(bright?520:clamp(180+Math.abs(v)*.25,180,620),.045,.012,bright?"triangle":"sine")}
  update(dt){
    if(!dt)return;const g=this.gravityOn?this.gravity:new Vec2(),floor=this.height-Math.max(90,this.height*.1);
    for(const x of this.bumpers)x.pulse=Math.max(0,x.pulse-dt*3);for(const x of this.spinners){x.a+=dt*x.s;x.pulse=Math.max(0,x.pulse-dt*3)}for(const x of [...this.portals,...this.pads])x.pulse=Math.max(0,x.pulse-dt*2.5);
    for(const m of this.marbles){
      m.cool=Math.max(0,m.cool-dt);if(m.grab)continue;m.v.x+=g.x*dt;m.v.y+=g.y*dt;m.v.mul(Math.pow(.996,dt*60));m.p.x+=m.v.x*dt;m.p.y+=m.v.y*dt;
      if(m.p.x<m.r){m.p.x=m.r;m.v.x=Math.abs(m.v.x)*.78}if(m.p.x>this.width-m.r){m.p.x=this.width-m.r;m.v.x=-Math.abs(m.v.x)*.78}if(m.p.y<m.r){m.p.y=m.r;m.v.y=Math.abs(m.v.y)*.78}if(m.p.y>floor-m.r){m.p.y=floor-m.r;m.v.y=-Math.abs(m.v.y)*.72;m.v.x*=.985;this.sound(m.v.y)}
      for(const s of this.segments){const h=pointSeg(m.p,s.a,s.b),min=m.r+s.t/2;if(h.d<min&&h.d){const n=Vec2.sub(m.p,h.q).normalize();m.p.add(n.clone().mul(min-h.d+.5));const vn=Vec2.dot(m.v,n);if(vn<0){m.v.sub(n.clone().mul(1.72*vn));this.sound(vn)}}}
      for(const b of this.bumpers){const d=Vec2.sub(m.p,b.p),z=d.length()||.01,min=m.r+b.r;if(z<min){const n=d.mul(1/z);m.p.add(n.clone().mul(min-z+1));m.v.add(n.clone().mul(Math.max(280,Math.abs(Vec2.dot(m.v,n))+180)));b.pulse=1;this.sound(400,true)}}
      for(const s of this.spinners){const d=Vec2.sub(m.p,s.p),z=d.length()||.01,min=m.r+s.r;if(z<min){const n=d.mul(1/z),t=new Vec2(-n.y,n.x).mul(Math.sign(s.s||1));m.p.add(n.clone().mul(min-z+1));m.v.add(t.mul(220)).add(n.clone().mul(80));s.pulse=1;this.engine.audio.ping(360,.04,.014,"square")}}
      this.padHit(m);this.portalHit(m);
    }
    for(let i=0;i<this.marbles.length;i++)for(let j=i+1;j<this.marbles.length;j++){const a=this.marbles[i],b=this.marbles[j],d=Vec2.sub(b.p,a.p),z=d.length()||.01,min=a.r+b.r;if(z<min){const n=d.mul(1/z),o=(min-z)/2;if(!a.grab)a.p.add(n.clone().mul(-o));if(!b.grab)b.p.add(n.clone().mul(o));const v=Vec2.dot(Vec2.sub(b.v,a.v),n);if(v<0){a.v.add(n.clone().mul(v*.78));b.v.add(n.clone().mul(-v*.78))}}}
  }
  padHit(m){let active=null;for(const p of this.pads)if(dist(m.p,p.p)<m.r+p.r){active=p.id;if(m.pad!==p.id){p.pulse=1;if(p.kind==="boost"){m.v.x+=(Math.random()-.5)*360;m.v.y-=180;this.engine.audio.ping(620,.05,.018,"triangle")}else if(p.kind==="chime")this.engine.audio.ping(470,.09,.015,"sine");else{m.v.mul(.76);this.engine.audio.ping(220,.08,.012,"sine")}}}m.pad=active}
  portalHit(m){if(m.cool>0)return;for(const p of this.portals)if(dist(m.p,p.p)<p.r+m.r*.35){const q=this.portals.find(x=>x.id===p.id&&x!==p);if(!q)return;const n=m.v.length()>10?m.v.clone().normalize():new Vec2(1,0);m.p=q.p.clone().add(n.clone().mul(q.r+m.r+4));m.v.add(n.mul(120));m.cool=.35;p.pulse=q.pulse=1;this.engine.audio.ping(700,.05,.015,"triangle");return}}
  render(ctx){this.drawMap(ctx);const floor=this.height-Math.max(90,this.height*.1);ctx.fillStyle="rgba(69,65,59,.06)";ctx.fillRect(0,floor,this.width,this.height-floor);for(const p of this.pads)this.drawPad(ctx,p);for(const s of this.segments)this.drawRamp(ctx,s);if(this.preview){ctx.save();ctx.globalAlpha=.5;this.drawRamp(ctx,this.preview);ctx.restore()}for(const b of this.bumpers)this.drawBumper(ctx,b);for(const s of this.spinners)this.drawSpinner(ctx,s);for(const p of this.portals)this.drawPortal(ctx,p);for(const m of this.marbles)this.drawMarble(ctx,m)}
  drawMap(ctx){
    const w=this.width,h=this.height,g=ctx.createLinearGradient(0,0,w,h);if(this.sceneIndex===0){g.addColorStop(0,"#f7f4ea");g.addColorStop(1,"#e7e1d2")}else if(this.sceneIndex===1){g.addColorStop(0,"#f9efd9");g.addColorStop(1,"#e9d6b4")}else{g.addColorStop(0,"#e8f6ff");g.addColorStop(1,"#f8ecdc")}ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.globalAlpha=.18;if(this.sceneIndex===0){ctx.fillStyle="#81b97a";for(const [x,y,rx,ry] of [[.18,.22,70,42],[.82,.18,75,45],[.18,.86,85,52]]){ctx.beginPath();ctx.ellipse(w*x,h*y,rx,ry,0,0,TAU);ctx.fill()}ctx.fillStyle="#86c6df";ctx.beginPath();ctx.ellipse(w*.8,h*.33,58,38,-.2,0,TAU);ctx.fill();this.tree(ctx,w*.09,h*.72,.9);this.tree(ctx,w*.88,h*.88,1.1);this.house(ctx,w*.12,h*.1)}
    else if(this.sceneIndex===1){ctx.fillStyle="#75c7e8";ctx.fillRect(0,h*.08,w,h*.14);ctx.fillRect(0,h*.8,w,h*.12);ctx.fillStyle="#8dbf77";ctx.beginPath();ctx.ellipse(w*.24,h*.48,65,40,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(w*.78,h*.54,75,44,0,0,TAU);ctx.fill();this.lighthouse(ctx,w*.9,h*.15);this.dock(ctx,w*.1,h*.86)}
    else{this.cloud(ctx,w*.16,h*.16,1.1);this.cloud(ctx,w*.78,h*.12,.9);this.cloud(ctx,w*.88,h*.3,.8);ctx.fillStyle="#f3cd58";ctx.beginPath();ctx.arc(w*.12,h*.12,42,0,TAU);ctx.fill();this.balloon(ctx,w*.22,h*.8);this.balloon(ctx,w*.76,h*.84)}ctx.restore();
    ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle="#81796d";for(let x=56;x<w;x+=56){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=56;y<h;y+=56){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}ctx.restore();
  }
  drawRamp(ctx,s){ctx.lineCap="round";ctx.strokeStyle="rgba(0,0,0,.1)";ctx.lineWidth=s.t+7;ctx.beginPath();ctx.moveTo(s.a.x+2,s.a.y+3);ctx.lineTo(s.b.x+2,s.b.y+3);ctx.stroke();ctx.strokeStyle="#8c6138";ctx.lineWidth=s.t;ctx.beginPath();ctx.moveTo(s.a.x,s.a.y);ctx.lineTo(s.b.x,s.b.y);ctx.stroke()}
  drawBumper(ctx,b){ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(b.p.x,b.p.y,b.r+5+b.pulse*5,0,TAU);ctx.fill();ctx.fillStyle="#ec7b67";ctx.beginPath();ctx.arc(b.p.x,b.p.y,b.r+b.pulse*4,0,TAU);ctx.fill()}
  drawSpinner(ctx,s){ctx.save();ctx.translate(s.p.x,s.p.y);ctx.rotate(s.a);ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(0,0,s.r+4,0,TAU);ctx.fill();for(const c of ["#f4c15d","#6bc2d5","#ea7b68","#88c76e"]){ctx.rotate(Math.PI/2);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(8,-6,s.r-2,-4);ctx.quadraticCurveTo(10,10,0,18);ctx.closePath();ctx.fill()}ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(0,0,7,0,TAU);ctx.fill();ctx.restore()}
  drawPortal(ctx,p){ctx.save();ctx.translate(p.p.x,p.p.y);ctx.rotate(performance.now()/900);ctx.strokeStyle=p.c;ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,p.r+p.pulse*4,0,TAU);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,p.r-9,0,TAU);ctx.stroke();ctx.restore()}
  drawPad(ctx,p){const c={boost:"#54a86c",chime:"#4e99c4",slow:"#c5963f"}[p.kind];ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(p.p.x,p.p.y,p.r+4+p.pulse*4,0,TAU);ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.arc(p.p.x,p.p.y,p.r,0,TAU);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 24px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(p.kind==="boost"?"↟":p.kind==="chime"?"♪":"+",p.p.x,p.p.y)}
  drawMarble(ctx,m){const q=ctx.createRadialGradient(m.p.x-m.r*.35,m.p.y-m.r*.4,2,m.p.x,m.p.y,m.r);q.addColorStop(0,"#fff");q.addColorStop(.16,m.c);q.addColorStop(1,"#394d73");ctx.fillStyle=q;ctx.beginPath();ctx.arc(m.p.x,m.p.y,m.r,0,TAU);ctx.fill()}
  tree(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle="#8c6946";c.fillRect(-5,0,10,26);c.fillStyle="#77ad68";for(const [a,b,r] of [[0,-6,18],[-12,2,14],[13,1,13]]){c.beginPath();c.arc(a,b,r,0,TAU);c.fill()}c.restore()}
  house(c,x,y){c.save();c.translate(x,y);c.fillStyle="#fff5ef";c.fillRect(-16,8,32,24);c.fillStyle="#d97b65";c.beginPath();c.moveTo(-20,10);c.lineTo(0,-6);c.lineTo(20,10);c.closePath();c.fill();c.restore()}
  lighthouse(c,x,y){c.save();c.translate(x,y);c.fillStyle="#fff";c.fillRect(-12,-8,24,48);c.fillStyle="#e97b67";c.fillRect(-12,4,24,8);c.fillRect(-12,20,24,8);c.fillStyle="#5d6b83";c.fillRect(-15,-16,30,10);c.restore()}
  dock(c,x,y){c.save();c.translate(x,y);c.fillStyle="#98724a";c.fillRect(-10,-12,70,12);for(const z of [-6,20,46])c.fillRect(z,0,8,20);c.restore()}
  cloud(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle="#fff";for(const [a,b,r] of [[-18,2,18],[2,-6,22],[25,2,18]]){c.beginPath();c.arc(a,b,r,0,TAU);c.fill()}c.restore()}
  balloon(c,x,y){c.save();c.translate(x,y);c.fillStyle="#e88572";c.beginPath();c.ellipse(0,-20,18,24,0,0,TAU);c.fill();c.strokeStyle="#8b6a47";c.beginPath();c.moveTo(0,4);c.lineTo(0,30);c.stroke();c.fillStyle="#cfa973";c.fillRect(-9,30,18,10);c.restore()}
}
