import './build-zero-v9.mjs';
import fs from 'node:fs';
const p='zero-is-you/game-v9.js';let s=fs.readFileSync(p,'utf8');
s=s.replace("from './levels-v9.js'","from './levels-v9-runtime.js'");
s=s.replaceAll("./sw.js?v=9.0","./sw.js?v=9.1");
const required=[
  "from './levels-v9-runtime.js'",
  "./sw.js?v=9.1",
  'CHALLENGE CONSTELLATION',
  'R = ESTIMATED REASONING STEPS',
  'createMusicV9',
  'menuBackdrop',
  'fitPtext',
];
for(const needle of required)if(!s.includes(needle))throw new Error(`v9 build transform missing: ${needle}`);
const names=[...s.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m=>m[1]);
const duplicate=[...new Set(names.filter((n,i)=>names.indexOf(n)!==i))];
if(duplicate.length)throw new Error(`duplicate v9 functions: ${duplicate.join(', ')}`);
fs.writeFileSync(p,s);
console.log('activated and verified ZERO v9.1 runtime');
