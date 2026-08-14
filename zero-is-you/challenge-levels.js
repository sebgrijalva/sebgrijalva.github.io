import {LEVELS as BASE_LEVELS, WORLDS} from './levels.js';

let CID=12000;
const W=(x,y,text)=>({id:`cw${++CID}`,kind:'word',x,y,text});
const O=(x,y,noun,extra={})=>({id:`co${++CID}`,kind:'object',x,y,noun,...extra});
const R=(y,a,b,c)=>[W(0,y,a),W(1,y,b),W(2,y,c)];

function h(s){let n=0;for(const c of s)n=(n*33+c.charCodeAt(0))>>>0;return n;}
function base(id,world,title,concept,difficulty,extra={}){return {id,world,title,concept,difficulty,width:12,height:8,entities:[],challengePack:7,...extra};}
function statement(id,world,title,tokens,blank,candidates,concept,difficulty,hint){
  const l=base(id,world,title,concept,difficulty,{goal:{type:'statement'},hint,reasoningSteps:2});
  l.entities.push(...R(0,'ZERO','IS','YOU'),O(1,6,'ZERO'));
  const sx=Math.max(3,Math.floor((12-tokens.length)/2));l.sentenceStart=sx;
  tokens.forEach((t,i)=>{if(i!==blank)l.entities.push(W(sx+i,2,t));});
  const correct=tokens[blank];const pool=[correct,...candidates.filter(x=>x!==correct)].slice(0,4);
  pool.sort((a,b)=>(h(id+a)%97)-(h(id+b)%97));
  const spots=[[9,6],[3,5],[10,4],[6,6]];pool.forEach((t,i)=>l.entities.push(W(spots[i][0],spots[i][1],t)));
  return l;
}
function subsetFusion(id,title,values,target,concept,difficulty,hint){
  const l=base(id,1,title,concept,difficulty,{features:{fusion:true},goal:{type:'valueDoor',target},hint,reasoningSteps:3});
  l.entities.push(...R(0,'ZERO','IS','YOU'),...R(1,'CLUMP','IS','PUSH'),O(6,7,'ZERO'),O(10,2,'DOOR',{target}));
  const spots=[[2,3],[8,3],[4,6],[9,6]];values.forEach((v,i)=>l.entities.push(O(spots[i][0],spots[i][1],'CLUMP',{value:v})));
  return l;
}

