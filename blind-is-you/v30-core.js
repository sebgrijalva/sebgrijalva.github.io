(function(){
'use strict';

const BUILD='3.0.1';
const PROTOCOL='biy-v3-p2';
const STORAGE={sessions:'biy_v30_sessions',trials:'biy_v30_trials',active:'biy_v30_active'};
const FORMS=['trace','shift','echo'];
const META={
  trace:{name:'TRACE',construct:'serial visuospatial maintenance',axis:'span',min:3,max:9,start:3},
  shift:{name:'SHIFT',construct:'object-location binding + controlled updating',axis:'updates',min:1,max:8,start:1},
  echo:{name:'ECHO',construct:'serial maintenance under controlled manual-spatial interference',axis:'span',min:3,max:9,start:3}
};
const TEST=/[?&]test=1(?:&|$)/.test(location.search);
const T=TEST?{flash:35,gap:12,veil:20,bind:55,op:55,feedback:25,intGap:15,intDeadline:1000,demo:45}:{flash:560,gap:180,veil:420,bind:1850,op:1050,feedback:620,intGap:260,intDeadline:1500,demo:720};
const TAP_MAX_PX=14,TAP_MAX_MS=950;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const copy=x=>JSON.parse(JSON.stringify(x));
const iso=()=>new Date().toISOString();
const key=p=>p.r+','+p.c;
const eq=(a,b)=>!!a&&!!b&&a.r===b.r&&a.c===b.c;
function load(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(_){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}
function seed32(){if(window.crypto&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}
function rng32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function randint(rng,n){return Math.floor(rng()*n)}
function shuffled(a,rng){a=a.slice();for(let i=a.length-1;i>0;i--){const j=randint(rng,i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function freezeDeep(o){Object.freeze(o);Object.getOwnPropertyNames(o).forEach(k=>{const v=o[k];if(v&&typeof v==='object'&&!Object.isFrozen(v))freezeDeep(v)});return o}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:NaN}
function round1(x){return Math.round(x*10)/10}
function titleCase(s){return s.charAt(0).toUpperCase()+s.slice(1)}

const SHAPES={
  diamond:'<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 10L88 50 50 90 12 50Z"/></svg>',
  ring:'<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34"/><circle cx="50" cy="50" r="13"/></svg>'
};
const OBJECTS=[{id:'diamond',label:'diamond'},{id:'ring',label:'ring'}];
const DIRS=[{dr:-1,dc:0,arrow:'↑',name:'up'},{dr:1,dc:0,arrow:'↓',name:'down'},{dr:0,dc:-1,arrow:'←',name:'left'},{dr:0,dc:1,arrow:'→',name:'right'}];

let session=null,cancelled=0;
const debug={currentSpec:null,currentMode:null};

function tapOnce(el,handler){
  let active=null;
  const down=e=>{if(!e.isPrimary||active)return;active={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};try{el.setPointerCapture(e.pointerId)}catch(_){ }e.preventDefault()};
  const up=e=>{if(!active||e.pointerId!==active.id)return;const a=active;active=null;const dist=Math.hypot(e.clientX-a.x,e.clientY-a.y),dt=performance.now()-a.t;e.preventDefault();e.stopPropagation();if(dist<=TAP_MAX_PX&&dt<=TAP_MAX_MS)handler(e)};
  const cancel=e=>{if(active&&e.pointerId===active.id)active=null};
  const keydown=e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();handler(e)}};
  el.addEventListener('pointerdown',down,{passive:false});el.addEventListener('pointerup',up,{passive:false});el.addEventListener('pointercancel',cancel,{passive:true});el.addEventListener('keydown',keydown);
  return()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',cancel);el.removeEventListener('keydown',keydown)};
}
function bindStatic(id,fn){const el=$(id);if(el)tapOnce(el,fn)}

function svgEl(name,attrs={}){const el=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));return el}
function renderTapestry(){
  const host=$('#tapestry');if(!host)return;host.innerHTML='';const svg=svgEl('svg',{viewBox:'0 0 640 220','aria-hidden':'true'}),rng=rng32(0x51f2a7c3),cols=16,rows=6,w=40,h=36.7;
  const colors=['#ef604f','#f4b51e','#087d54','#1185b8','#e65874','#f07835'];
  const motifs=[
    (x,y)=>`M${x} ${y+h/2}H${x+w} M${x+w/2} ${y}V${y+h/2}`,
    (x,y)=>`M${x} ${y+h}V${y+h/2}Q${x} ${y} ${x+w/2} ${y}H${x+w}`,
    (x,y)=>`M${x} ${y}H${x+w/2}V${y+h}H${x+w}`,
    (x,y)=>`M${x} ${y+h/2}H${x+w/2}Q${x+w} ${y+h/2} ${x+w} ${y}`,
    (x,y)=>`M${x} ${y}H${x+w} M${x+w/2} ${y}Q${x+w/2} ${y+h} ${x+w} ${y+h}`,
    (x,y)=>`M${x} ${y+h}H${x+w/2}V${y} M${x+w/2} ${y+h/2}H${x+w}`
  ];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const x=c*w,y=r*h,m=motifs[randint(rng,motifs.length)];
    const p=svgEl('path',{d:m(x,y),fill:'none',stroke:'#42575b','stroke-width':1.35,'stroke-linecap':'square'});svg.appendChild(p);
    if(rng()<.47){const stem=svgEl('path',{d:`M${x+w*(.25+.5*rng())} ${y+h*(.15+.7*rng())}v${(rng()<.5?-1:1)*(5+8*rng())}`,stroke:'#42575b','stroke-width':1.2});svg.appendChild(stem)}
    if(rng()<.43){const cx=x+6+rng()*(w-12),cy=y+6+rng()*(h-12),color=colors[randint(rng,colors.length)];if(rng()<.28){svg.appendChild(svgEl('rect',{x:cx-4,y:cy-4,width:8,height:8,fill:color,stroke:'#304348','stroke-width':1}))}else{svg.appendChild(svgEl('circle',{cx,cy,r:4.2,fill:color,stroke:'#304348','stroke-width':1}))}}
  }
  host.appendChild(svg);
}

function showHome(){cancelled++;$('#instrument').classList.add('hidden');$('#modal').classList.add('hidden');$('#home').classList.remove('hidden');session=load(STORAGE.active,null);$('#resume').classList.toggle('hidden',!session);$('#homeStatus').textContent=session?'An unfinished v3 session is preserved locally.':'';renderTapestry()}
function showInstrument(){$('#home').classList.add('hidden');$('#instrument').classList.remove('hidden')}
function setHeader(form,phase,title,detail){$('#formLabel').textContent=form?('FORM · '+META[form].name):'BLIND IS YOU · v3.0';$('#phaseLabel').textContent=phase||'';$('#trialTitle').textContent=title||'';$('#trialDetail').textContent=detail||''}
function metrics(items){const m=$('#metricStrip');m.innerHTML='';items.filter(Boolean).forEach(x=>{const s=document.createElement('span');s.textContent=x;m.appendChild(s)})}
function setProgress(done,total){const p=$('#progress');p.innerHTML='';for(let i=0;i<total;i++){const x=document.createElement('i');if(i<done)x.className='done';else if(i===done)x.className='current';p.appendChild(x)}}
function clearOverlay(){const o=$('#overlay');o.className='overlay pointer-silent';o.innerHTML=''}
function overlay(html,interactive=false){const o=$('#overlay');o.className='overlay '+(interactive?'interactive':'pointer-silent');o.innerHTML=html;return o}
function buildBoard(n){const b=$('#board');b.innerHTML='';b.style.setProperty('--n',n);b.setAttribute('aria-rowcount',n);b.setAttribute('aria-colcount',n);for(let r=0;r<n;r++)for(let c=0;c<n;c++){const x=document.createElement('button');x.type='button';x.className='cell';x.dataset.r=r;x.dataset.c=c;x.setAttribute('role','gridcell');x.setAttribute('aria-label',`row ${r+1}, column ${c+1}`);b.appendChild(x)}return b}
function cell(p){return $(`.cell[data-r="${p.r}"][data-c="${p.c}"]`)}
function clearCells(){$$('.cell').forEach(x=>{x.className='cell';x.innerHTML=''})}
function markCell(p,cls,html=''){const x=cell(p);if(x){x.className='cell '+cls;x.innerHTML=html}}
function glyphAt(p,o,extra=''){markCell(p,`glyph ${extra}`.trim(),SHAPES[o.id])}

function waitBoardTap(token){return new Promise((resolve,reject)=>{
  const b=$('#board');let active=null,done=false,iv=null;
  const cleanup=()=>{b.removeEventListener('pointerdown',down);b.removeEventListener('pointerup',up);b.removeEventListener('pointercancel',pc);b.removeEventListener('keydown',kd);if(iv)clearInterval(iv)};
  const finish=(x,e)=>{if(done)return;done=true;cleanup();e&&e.preventDefault();resolve({r:+x.dataset.r,c:+x.dataset.c})};
  const down=e=>{if(!e.isPrimary||active||token!==cancelled)return;const x=e.target.closest('.cell');if(!x)return;active={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),cell:x};try{b.setPointerCapture(e.pointerId)}catch(_){ }e.preventDefault()};
  const up=e=>{if(!active||e.pointerId!==active.id)return;const a=active;active=null;const d=Math.hypot(e.clientX-a.x,e.clientY-a.y),dt=performance.now()-a.t;e.preventDefault();e.stopPropagation();if(d<=TAP_MAX_PX&&dt<=TAP_MAX_MS)finish(a.cell,e)};
  const pc=e=>{if(active&&e.pointerId===active.id)active=null};
  const kd=e=>{const x=e.target.closest&&e.target.closest('.cell');if(x&&(e.key==='Enter'||e.key===' ')){e.preventDefault();finish(x,e)}};
  b.addEventListener('pointerdown',down,{passive:false});b.addEventListener('pointerup',up,{passive:false});b.addEventListener('pointercancel',pc,{passive:true});b.addEventListener('keydown',kd);
  iv=setInterval(()=>{if(token!==cancelled){cleanup();if(!done)reject(new Error('cancelled'))}},80);
}).catch(()=>{throw new Error('cancelled')})}

