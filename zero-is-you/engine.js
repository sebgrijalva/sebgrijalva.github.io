export const NUM_WORDS = [
  'ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN',
  'ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN','TWENTY'
];

export const WORD_NUM = Object.fromEntries(NUM_WORDS.map((w,i)=>[w,i]));
Object.assign(WORD_NUM, {'THIRTY':30, 'FORTY':40, 'FIFTY':50, 'HALF':0.5, 'QUARTER':0.25});

export const cloneState = s => structuredClone(s);
export const key = (x,y) => `${x},${y}`;

export function createState(level) {
  const state = {
    levelId: level.id,
    width: level.width ?? 12,
    height: level.height ?? 8,
    entities: structuredClone(level.entities ?? []),
    moves: 0,
    lamps: structuredClone(level.lamps ?? {}),
    switches: structuredClone(level.switches ?? {}),
    heap: level.heap ?? null,
    turtleTurn: 0,
    graphNode: level.graph?.start ?? null,
    graphUsed: [],
    socketValues: {},
    won: false,
    message: '',
  };
  applyRules(state, level);
  return state;
}

export function isWord(e){ return e.kind === 'word'; }
export function wordsAt(state,x,y){ return state.entities.filter(e=>e.x===x&&e.y===y&&e.kind==='word'); }
export function objectsAt(state,x,y){ return state.entities.filter(e=>e.x===x&&e.y===y&&e.kind!=='floor'&&e.kind!=='word'); }
export function floorAt(state,x,y){ return state.entities.filter(e=>e.x===x&&e.y===y&&e.kind==='floor'); }

export function scanRuns(state) {
  const wm = new Map();
  for (const e of state.entities) if (e.kind==='word') wm.set(key(e.x,e.y), e.text);
  const runs=[];
  for (let y=0;y<state.height;y++) {
    let run=[];
    for (let x=0;x<=state.width;x++) {
      const t=x<state.width?wm.get(key(x,y)):null;
      if(t) run.push({text:t,x,y});
      else { if(run.length>=3) runs.push(run.map(v=>v.text)); run=[]; }
    }
  }
  for (let x=0;x<state.width;x++) {
    let run=[];
    for (let y=0;y<=state.height;y++) {
      const t=y<state.height?wm.get(key(x,y)):null;
      if(t) run.push({text:t,x,y});
      else { if(run.length>=3) runs.push(run.map(v=>v.text)); run=[]; }
    }
  }
  return runs;
}

const PROPS = new Set(['YOU','WIN','PUSH','STOP','HOT','SINK','EVEN','ODD','PRIME']);
const OPS = new Set(['PLUS','MINUS','TIMES','MOD']);

export function scanRules(state) {
  const runs=scanRuns(state);
  const rules=[];
  const statements=[];
  for(const r of runs){
    for(let i=0;i+2<r.length;i++){
      const a=r[i], b=r[i+1], c=r[i+2];
      if(b==='IS') rules.push({subject:a,verb:'IS',object:c});
      if(b==='HAS') rules.push({subject:a,verb:'HAS',object:c});
    }
    const ev=evaluateStatement(r);
    if(ev.recognized) statements.push({tokens:r,...ev});
  }
  return {rules,statements,runs};
}

function atomValue(tok, vars={}) {
  if(tok in WORD_NUM) return WORD_NUM[tok];
  if(tok==='1/2') return 0.5;
  if(tok==='1/3') return 1/3;
  if(tok==='1/4') return 0.25;
  if(tok==='2/4') return 0.5;
  if(tok==='3/4') return 0.75;
  if(tok in vars) return vars[tok];
  return null;
}

function evalExpr(tokens,vars={}) {
  if(tokens.length===1) return atomValue(tokens[0],vars);
  let v=atomValue(tokens[0],vars);
  if(v===null) return null;
  for(let i=1;i<tokens.length;i+=2){
    const op=tokens[i], rhs=atomValue(tokens[i+1],vars);
    if(rhs===null || !OPS.has(op)) return null;
    if(op==='PLUS') v+=rhs;
    if(op==='MINUS') v-=rhs;
    if(op==='TIMES') v*=rhs;
    if(op==='MOD') v=((v%rhs)+rhs)%rhs;
  }
  return v;
}

