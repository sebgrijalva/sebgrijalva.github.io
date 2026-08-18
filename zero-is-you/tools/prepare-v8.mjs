import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const file=fileURLToPath(new URL('../game-v8.js',import.meta.url));
const source=fs.readFileSync(file,'utf8');
const seen=new Set();
const removed=[];
const lines=source.split('\n').filter((line,index)=>{
  const m=line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if(!m)return true;
  if(seen.has(m[1])){removed.push(`${m[1]}@${index+1}`);return false;}
  seen.add(m[1]);return true;
});
const clean=lines.join('\n');
if(clean!==source)fs.writeFileSync(file,clean);
console.log(`ZERO v8 source prepared; removed ${removed.length} duplicate declarations${removed.length?`: ${removed.join(', ')}`:''}`);