function randomDistinctCells(rng,n,count){const all=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)all.push({r,c});return shuffled(all,rng).slice(0,count)}
function baseSpec(form,seed,practice){return{version:BUILD,protocolVersion:PROTOCOL,construct:META[form].construct,form,seed,trialId:`${form}-${seed}`,practice:!!practice}}
function generateTrace(axis,seed,practice=false){const rng=rng32(seed),n=5,span=clamp(axis,3,9);return freezeDeep({...baseSpec('trace',seed,practice),gridSize:n,memoryLoad:span,span,presentation:{flashMs:T.flash,gapMs:T.gap,retentionMs:T.veil},target:randomDistinctCells(rng,n,span)})}
function generateShift(axis,seed,practice=false){
  const rng=rng32(seed),n=4,updates=clamp(axis,1,8),positions={},used=new Set();
  for(const ob of OBJECTS){let p;do{p={r:randint(rng,n),c:randint(rng,n)}}while(used.has(key(p)));positions[ob.id]=p;used.add(key(p))}
  const initial=copy(positions),ops=[],activeObject=OBJECTS[randint(rng,OBJECTS.length)],anchorObject=OBJECTS.find(o=>o.id!==activeObject.id);let previousDirection=null;
  for(let i=0;i<updates;i++){
    const from=positions[activeObject.id],other=positions[anchorObject.id];let possible=shuffled(DIRS,rng).filter(d=>{const q={r:from.r+d.dr,c:from.c+d.dc};return q.r>=0&&q.c>=0&&q.r<n&&q.c<n&&!eq(q,other)});
    if(previousDirection&&possible.length>1){const reverse={up:'down',down:'up',left:'right',right:'left'}[previousDirection],filtered=possible.filter(d=>d.name!==reverse);if(filtered.length)possible=filtered}
    if(!possible.length)throw new Error('SHIFT generator reached impossible state');
    const d=possible[0],to={r:from.r+d.dr,c:from.c+d.dc};positions[activeObject.id]=to;ops.push({index:i+1,objectId:activeObject.id,direction:d.name,arrow:d.arrow,from:copy(from),to:copy(to)});previousDirection=d.name;
  }
  return freezeDeep({...baseSpec('shift',seed,practice),gridSize:n,memoryLoad:OBJECTS.length,maintainedObjects:OBJECTS.length,updateCount:updates,activeObjectId:activeObject.id,anchorObjectId:anchorObject.id,objectSwitchFrequency:0,presentation:{bindingMs:T.bind,operatorMs:T.op,retentionMs:T.veil},objects:OBJECTS.map(o=>({id:o.id,shape:o.id,identityColor:'neutral'})),initial,target:copy(positions),operations:ops})
}
function generateEcho(axis,seed,practice=false){const rng=rng32(seed),n=5,span=clamp(axis,3,9),interferenceCount=2;const interferenceTrials=Array.from({length:interferenceCount},()=>{const side=rng()<.5?'left':'right';return{cue:side==='left'?'←':'→',answer:side}});return freezeDeep({...baseSpec('echo',seed,practice),gridSize:n,memoryLoad:span,span,interferenceCount,interferenceRule:'tap the side indicated by the arrow',interference:{count:interferenceCount,cueMs:T.intDeadline,gapMs:T.intGap,input:'manual-spatial left/right'},presentation:{flashMs:T.flash,gapMs:T.gap,retentionMs:T.veil},target:randomDistinctCells(rng,n,span),interferenceTrials})}
function generateTrial(form,axis,seed,practice=false){if(form==='trace')return generateTrace(axis,seed,practice);if(form==='shift')return generateShift(axis,seed,practice);return generateEcho(axis,seed,practice)}
function scoreTrace(spec,response){return response.length===spec.target.length&&response.every((p,i)=>eq(p,spec.target[i]))}
function scoreShift(spec,response){return OBJECTS.every(o=>eq(response[o.id],spec.target[o.id]))}
function scoreEcho(spec,response){return response.length===spec.target.length&&response.every((p,i)=>eq(p,spec.target[i]))}

