import {LEVELS as BASE_LEVELS,WORLDS} from './levels-v9.js';

export {WORLDS};
export const LEVELS=structuredClone(BASE_LEVELS);

function patchLamp(title,initial,toggles){
  const l=LEVELS.find(x=>x.title===title);if(!l)throw new Error(`missing lamp level ${title}`);
  l.lamps=Object.fromEntries(initial.map((v,i)=>[`l${i}`,!!v]));
  for(const e of l.entities.filter(e=>e.kind==='object'&&e.noun==='LAMP'))e.lampId=`l${Number(e.lampId.slice(1))}`;
  const levers=l.entities.filter(e=>e.kind==='floor'&&e.floorType==='LEVER');
  toggles.forEach((ids,i)=>{if(levers[i])levers[i].toggleIds=ids.map(j=>`l${j}`);});
}

// One lit lamp gives the four-lamp system odd parity; pair-flips cannot reach four lit lamps.
patchLamp('PARITY CAGE',[1,0,0,0],[[0,1],[1,2],[2,3],[3,0],[0,2]]);
// Full-rank-ish five-lamp code with a short but non-obvious solution from the authored start state.
patchLamp('FIVE-LAMP CODE',[1,0,1,0,0],[[0,1,2],[1,3],[2,4],[0,3,4],[1,2,3]]);

export const LEVEL_BY_ID=Object.fromEntries(LEVELS.map(l=>[l.id,l]));
