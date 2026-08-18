import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PROBLEM_BANK,BAND_META} from '../problem-bank-v9.js';
import {LEVELS,WORLDS} from '../levels-v9-runtime.js';
import {createState,checkWin,validateNope} from '../engine.js';
assert.equal(BAND_META.length,6);assert.equal(PROBLEM_BANK.length,60);assert.equal(LEVELS.length,60);assert.equal(WORLDS.length,6);
for(let w=1;w<=6;w++)assert.equal(LEVELS.filter(l=>l.world===w).length,10);
assert.deepEqual(BAND_META.map(b=>b.label),['50','75','90','95','99','99.9']);
function lampReachable(level){const ids=Object.keys(level.lamps??{}),n=ids.length;if(!n)return true;const start=ids.reduce((m,id,i)=>m|((level.lamps[id]?1:0)<<i),0),target=(1<<n)-1,toggles=(level.entities??[]).filter(e=>e.floorType==='LEVER').map(f=>f.toggleIds.reduce((m,id)=>m|(1<<ids.indexOf(id)),0)),q=[start],seen=new Set(q);while(q.length){const m=q.shift();if(m===target)return true;for(const t of toggles){const x=m^t;if(!seen.has(x)){seen.add(x);q.push(x);}}}return false;}
function oddGraph(level){const d=Object.fromEntries(Object.keys(level.graph.nodes).map(k=>[k,0]));for(const e of level.graph.edges){d[e.a]++;d[e.b]++;}return Object.values(d).filter(x=>x%2).length;}
function countBy(xs,key){return xs.reduce((m,x)=>(m.set(x[key],(m.get(x[key])||0)+1),m),new Map());}
for(const [idx,l] of LEVELS.entries()){
  const spec=PROBLEM_BANK[idx],s=createState(l);assert.equal(s.levelId,l.id);assert(!checkWin(structuredClone(s),l),`${l.id}: starts won`);assert((l.reasoningSteps??0)>=2);for(const e of l.entities??[])assert(e.x>=0&&e.x<12&&e.y>=0&&e.y<8,`${l.id}: out of bounds`);
  if(l.goal?.type==='statement'){const correct=l.entities.find(e=>e.kind==='word'&&e.text===l.answerToken&&e.y>=4);assert(correct,`${l.id}: correct candidate missing`);assert.notEqual(correct.x,l.answerCell.x,`${l.id}: straight push`);}
  if(l.goal?.type==='facts'){
    assert((l.goal.requiredFacts??[]).length>=1,`${l.id}: fact keys missing`);
    const movable=l.entities.filter(e=>e.kind==='word'&&e.y>=5),have=countBy(movable,'text');
    const needed=spec.data.facts.map((f,i)=>({text:f[spec.data.blanks[i]],x:Math.max(1,Math.floor((12-f.length)/2))+spec.data.blanks[i]}));
    const reqCount=needed.reduce((m,n)=>(m.set(n.text,(m.get(n.text)||0)+1),m),new Map());
    for(const [text,n] of reqCount)assert((have.get(text)||0)>=n,`${l.id}: missing ${n} movable ${text} piece(s)`);
    for(const n of needed)assert(movable.some(e=>e.text===n.text&&e.x!==n.x),`${l.id}: ${n.text} only offered as a straight push`);
  }
  if(l.mode==='graph'){const odd=oddGraph(l);if(l.nope)assert(odd>2);else assert(odd===0||odd===2,`${l.id}: odd degree count ${odd}`);}
  if(l.goal?.type==='lamps'){if(l.nope)assert(validateNope(l).valid,`${l.id}: invalid NOPE`);else assert(lampReachable(l),`${l.id}: unreachable lamps`);}
  if(l.nope)assert(validateNope(l).valid,`${l.id}: NOPE claim invalid`);
}
for(let w=2;w<=6;w++){const prev=LEVELS.filter(l=>l.world===w-1).reduce((a,l)=>a+l.reasoningSteps,0)/10,cur=LEVELS.filter(l=>l.world===w).reduce((a,l)=>a+l.reasoningSteps,0)/10;assert(cur>=prev,`reasoning depth regressed into band ${BAND_META[w-1].label}`);}
const music=fs.readFileSync(new URL('../music-v9.js',import.meta.url),'utf8');assert.match(music,/BACH GRID/);assert.match(music,/MOZART STAR SONATA/);assert.match(music,/ODE TO ORBIT/);assert.doesNotMatch(music,/\.mp3|\.ogg|\.wav/);
console.log('ZERO v9 challenge-bank, geometry, proof and music checks passed');
