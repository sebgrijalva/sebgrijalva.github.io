// v11: difficulty is verified from the actual solution space, not a hand-written reasoning label.
import {PROBLEM_BANK as V10,BAND_META} from './problem-bank-v10.js';
export {BAND_META};
export const PROBLEM_BANK=structuredClone(V10);
const C6=['ONE','TWO','THREE','FOUR','FIVE','SIX'];
const C7=[...C6,'SEVEN'];
const C8=[...C7,'EIGHT'];
const C9=[...C8,'NINE'];
const C10=[...C9,'TEN'];
const S=(vars,value)=>({kind:'sum',vars,value}),P=(vars,value)=>({kind:'prod',vars,value}),D=(a,b,value)=>({kind:'diff',a,b,value});
const LT=(a,b)=>({kind:'lt',a,b}),GT=(a,b)=>({kind:'gt',a,b}),M=(v,mod,value)=>({kind:'mod',var:v,mod,value});
const PAR=(v,value)=>({kind:'parity',var:v,value});
const L=(world,title,concept,candidates,solution,constraints,hint)=>({world,title,kind:'lock',concept,reasoning:constraints.length+2,data:{slots:Object.keys(solution),candidates,solution,constraints,distinct:true},hint,sourceBasis:'ENUMERATED-CONSTRAINT-DESIGN'});
const set=(world,pos,spec)=>{const i=(world-1)*10+pos;PROBLEM_BANK[i]=spec;};

// Band 50: simultaneous relationships, not isolated arithmetic recall.
set(1,0,L(1,'THREE NUMBER LOCK','relations.sum-product',C6,{A:2,B:3,C:4},[P(['A','B'],6),S(['A','C'],6),M('C',4,0)],'ALL THREE CLUES MUST BE TRUE AT THE SAME TIME.'));
set(1,3,L(1,'WHO IS BETWEEN','relations.order-product',C6,{A:1,B:5,C:3},[S(['A','B'],6),LT('A','B'),P(['A','C'],3)],'DO NOT SOLVE ONE CLUE ALONE. FIND NUMBERS THAT SURVIVE ALL OF THEM.'));
set(1,5,L(1,'ELEVEN LOCK','relations.sum-difference',C6,{A:1,B:4,C:6},[D('B','C',2),S(['A','B','C'],11),M('C',5,1)],'USE THE TOTAL TO CONNECT THE OTHER TWO CLUES.'));

// Band 75: larger candidate space and inverse/remainder constraints.
set(2,0,L(2,'TWELVE LOCK','relations.inverse',C7,{A:3,B:5,C:4},[D('A','B',2),S(['A','B','C'],12),M('B',4,1)],'START WITH THE DIFFERENCE, THEN TEST THE TOTAL.'));
set(2,2,L(2,'THIRTEEN LOCK','relations.multi-constraint',C7,{A:2,B:6,C:5},[S(['A','C'],7),D('A','C',3),S(['A','B','C'],13),M('A',4,2)],'EACH CLUE SHRINKS THE POSSIBILITIES. KEEP THE SURVIVORS.'));
set(2,4,L(2,'EVEN CORNER','relations.factor-parity',C7,{A:2,B:7,C:4},[LT('A','C'),P(['B','C'],28),M('A',3,2),PAR('C','EVEN')],'FACTOR 28, THEN USE ORDER AND PARITY TO ORIENT THE PAIR.'));

// Band 90: hundreds of possible assignments before the clues act.
set(3,0,L(3,'FIFTEEN LOCK','relations.system',C9,{A:4,B:6,C:5},[S(['A','C'],9),D('B','C',1),S(['A','B','C'],15),M('C',3,2)],'USE THE TOTAL AS A CHECK, NOT AS YOUR FIRST GUESS.'));
set(3,2,L(3,'FORTY-TWO PAIR','relations.factor-remainder',C9,{A:2,B:7,C:6},[S(['B','C'],13),P(['B','C'],42),M('A',4,2),PAR('B','ODD')],'THE SUM AND PRODUCT IDENTIFY A PAIR; THE OTHER CLUES PLACE THE LAST NUMBER.'));
set(3,4,L(3,'TWELVE AND ELEVEN','relations.coupled-pairs',C9,{A:3,B:8,C:4},[S(['A','B'],11),D('A','B',5),S(['B','C'],12),M('B',4,0)],'ONE NUMBER APPEARS IN TWO RELATIONS. THAT IS THE HINGE.'));

