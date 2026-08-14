import assert from 'node:assert/strict';
import {LEVELS} from '../challenge-levels.js';
import {NIL_LEVELS} from '../nil-levels.js';
import {createState,stepState,validateNope} from '../engine.js';
import {parseFactTokens,rational,rEq} from '../facts.js';
assert.equal(LEVELS.length,60,'base level count changed');
assert.equal(NIL_LEVELS.length,10,'Fact Forge should contain ten levels');
for(const l of [...LEVELS,...NIL_LEVELS]){const s=createState(l);assert.equal(s.levelId,l.id);if(l.nope)assert(validateNope(l).valid,`${l.id} NOPE invalid`);}
assert.equal(parseFactTokens(['TWO','PLUS','THREE','TIMES','FOUR','SAME','FOURTEEN']).truth,true);
assert.equal(parseFactTokens(['THREE','TIMES','FOUR','PLUS','THREE','TIMES','TWO','SAME','EIGHTEEN']).truth,true);
assert.equal(parseFactTokens(['HALF','SAME','TWOQUARTERS']).truth,true);assert(rEq(rational(1n,2n),rational(2n,4n)));
for(const l of LEVELS.filter(x=>x.goal?.type==='statement'&&x.id!=='s1-first-rule'&&x.id!=='s2-make-win')){const z=l.entities.find(e=>e.kind==='object'&&e.noun==='ZERO');const candidates=l.entities.filter(e=>e.kind==='word'&&e.y>=4);if(z&&candidates.length)assert(candidates.every(w=>Math.abs(w.x-z.x)+Math.abs(w.y-z.y)>1),`${l.id} has an answer tile directly in front of ZERO`);}
for(const l of LEVELS.filter(x=>x.goal?.type==='valueDoor'))assert(l.entities.filter(e=>e.kind==='object'&&e.noun==='CLUMP').length>=3,`${l.id} needs a decoy clump`);
for(const l of NIL_LEVELS){assert(l.difficulty>=4,`${l.id} too easy`);const s=createState(l),req=new Set(l.goal.requiredFacts);assert(!s.factScans.some(f=>f.truth&&req.has(f.key)),`${l.id} starts already solved`);const z=l.entities.find(e=>e.kind==='object'&&e.noun==='ZERO'),pieces=l.entities.filter(e=>e.kind==='word'&&e.y>=5);assert(pieces.every(w=>Math.abs(w.x-z.x)+Math.abs(w.y-z.y)>1),`${l.id} has trivial adjacent answer placement`);}
function key(s){return s.entities.filter(e=>e.kind!=='floor').map(e=>`${e.id}:${e.x},${e.y}`).sort().join(';')+'|'+[...s.authoredInLevel].sort().join(',');}
function solve(level,max=180000){const q=[createState(level)],seen=new Set([key(q[0])]);for(let i=0;i<q.length&&seen.size<max;i++){const s=q[i];if(s.won)return s.moves;for(const d of ['L','R','U','D']){const n=stepState(s,level,d),k=key(n);if(!seen.has(k)){seen.add(k);q.push(n);}}}return null;}
for(const l of NIL_LEVELS.slice(0,3)){const moves=solve(l);assert(moves!==null,`${l.id} unsolved`);assert(moves>=5,`${l.id} solved too cheaply in ${moves} moves`);console.log(l.id,{moves});}
console.log('v7 challenge tests passed');
