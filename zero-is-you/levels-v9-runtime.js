import {LEVELS as BASE_LEVELS,WORLDS} from './levels-v9.js';
import {PROBLEM_BANK} from './problem-bank-v9.js';

export {WORLDS};
export const LEVELS=structuredClone(BASE_LEVELS);
let RID=50000;

function patchLamp(title,initial,toggles){
  const l=LEVELS.find(x=>x.title===title);if(!l)throw new Error(`missing lamp level ${title}`);
  l.lamps=Object.fromEntries(initial.map((v,i)=>[`l${i}`,!!v]));
  const levers=l.entities.filter(e=>e.kind==='floor'&&e.floorType==='LEVER');
  toggles.forEach((ids,i)=>{if(levers[i])levers[i].toggleIds=ids.map(j=>`l${j}`);});
}
patchLamp('PARITY CAGE',[1,0,0,0],[[0,1],[1,2],[2,3],[3,0],[0,2]]);
patchLamp('FIVE-LAMP CODE',[1,0,1,0,0],[[0,1,2],[1,3],[2,4],[0,3,4],[1,2,3]]);

// Keep movable answer tiles out of obstacle cells and away from straight-shot placements.
const statementSpots=[[9,6],[3,5],[10,5],[2,6]];
for(const l of LEVELS.filter(x=>x.goal?.type==='statement')){
  const candidates=l.entities.filter(e=>e.kind==='word'&&e.y>=4);
  candidates.forEach((e,i)=>{e.x=statementSpots[i%statementSpots.length][0];e.y=statementSpots[i%statementSpots.length][1];});
  const correct=candidates.find(e=>e.text===l.answerToken);if(correct&&correct.x===l.answerCell.x){correct.x=10;correct.y=6;}
}

// Fact puzzles sometimes require two copies of the same mathematical token. Preserve multiplicity.
const factSpots=[[9,6],[3,6],[10,6],[5,6],[7,6],[2,6]];
LEVELS.forEach((l,index)=>{
  const spec=PROBLEM_BANK[index];if(l.goal?.type!=='facts'||spec?.kind!=='facts')return;
  l.entities=l.entities.filter(e=>!(e.kind==='word'&&e.y>=5));
  const needed=spec.data.facts.map((f,i)=>f[spec.data.blanks[i]]);
  const pool=[...needed];
  for(const t of spec.data.candidates){if(pool.length>=Math.max(4,needed.length+2))break;if(!pool.includes(t)||needed.filter(x=>x===t).length>1)pool.push(t);}
  pool.forEach((text,i)=>l.entities.push({id:`v9rw${++RID}`,kind:'word',x:factSpots[i%factSpots.length][0],y:factSpots[i%factSpots.length][1],text}));
});

export const LEVEL_BY_ID=Object.fromEntries(LEVELS.map(l=>[l.id,l]));