function shiftInvariant(spec){
  if(spec.form!=='shift')return false;const pos=copy(spec.initial),n=spec.gridSize;for(const op of spec.operations){const from=pos[op.objectId];if(!eq(from,op.from))return false;const d=DIRS.find(x=>x.name===op.direction);if(!d)return false;const to={r:from.r+d.dr,c:from.c+d.dc};if(!eq(to,op.to)||to.r<0||to.c<0||to.r>=n||to.c>=n)return false;const other=OBJECTS.find(o=>o.id!==op.objectId);if(eq(to,pos[other.id]))return false;pos[op.objectId]=to}return OBJECTS.every(o=>eq(pos[o.id],spec.target[o.id]))
}
function selfTestShift(samples=2000){let dirs=new Set();for(let seed=1;seed<=samples;seed++){for(let axis=1;axis<=8;axis++){const s=generateShift(axis,seed,false);if(!shiftInvariant(s))return{ok:false,seed,axis,reason:'invariant'};s.operations.forEach(o=>dirs.add(o.direction));if(!scoreShift(s,copy(s.target)))return{ok:false,seed,axis,reason:'target score'};const wrong=copy(s.target),o=OBJECTS[0],p=wrong[o.id];wrong[o.id]={r:(p.r+1)%s.gridSize,c:p.c};if(eq(wrong[o.id],s.target[o.id]))wrong[o.id]={r:p.r,c:(p.c+1)%s.gridSize};if(scoreShift(s,wrong))return{ok:false,seed,axis,reason:'wrong accepted'}}}return{ok:true,samples,axes:8,directions:Array.from(dirs).sort()}}

