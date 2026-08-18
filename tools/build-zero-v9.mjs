import fs from 'node:fs';

const input='zero-is-you/game-v8.js',output='zero-is-you/game-v9.js';
let src=fs.readFileSync(input,'utf8');

// v8 was assembled incrementally and contains repeated single-line helpers. Keep first.
const seen=new Set();
src=src.split('\n').filter(line=>{
  const m=line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if(!m)return true;if(seen.has(m[1]))return false;seen.add(m[1]);return true;
}).join('\n');

src=src.replace("import {WORLDS,LEVELS,LEVEL_BY_ID} from './challenge-levels.js';","import {WORLDS,LEVELS,LEVEL_BY_ID} from './levels-v9.js';");
src=src.replace("import {displayFactKey} from './facts.js';","import {displayFactKey} from './facts.js';\nimport {createMusicV9} from './music-v9.js';");

function replaceLineFunction(name,code){
  const lines=src.split('\n');let n=0;
  src=lines.map(line=>{if(line.startsWith(`function ${name}(`)){n++;return code;}return line;}).join('\n');
  if(n!==1)throw new Error(`expected one ${name}, got ${n}`);
}

src=src.replace(/function ptext\([^\n]+/,m=>m+"\nfunction fitPtext(t,x,y,maxW,col=P.white,maxS=3,minS=1,align='center'){let s=maxS;while(s>minS&&textWidth(String(t).toUpperCase(),s,1)>maxW)s--;ptext(t,x,y,col,s,align,s===1?0:1);}");
src=src.replace(/function card\(x,y,w,h,accent,title,sub,done=false\)\{.*?\}function factEntry/,`function card(x,y,w,h,accent,title,sub,done=false){rect(x,y,w,h,P.black);rect(x+2,y+2,w-4,h-4,accent);rect(x+5,y+5,w-10,h-10,P.ink);if(done){rect(x+7,y+7,w-14,4,accent);rect(x+w-13,y+8,5,5,accent);}fitPtext(title,x+w/2,y+17,w-22,P.white,2,1,'center');if(sub)fitPtext(sub,x+w/2,y+h-16,w-18,done?P.paper:P.gray,1,1,'center');}function factEntry`);

// Menu backdrop: sparse procedural stars, no generated-image assets.
src=src.replace("function clear(){hits=[];rect(0,0,canvas.width,canvas.height,P.deep);}","function clear(){hits=[];rect(0,0,canvas.width,canvas.height,P.deep);}function menuBackdrop(seed=0){clear();rect(0,0,canvas.width,canvas.height,'#151d31');for(let i=0;i<44;i++){const n=hash(`star:${seed}:${i}`),x=n%canvas.width,y=(n>>>9)%canvas.height,s=(n>>>18)%5===0?2:1;rect(x,y,s,s,(n>>>22)%3===0?P.sand:P.gray);}for(let y=54;y<canvas.height;y+=32)rect(0,y,canvas.width,1,'#ffffff08');}function bandColor(w){return [P.sand,P.mint,P.ice,P.violet,P.rust,P.red][Math.max(0,(w||1)-1)]||P.sand;}");

replaceLineFunction('drawMap',`function drawMap(){menuBackdrop(0);fitPtext('ZERO IS YOU',canvas.width/2,12,360,P.sand,4,2);ptext('CHALLENGE CONSTELLATION',canvas.width/2,47,P.gray,1,'center');const cw=178,ch=82,xs=[9,197],ys=[68,156,244];WORLDS.forEach((w,i)=>{const x=xs[i%2],y=ys[Math.floor(i/2)],done=LEVELS.filter(l=>l.world===w.id&&progress.done[l.id]).length,accent=bandColor(w.id);card(x,y,cw,ch,accent,`BAND ${w.band}`,`${w.name}  ${done}/10`,done===10);addHit(x,y,cw,ch,()=>{world=w.id;screen='world';beep(330);draw();});});drawBookIcon(32,348);ptext('FACT BOOK',51,386,P.paper,1,'center');addHit(15,340,78,60,()=>{screen='book';draw();});card(190,344,184,58,P.gold,'FACT FORGE',`${progress.nilExpansion.facts.length} FACTS`,false);addHit(190,344,184,58,()=>{screen='nil';draw();});ptext('BANDS ARE GAME TARGETS, NOT TEST NORMS',canvas.width/2,423,P.gray,1,'center');}`);

replaceLineFunction('drawWorld',`function drawWorld(){menuBackdrop(world);const w=WORLDS[world-1],accent=bandColor(world);ptext('< MAP',10,10,P.gray,1);addHit(0,0,70,36,()=>{screen='map';draw();});fitPtext(w.name,canvas.width/2,10,300,accent,3,2);ptext(`BAND ${w.band}  ·  ${w.subtitle.replace(/^BAND [^·]+ · /,'')}`,canvas.width/2,42,P.gray,1,'center');const ls=LEVELS.filter(l=>l.world===world),cw=180,ch=59;ls.forEach((l,i)=>{const x=7+(i%2)*190,y=66+Math.floor(i/2)*65;card(x,y,cw,ch,accent,`${i+1}. ${l.title}`,`R${l.reasoningSteps||1}  ${progress.done[l.id]?'DONE':'OPEN'}`,!!progress.done[l.id]);addHit(x,y,cw,ch,()=>openLevel(l));});ptext('R = ESTIMATED REASONING STEPS',canvas.width/2,414,P.gray,1,'center');}`);

replaceLineFunction('drawNilWorld',`function drawNilWorld(){menuBackdrop(6);ptext('< MAP',10,10,P.gray,1);addHit(0,0,70,36,()=>{screen='map';draw();});fitPtext('FACT FORGE',canvas.width/2,12,300,P.gold,3,2);ptext('AUTHOR TRUE RELATIONS',canvas.width/2,43,P.paper,1,'center');const cw=180,ch=59;NIL_LEVELS.forEach((l,i)=>{const x=7+(i%2)*190,y=66+Math.floor(i/2)*65;card(x,y,cw,ch,P.gold,`${i+1}. ${l.title}`,`R${l.reasoningSteps||3} ${progress.done[l.id]?'DONE':'OPEN'}`,!!progress.done[l.id]);addHit(x,y,cw,ch,()=>openLevel(l));});}`);

replaceLineFunction('drawFactBook',`function drawFactBook(){menuBackdrop(6);ptext('< MAP',10,10,P.gray,1);addHit(0,0,70,36,()=>{screen='map';draw();});fitPtext('THE FACT BOOK',canvas.width/2,10,300,P.paper,3,2);rect(14,54,356,372,P.black);rect(18,58,172,364,P.paper);rect(194,58,172,364,P.paper);rect(188,62,8,356,P.rust);const facts=progress.nilExpansion.facts||[];if(!facts.length){ptext('EMPTY',canvas.width/2,145,'#5a4638',3,'center');ptext('TRUE FACTS FROM THE FORGE LIVE HERE',canvas.width/2,186,'#795e4a',1,'center');}else facts.slice(0,20).forEach((f,i)=>{const col=i<10?0:1,row=i%10,px=col?204:28,py=76+row*33;fitPtext(factEntry(f),px,py,150,'#30251e',1,1,'left');ptext((f.familyKey||'').startsWith('add:')?'FAMILY':'FACT',px,py+14,'#7b5c45',1);});}`);

replaceLineFunction('drawPlay',`function drawPlay(){clear();const L=layout(),accent=bandColor(level.world);fitPtext(level.expansion==='nil'?'FACT FORGE':level.title,10,7,245,level.expansion==='nil'?P.gold:accent,2,1,'left');ptext(`B${level.challengeBand||'-'} M${state.moves}`,canvas.width-8,8,P.gray,1,'right');ptext('#'.repeat(Math.min(9,level.difficulty||1)),canvas.width-8,29,P.gold,1,'right');fitPtext(level.concept||'',10,31,245,P.gray,1,1,'left');for(let gy=0;gy<8;gy++)for(let gx=0;gx<12;gx++)terrain(level.world,gx,gy);specialOverlay();if(level.mode==='graph')drawGraph();else{for(const e of state.entities.filter(e=>e.kind==='floor'))drawFloor(e);for(const e of state.entities.filter(e=>e.kind==='object'))drawObject(e);for(const e of state.entities.filter(e=>e.kind==='word'))drawWord(e);}if(level.expansion==='nil'||level.goal?.type==='facts')drawFactGlow();if(L===PORTRAIT){rect(0,L.panelY,384,128,P.black);rect(0,L.panelY,384,4,accent);fitPtext(level.goal?.type==='facts'?'BUILD THE TRUE RELATION':(level.goalText||'REASON, THEN MOVE'),12,334,350,P.white,2,1,'left');if(level.goal?.type==='facts'){ptext('FACTS AUTHORED',12,364,P.gray,1);(state.authoredInLevel||[]).slice(-3).forEach((k,i)=>fitPtext(`+ ${displayFactKey(k)}`,16,382+i*18,350,P.paper,1,1,'left'));}else{ptext('ACTIVE RULES',12,364,P.gray,1);(state.rules||[]).slice(0,3).forEach((r,i)=>fitPtext(`${r.subject} ${r.verb} ${r.object}`,16,382+i*18,350,i===0?P.sand:P.white,1,1,'left'));}if(level.hint)ptext('HOLD SNAIL = HINT',372,423,P.gray,1,'right');}}`);

replaceLineFunction('syncMusic',`const musicV9=createMusicV9(audio);function syncMusic(){if(music){musicV9.setScene(screen==='nil'?6:world);musicV9.start(screen==='nil'?6:world);}else musicV9.stop();}`);
replaceLineFunction('draw',`function draw(){if(music)musicV9.setScene(screen==='nil'?6:world);if(screen==='map')drawMap();else if(screen==='world')drawWorld();else if(screen==='nil')drawNilWorld();else if(screen==='book')drawFactBook();else if(screen==='play')drawPlay();}`);
replaceLineFunction('showParent',`function showParent(){const done=Object.keys(progress.done).filter(k=>progress.done[k]).length;modal.classList.remove('hidden');modal.innerHTML=\`<div class="modalbox"><h2>PARENT PANEL</h2><p>${'${done}'} puzzles completed<br>${'${progress.nilExpansion.facts.length}'} facts authored</p><p>v9 · native 32×32 pixel art<br>Six challenge bands: 50 → 99.9<br>Band labels are game targets, not psychometric norms.</p><p>Music: original tracker pieces + new 8-bit arrangements of public-domain classical works.</p><button id="closep">BACK</button></div>\`;$('#closep').onclick=()=>modal.classList.add('hidden');}`);

src=src.replaceAll("./sw.js?v=8.0","./sw.js?v=9.0");
src += '\n//# sourceURL=zero-is-you-v9.js\n';
fs.writeFileSync(output,src);

const duplicates=[...src.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m=>m[1]).filter((x,i,a)=>a.indexOf(x)!==i);
if(duplicates.length)throw new Error(`duplicate top-level functions remain: ${[...new Set(duplicates)].join(', ')}`);
if(!src.includes("from './levels-v9.js'"))throw new Error('v9 levels import missing');
if(!src.includes('createMusicV9'))throw new Error('v9 music integration missing');
console.log(`built ${output}: ${src.length} bytes`);