export function evaluateStatement(tokens, vars={}) {
  if(tokens.length===3 && tokens[1]==='IS' && ['EVEN','ODD','PRIME'].includes(tokens[2])){
    const v=atomValue(tokens[0],vars);
    if(v===null) return {recognized:false,truth:false};
    let truth=false;
    if(tokens[2]==='EVEN') truth=Number.isInteger(v)&&Math.abs(v%2)===0;
    if(tokens[2]==='ODD') truth=Number.isInteger(v)&&Math.abs(v%2)===1;
    if(tokens[2]==='PRIME') truth=isPrime(v);
    return {recognized:true,truth,value:v};
  }
  const same=tokens.indexOf('SAME');
  if(same>0 && same<tokens.length-1){
    const l=evalExpr(tokens.slice(0,same),vars), r=evalExpr(tokens.slice(same+1),vars);
    if(l===null||r===null) return {recognized:false,truth:false};
    return {recognized:true,truth:Math.abs(l-r)<1e-9,left:l,right:r};
  }
  return {recognized:false,truth:false};
}

export function isPrime(n){
  if(!Number.isInteger(n)||n<2) return false;
  for(let d=2;d*d<=n;d++) if(n%d===0) return false;
  return true;
}

export function applyRules(state, level) {
  const {rules,statements}=scanRules(state);
  state.rules=rules;
  state.statements=statements;
  state.props={};
  state.transforms={};
  state.stepSize=1;
  for(const r of rules){
    if(r.verb!=='IS') continue;
    if(r.subject==='STEP' && r.object in WORD_NUM){ state.stepSize=Math.max(1,WORD_NUM[r.object]); continue; }
    if(PROPS.has(r.object)) (state.props[r.subject]??=new Set()).add(r.object);
    else state.transforms[r.subject]=r.object;
  }
  for(const e of state.entities){
    if(e.kind==='object' && state.transforms[e.noun]) e.noun=state.transforms[e.noun];
  }
  evaluateSockets(state,level);
  return state;
}

function hasProp(state,noun,prop){ return !!state.props?.[noun]?.has(prop); }
function inherentlyPushable(e){ return e.kind==='word' || e.push===true; }
function entityPushable(state,e){ return inherentlyPushable(e) || (e.kind==='object'&&hasProp(state,e.noun,'PUSH')); }
function entityStop(state,e){ return e.kind==='object'&&hasProp(state,e.noun,'STOP'); }

function canEnter(state, level, mover, nx,ny,dx,dy, depth=0){
  if(depth>30 || nx<0||ny<0||nx>=state.width||ny>=state.height) return false;
  const blockers=state.entities.filter(e=>e.kind!=='floor'&&e.id!==mover.id&&e.x===nx&&e.y===ny);
  for(const b of blockers){
    if(level.features?.fusion && mover.kind==='object'&&b.kind==='object'&&mover.noun==='CLUMP'&&b.noun==='CLUMP') continue;
    if(entityPushable(state,b)){
      if(!canEnter(state,level,b,nx+dx,ny+dy,dx,dy,depth+1)) return false;
      moveEntity(state,level,b,nx+dx,ny+dy,dx,dy);
    } else if(entityStop(state,b) || b.kind==='word') return false;
  }
  return true;
}

function moveEntity(state,level,e,nx,ny,dx,dy){
  if(level.features?.fusion && e.kind==='object'&&e.noun==='CLUMP'){
    const other=state.entities.find(o=>o.id!==e.id&&o.kind==='object'&&o.noun==='CLUMP'&&o.x===nx&&o.y===ny);
    if(other){
      other.value=(other.value??0)+(e.value??0);
      other.fusionPulse=6;
      state.entities=state.entities.filter(o=>o.id!==e.id);
      state.event='fusion';
      return;
    }
  }
  e.x=nx;e.y=ny;
  const floor=floorAt(state,nx,ny);
  if(floor.some(f=>f.floorType==='HOLE') && e.kind==='object' && e.noun!=='ZERO'){
    state.entities=state.entities.filter(o=>o.id!==e.id);
    state.event='eat';
    return;
  }
}

