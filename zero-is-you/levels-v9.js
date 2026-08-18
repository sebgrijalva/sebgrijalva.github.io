import {LEVELS as LEGACY_LEVELS} from './challenge-levels.js';
import {PROBLEM_BANK,BAND_META} from './problem-bank-v9.js';
import {parseFactTokens} from './facts.js';

let ID=30000;
const W=(x,y,text)=>({id:`v9w${++ID}`,kind:'word',x,y,text});
const O=(x,y,noun,extra={})=>({id:`v9o${++ID}`,kind:'object',x,y,noun,...extra});
const F=(x,y,floorType,extra={})=>({id:`v9f${++ID}`,kind:'floor',x,y,floorType,...extra});
const R=(y,a,b,c)=>[W(0,y,a),W(1,y,b),W(2,y,c)];
const difficultyForWorld=w=>[3,4,5,6,8,9][w-1];

export const WORLDS=BAND_META.map(b=>({id:b.world,name:b.name,subtitle:`BAND ${b.label} · ${b.subtitle}`,band:b.label,accent:b.accent}));

function shell(spec,index,extra={}){
  const legacy=LEGACY_LEVELS[index];
  return {id:legacy?.id??`v9-${index+1}`,world:spec.world,title:spec.title,concept:spec.concept,difficulty:difficultyForWorld(spec.world),reasoningSteps:spec.reasoning,challengeBand:BAND_META[spec.world-1].label,sourceBasis:spec.sourceBasis,width:12,height:8,entities:[],challengePack:9,noStraightPush:true,hint:spec.hint,...extra};
}
function addWalls(l,cells){l.entities.push(...R(1,'WALL','IS','STOP'));for(const [x,y] of cells)l.entities.push(O(x,y,'WALL'));}
function candidateSpots(){return [[9,6],[3,5],[10,4],[6,6],[2,4],[8,5],[4,6],[10,6],[2,6],[7,4]];}

function makeStatement(spec,index){
  const {tokens,blank,candidates}=spec.data,l=shell(spec,index,{goal:{type:'statement'}});l.entities.push(...R(0,'ZERO','IS','YOU'),O(1,7,'ZERO'));
  addWalls(l,[[5,4],[6,4],[7,4],[1,5],[11,5]]);
  const sx=Math.max(3,Math.floor((12-tokens.length)/2));l.sentenceStart=sx;tokens.forEach((t,i)=>{if(i!==blank)l.entities.push(W(sx+i,2,t));});
  const correct=tokens[blank],pool=[correct,...candidates.filter(x=>x!==correct)].slice(0,4),spots=candidateSpots();
  pool.forEach((t,i)=>{let [x,y]=spots[(i+index)%spots.length];if(x===sx+blank)x=(x+3)%11+1;l.entities.push(W(x,y,t));});
  l.answerToken=correct;l.answerCell={x:sx+blank,y:2};return l;
}

function makeFusion(spec,index){
  const {values,target}=spec.data,l=shell(spec,index,{features:{fusion:true},goal:{type:'valueDoor',target},subsetChoice:true});
  l.entities.push(...R(0,'ZERO','IS','YOU'),...R(1,'CLUMP','IS','PUSH'),O(1,7,'ZERO'),O(10,2,'DOOR',{target}));
  const spots=[[2,3],[8,3],[4,6],[9,6],[6,4]];values.forEach((v,i)=>l.entities.push(O(spots[i][0],spots[i][1],'CLUMP',{value:v})));
  return l;
}

function makeCount(spec,index){
  const {initial,target}=spec.data,l=shell(spec,index,{goal:{type:'count',noun:'CRAB',target},countDisplay:{noun:'CRAB',target}});l.entities.push(...R(0,'ZERO','IS','YOU'),...R(1,'CRAB','IS','PUSH'),O(1,7,'ZERO'));
  const crabSpots=[[2,5],[4,4],[6,5],[8,4],[10,5],[3,6],[9,6],[6,3]];for(let i=0;i<initial;i++)l.entities.push(O(crabSpots[i][0],crabSpots[i][1],'CRAB'));
  const holes=initial-target,holeSpots=[[3,2],[8,2],[6,3],[10,2]];for(let i=0;i<holes;i++)l.entities.push(F(holeSpots[i][0],holeSpots[i][1],'HOLE'));
  return l;
}

