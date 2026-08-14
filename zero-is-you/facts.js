const INTEGER_WORDS = [
  'ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN',
  'ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN','TWENTY',
  'TWENTYONE','TWENTYTWO','TWENTYTHREE','TWENTYFOUR','TWENTYFIVE','TWENTYSIX','TWENTYSEVEN','TWENTYEIGHT','TWENTYNINE','THIRTY',
  'THIRTYONE','THIRTYTWO','THIRTYTHREE','THIRTYFOUR','THIRTYFIVE','THIRTYSIX','THIRTYSEVEN','THIRTYEIGHT','THIRTYNINE','FORTY',
  'FORTYONE','FORTYTWO','FORTYTHREE','FORTYFOUR','FORTYFIVE','FORTYSIX','FORTYSEVEN','FORTYEIGHT','FORTYNINE','FIFTY'
];
const WORD_INT = Object.fromEntries(INTEGER_WORDS.map((w,i)=>[w,BigInt(i)]));

function abs(n){return n<0n?-n:n;}
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a||1n;}
export function rational(n,d=1n){
  n=BigInt(n);d=BigInt(d);if(d===0n)throw new Error('division by zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {numerator:n/g,denominator:d/g};
}
export function rAdd(a,b){return rational(a.numerator*b.denominator+b.numerator*a.denominator,a.denominator*b.denominator);}
export function rSub(a,b){return rational(a.numerator*b.denominator-b.numerator*a.denominator,a.denominator*b.denominator);}
export function rMul(a,b){return rational(a.numerator*b.numerator,a.denominator*b.denominator);}
export function rDiv(a,b){if(b.numerator===0n)throw new Error('division by zero');return rational(a.numerator*b.denominator,a.denominator*b.numerator);}
export function rEq(a,b){return a.numerator===b.numerator&&a.denominator===b.denominator;}
export function rationalText(r){return r.denominator===1n?String(r.numerator):`${r.numerator}/${r.denominator}`;}

function valueToken(tok){
  if(tok in WORD_INT)return {kind:'value',value:rational(WORD_INT[tok]),source:tok};
  if(tok==='HALF')return {kind:'value',value:rational(1n,2n),source:tok};
  if(tok==='QUARTER')return {kind:'value',value:rational(1n,4n),source:tok};
  if(tok==='TWOQUARTERS')return {kind:'value',value:rational(2n,4n),source:tok};
  if(tok?.startsWith('ANTI-')&&tok.slice(5) in WORD_INT)return {kind:'value',value:rational(-WORD_INT[tok.slice(5)]),source:tok};
  return null;
}
const PRECEDENCE={PLUS:1,MINUS:1,TIMES:2,'DIVIDED-BY':2};
const KIND={PLUS:'add',MINUS:'sub',TIMES:'mul','DIVIDED-BY':'div'};

export function parseExpr(tokens){
  if(!Array.isArray(tokens)||!tokens.length)return null;
  const values=[],ops=[];
  const apply=()=>{const op=ops.pop(),right=values.pop(),left=values.pop();if(!left||!right)return false;values.push({kind:KIND[op],left,right});return true;};
  for(let i=0;i<tokens.length;i++){
    const t=tokens[i];
    if(i%2===0){const v=valueToken(t);if(!v)return null;values.push(v);}
    else{if(!(t in PRECEDENCE))return null;while(ops.length&&PRECEDENCE[ops.at(-1)]>=PRECEDENCE[t])if(!apply())return null;ops.push(t);}
  }
  if(values.length!==ops.length+1)return null;while(ops.length)if(!apply())return null;return values.length===1?values[0]:null;
}
export function evaluateExpr(expr){
  if(!expr)return null;if(expr.kind==='value')return expr.value;const a=evaluateExpr(expr.left),b=evaluateExpr(expr.right);if(!a||!b)return null;
  if(expr.kind==='add')return rAdd(a,b);if(expr.kind==='sub')return rSub(a,b);if(expr.kind==='mul')return rMul(a,b);if(expr.kind==='div'){try{return rDiv(a,b)}catch{return null}}return null;
}
export function serializeExpr(expr){
  if(expr.kind==='value')return rationalText(expr.value);const op={add:'+',sub:'-',mul:'*',div:'/'}[expr.kind];return `(${serializeExpr(expr.left)}${op}${serializeExpr(expr.right)})`;
}
function displayExpr(expr){
  if(expr.kind==='value')return rationalText(expr.value);const op={add:'+',sub:'-',mul:'×',div:'÷'}[expr.kind];return `${displayExpr(expr.left)}${op}${displayExpr(expr.right)}`;
}
function simpleValue(expr){return expr?.kind==='value'?expr.value:null;}
function familyKey(left,right){
  // Addition/subtraction fact-family recognition is structural, not magical inference.
  if(left?.kind==='add'){
    const a=simpleValue(left.left),b=simpleValue(left.right),c=simpleValue(right);if(a&&b&&c&&rEq(rAdd(a,b),c)){
      const xs=[a,b].map(rationalText).sort((x,y)=>Number(x)-Number(y));return `add:${xs[0]},${xs[1]},${rationalText(c)}`;
    }
  }
  if(left?.kind==='sub'){
    const whole=simpleValue(left.left),part=simpleValue(left.right),rest=simpleValue(right);if(whole&&part&&rest&&rEq(rSub(whole,part),rest)){
      const xs=[part,rest].map(rationalText).sort((x,y)=>Number(x)-Number(y));return `add:${xs[0]},${xs[1]},${rationalText(whole)}`;
    }
  }
  if(left?.kind==='mul'){
    const a=simpleValue(left.left),b=simpleValue(left.right),c=simpleValue(right);if(a&&b&&c&&rEq(rMul(a,b),c)){
      const xs=[a,b].map(rationalText).sort((x,y)=>Number(x)-Number(y));return `mul:${xs[0]},${xs[1]},${rationalText(c)}`;
    }
  }
  return `eq:${serializeExpr(left)}=${serializeExpr(right)}`;
}
export function parseFactTokens(tokens){
  const same=tokens.indexOf('SAME');if(same<=0||same!==tokens.lastIndexOf('SAME')||same>=tokens.length-1)return null;
  const left=parseExpr(tokens.slice(0,same)),right=parseExpr(tokens.slice(same+1));if(!left||!right)return null;
  const lv=evaluateExpr(left),rv=evaluateExpr(right);if(!lv||!rv)return null;
  const truth=rEq(lv,rv),key=`${serializeExpr(left)}=${serializeExpr(right)}`;
  return {tokens:[...tokens],left,right,leftValue:lv,rightValue:rv,truth,key,familyKey:familyKey(left,right),display:`${displayExpr(left)} = ${displayExpr(right)}`};
}
export function displayFactKey(key){return key.replaceAll('(','').replaceAll(')','').replaceAll('*','X');}