function newAdaptive(form,startOverride){const m=META[form];return{form,value:clamp(startOverride??m.start,m.min,m.max),successStreak:0,trials:0,reversals:0,lastDirection:0,reversalValues:[],history:[],stable:false,stopReason:null}}
function adaptiveStep(state,correct){const before=copy(state),m=META[state.form];let dir=0;state.trials++;if(correct){state.successStreak++;if(state.successStreak>=2&&state.value<m.max){state.value++;state.successStreak=0;dir=1}}else{state.successStreak=0;if(state.value>m.min){state.value--;dir=-1}}if(dir&&state.lastDirection&&dir!==state.lastDirection){state.reversals++;state.reversalValues.push(before.value)}if(dir)state.lastDirection=dir;state.history.push({trial:state.trials,load:before.value,correct,dir,after:state.value});const recent=state.history.slice(-6),mixed=recent.some(x=>x.correct)&&recent.some(x=>!x.correct),range=recent.length?Math.max(...recent.map(x=>x.load))-Math.min(...recent.map(x=>x.load)):99;if(state.trials>=7&&state.reversals>=3&&mixed&&range<=2){state.stable=true;state.stopReason='stable reversal region'}if(state.trials>=11&&!state.stable){state.stable=true;state.stopReason='session trial limit'}return{before,after:copy(state),direction:dir}}
function estimateAdaptive(state){const h=state.history,rev=state.reversalValues.slice(-4);let center;if(rev.length>=2)center=mean(rev);else{const last=h.slice(-5);center=last.length?mean(last.map(x=>x.load)):state.value}const samples=rev.length>=2?rev:h.slice(-5).map(x=>x.load);let lo=samples.length?Math.min(...samples):state.value,hi=samples.length?Math.max(...samples):state.value;if(lo===hi){lo=Math.max(META[state.form].min,lo-1);hi=Math.min(META[state.form].max,hi+1)}const maxSuccess=h.filter(x=>x.correct).reduce((m,x)=>Math.max(m,x.load),0),counts={};h.filter(x=>x.correct).forEach(x=>counts[x.load]=(counts[x.load]||0)+1);const stableLoads=Object.keys(counts).map(Number).filter(k=>counts[k]>=2),stableThrough=stableLoads.length?Math.max(...stableLoads):maxSuccess;const floorFailure=h.some(x=>!x.correct&&x.load===META[state.form].min),ceilingSuccess=h.some(x=>x.correct&&x.load===META[state.form].max);return{center:round1(center),low:lo,high:hi,uncertaintyBand:[lo,hi],maxSuccess,stableThrough,reversals:state.reversals,trials:state.trials,stable:state.stopReason==='stable reversal region',boundedLow:!floorFailure,boundedHigh:!ceilingSuccess,stopReason:state.stopReason}}

async function presentSequence(spec,form,practice,token){buildBoard(spec.gridSize);clearOverlay();const cls=form==='echo'?'echo-active':'active';for(let i=0;i<spec.target.length;i++){if(token!==cancelled)throw new Error('cancelled');clearCells();markCell(spec.target[i],cls);await sleep(spec.presentation.flashMs);clearCells();await sleep(spec.presentation.gapMs)}await sleep(spec.presentation.retentionMs)}
async function collectSequence(spec,form,practice,token){const response=[],rts=[];setHeader(form,practice?'PRACTICE · RECALL':'RECALL','Return the locations in the same order.','Direct taps only. Accuracy matters; speed is recorded but not rewarded.');for(let i=0;i<spec.target.length;i++){const t0=performance.now(),p=await waitBoardTap(token);response.push(p);rts.push(Math.round(performance.now()-t0));markCell(p,'response');await sleep(TEST?5:70);clearCells()}return{response,responseTimingMs:rts}}
async function renderTrace(spec,practice,token){setHeader('trace',practice?'PRACTICE · WATCH':'ENCODE','Watch each location.','They are independent locations, not a route. Hold the order.');metrics([`span ${spec.span}`,`grid ${spec.gridSize}×${spec.gridSize}`,`${spec.presentation.flashMs} ms cue`]);await presentSequence(spec,'trace',practice,token);return collectSequence(spec,'trace',practice,token)}
function operatorCard(op,total){const o=OBJECTS.find(x=>x.id===op.objectId);return `<div class="operator-card"><div class="operator-object">${SHAPES[o.id]}<b>${o.label}</b></div><div class="operator-command"><div><div class="operator-arrow">${op.arrow}</div><div class="operator-word">${op.direction}</div><div class="operator-count">update ${op.index} of ${total}</div></div></div></div>`}
async function renderShift(spec,practice,token){
  buildBoard(spec.gridSize);const active=OBJECTS.find(o=>o.id===spec.activeObjectId),anchor=OBJECTS.find(o=>o.id===spec.anchorObjectId);
  setHeader('shift',practice?'PRACTICE · BIND':'BIND','Remember both shapes and their cells.','One shape will move. The other will stay fixed. Shape, never color, defines identity.');metrics([`${spec.maintainedObjects} objects`,`${spec.updateCount} updates`,`switch 0%`]);
  clearCells();OBJECTS.forEach(o=>glyphAt(spec.initial[o.id],o));await sleep(spec.presentation.bindingMs);clearCells();await sleep(spec.presentation.retentionMs);
  for(const op of spec.operations){const prefix=op.index===1?'Move':'Again, move';setHeader('shift',`UPDATE ${op.index}/${spec.updateCount}`,`${prefix} the ${active.label} one cell ${op.direction.toUpperCase()}.`,`Apply it to the ${active.label}'s current imagined position. The ${anchor.label} stays fixed.`);overlay(operatorCard(op,spec.updateCount));await sleep(spec.presentation.operatorMs)}
  clearOverlay();const response={},responseTimingMs={};
  for(const o of OBJECTS){clearCells();setHeader('shift',practice?'PRACTICE · REPORT':'REPORT',`Tap the ${o.label}'s FINAL cell.`,`Report where it is after all ${spec.updateCount} update${spec.updateCount===1?'':'s'}.`);const ov=overlay(`<div class="report-cue">${SHAPES[o.id]}<span>${o.label} · final</span></div>`);ov.className='overlay pointer-silent';const t0=performance.now(),p=await waitBoardTap(token);response[o.id]=p;responseTimingMs[o.id]=Math.round(performance.now()-t0);markCell(p,'response');await sleep(TEST?5:90);clearCells()}
  clearOverlay();return{response,responseTimingMs}
}
async function waitInterferenceChoice(trial,token){return new Promise(resolve=>{const o=overlay(`<div class="interference-card"><div class="interference-cue">${trial.cue}</div><div class="interference-actions"><button type="button" data-side="left" aria-label="left">←</button><button type="button" data-side="right" aria-label="right">→</button></div></div>`,true);let settled=false,cleanups=[],t0=performance.now();function finish(side){if(settled)return;settled=true;cleanups.forEach(f=>f());clearTimeout(timer);resolve({side,rtMs:Math.round(performance.now()-t0),correct:side===trial.answer})}$$('[data-side]',o).forEach(b=>cleanups.push(tapOnce(b,()=>finish(b.dataset.side))));const timer=setTimeout(()=>finish(null),T.intDeadline)})}
async function renderEcho(spec,practice,token){setHeader('echo',practice?'PRACTICE · WATCH':'ENCODE','Watch each location and hold the order.','A fixed arrow interruption will occur before recall.');metrics([`span ${spec.span}`,`${spec.interferenceCount} interruptions`,`manual-spatial rule`]);await presentSequence(spec,'echo',practice,token);const interferenceResponses=[];for(let i=0;i<spec.interferenceTrials.length;i++){setHeader('echo','INTERRUPTION','Tap the side shown by the arrow.','Same rule every trial. This is controlled interference, not a puzzle.');const r=await waitInterferenceChoice(spec.interferenceTrials[i],token);interferenceResponses.push(r);clearOverlay();await sleep(T.intGap)}const recall=await collectSequence(spec,'echo',practice,token);return{...recall,interferenceResponses}}
async function renderTrial(spec,practice,token){if(spec.form==='trace')return renderTrace(spec,practice,token);if(spec.form==='shift')return renderShift(spec,practice,token);return renderEcho(spec,practice,token)}
function scoreTrial(spec,result){if(spec.form==='trace')return scoreTrace(spec,result.response);if(spec.form==='shift')return scoreShift(spec,result.response);return scoreEcho(spec,result.response)}
function validForAdaptive(spec,result){return spec.form!=='echo'||(result.interferenceResponses&&result.interferenceResponses.length===spec.interferenceCount&&result.interferenceResponses.every(x=>x.correct===true))}