function makeArray(spec,index){
  const {count,cols,rows}=spec.data,l=shell(spec,index,{goal:{type:'fillZones',noun:'CRAB'},array:{cols,rows}});l.entities.push(...R(0,'ZERO','IS','YOU'),...R(1,'CRAB','IS','PUSH'),O(1,7,'ZERO'));
  const sx=Math.max(3,6-Math.floor(cols/2)),sy=2,cells=[];for(let i=0;i<count;i++){const x=sx+(i%cols),y=sy+Math.floor(i/cols);cells.push([x,y]);l.entities.push(F(x,y,'ZONE'));}
  cells.slice(0,Math.max(0,count-2)).forEach(([x,y])=>l.entities.push(O(x,y,'CRAB')));
  const free=[[10,6],[3,6],[9,5],[2,5]];for(let i=Math.max(0,count-2);i<count;i++){const q=free[i-(count-2)];l.entities.push(O(q[0],q[1],'CRAB'));}
  return l;
}

const NWORD={1:'ONE',2:'TWO',3:'THREE',4:'FOUR',5:'FIVE',6:'SIX',7:'SEVEN',8:'EIGHT',9:'NINE'};
function makeMachine(spec,index){
  const {samples,op,n}=spec.data,l=shell(spec,index,{goal:{type:'machineRule',op,n},machineSamples:samples});l.entities.push(...R(0,'ZERO','IS','YOU'),O(1,7,'ZERO'),F(5,2,'SOCKET',{socket:'op'}),F(6,2,'SOCKET',{socket:'n'}));
  const ops=[op,...['PLUS','TIMES'].filter(x=>x!==op)],nums=[NWORD[n],...['ONE','TWO','THREE','FOUR'].filter(x=>x!==NWORD[n])];
  const spots=[[9,6],[3,5],[10,4],[6,6],[2,4],[8,5]];[...ops.slice(0,2),...nums.slice(0,3)].forEach((t,i)=>l.entities.push(W(spots[i][0],spots[i][1],t)));return l;
}

function makeBinary(spec,index){
  const l=shell(spec,index,{goal:{type:'switchSum',target:spec.data.target},switches:{s1:false,s2:false,s4:false,s8:false},switchWeights:{s1:1,s2:2,s4:4,s8:8},binaryTarget:spec.data.target});l.entities.push(...R(0,'ZERO','IS','YOU'),O(5,7,'ZERO'));
  [1,2,4,8].forEach((v,i)=>l.entities.push(F(1+i*3,4,'SWITCH',{switchId:`s${v}`,weight:v,label:String(v)})));return l;
}

function makePlace(spec,index){
  const l=shell(spec,index,{goal:{type:'placeValue',target:spec.data.target},placeStation:true});l.entities.push(...R(0,'ZERO','IS','YOU'),O(1,7,'ZERO'),F(5,2,'SOCKET',{socket:'tens'}),F(6,2,'SOCKET',{socket:'ones'}));
  const spots=[[9,6],[3,5],[10,4],[6,6]];spec.data.candidates.forEach((t,i)=>l.entities.push(W(spots[i][0],spots[i][1],t)));return l;
}

function makeFacts(spec,index){
  const facts=spec.data.facts,blanks=spec.data.blanks,l=shell(spec,index,{goal:{type:'facts',requiredFacts:facts.map(f=>parseFactTokens(f)?.key).filter(Boolean)},factMode:true});l.entities.push(...R(0,'ZERO','IS','YOU'),O(1,7,'ZERO'));
  const ys=facts.length===1?[3]:[2,4],needed=[];
  facts.forEach((tokens,fi)=>{const y=ys[fi],sx=Math.max(1,Math.floor((12-tokens.length)/2));tokens.forEach((t,i)=>{l.entities.push(F(sx+i,y,'FACT_RAIL'));if(i!==blanks[fi])l.entities.push(W(sx+i,y,t));else needed.push(t);});});
  const pool=[...new Set([...needed,...spec.data.candidates])].slice(0,Math.max(4,needed.length+2)),spots=candidateSpots();pool.forEach((t,i)=>{const [x,y]=spots[(i+index+2)%spots.length];l.entities.push(W(x,y,t));});return l;
}