function triggerFloors(state,level,you){
  const floors=floorAt(state,you.x,you.y);
  for(const f of floors){
    if(f.floorType==='LEVER' && f.toggleIds){
      for(const id of f.toggleIds) state.lamps[id]=!state.lamps[id];
      state.event='toggle';
    }
    if(f.floorType==='SWITCH' && f.switchId){
      state.switches[f.switchId]=!state.switches[f.switchId];
      state.event='toggle';
    }
    if(f.floorType==='TAKE' && state.heap!==null){
      const take=Math.min(f.amount,state.heap);
      state.heap-=take;
      state.event='take';
      if(state.heap===0){ state.won=true; state.message='LAST CRAB'; return; }
      const turtleTake=Math.min(level.turtleTake??1,state.heap);
      state.heap-=turtleTake;
      state.turtleTurn++;
      if(state.heap===0){ state.message='TURTLE TOOK THE LAST CRAB'; state.lost=true; }
    }
  }
}

export function stepBaba(inputState, level, dir) {
  const state=cloneState(inputState); state.event='step'; state.lost=false;
  applyRules(state,level);
  const [dx0,dy0]=({L:[-1,0],R:[1,0],U:[0,-1],D:[0,1]})[dir]??[0,0];
  let dx=dx0,dy=dy0;
  if(level.features?.numberLine && dy===0) dx*=state.stepSize;
  const yous=state.entities.filter(e=>e.kind==='object'&&hasProp(state,e.noun,'YOU'));
  if(yous.length===0) return state;
  const you=yous[0];
  const nx=you.x+dx, ny=you.y+dy;
  if(canEnter(state,level,you,nx,ny,Math.sign(dx),Math.sign(dy))){
    moveEntity(state,level,you,nx,ny,Math.sign(dx),Math.sign(dy));
    if(state.entities.includes(you)) triggerFloors(state,level,you);
    state.moves++;
  } else state.event='bump';
  applyRules(state,level);
  checkWin(state,level);
  return state;
}

export function graphMove(inputState,level,dir){
  const state=cloneState(inputState); state.event='step';
  const g=level.graph; if(!g) return state;
  const cur=g.nodes[state.graphNode];
  const candidates=[];
  for(const e of g.edges){
    const used=state.graphUsed.includes(e.id); if(used) continue;
    const other=e.a===state.graphNode?e.b:e.b===state.graphNode?e.a:null; if(!other) continue;
    const n=g.nodes[other], vx=n.x-cur.x, vy=n.y-cur.y;
    let score=-Infinity;
    if(dir==='R'&&vx>0) score=Math.abs(vx)*2-Math.abs(vy);
    if(dir==='L'&&vx<0) score=Math.abs(vx)*2-Math.abs(vy);
    if(dir==='D'&&vy>0) score=Math.abs(vy)*2-Math.abs(vx);
    if(dir==='U'&&vy<0) score=Math.abs(vy)*2-Math.abs(vx);
    if(score>0) candidates.push({e,other,score});
  }
  candidates.sort((a,b)=>b.score-a.score);
  if(candidates.length){
    const c=candidates[0]; state.graphNode=c.other; state.graphUsed.push(c.e.id); state.moves++; state.event='graph';
  } else state.event='bump';
  checkWin(state,level); return state;
}

export function stepState(state,level,dir){
  if(level.mode==='graph') return graphMove(state,level,dir);
  return stepBaba(state,level,dir);
}

export function evaluateSockets(state,level){
  state.socketValues={};
  for(const f of state.entities.filter(e=>e.kind==='floor'&&e.socket)){
    const w=state.entities.find(e=>e.kind==='word'&&e.x===f.x&&e.y===f.y);
    if(w) state.socketValues[f.socket]=w.text;
  }
}