function trialRecord(spec,result,memoryCorrect,adaptiveBefore,adaptiveAfter,sessionId,trialIndex){const valid=validForAdaptive(spec,result),comprehensionPassed=spec.practice?(memoryCorrect&&valid):null;return{version:BUILD,protocolVersion:PROTOCOL,form:spec.form,construct:spec.construct,seed:spec.seed,trialId:spec.trialId,sessionId,trialIndex,practice:spec.practice,trialKind:spec.practice?'practice':'measured',gridSize:spec.gridSize,initial:spec.initial??null,target:spec.target,response:result.response,correct:memoryCorrect,memoryCorrect,comprehensionPassed,validForAdaptive:valid,memoryLoad:spec.memoryLoad,maintainedObjects:spec.maintainedObjects??null,updateCount:spec.updateCount??null,activeObjectId:spec.activeObjectId??null,anchorObjectId:spec.anchorObjectId??null,objectSwitchFrequency:spec.objectSwitchFrequency??null,operations:spec.operations??null,interferenceParameters:spec.interference??null,interferenceResponses:result.interferenceResponses??null,interferenceCorrect:spec.form==='echo'?valid:null,presentationTiming:spec.presentation,responseTiming:result.responseTimingMs,adaptiveStateBefore:adaptiveBefore,adaptiveStateAfter:adaptiveAfter,recordedAt:iso()}}
function appendTrial(rec){const a=load(STORAGE.trials,[]);a.push(rec);save(STORAGE.trials,a.slice(-2500))}
function saveActive(){if(session)save(STORAGE.active,session)}