export const LEVELS=structuredClone(BASE_LEVELS);
function relocateCandidates(l){
  const zero=l.entities.find(e=>e.kind==='object'&&e.noun==='ZERO');if(zero){zero.x=1;zero.y=7;}
  const words=l.entities.filter(e=>e.kind==='word'&&e.y>=5);if(!words.length)return;
  const spots=[[9,6],[3,5],[10,4],[6,6],[2,6],[8,5],[4,6],[10,6]];
  words.forEach((w,i)=>{w.x=spots[i%spots.length][0];w.y=spots[i%spots.length][1];});
  l.reasoningSteps=Math.max(l.reasoningSteps??1,2);l.noStraightPush=true;
}
function deepenFusion(l){
  const clumps=l.entities.filter(e=>e.kind==='object'&&e.noun==='CLUMP');if(clumps.length!==2)return;
  const [a,b]=clumps.map(c=>c.value??0),target=l.goal.target;let d=1;while(d===a||d===b||d===target||d+a===target||d+b===target)d++;
  const spots=[[2,3],[8,3],[4,6]];clumps.forEach((c,i)=>{c.x=spots[i][0];c.y=spots[i][1];});l.entities.push(O(spots[2][0],spots[2][1],'CLUMP',{value:d}));
  const zero=l.entities.find(e=>e.kind==='object'&&e.noun==='ZERO');if(zero){zero.x=6;zero.y=7;}
  const door=l.entities.find(e=>e.kind==='object'&&e.noun==='DOOR');if(door){door.x=10;door.y=2;}
  l.reasoningSteps=3;l.noStraightPush=true;l.subsetChoice=true;
}
function deepenArray(l){
  const zones=new Set(l.entities.filter(e=>e.kind==='floor'&&e.floorType==='ZONE').map(e=>`${e.x},${e.y}`));
  const free=l.entities.filter(e=>e.kind==='object'&&e.noun==='CRAB'&&!zones.has(`${e.x},${e.y}`));const spots=[[1,6],[10,6],[1,3],[10,3]];
  free.forEach((c,i)=>{c.x=spots[i][0];c.y=spots[i][1];});const zero=l.entities.find(e=>e.kind==='object'&&e.noun==='ZERO');if(zero){zero.x=6;zero.y=7;}
  if(free.length){l.reasoningSteps=3;l.noStraightPush=true;}
}
for(const l of LEVELS){
  if(l.goal?.type==='statement'||l.goal?.type==='machineRule'||l.goal?.type==='equationSocket'||l.goal?.type==='placeValue')relocateCandidates(l);
  if(l.goal?.type==='valueDoor')deepenFusion(l);
  if(l.goal?.type==='fillZones')deepenArray(l);
}
const replace=(id,level)=>{const i=LEVELS.findIndex(l=>l.id===id);if(i<0)throw new Error(`missing ${id}`);LEVELS[i]=level;};
replace('s4-join',subsetFusion('s4-join','CHOOSE THE PARTS',[5,7,4],12,'addition.part-whole',4,'ONLY TWO CLUMPS BELONG IN TWELVE. THE THIRD IS BAIT.'));
replace('s5-same-five',statement('s5-same-five',1,'MISSING FIVE',['EIGHT','PLUS','FIVE','SAME','THIRTEEN'],2,['FOUR','SIX','SEVEN'],'missing.addend',4,'DO NOT START WITH COUNTING. ASK WHAT THIRTEEN IS MISSING.'));
replace('s6-zero-joins',statement('s6-zero-joins',1,'REWIND',['THIRTEEN','MINUS','FIVE','SAME','EIGHT'],2,['FOUR','SIX','SEVEN'],'inverse.operations',4,'USE THE ADDITION FACT BACKWARDS.'));
replace('s7-small-sum',statement('s7-small-sum',1,'MAKE TWELVE',['SEVEN','PLUS','FIVE','SAME','TWELVE'],2,['FOUR','SIX','EIGHT'],'part-whole',4,'FIND THE COMPLEMENT, THEN MANEUVER IT INTO PLACE.'));
replace('s8-join-again',statement('s8-join-again',1,'THREE PARTS',['TWO','PLUS','THREE','PLUS','FOUR','SAME','NINE'],4,['THREE','FIVE','SIX'],'associative.addition',5,'THINK IN CHUNKS: FIVE, THEN NINE.'));
replace('s9-zero-left',statement('s9-zero-left',1,'NEAR DOUBLE',['SIX','PLUS','SEVEN','SAME','THIRTEEN'],2,['FIVE','EIGHT','NINE'],'near-doubles',5,'DOUBLE SIX, THEN ADJUST BY ONE.'));
replace('s10-five-ways',statement('s10-five-ways',1,'RECTANGLE TWELVE',['THREE','TIMES','FOUR','SAME','TWELVE'],2,['TWO','FIVE','SIX'],'multiplication.array',5,'THINK OF TWELVE AS A RECTANGLE, NOT A CHANT.'));
for(const id of ['f2-missing','f3-even','f4-odd','f6-teen-backpack','f8-near-double','f9-six-even','a2-turn-array','a3-commute','a8-two-by-six','m2-rewind','m3-remainder','m4-fractions','m5-times-zero','m8-two-quarters','m9-one-times','p1-prime-seven','p2-factor-twelve','p3-divisible','p7-prime-eleven','p8-factor-eighteen','p10-magic-row','i6-gnomon','i8-clock-seven','i10-four-odds']){const l=LEVELS.find(x=>x.id===id);if(l){l.difficulty=Math.max(l.difficulty,4);l.challengePack=7;l.reasoningSteps=Math.max(l.reasoningSteps??1,2);}}
export {WORLDS};
export const LEVEL_BY_ID=Object.fromEntries(LEVELS.map(l=>[l.id,l]));
