import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {LEVELS} from '../challenge-levels.js';
import {NIL_LEVELS} from '../nil-levels.js';
import {createState,validateNope} from '../engine.js';
import {parseFactTokens,rational,rEq} from '../facts.js';

assert.equal(LEVELS.length,60,'base challenge level count changed');
assert.equal(NIL_LEVELS.length,10,'Fact Forge must contain 10 challenge levels');
for(const l of [...LEVELS,...NIL_LEVELS]){
  const s=createState(l);assert.equal(s.levelId,l.id);
  for(const e of l.entities??[]) assert(e.x>=0&&e.x<12&&e.y>=0&&e.y<8,`${l.id}: entity outside 12x8 grid`);
  if(l.nope) assert(validateNope(l).valid,`${l.id}: NOPE claim is not valid`);
}
for(const l of LEVELS.filter(x=>x.world===1).slice(3)) assert((l.reasoningSteps??0)>=2,`${l.id}: early challenge regressed to one-step`);
for(const l of NIL_LEVELS){assert((l.reasoningSteps??0)>=3,`${l.id}: Fact Forge level too shallow`);for(const k of l.goal.requiredFacts??[]) assert(k,`${l.id}: missing required fact key`);}
assert.equal(parseFactTokens(['TWO','PLUS','THREE','TIMES','FOUR','SAME','FOURTEEN']).truth,true);
assert.equal(parseFactTokens(['TWO','PLUS','THREE','TIMES','FOUR','SAME','TWENTY']).truth,false);
assert.equal(parseFactTokens(['HALF','SAME','TWOQUARTERS']).truth,true);
assert(rEq(rational(1n,2n),rational(2n,4n)));
const rendererURL=new URL('../game-v8.js',import.meta.url);
const rendererPath=fileURLToPath(rendererURL);
const src=fs.readFileSync(rendererURL,'utf8');
assert.match(src,/const TILE=32/,'renderer must use native 32x32 tiles');
assert.match(src,/w:384,h:448/,'portrait renderer must be 384x448');
assert.match(src,/BOARD_W=12\*TILE/,'board must remain 12 tiles wide');
assert.doesNotMatch(src,/game-v6\.pack/,'v8 must not depend on the packed blob loader');
const names=[...src.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m=>m[1]);
const duplicates=[...new Set(names.filter((n,i)=>names.indexOf(n)!==i))];
assert.deepEqual(duplicates,[],'renderer contains duplicate top-level function declarations');
execFileSync(process.execPath,['--check',rendererPath],{stdio:'inherit'});
console.log('ZERO IS YOU v8 challenge, syntax, and 32px renderer checks passed');