const GRAPH_SHAPES={
  'square-tail':{nodes:{A:{x:2,y:2},B:{x:5,y:2},C:{x:5,y:5},D:{x:2,y:5},E:{x:9,y:5}},edges:[['A','B'],['B','C'],['C','D'],['D','A'],['C','E']],start:'E'},
  branch:{nodes:{A:{x:1,y:4},B:{x:4,y:1},C:{x:5,y:4},D:{x:4,y:7},E:{x:10,y:4}},edges:[['A','C'],['C','B'],['B','E'],['E','C'],['C','D'],['D','A']],start:'A'},
  'four-odd':{nodes:{C:{x:6,y:4},A:{x:2,y:1},B:{x:10,y:1},D:{x:2,y:7},E:{x:10,y:7}},edges:[['C','A'],['C','B'],['C','D'],['C','E']],start:'A'},
  'fork-loop':{nodes:{A:{x:2,y:4},B:{x:5,y:1},C:{x:6,y:4},D:{x:10,y:4}},edges:[['A','B'],['B','C'],['C','A'],['C','D']],start:'D'},
  'six-odd':{nodes:{C:{x:6,y:4},A:{x:1,y:1},B:{x:6,y:1},D:{x:11,y:1},E:{x:1,y:7},F:{x:6,y:7},G:{x:11,y:7}},edges:[['C','A'],['C','B'],['C','D'],['C','E'],['C','F'],['C','G']],start:'A'},
  'double-loop':{nodes:{A:{x:1,y:2},B:{x:4,y:2},C:{x:4,y:5},D:{x:1,y:5},E:{x:7,y:5},F:{x:10,y:5},G:{x:10,y:2},H:{x:7,y:2}},edges:[['A','B'],['B','C'],['C','D'],['D','A'],['C','E'],['E','F'],['F','G'],['G','H'],['H','E']],start:'C'},
};
function makeGraph(spec,index){const s=GRAPH_SHAPES[spec.data.shape];if(!s)throw new Error(`unknown graph ${spec.data.shape}`);const graph={nodes:structuredClone(s.nodes),edges:s.edges.map((e,i)=>({id:`v9e${index}-${i}`,a:e[0],b:e[1]})),start:s.start};return shell(spec,index,{mode:'graph',goal:{type:'graphAllEdges'},graph,nope:!!spec.data.nope,nopeReasons:spec.data.reasons,correctReason:spec.data.correct??0});}

function makeLamps(spec,index){
  const initial=Object.fromEntries(spec.data.initial.map((v,i)=>[`l${i}`,!!v])),l=shell(spec,index,{goal:{type:'lamps'},lamps:initial,nope:!!spec.data.nope,nopeReasons:spec.data.reasons,correctReason:spec.data.correct??0});l.entities.push(...R(0,'ZERO','IS','YOU'),O(5,7,'ZERO'));
  spec.data.initial.forEach((_,i)=>l.entities.push(O(1+i*2,2,'LAMP',{lampId:`l${i}`})));
  const xs=[1,4,7,10,6];spec.data.toggles.forEach((ids,i)=>l.entities.push(F(xs[i%xs.length],5+(i>=4?1:0),'LEVER',{toggleIds:ids.map(j=>`l${j}`),label:String.fromCharCode(65+i)})));return l;
}

function makeHeap(spec,index){
  const l=shell(spec,index,{goal:{type:'never'},heap:spec.data.heap,turtleTake:spec.data.turtleTake,heapGame:true});l.entities.push(...R(0,'ZERO','IS','YOU'),O(6,7,'ZERO'));
  const xs=[3,6,9];spec.data.takes.forEach((n,i)=>l.entities.push(F(xs[i],4,'TAKE',{amount:n,label:String(n)})));return l;
}

function build(spec,index){switch(spec.kind){case'statement':return makeStatement(spec,index);case'fusion':return makeFusion(spec,index);case'count':return makeCount(spec,index);case'array':return makeArray(spec,index);case'machine':return makeMachine(spec,index);case'binary':return makeBinary(spec,index);case'place':return makePlace(spec,index);case'facts':return makeFacts(spec,index);case'graph':return makeGraph(spec,index);case'lamps':return makeLamps(spec,index);case'heap':return makeHeap(spec,index);default:throw new Error(`unknown v9 kind ${spec.kind}`);}}

if(PROBLEM_BANK.length!==60)throw new Error(`v9 bank must have 60 problems, got ${PROBLEM_BANK.length}`);
export const LEVELS=PROBLEM_BANK.map(build);
export const LEVEL_BY_ID=Object.fromEntries(LEVELS.map(l=>[l.id,l]));