function modal(kicker,title,body,actions){$('#modalKicker').textContent=kicker;$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;const box=$('#modalActions');box.innerHTML='';$('#modal').classList.remove('hidden');return new Promise(resolve=>actions.forEach(a=>{const b=document.createElement('button');b.type='button';b.textContent=a.label;b.className=a.secondary?'secondary':'';tapOnce(b,()=>{$('#modal').classList.add('hidden');resolve(a.value)});box.appendChild(b)}))}
function introCopy(form){
  if(form==='trace')return{title:'TRACE',body:'<p><strong>Target:</strong> serial visuospatial maintenance.</p><div class="rule">Locations appear one at a time. After they vanish, tap the same locations in the same order.</div><p>No maze, path, transformation, drag, or hidden rule. Difficulty changes span only.</p>'};
  if(form==='shift')return{title:'SHIFT',body:'<p><strong>Target:</strong> object-location binding plus controlled updating.</p><div class="shift-rule"><div><b>1</b><span>Remember where the <strong>diamond</strong> and <strong>ring</strong> begin.</span></div><div><b>2</b><span>An operator names one shape and one direction. Move <strong>that shape one cell in your mind</strong>.</span></div><div><b>3</b><span>If another operator follows, apply it to the shape\'s <strong>new imagined position</strong>. The other shape stays fixed.</span></div><div><b>4</b><span>Finally tap each shape\'s final cell.</span></div></div><p>Both shapes use the same neutral color. Shape defines identity. Difficulty changes update count only.</p>'};
  return{title:'ECHO',body:'<p><strong>Target:</strong> serial maintenance under controlled interference.</p><div class="rule">Hold the location sequence. Then, for two arrow cues, tap the side the arrow points to. Finally recall the original locations in order.</div><p>The interruption rule and count stay fixed. Difficulty changes memory span only.</p>'}
}
async function feedback(form,correct,practice){setHeader(form,'RESULT',correct?'Structure held.':'Structure drifted.',practice?(correct?'Practice passed. Measurement can begin.':'Practice is unscored. We will show exactly what SHIFT meant before retrying.'):'The next measured trial changes only the declared adaptive axis.');overlay(`<div class="result-stamp ${correct?'held':'drift'}">${correct?'HELD':'DRIFTED'}</div>`);await sleep(T.feedback);clearOverlay()}

async function showShiftState(spec,positions,extraClass=''){clearCells();for(const o of OBJECTS){glyphAt(positions[o.id],o,o.id===spec.anchorObjectId?'anchor':extraClass)}await sleep(TEST?30:T.demo)}
async function demonstrateShift(spec,token){
  buildBoard(spec.gridSize);setHeader('shift','DEMONSTRATION · START','First, bind each shape to a cell.','The ring and diamond have the same neutral identity color.');metrics([`${spec.maintainedObjects} objects`,`${spec.updateCount} update`,`switch 0%`]);await showShiftState(spec,spec.initial);clearCells();await sleep(TEST?15:260);
  const op=spec.operations[0],active=OBJECTS.find(o=>o.id===op.objectId),anchor=OBJECTS.find(o=>o.id!==op.objectId);
  setHeader('shift','DEMONSTRATION · OPERATOR',`The ${active.label} moves one cell ${op.direction.toUpperCase()}.`,`The ${anchor.label} does not move.`);overlay(operatorCard(op,1));await sleep(TEST?45:850);clearOverlay();
  clearCells();glyphAt(spec.initial[anchor.id],anchor,'anchor');markCell(op.from,'demo-origin');markCell(op.to,'demo-destination',`<div class="glyph demo-move">${SHAPES[active.id]}</div>`);setHeader('shift','DEMONSTRATION · MOVEMENT','This visible move is teaching only.','In measurement you must perform the same one-cell move mentally.');await sleep(TEST?45:900);
  clearCells();OBJECTS.forEach(o=>glyphAt(spec.target[o.id],o));setHeader('shift','DEMONSTRATION · FINAL','Then report both FINAL locations.','That is the whole rule. No hidden transformation.');await sleep(TEST?45:850);clearCells()
}
async function auditShiftPractice(spec,result,token){
  await modal('UNSCORED PRACTICE','SHIFT · replay the rule','<p>Your answer is not scored. This replay shows the exact trial you just saw.</p><div class="rule"><strong>Important:</strong> every arrow starts from the shape\'s current imagined position, not its original cell.</div>',[{label:'Show replay',value:'go'}]);
  buildBoard(spec.gridSize);let pos=copy(spec.initial);setHeader('shift','PRACTICE REPLAY · START','These were the starting cells.','Now watch each mental update made visible.');await showShiftState(spec,pos);clearCells();
  for(const op of spec.operations){const active=OBJECTS.find(o=>o.id===op.objectId),anchor=OBJECTS.find(o=>o.id!==op.objectId);setHeader('shift',`PRACTICE REPLAY · ${op.index}/${spec.updateCount}`,`${titleCase(active.label)} moves ${op.direction.toUpperCase()} one cell.`,`The ${anchor.label} stays fixed. The next update, if any, starts from this new position.`);overlay(operatorCard(op,spec.updateCount));await sleep(TEST?35:600);clearOverlay();clearCells();glyphAt(pos[anchor.id],anchor,'anchor');markCell(op.from,'demo-origin');pos[active.id]=copy(op.to);markCell(op.to,'demo-destination',`<div class="glyph demo-move">${SHAPES[active.id]}</div>`);await sleep(TEST?35:650)}
  clearCells();OBJECTS.forEach(o=>glyphAt(spec.target[o.id],o));setHeader('shift','PRACTICE REPLAY · ANSWER','These were the correct final cells.','A fresh unscored practice trial comes next.');await sleep(TEST?45:900);clearCells();
  await modal('SHIFT RULE','Carry the positions, not the picture','<div class="shift-rule"><div><b>1</b><span>Bind both shapes to their starting cells.</span></div><div><b>2</b><span>Move only the named shape one cell per operator.</span></div><div><b>3</b><span>Updates accumulate from the new imagined position.</span></div><div><b>4</b><span>Report both final cells.</span></div></div>',[{label:'Try a fresh practice',value:'again'}])
}
async function demonstrate(form,token){const seed={trace:31001,shift:31002,echo:31003}[form],spec=generateTrial(form,META[form].start,seed,true);if(form==='trace'){setHeader(form,'DEMONSTRATION','Watch, then the instrument will reveal the answer.','This is not scored.');metrics([`span ${spec.span}`]);await presentSequence(spec,'trace',true,token);setHeader(form,'DEMONSTRATION · ANSWER','Same locations. Same order.','The marks now trace the correct response.');for(const p of spec.target){markCell(p,'response');await sleep(TEST?18:260);clearCells()}}else if(form==='shift'){await demonstrateShift(spec,token)}else{setHeader(form,'DEMONSTRATION','Hold the locations through a fixed interruption.','The interruption always uses the same left/right arrow rule.');metrics([`span ${spec.span}`,`${spec.interferenceCount} interruptions`]);await presentSequence(spec,'echo',true,token);for(const it of spec.interferenceTrials){setHeader(form,'DEMONSTRATION · INTERRUPTION','Arrow means tap that side.','No puzzle rule is being discovered.');overlay(`<div class="interference-card"><div class="interference-cue">${it.cue}</div><div class="interference-actions"><button type="button">←</button><button type="button">→</button></div></div>`);await sleep(TEST?30:500);clearOverlay();await sleep(T.intGap)}setHeader(form,'DEMONSTRATION · ANSWER','Then recall the original locations in order.','The marks now trace the correct response.');for(const p of spec.target){markCell(p,'response');await sleep(TEST?18:250);clearCells()}}clearOverlay();await sleep(TEST?10:220)}

