import './build-zero-v9.mjs';
import fs from 'node:fs';
const p='zero-is-you/game-v9.js';let s=fs.readFileSync(p,'utf8');
s=s.replace("from './levels-v9.js'","from './levels-v9-runtime.js'");
if(!s.includes("from './levels-v9-runtime.js'"))throw new Error('v9 runtime levels were not activated');
fs.writeFileSync(p,s);
console.log('activated v9 runtime level corrections');
