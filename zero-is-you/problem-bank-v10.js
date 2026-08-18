// v10 keeps the broad v9 curriculum, but replaces the top band with denser structural puzzles.
// These are original adaptations, not copied problem text. Difficulty is from invariants,
// representation, chaining and strategy rather than larger arithmetic.
import {PROBLEM_BANK as V9,BAND_META} from './problem-bank-v9.js';
export {BAND_META};
export const PROBLEM_BANK=structuredClone(V9);
const q=(title,kind,concept,reasoning,data,hint)=>({world:6,title,kind,concept,reasoning,data,hint,sourceBasis:'IM1E+OMI2+RICH-TASK-DESIGN'});
PROBLEM_BANK.splice(50,10,
 q('SIX ODD NODES','graph','graph.euler-impossibility',9,{shape:'six-odd',nope:true,reasons:['SIX VERTICES HAVE ODD DEGREE','THE GRAPH IS TOO LARGE','A TRIANGLE APPEARS'],correct:0},'DO NOT TRY PATHS YET. PROVE WHETHER A PATH CAN EXIST.'),
 q('DOUBLE LOOP','graph','graph.euler-trail',9,{shape:'double-loop',nope:false},'PLAN THE BRIDGE BEFORE ENTERING EITHER LOOP. A LOCAL GOOD MOVE CAN RUIN THE GLOBAL TRAIL.'),
 q('FIVE LAMP WALL','lamps','linear-invariant',10,{initial:[0,0,0,0,0],toggles:[[0,1],[1,2],[2,3],[3,4],[4,0]],nope:true,reasons:['THE TARGET IS OUTSIDE THE TOGGLE SPAN','FIVE IS ODD','THE LEVERS FORM A CYCLE'],correct:0},'SEARCH FOR SOMETHING EVERY MOVE PRESERVES. THEN PROVE NO.'),
 q('CHAIN OF TRUTH','facts','operations.precedence-chain',10,{facts:[['TWO','PLUS','THREE','TIMES','FOUR','SAME','FOURTEEN'],['FOURTEEN','MINUS','TWO','SAME','TWELVE'],['THREE','TIMES','FOUR','SAME','TWELVE']],blanks:[6,2,2],candidates:['FOURTEEN','TWELVE','FOUR','TWENTY']},'MAKE THREE STATEMENTS AGREE. EACH ONE CONSTRAINS THE NEXT.'),
 q('SPLIT RECTANGLE','facts','distributive-equivalence-chain',10,{facts:[['THREE','TIMES','FOUR','PLUS','THREE','TIMES','TWO','SAME','EIGHTEEN'],['THREE','TIMES','SIX','SAME','EIGHTEEN'],['FOUR','PLUS','TWO','SAME','SIX']],blanks:[8,2,4],candidates:['EIGHTEEN','SIX','FOUR','TWELVE']},'PROVE THE SPLIT AND UNSPLIT RECTANGLES HAVE THE SAME AREA.'),
 q('HEAP SEVENTEEN','heap','games.modular-strategy',10,{heap:17,turtleTake:2,takes:[1,2,3]},'WORK BACKWARD FROM LOSING POSITIONS. THE WINNING IDEA IS A RESIDUE CLASS, NOT A GUESS.'),
 q('THIRTEEN TWICE','fusion','subset-sum.multiple-representations',10,{values:[2,3,5,8],target:13},'FIND TWO REPRESENTATIONS FIRST. THEN CHOOSE THE ONE THE BOARD GEOMETRY ALLOWS.'),
 q('HALF THREE WAYS','facts','fractions.operator-equivalence',10,{facts:[['QUARTER','PLUS','QUARTER','SAME','HALF'],['QUARTER','TIMES','TWO','SAME','HALF'],['HALF','SAME','TWOQUARTERS']],blanks:[2,2,2],candidates:['QUARTER','TWO','TWOQUARTERS','THREE']},'THREE DIFFERENT SYMBOLIC STORIES MUST LAND ON THE SAME QUANTITY.'),
 q('TEN TWO ORDERS','facts','operations.precedence-symmetry',10,{facts:[['TWO','TIMES','THREE','PLUS','FOUR','SAME','TEN'],['FOUR','PLUS','TWO','TIMES','THREE','SAME','TEN']],blanks:[6,6],candidates:['TEN','TWELVE','FOURTEEN','EIGHT']},'THE TERMS MOVE, BUT THE MULTIPLICATION CHUNK MUST STILL BE EVALUATED FIRST.'),
 q('FIVE-LAMP CODE','lamps','linear-toggle.system',11,{initial:[1,0,1,0,0],toggles:[[0,1,2],[1,3],[2,4],[0,3,4],[1,2,4]],nope:false},'SOLVE THE SWITCHES AS BIT VECTORS BEFORE TOUCHING THEM. EXECUTION IS THE EASY PART.')
);
export const BANK_BY_WORLD=Object.fromEntries(BAND_META.map(b=>[b.world,PROBLEM_BANK.filter(p=>p.world===b.world)]));
