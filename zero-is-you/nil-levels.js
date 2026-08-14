import {parseFactTokens} from './facts.js';
let ID=9000;
const W=(x,y,text)=>({id:`nw${++ID}`,kind:'word',x,y,text});
const O=(x,y,noun,extra={})=>({id:`no${++ID}`,kind:'object',x,y,noun,...extra});
const F=(x,y,floorType,extra={})=>({id:`nf${++ID}`,kind:'floor',x,y,floorType,...extra});
const R=(y,a,b,c)=>[W(0,y,a),W(1,y,b),W(2,y,c)];
const Z=(x=5,y=6)=>O(x,y,'ZERO');
const fk=(tokens)=>parseFactTokens(tokens)?.key;
function factBase(id,title,difficulty,required,entities,extra={}){
  return {id,world:2,title,concept:'fact.authorship',difficulty,width:12,height:8,expansion:'nil',nilCluster:'FACT FORGE',goal:{type:'facts',requiredFacts:required.map(fk)},entities:[...R(0,'ZERO','IS','YOU'),...entities],...extra};
}

const PAPERWORK=factBase('nil-01-paperwork','PAPERWORK',2,[['TWO','PLUS','TWO','SAME','FOUR']],[
  W(3,2,'TWO'),W(4,2,'PLUS'),W(6,2,'SAME'),W(7,2,'FOUR'),W(5,5,'TWO'),Z(5,6),
  F(3,2,'FACT_RAIL'),F(4,2,'FACT_RAIL'),F(5,2,'FACT_RAIL'),F(6,2,'FACT_RAIL'),F(7,2,'FACT_RAIL'),F(9,3,'FACT_LOCK',{label:'1'})
],{hint:'THE EMPTY PLACE IS PART OF A STATEMENT.',factForgeIndex:1});

const NICE_TRY=factBase('nil-02-nice-try','NICE TRY',2,[['TWO','PLUS','THREE','SAME','FIVE']],[
  W(3,2,'TWO'),W(4,2,'PLUS'),W(5,2,'THREE'),W(6,2,'SAME'),W(7,5,'FIVE'),W(9,5,'SIX'),Z(7,6),
  ...[3,4,5,6,7].map(x=>F(x,2,'FACT_RAIL')),F(10,2,'FACT_LOCK',{label:'2'})
],{hint:'THE WORLD WILL TEST WHATEVER YOU WRITE.',factForgeIndex:2});

const OLD_NEWS=factBase('nil-03-old-news','OLD NEWS',3,[['TWO','PLUS','TWO','SAME','FOUR']],[
  W(4,2,'PLUS'),W(5,2,'TWO'),W(6,2,'SAME'),W(7,2,'FOUR'),W(3,5,'TWO'),Z(3,6),
  ...[3,4,5,6,7].map(x=>F(x,2,'FACT_RAIL')),F(9,2,'FACT_LOCK',{label:'3'})
],{hint:'YOU HAVE WRITTEN THIS RELATION BEFORE.',factForgeIndex:3,recall:true});

const TURN_IT=factBase('nil-04-turn-it-around','TURN IT AROUND',4,[
  ['THREE','PLUS','FOUR','SAME','SEVEN'],['FOUR','PLUS','THREE','SAME','SEVEN']
],[
  W(4,1,'PLUS'),W(5,1,'FOUR'),W(6,1,'SAME'),W(7,1,'SEVEN'),W(3,5,'THREE'),
  W(8,3,'PLUS'),W(9,3,'THREE'),W(10,3,'SAME'),W(11,3,'SEVEN'),W(7,5,'FOUR'),Z(3,6),
  ...[3,4,5,6,7].map(x=>F(x,1,'FACT_RAIL')),...[7,8,9,10,11].map(x=>F(x,3,'FACT_RAIL'))
],{hint:'WRITE THE SAME CROWD IN THE OTHER ORDER.',factForgeIndex:4});

const FAMILY=factBase('nil-05-family-dinner','FAMILY DINNER',5,[
  ['SEVEN','MINUS','THREE','SAME','FOUR'],['SEVEN','MINUS','FOUR','SAME','THREE']
],[
  W(1,2,'SEVEN'),W(2,2,'MINUS'),W(3,2,'THREE'),W(5,2,'FOUR'),W(4,5,'SAME'),Z(4,6),
  W(7,4,'SEVEN'),W(8,4,'MINUS'),W(9,4,'FOUR'),W(11,4,'THREE'),W(10,6,'SAME'),
  ...[1,2,3,4,5].map(x=>F(x,2,'FACT_RAIL')),...[7,8,9,10,11].map(x=>F(x,4,'FACT_RAIL')),F(6,2,'FACT_LOCK',{label:'4'})
],{hint:'THE ADDITION PAGES HAVE SUBTRACTION RELATIVES.',factForgeIndex:5,familyGoal:true});

export const NIL_LEVELS=[PAPERWORK,NICE_TRY,OLD_NEWS,TURN_IT,FAMILY];
export const NIL_LEVEL_BY_ID=Object.fromEntries(NIL_LEVELS.map(l=>[l.id,l]));
