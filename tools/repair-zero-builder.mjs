import fs from 'node:fs';
const p='tools/build-zero-v9.mjs';
let s=fs.readFileSync(p,'utf8');
const bad="src=src.replace(clearNeedle,clearNeedle+menuBackdrop.toString()+bandColor.toString());";
const good="src=src.replace(clearNeedle,clearNeedle+'\\n'+menuBackdrop.toString()+'\\n'+bandColor.toString());";
if(s.includes(bad)){
  s=s.replace(bad,good);
  fs.writeFileSync(p,s);
  console.log('repaired ZERO builder function boundaries');
}else if(s.includes(good)){
  console.log('ZERO builder function boundaries already repaired');
}else{
  throw new Error('ZERO builder boundary pattern not found');
}
