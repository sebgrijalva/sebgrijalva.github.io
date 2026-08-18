import './build-zero-v9.mjs';
import fs from 'node:fs';
const p='zero-is-you/game-v9.js';let s=fs.readFileSync(p,'utf8');
s=s.replace("from './levels-v9.js'","from './levels-v9-runtime.js'");
s=s.replaceAll("./sw.js?v=9.0","./sw.js?v=9.1");
if(!s.includes("from './levels-v9-runtime.js'"))throw new Error('v9 runtime levels were not activated');
if(!s.includes("./sw.js?v=9.1"))throw new Error('v9.1 service-worker cache version missing');
fs.writeFileSync(p,s);
console.log('activated ZERO v9.1 runtime corrections');
