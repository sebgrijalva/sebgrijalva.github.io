import assert from 'node:assert/strict';
import {LEVELS} from '../levels.js';
import {NIL_LEVELS} from '../nil-levels.js';
import {createState,stepState,validateNope} from '../engine.js';
import {parseFactTokens,rational,rEq} from '../facts.js';
assert.equal(LEVELS.length,60,'base level count changed');
for(const l of LEVELS){const s=createState(l);assert.equal(s.levelId,l.id);if(l.nope)validateNope(l);}
assert.equal(NIL_LEVELS.length,5);
assert.equal(parseFactTokens(['TWO','PLUS','TWO','SAME','FOUR']).truth,true);
assert.equal(parseFactTokens(['TWO','PLUS','THREE','SAME','SIX']).truth,false);
assert.equal(parseFactTokens(['HALF','SAME','TWOQUARTERS']).truth,true);
assert(rEq(rational(1n,2n),rational(2n,4n)));
const fam=[parseFactTokens(['THREE','PLUS','FOUR','SAME','SEVEN']),parseFactTokens(['FOUR','PLUS','THREE','SAME','SEVEN']),parseFactTokens(['SEVEN','MINUS','THREE','SAME','FOUR']),parseFactTokens(['SEVEN','MINUS','FOUR','SAME','THREE'])];
assert(fam.every(f=>f.familyKey===fam[0].familyKey),'fact family canonicalization mismatch');
function key(s){const ents=s.entities.filter(e=>e.kind!=='floor').map(e=>`${e.id}:${e.x},${e.y},${e.noun||e.text||''}`).sort().join(';');return ents+'|'+[...s.authoredInLevel].sort().join(',');}
function solve(level,max=120000){const q=[createState(level)],seen=new Set([key(q[0])]);let qi=0;while(qi<q.length&&seen.size<max){const s=q[qi++];if(s.won)return {moves:s.moves,states:seen.size};for(const d of ['L','R','U','D']){const n=stepState(s,level,d);const k=key(n);if(!seen.has(k)){seen.add(k);q.push(n);}}}return null;}
for(const l of NIL_LEVELS.slice(0,4)){const r=solve(l);console.log(l.id,r);assert(r,`${l.id} unsolved within search limit`);}
{const l=NIL_LEVELS[4],seq=['U','U','U','D','D','D','D','R','R','R','R','R','R','U','U'];let s=createState(l);for(const d of seq)s=stepState(s,l,d);assert(s.won,'family dinner witness failed');console.log(l.id,{moves:s.moves,witness:true});}
console.log('v5 tests passed');