async function ensurePractice(form,token){if(session.practicePassed[form])return;const c=introCopy(form);await modal('INTRODUCE',c.title,c.body,[{label:'See demonstration',value:'go'}]);if(token!==cancelled)return;await demonstrate(form,token);if(token!==cancelled)return;await modal('UNSCORED PRACTICE',`${META[form].name} · your turn`,'<p>Now perform the same invariant rule yourself. This trial is logged as practice but excluded from the adaptive estimate.</p>',[{label:'Begin practice',value:'practice'}]);while(token===cancelled&&!session.practicePassed[form]){const axis=META[form].start,seed=seed32(),spec=generateTrial(form,axis,seed,true);debug.currentSpec=spec;debug.currentMode='practice';setProgress(0,1);const result=await renderTrial(spec,true,token),memoryCorrect=scoreTrial(spec,result),practicePassed=memoryCorrect&&validForAdaptive(spec,result);appendTrial(trialRecord(spec,result,memoryCorrect,null,null,session.id,session.results.length));await feedback(form,practicePassed,true);if(practicePassed){session.practicePassed[form]=true;saveActive();if(form==='shift')await modal('PRACTICE PASSED','SHIFT · rule understood','<p>Correct. During measurement the movement itself stays invisible. Carry the shape locations forward in your mind, one operator at a time.</p>',[{label:'Begin measured SHIFT',value:'go'}]);return}if(form==='shift')await auditShiftPractice(spec,result,token);else await modal('PRACTICE',`${META[form].name} · try again`,'<p>This did not count. The rule is unchanged.</p><p>Practice repeats until the mechanic is demonstrated correctly.</p>',[{label:'Repeat practice',value:'again'}])}}

function newSession(){const id=`biy3-${Date.now()}-${seed32()}`;return{id,version:BUILD,protocolVersion:PROTOCOL,startedAt:iso(),formIndex:0,practicePassed:{trace:false,shift:false,echo:false},adaptive:{trace:newAdaptive('trace',priorStart('trace')),shift:newAdaptive('shift',priorStart('shift')),echo:newAdaptive('echo',priorStart('echo'))},measuredCounts:{trace:0,shift:0,echo:0},results:[]}}
function normalizeSession(s){if(!s)return null;s.protocolVersion=s.protocolVersion||'biy-v3-p1';s.practicePassed=s.practicePassed||{trace:false,shift:false,echo:false};s.measuredCounts=s.measuredCounts||{trace:0,shift:0,echo:0};s.results=s.results||[];s.adaptive=s.adaptive||{};FORMS.forEach(f=>{if(!s.adaptive[f])s.adaptive[f]=newAdaptive(f)});return s}
function comparableSessions(){return load(STORAGE.sessions,[]).filter(s=>s.protocolVersion===PROTOCOL)}
function priorStart(form){const sessions=comparableSessions();if(!sessions.length)return META[form].start;const prev=sessions[sessions.length-1]?.forms?.[form]?.estimate;if(!prev||!Number.isFinite(prev.center))return META[form].start;return clamp(Math.round(prev.center)-1,META[form].min,META[form].max)}
async function startFresh(){if(load(STORAGE.active,null)){const choice=await modal('UNFINISHED SESSION','Start fresh?','<p>An unfinished v3 session is stored locally. Starting fresh will discard only that unfinished session, not completed history.</p>',[{label:'Start fresh',value:'fresh'},{label:'Keep it',value:'keep',secondary:true}]);if(choice!=='fresh')return}session=newSession();saveActive();runSession()}
async function resumeSession(){session=normalizeSession(load(STORAGE.active,null));if(!session)return showHome();if(session.protocolVersion!==PROTOCOL){const choice=await modal('PROTOCOL UPDATED','Restart unfinished session?','<p>SHIFT teaching and presentation timing changed in build 3.0.1. To avoid mixing protocols inside one measurement session, the unfinished older session should restart.</p>',[{label:'Restart under 3.0.1',value:'restart'},{label:'Return home',value:'home',secondary:true}]);if(choice!=='restart')return showHome();session=newSession();saveActive()}runSession()}

