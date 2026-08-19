import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PROBLEM_BANK} from '../problem-bank-v11-fix.js';
import {enumerateLockSolutions,lockComplexity} from '../constraints-v11.js';
import {LEVELS} from '../levels-v11-runtime.js';
import {createState,stepState} from '../engine-v11.js';

assert.equal(PROBLEM_BANK.length,60);assert.equal(LEVELS.length,60);
const expectedLocks=[3,3,3,4,4,4];
const initialFloor=[120,210,504,1680,3024,5040];
const informativeFloor=[3,3,3,4,4,5];
for(let w=1;w<=6;w++){
  const specs=PROBLEM_BANK.filter(p=>p.world===w&&p.kind==='lock');
  assert.equal(specs.length,expectedLocks[w-1],`band ${w} lock coverage`);
  for(const spec of specs){
    const solutions=enumerateLockSolutions(spec.data);
    assert.equal(solutions.length,1,`${spec.title}: solution must be unique`);
    assert.deepEqual(solutions[0],spec.data.solution,`${spec.title}: enumerated solution differs from authored target`);
    const c=lockComplexity(spec.data);
    assert(c.initial>=initialFloor[w-1],`${spec.title}: search space too small (${c.initial})`);
    assert.equal(c.final,1,`${spec.title}: final ambiguity ${c.final}`);
    assert(c.informative>=informativeFloor[w-1],`${spec.title}: only ${c.informative} informative clues`);
    assert(c.trace.every((n,i,a)=>i===0||n<=a[i-1]),`${spec.title}: survivor count increased`);
  }
}

const web=PROBLEM_BANK.find(p=>p.title==='PRODUCT WEB');
assert.deepEqual(lockComplexity(web.data).trace,[560,280,112,5,2,1]);

for(const w of [5,6]){
  const band=PROBLEM_BANK.filter(p=>p.world===w);
  assert(band.filter(p=>p.kind==='lock').length>=4);
  assert(band.some(p=>p.kind==='graph'));
  assert(band.some(p=>p.kind==='lamps'||p.kind==='heap'));
}

for(const level of LEVELS.filter(l=>l.lockPuzzle)){
  const s=createState(level);assert(!s.won,`${level.title}: starts won`);
  assert.equal(level.goal.type,'constraintSockets');
  assert.equal(level.constraintDisplay.length,level.goal.constraints.length);
  assert(level.entities.filter(e=>e.floorType==='SOCKET').length>=3);
  stepState(s,level,'R');
}
const game=fs.readFileSync('zero-is-you/game-v9.js','utf8');
assert.match(game,/levels-v11-runtime/);assert.match(game,/engine-v11/);assert.match(game,/MAKE EVERY CLUE TRUE/);assert.match(game,/v=10\.2/);
console.log('ZERO v10.2 enumerated math-generator checks passed');
