// ZERO IS YOU v9 problem bank.
// The percentile-like labels are challenge bands, NOT psychometric norms.
// Problems are original game adaptations. The conceptual taxonomy is informed by
// IM K-12 Math 1st ed. (CC BY 4.0) and diversity patterns from OpenMathInstruct-2
// (CC BY 4.0); no external problem text is copied verbatim here.

export const BAND_META=[
  {world:1,label:'50',name:'FOUNDATION ORBIT',short:'50',subtitle:'REPRESENT · DECOMPOSE · MOVE',accent:'sand'},
  {world:2,label:'75',name:'STRUCTURE FARM',short:'75',subtitle:'INVERSE · FAMILIES · ARRAYS',accent:'mint'},
  {world:3,label:'90',name:'PATTERN BAY',short:'90',subtitle:'FUNCTIONS · MOD · REPRESENT',accent:'ice'},
  {world:4,label:'95',name:'RELATION MARSH',short:'95',subtitle:'MULTI-STEP · EQUIVALENCE · STRATEGY',accent:'violet'},
  {world:5,label:'99',name:'PROOF PEAKS',short:'99',subtitle:'INVARIANTS · EULER · NUMBER THEORY',accent:'rust'},
  {world:6,label:'99.9',name:'OLYMPIAD ISLES',short:'99.9',subtitle:'PROOF · STRATEGY · HIDDEN STRUCTURE',accent:'red'},
];

const S='IM1E+OMI2';
const p=(world,title,kind,concept,reasoning,data,hint)=>({world,title,kind,concept,reasoning,data,hint,sourceBasis:S});