async function measuredForm(form,token){const a=session.adaptive[form];while(token===cancelled&&!a.stable){const axis=a.value,seed=seed32(),spec=generateTrial(form,axis,seed,false);debug.currentSpec=spec;debug.currentMode='measured';setProgress(a.trials,11);const adaptiveBefore=copy(a),result=await renderTrial(spec,false,token),correct=scoreTrial(spec,result),valid=validForAdaptive(spec,result);if(valid)adaptiveStep(a,correct);const adaptiveAfter=copy(a),rec=trialRecord(spec,result,correct,adaptiveBefore,adaptiveAfter,session.id,session.results.length);appendTrial(rec);session.results.push(rec);session.measuredCounts[form]++;saveActive();if(valid)await feedback(form,correct,false);else{setHeader(form,'TRIAL REPEATED','Interruption response missed.','Memory response was logged, but this trial is excluded from the staircase so the interference condition stays comparable.');overlay('<div class="result-stamp drift">REPEAT</div>');await sleep(T.feedback);clearOverlay()}}}
async function runSession(){const token=++cancelled;showInstrument();try{while(session&&session.formIndex<FORMS.length&&token===cancelled){const form=FORMS[session.formIndex];await ensurePractice(form,token);if(token!==cancelled)return;await measuredForm(form,token);if(token!==cancelled)return;const e=estimateAdaptive(session.adaptive[form]);session.formIndex++;saveActive();if(session.formIndex<FORMS.length)await modal('FORM COMPLETE',META[form].name,`<p>${boundarySentence(form,e)}</p><p>The next form measures a different construct and uses its own staircase.</p>`,[{label:'Continue',value:'next'}])}if(session&&token===cancelled)completeSession()}catch(e){if(e&&e.message!=='cancelled')console.error(e)}}
function boundarySentence(form,e){if(e.boundedHigh===false)return`${META[form].name}: ceiling was not reached within the tested range.`;if(e.boundedLow===false)return`${META[form].name}: performance was unstable at the lowest tested load.`;if(form==='trace')return`TRACE: stable through span ${e.stableThrough}; boundary sampled around ${e.low}–${e.high}.`;if(form==='shift')return`SHIFT: stable through ${e.stableThrough} updates; updating becomes unstable around ${e.low}–${e.high} operations.`;return`ECHO: stable through span ${e.stableThrough} under interference; cost becomes visible around ${e.low}–${e.high}.`}
function previousComparable(form){const s=comparableSessions();if(!s.length)return null;return s[s.length-1]?.forms?.[form]?.estimate||null}
function changeText(cur,prev){if(!prev)return'first session under this protocol';const d=cur.center-prev.center;if(Math.abs(d)<.75)return'similar to the previous sampled boundary';return d>0?`boundary sampled about ${round1(d)} load higher than last comparable session`:`boundary sampled about ${Math.abs(round1(d))} load lower than last comparable session`}
function completeSession(){const completed=copy(session);completed.endedAt=iso();completed.version=BUILD;completed.protocolVersion=PROTOCOL;completed.forms={};FORMS.forEach(f=>{const e=estimateAdaptive(completed.adaptive[f]);completed.forms[f]={estimate:e,summary:boundarySentence(f,e),change:changeText(e,previousComparable(f))}});delete completed.adaptive;const sessions=load(STORAGE.sessions,[]);sessions.push(completed);save(STORAGE.sessions,sessions.slice(-80));localStorage.removeItem(STORAGE.active);session=null;const cards=FORMS.map(f=>{const x=completed.forms[f],e=x.estimate;return`<div class="summary-card"><b>${META[f].name}</b><strong>${x.summary}</strong><small>${e.trials} valid measured trials · ${e.reversals} reversals · uncertainty ${e.low}–${e.high} · ${e.stable?'stable reversal region':'trial-limit estimate'} · ${x.change}. Descriptive, not normative.</small></div>`}).join('');modal('SESSION COMPLETE','Three limits, kept separate',`<p>No pooled intelligence score was calculated.</p><div class="summary-grid">${cards}</div><p>Exact seeds, targets, responses, timing, adaptive states, build, and protocol are stored locally for later analysis.</p>`,[{label:'Return home',value:'home'}]).then(showHome)}
async function showHistory(){const s=load(STORAGE.sessions,[]);if(!s.length){await modal('HISTORY','No completed v3 sessions','<p>Completed v3 sessions will appear here. v2 data remains preserved under its original storage keys and is intentionally not merged.</p>',[{label:'Close',value:'close'}]);return}const rows=s.slice(-8).reverse().map(x=>`<div class="history-row"><b>${new Date(x.endedAt||x.startedAt).toLocaleDateString()} · ${x.version||'v3'}</b><small>${FORMS.map(f=>x.forms?.[f]?.summary||META[f].name+': unavailable').join('<br>')}</small></div>`).join('');await modal('V3 HISTORY','Recent sessions',rows,[{label:'Close',value:'close'}])}

bindStatic('#startFresh',startFresh);bindStatic('#resume',resumeSession);bindStatic('#history',showHistory);bindStatic('#exit',showHome);window.addEventListener('pagehide',saveActive);
window.__BIY3__={BUILD,PROTOCOL,generateTrial,scoreTrace,scoreShift,scoreEcho,shiftInvariant,selfTestShift,newAdaptive,adaptiveStep,estimateAdaptive,validForAdaptive,freezeDeep,META,SHAPES,testMode:TEST,storage:STORAGE,getCurrentSpec:()=>TEST?debug.currentSpec:null,getMode:()=>TEST?debug.currentMode:null};
showHome();
})();