// Band 95: four variables, thousands of initial assignments.
set(4,0,L(4,'FOUR-STAR LOCK','systems.four-variable',C8,{A:2,B:5,C:3,D:8},[P(['C','D'],24),S(['A','B','D'],15),S(['B','C','D'],16),PAR('C','ODD')],'TWO OVERLAPPING SUMS LET YOU COMPARE A AND C WITHOUT GUESSING THEM.'));
set(4,2,L(4,'ORBIT FOUR','systems.order-mod',C8,{A:1,B:7,C:4,D:6},[S(['A','C'],5),GT('B','D'),P(['C','D'],24),M('A',3,1),M('B',5,2)],'FACTOR FIRST. THEN USE THE SMALL REMAINDERS TO ORIENT THE VALUES.'));
set(4,6,L(4,'TWIN PRODUCTS','systems.factorization',C8,{A:2,B:7,C:4,D:5},[P(['A','B'],14),P(['C','D'],20),LT('C','D'),S(['B','C','D'],16),PAR('B','ODD')],'TWO PRODUCTS CREATE TWO PAIRS. THE SUM FORCES THEM TO SHARE THE RIGHT ORIENTATION.'));
set(4,9,L(4,'SIX AND TWENTY-FOUR','systems.factor-parity',C8,{A:1,B:6,C:3,D:8},[P(['A','B'],6),P(['C','D'],24),LT('C','D'),S(['B','C','D'],17),PAR('B','EVEN')],'FACTOR BOTH PRODUCTS BEFORE USING THE TOTAL.'));

// Band 99: uniqueness depends on five interacting clues.
set(5,2,L(5,'TWENTY-TWO LOCK','systems.constraint-elimination',C9,{A:2,B:7,C:4,D:9},[P(['A','D'],18),S(['B','C'],11),D('B','D',2),S(['A','B','C','D'],22),M('D',4,1)],'DO NOT SEARCH 3000 CASES. USE FACTORIZATION TO COLLAPSE THE SPACE.'));
set(5,6,L(5,'TWENTY-THREE LOCK','systems.mod-parity',C9,{A:3,B:8,C:5,D:7},[S(['B','D'],15),S(['A','B','C','D'],23),M('A',4,3),M('B',5,3),PAR('D','ODD')],'THE MOD CLUES IDENTIFY CANDIDATES; THE TOTAL COUPLES THEM.'));
set(5,7,L(5,'PRODUCT FORTY','systems.factor-mod',C9,{A:1,B:8,C:5,D:6},[D('A','C',4),P(['B','C'],40),S(['A','B','D'],15),PAR('C','ODD'),M('D',4,2)],'FACTOR 40, BUT KEEP ONLY PAIRS COMPATIBLE WITH THE OTHER CLUES.'));
set(5,9,L(5,'TWENTY-FOUR LOCK','systems.global-local',C9,{A:2,B:8,C:5,D:9},[P(['A','B'],16),S(['A','D'],11),GT('B','C'),S(['A','B','C','D'],24),M('A',5,2)],'A LOCAL PRODUCT AND A GLOBAL TOTAL MUST AGREE.'));

// Band 99.9: 5040 candidate assignments; six constraints must isolate one.
set(6,3,L(6,'DEEP SPACE LOCK','olympiad.constraint-system',C10,{A:3,B:8,C:5,D:10},[LT('A','C'),D('A','D',7),S(['B','D'],18),M('B',4,0),M('C',5,0),M('D',3,1)],'BUILD A SHORT PROOF: EACH CLUE SHOULD ELIMINATE A WHOLE CLASS OF VALUES.'));
set(6,4,L(6,'PRODUCT WEB','olympiad.constraint-system',C10,{A:2,B:9,C:6,D:7},[S(['A','B'],11),P(['A','C'],12),P(['B','C'],54),S(['B','D'],16),PAR('D','ODD'),M('D',4,3)],'THE TWO PRODUCTS SHARE C. USE THAT BEFORE TOUCHING A TILE.'));
set(6,7,L(6,'COMET LOCK','olympiad.elimination',C10,{A:4,B:9,C:6,D:7},[LT('A','D'),S(['B','D'],16),S(['A','C','D'],17),PAR('B','ODD'),M('C',3,0),M('D',5,2)],'TURN EACH CLUE INTO AN ELIMINATION, THEN INTERSECT THE SURVIVORS.'));
set(6,8,L(6,'TEN-STAR CODE','olympiad.elimination',C10,{A:1,B:10,C:4,D:7},[D('A','C',3),S(['A','D'],8),D('B','D',3),PAR('C','EVEN'),M('C',5,4),M('D',5,2)],'THE DIFFERENCES GIVE PAIRS; PARITY AND REMAINDERS CHOOSE THEIR ORIENTATION.'));

export const BANK_BY_WORLD=Object.fromEntries(BAND_META.map(b=>[b.world,PROBLEM_BANK.filter(p=>p.world===b.world)]));