export const PROBLEM_BANK=[
  // 50 band: still puzzle-first. Nothing here should be solvable by tapping a flashcard.
  p(1,'MISSING PART','statement','part-whole.missing-addend',2,{tokens:['EIGHT','PLUS','FIVE','SAME','THIRTEEN'],blank:2,candidates:['FOUR','FIVE','SIX','SEVEN']},'THINK OF THIRTEEN AS EIGHT AND A HIDDEN PART.'),
  p(1,'FIVE TWO WAYS','fusion','decomposition.subset',3,{values:[2,3,4],target:5},'CHOOSE THE PARTS THAT MAKE FIVE. ONE CLUMP IS BAIT.'),
  p(1,'THREE SURVIVE','count','cardinality.conservation',3,{initial:5,target:3},'REMOVE EXACTLY TWO WITHOUT LOSING TRACK OF THE WHOLE.'),
  p(1,'NEAR DOUBLE','statement','addition.near-double',3,{tokens:['SIX','PLUS','SEVEN','SAME','THIRTEEN'],blank:2,candidates:['FIVE','SEVEN','EIGHT','NINE']},'DOUBLE SIX, THEN ADJUST BY ONE.'),
  p(1,'RECTANGLE SIX','array','multiplication.array',3,{count:6,cols:3,rows:2},'MAKE THE RECTANGLE COMPLETE, NOT JUST THE COUNT.'),
  p(1,'FAMILY OF SEVEN','facts','inverse.fact-family',3,{facts:[['THREE','PLUS','FOUR','SAME','SEVEN'],['SEVEN','MINUS','THREE','SAME','FOUR']],blanks:[0,2],candidates:['THREE','FOUR','FIVE','SIX']},'ONE WHOLE-PART RELATION CAN BE READ IN TWO DIRECTIONS.'),
  p(1,'PLUS TWO BOX','machine','functions.induction',3,{samples:[[1,3],[4,6],[7,9]],op:'PLUS',n:2},'FIND ONE RULE THAT EXPLAINS EVERY INPUT-OUTPUT PAIR.'),
  p(1,'FIVE IN BITS','binary','binary.place-value',3,{target:5},'BUILD FIVE FROM POWERS OF TWO.'),
  p(1,'THIRTY PLACE','place','place-value.position',3,{target:30,candidates:['THREE','ZERO','ONE','TWO']},'THE SAME DIGIT MEANS SOMETHING DIFFERENT WHEN ITS PLACE CHANGES.'),
  p(1,'MAKE TEN','fusion','make-ten.subset',3,{values:[1,4,6,8],target:10},'TEN IS HIDING IN A PAIR. DO NOT MERGE THE DECOYS.'),

  // 75 band
  p(2,'REWIND TWELVE','statement','inverse.operations',3,{tokens:['TWELVE','MINUS','FIVE','SAME','SEVEN'],blank:2,candidates:['FOUR','FIVE','SIX','EIGHT']},'USE THE ADDITION FACT BACKWARDS.'),
  p(2,'TEN FROM FOUR','fusion','subset-sum.selection',4,{values:[3,4,5,7],target:10},'MORE THAN ONE NUMBER LOOKS USEFUL. ONLY THE RIGHT SUBSET SURVIVES.'),
  p(2,'TWELVE FAMILY','facts','fact-family.inverse',4,{facts:[['SEVEN','PLUS','FIVE','SAME','TWELVE'],['TWELVE','MINUS','FIVE','SAME','SEVEN']],blanks:[2,2],candidates:['FOUR','FIVE','SEVEN','SIX']},'AUTHOR BOTH DIRECTIONS OF THE SAME RELATION.'),
  p(2,'ARRAY EIGHT','array','multiplication.array',4,{count:8,cols:4,rows:2},'USE ROWS AND COLUMNS AS STRUCTURE.'),
  p(2,'DOUBLE MACHINE','machine','functions.induction',4,{samples:[[2,4],[3,6],[5,10]],op:'TIMES',n:2},'ADDITION CAN MIMIC A SAMPLE. THE RULE MUST FIT ALL THREE.'),
  p(2,'TEN IN BITS','binary','binary.place-value',4,{target:10},'TEN IS EIGHT PLUS TWO, BUT THE BOARD WILL NOT SAY THAT FOR YOU.'),
  p(2,'THREE BY FOUR','statement','multiplication.structure',4,{tokens:['THREE','TIMES','FOUR','SAME','TWELVE'],blank:2,candidates:['TWO','FOUR','FIVE','SIX']},'SEE TWELVE AS AN ARRAY.'),
  p(2,'FOUR SURVIVE','count','subtraction.as-removal',4,{initial:7,target:4},'PLAN ALL THREE REMOVALS BEFORE YOU COMMIT.'),
  p(2,'HALF FROM PARTS','facts','fractions.equivalence',4,{facts:[['QUARTER','PLUS','QUARTER','SAME','HALF']],blanks:[2],candidates:['QUARTER','HALF','TWO','THREE']},'TWO EQUAL QUARTERS FORM ONE HALF.'),
  p(2,'LIGHT ALL FOUR','lamps','linear-toggle.system',4,{initial:[0,0,0,0],toggles:[[0,1],[1,2],[2,3],[0,3]],nope:false},'EACH LEVER CHANGES TWO LAMPS. THINK AHEAD IN STATES.'),

  // 90 band
  p(3,'FOURTEEN SET','fusion','subset-sum.selection',4,{values:[2,5,7,9],target:14},'SEARCH COMBINATIONS, NOT THE NEAREST CLUMPS.'),
  p(3,'TURN THE ARRAY','facts','multiplication.commutative',4,{facts:[['THREE','TIMES','FOUR','SAME','TWELVE'],['FOUR','TIMES','THREE','SAME','TWELVE']],blanks:[0,2],candidates:['THREE','FOUR','FIVE','SIX']},'ROTATION CHANGES THE DESCRIPTION, NOT THE PRODUCT.'),
  p(3,'PLUS THREE BOX','machine','functions.induction',4,{samples:[[1,4],[5,8],[9,12]],op:'PLUS',n:3},'ONE RULE MUST EXPLAIN ALL THREE CASES.'),
  p(3,'THIRTEEN BITS','binary','binary.place-value',5,{target:13},'DECOMPOSE THIRTEEN INTO DISTINCT POWERS OF TWO.'),
  p(3,'THE REMAINDER','statement','modular.remainder',5,{tokens:['ELEVEN','MOD','THREE','SAME','TWO'],blank:4,candidates:['ONE','TWO','THREE','FOUR']},'GROUP ELEVEN IN THREES. WHAT CANNOT JOIN A FULL GROUP?'),
  p(3,'ARRAY TWELVE','array','multiplication.factorization',5,{count:12,cols:4,rows:3},'COMPLETE A FACTORIZATION, NOT A LINE OF OBJECTS.'),
  p(3,'FRACTION BRIDGE','facts','fractions.equivalence',5,{facts:[['HALF','SAME','TWOQUARTERS'],['QUARTER','PLUS','QUARTER','SAME','HALF']],blanks:[2,2],candidates:['TWOQUARTERS','HALF','QUARTER','TWO']},'THE SAME QUANTITY CAN WEAR DIFFERENT NAMES.'),
  p(3,'EULER SQUARE','graph','graph.euler-trail',5,{shape:'square-tail',nope:false},'USE EVERY EDGE EXACTLY ONCE. VERTEX DEGREE MATTERS.'),
  p(3,'FORTY PLACE','place','place-value.position',5,{target:40,candidates:['FOUR','ZERO','ONE','FIVE']},'BUILD FORTY USING PLACE, NOT FOUR PLUS ZERO.'),
  p(3,'TAKE THE LAST','heap','games.backward-induction',5,{heap:9,turtleTake:1,takes:[1,2,3]},'WORK BACKWARD FROM THE LAST SAFE TOTAL.'),

  // 95 band
  p(4,'THREE PARTS','facts','addition.associative',5,{facts:[['TWO','PLUS','THREE','PLUS','FOUR','SAME','NINE']],blanks:[4],candidates:['THREE','FOUR','FIVE','SIX']},'GROUP THE FIRST TWO PARTS, THEN COMPLETE THE WHOLE.'),
  p(4,'SIXTEEN SET','fusion','subset-sum.multiple-paths',5,{values:[3,5,8,11],target:16},'THERE MAY BE MORE THAN ONE REPRESENTATION. FIND A CLEAN ONE.'),
  p(4,'TRIPLE BOX','machine','functions.induction',5,{samples:[[2,6],[4,12],[5,15]],op:'TIMES',n:3},'DISTINGUISH REPEATED ADDITION FROM AN ADDITIVE OFFSET.'),
  p(4,'ELEVEN BITS','binary','binary.place-value',5,{target:11},'BUILD ELEVEN WITHOUT A TEN SWITCH.'),
  p(4,'IMPOSSIBLE LIGHT','lamps','parity.invariant',6,{initial:[0,0,0],toggles:[[0,1],[1,2],[0,2]],nope:true,reasons:['EVERY MOVE FLIPS TWO LAMPS','THREE IS PRIME','THE SWITCHES ARE TOO FAR APART'],correct:0},'IF EVERY MOVE PRESERVES A PARITY CLASS, TRY TO PROVE NO.'),
  p(4,'BRANCH TRAIL','graph','graph.euler-trail',6,{shape:'branch',nope:false},'AN EULER TRAIL CAN START AND END AT THE TWO ODD VERTICES.'),
  p(4,'DISTRIBUTE','facts','distributive.structure',6,{facts:[['THREE','TIMES','FOUR','PLUS','THREE','TIMES','TWO','SAME','EIGHTEEN']],blanks:[8],candidates:['SIXTEEN','EIGHTEEN','TWENTY','FOURTEEN']},'TWO RECTANGLES SHARE A HEIGHT. ADD THEIR AREAS.'),
  p(4,'SEVENTEEN PRIME','statement','number-theory.prime',6,{tokens:['SEVENTEEN','IS','PRIME'],blank:2,candidates:['EVEN','ODD','PRIME']},'TEST POSSIBLE FACTORS ONLY UP TO THE SQUARE ROOT.'),
  p(4,'HEAP ELEVEN','heap','games.backward-induction',6,{heap:11,turtleTake:1,takes:[1,2,3]},'IDENTIFY THE LOSING TOTALS FIRST.'),
  p(4,'TWO NAMES HALF','facts','fractions.equivalence',6,{facts:[['HALF','SAME','TWOQUARTERS'],['QUARTER','PLUS','QUARTER','SAME','HALF']],blanks:[0,4],candidates:['HALF','TWOQUARTERS','QUARTER','TWO']},'MAKE TWO TRUE STATEMENTS ABOUT THE SAME QUANTITY.'),

  // 99 band
  p(5,'NO EULER','graph','graph.euler-impossibility',7,{shape:'four-odd',nope:true,reasons:['FOUR VERTICES HAVE ODD DEGREE','THERE ARE TOO MANY EDGES','THE GRAPH HAS A SQUARE'],correct:0},'COUNT ODD-DEGREE VERTICES BEFORE YOU WALK.'),
  p(5,'PARITY CAGE','lamps','linear-invariant',7,{initial:[0,0,0,0],toggles:[[0,1],[1,2],[2,3],[3,0],[0,2]],nope:true,reasons:['THE REACHABLE STATES MISS ALL-ON','FOUR IS COMPOSITE','A CORNER IS TOO FAR'],correct:0},'TREAT EACH LEVER AS A BIT VECTOR. WHICH STATES ARE REACHABLE?'),
  p(5,'ORDER MATTERS','facts','operations.precedence',7,{facts:[['TWO','PLUS','THREE','TIMES','FOUR','SAME','FOURTEEN']],blanks:[6],candidates:['FOURTEEN','TWENTY','TWELVE','EIGHTEEN']},'MULTIPLICATION FORMS ITS CHUNK BEFORE ADDITION.'),
  p(5,'THIRTEEN SET','fusion','subset-sum.proof',7,{values:[2,4,7,9],target:13},'PROVE WHICH SUBSET WORKS BEFORE MOVING ANYTHING.'),
  p(5,'EULER FORK','graph','graph.euler-trail',7,{shape:'fork-loop',nope:false},'PLAN THE BRANCHES SO YOU DO NOT MAROON AN UNUSED EDGE.'),
  p(5,'HEAP FIFTEEN','heap','games.strategy',7,{heap:15,turtleTake:1,takes:[1,2,3]},'FIND A MODULAR PATTERN IN THE LOSING POSITIONS.'),
  p(5,'TWELVE TWICE','facts','multiple-representations',7,{facts:[['TWO','TIMES','SIX','SAME','TWELVE'],['THREE','TIMES','FOUR','SAME','TWELVE']],blanks:[2,2],candidates:['SIX','FOUR','FIVE','THREE']},'SAME OUTPUT, DIFFERENT FACTORIZATION.'),
  p(5,'NINETEEN PRIME','statement','number-theory.prime',7,{tokens:['NINETEEN','IS','PRIME'],blank:2,candidates:['EVEN','ODD','PRIME']},'ELIMINATE FACTORS SYSTEMATICALLY, NOT BY MEMORY.'),
  p(5,'FOUR-LAMP CODE','lamps','linear-toggle.system',7,{initial:[0,1,0,1],toggles:[[0,1],[1,3],[0,2],[2,3]],nope:false},'SOLVE THE TOGGLE SYSTEM, THEN EXECUTE IT.'),
  p(5,'INVERSE CHAIN','facts','inverse.composition',7,{facts:[['EIGHTEEN','MINUS','SEVEN','SAME','ELEVEN'],['ELEVEN','PLUS','SEVEN','SAME','EIGHTEEN']],blanks:[2,2],candidates:['SEVEN','SIX','EIGHT','NINE']},'THE OUTPUT OF ONE RELATION IS THE INPUT OF ITS INVERSE.'),

  // 99.9 band: child-readable olympiad flavor, not larger arithmetic.
  p(6,'SIX ODD NODES','graph','graph.euler-impossibility',8,{shape:'six-odd',nope:true,reasons:['SIX VERTICES HAVE ODD DEGREE','THE GRAPH IS TOO LARGE','A TRIANGLE APPEARS'],correct:0},'AN EULER TRAIL ALLOWS ZERO OR TWO ODD VERTICES, NEVER SIX.'),
  p(6,'DOUBLE LOOP','graph','graph.euler-trail',8,{shape:'double-loop',nope:false},'DECIDE WHICH LOOP TO CLOSE FIRST SO THE BRIDGE REMAINS USABLE.'),
  p(6,'FIVE LAMP WALL','lamps','linear-invariant',8,{initial:[0,0,0,0,0],toggles:[[0,1],[1,2],[2,3],[3,4],[4,0]],nope:true,reasons:['THE TARGET IS OUTSIDE THE TOGGLE SPAN','FIVE IS ODD','THE LEVERS FORM A CYCLE'],correct:0},'THINK OF TOGGLES AS ADDITION MODULO TWO.'),
  p(6,'PRECEDENCE CHAIN','facts','operations.precedence',8,{facts:[['TWO','PLUS','THREE','TIMES','FOUR','SAME','FOURTEEN'],['FOURTEEN','MINUS','TWO','SAME','TWELVE']],blanks:[6,2],candidates:['FOURTEEN','TWELVE','TWENTY','TEN']},'THE FIRST TRUE FACT CREATES THE NUMBER NEEDED BY THE SECOND.'),
  p(6,'TWO RECTANGLES','facts','distributive.equivalence',9,{facts:[['THREE','TIMES','FOUR','PLUS','THREE','TIMES','TWO','SAME','EIGHTEEN'],['THREE','TIMES','SIX','SAME','EIGHTEEN']],blanks:[8,2],candidates:['EIGHTEEN','SIX','FOUR','TWELVE']},'SHOW THAT SPLITTING A RECTANGLE DOES NOT CHANGE ITS AREA.'),
  p(6,'HEAP SEVENTEEN','heap','games.modular-strategy',9,{heap:17,turtleTake:2,takes:[1,2,3]},'THE OPPONENT REMOVES TWO. FIND THE RESIDUE CLASS YOU WANT TO RETURN TO.'),
  p(6,'THIRTEEN TWICE','fusion','subset-sum.multiple-representations',9,{values:[2,3,5,8],target:13},'THERE ARE TWO STRUCTURAL WAYS TO SEE THIRTEEN. CHOOSE ONE WITHOUT TRAPPING THE BOARD.'),
  p(6,'HALF MACHINE','facts','fractions.operator-equivalence',9,{facts:[['QUARTER','PLUS','QUARTER','SAME','HALF'],['QUARTER','TIMES','TWO','SAME','HALF']],blanks:[2,2],candidates:['QUARTER','TWO','HALF','THREE']},'ADDITION AND SCALING CAN DESCRIBE THE SAME QUANTITY.'),
  p(6,'TEN TWO WAYS','facts','operations.precedence',9,{facts:[['TWO','TIMES','THREE','PLUS','FOUR','SAME','TEN'],['FOUR','PLUS','TWO','TIMES','THREE','SAME','TEN']],blanks:[6,6],candidates:['TEN','TWELVE','FOURTEEN','EIGHT']},'SAME TERMS, DIFFERENT ORDER. PRECEDENCE KEEPS THE VALUE.'),
  p(6,'FIVE-LAMP CODE','lamps','linear-toggle.system',9,{initial:[1,0,1,0,0],toggles:[[0,1,2],[1,3],[2,4],[0,3,4],[1,2,4]],nope:false},'SOLVE A SMALL LINEAR SYSTEM OVER BITS, THEN WALK THE SOLUTION.'),
];

export const BANK_BY_WORLD=Object.fromEntries(BAND_META.map(b=>[b.world,PROBLEM_BANK.filter(p=>p.world===b.world)]));
