import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PROBLEM_BANK} from '../problem-bank-v10.js';
assert.equal(PROBLEM_BANK.length,60);
const top=PROBLEM_BANK.filter(p=>p.world===6);assert.equal(top.length,10);assert(top.some(p=>p.kind==='graph'));assert(top.some(p=>p.kind==='lamps'));assert(top.some(p=>p.kind==='heap'));assert(top.filter(p=>p.kind==='facts').every(p=>(p.data.facts?.length||0)>=2));
const music=fs.readFileSync(new URL('../music-v10.js',import.meta.url),'utf8');assert.match(music,/BACH CIRCUIT/);assert.match(music,/MOZART COMET/);assert.match(music,/ODE TO ORBIT/);assert.match(music,/createStereoPanner/);assert.match(music,/setIntensity/);assert.doesNotMatch(music,/\.mp3|\.ogg|\.wav/);
const game=fs.readFileSync('zero-is-you/game-v9.js','utf8');assert.match(game,/levels-v1(?:0|1)-runtime/);assert.match(game,/createMusicV10/);assert.match(game,/setIntensity/);assert.match(game,/star:/);
console.log('ZERO v10 graphics/music and legacy challenge checks passed');