function countNoun(state,noun){ return state.entities.filter(e=>e.kind==='object'&&e.noun===noun).length; }

export function checkWin(state,level){
  if(state.won) return true;
  const goal=level.goal??{type:'touchWin'};
  if(goal.type==='touchWin'){
    const you=state.entities.find(e=>e.kind==='object'&&hasProp(state,e.noun,'YOU'));
    if(you){
      const wins=state.entities.filter(e=>e.kind==='object'&&hasProp(state,e.noun,'WIN'));
      if(wins.some(w=>w.x===you.x&&w.y===you.y)) state.won=true;
    }
  }
  if(goal.type==='statement'){
    if(state.statements?.some(s=>s.truth)) state.won=true;
  }
  if(goal.type==='valueDoor'){
    const door=state.entities.find(e=>e.kind==='object'&&e.noun==='DOOR');
    const clump=state.entities.find(e=>e.kind==='object'&&e.noun==='CLUMP'&&e.value===goal.target&&door&&e.x===door.x&&e.y===door.y);
    if(clump) state.won=true;
  }
  if(goal.type==='count'){
    if(countNoun(state,goal.noun)===goal.target) state.won=true;
  }
  if(goal.type==='fillZones'){
    const zones=state.entities.filter(e=>e.kind==='floor'&&e.floorType==='ZONE');
    if(zones.length && zones.every(z=>state.entities.some(e=>e.kind==='object'&&e.noun===goal.noun&&e.x===z.x&&e.y===z.y))) state.won=true;
  }
  if(goal.type==='lamps'){
    const vals=Object.values(state.lamps); if(vals.length&&vals.every(Boolean)) state.won=true;
  }
  if(goal.type==='switchSum'){
    let sum=0; for(const [id,on] of Object.entries(state.switches)) if(on) sum+=(level.switchWeights?.[id]??0);
    state.switchSum=sum; if(sum===goal.target) state.won=true;
  }
  if(goal.type==='machineRule'){
    if(state.socketValues.op===goal.op && atomValue(state.socketValues.n)===goal.n) state.won=true;
  }
  if(goal.type==='equationSocket'){
    const v=atomValue(state.socketValues.box);
    if(v!==null && Math.abs((v+goal.add)-goal.right)<1e-9) state.won=true;
  }
  if(goal.type==='placeValue'){
    const tens=atomValue(state.socketValues.tens), ones=atomValue(state.socketValues.ones);
    if(tens!==null&&ones!==null){ state.placeValue=tens*10+ones; if(state.placeValue===goal.target) state.won=true; }
  }
  if(goal.type==='graphAllEdges'){
    if(state.graphUsed.length===level.graph.edges.length) state.won=true;
  }
  return state.won;
}

export function graphOddDegreeCount(graph){
  const d=Object.fromEntries(Object.keys(graph.nodes).map(k=>[k,0]));
  for(const e of graph.edges){d[e.a]++;d[e.b]++;}
  return Object.values(d).filter(v=>v%2===1).length;
}

export function validateNope(level){
  if(!level.nope) return {valid:true,reason:'not-nope'};
  if(level.mode==='graph'){
    const odd=graphOddDegreeCount(level.graph);
    return {valid:odd>2,reason:`${odd} odd-degree vertices`};
  }
  if(level.goal?.type==='lamps'){
    const ids=Object.keys(level.lamps??{}); const start=ids.reduce((m,id,i)=>m|((level.lamps[id]?1:0)<<i),0);
    const target=(1<<ids.length)-1; const toggles=(level.entities??[]).filter(e=>e.floorType==='LEVER').map(f=>f.toggleIds.reduce((m,id)=>m|(1<<ids.indexOf(id)),0));
    const q=[start], seen=new Set([start]);
    while(q.length){const m=q.shift(); if(m===target) return {valid:false,reason:'reachable'}; for(const t of toggles){const n=m^t;if(!seen.has(n)){seen.add(n);q.push(n);}}}
    return {valid:true,reason:`target unreachable across ${seen.size} states`};
  }
  return {valid:true,reason:'manual proof'};
}
