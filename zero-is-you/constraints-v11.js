const WORDS=['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN','TWENTY'];
const VALUE=Object.fromEntries(WORDS.map((w,i)=>[w,i]));
export const tokenValue=t=>VALUE[t]??null;
export const valueToken=n=>WORDS[n]??String(n);

export function constraintHolds(c,a){
  const v=x=>a[x];
  if(c.kind==='sum')return c.vars.reduce((s,x)=>s+v(x),0)===c.value;
  if(c.kind==='prod')return c.vars.reduce((s,x)=>s*v(x),1)===c.value;
  if(c.kind==='diff')return Math.abs(v(c.a)-v(c.b))===c.value;
  if(c.kind==='lt')return v(c.a)<v(c.b);
  if(c.kind==='gt')return v(c.a)>v(c.b);
  if(c.kind==='mod')return ((v(c.var)%c.mod)+c.mod)%c.mod===c.value;
  if(c.kind==='parity')return Math.abs(v(c.var)%2)===(c.value==='EVEN'?0:1);
  return false;
}

export function constraintText(c){
  if(c.kind==='sum')return `${c.vars.join(' + ')} = ${c.value}`;
  if(c.kind==='prod')return `${c.vars.join(' X ')} = ${c.value}`;
  if(c.kind==='diff')return `DIFF ${c.a} ${c.b} = ${c.value}`;
  if(c.kind==='lt')return `${c.a} < ${c.b}`;
  if(c.kind==='gt')return `${c.a} > ${c.b}`;
  if(c.kind==='mod')return `${c.var} MOD ${c.mod} = ${c.value}`;
  if(c.kind==='parity')return `${c.var} IS ${c.value}`;
  return '?';
}

function permutations(xs,k,prefix=[],out=[]){
  if(prefix.length===k){out.push(prefix.slice());return out;}
  for(let i=0;i<xs.length;i++)permutations([...xs.slice(0,i),...xs.slice(i+1)],k,[...prefix,xs[i]],out);
  return out;
}

export function enumerateLockSolutions(data,limit=20000){
  const slots=data.slots||[],candidateValues=(data.candidates||[]).map(tokenValue);
  if(candidateValues.some(v=>v===null))throw new Error('unknown lock candidate');
  const tuples=data.distinct===false
    ? (()=>{const o=[];const rec=p=>{if(p.length===slots.length){o.push(p);return;}for(const x of candidateValues)rec([...p,x]);};rec([]);return o;})()
    : permutations(candidateValues,slots.length);
  if(tuples.length>limit)throw new Error(`lock search space ${tuples.length} exceeds ${limit}`);
  return tuples.map(t=>Object.fromEntries(slots.map((s,i)=>[s,t[i]]))).filter(a=>(data.constraints||[]).every(c=>constraintHolds(c,a)));
}

export function lockComplexity(data){
  const slots=data.slots||[],candidateValues=(data.candidates||[]).map(tokenValue);
  const n=candidateValues.length,k=slots.length;
  let initial=1;for(let i=0;i<k;i++)initial*=data.distinct===false?n:(n-i);
  let survivors=initial,informative=0;
  const trace=[];
  for(let i=0;i<(data.constraints||[]).length;i++){
    const partial={...data,constraints:data.constraints.slice(0,i+1)};
    const next=enumerateLockSolutions(partial).length;
    if(next<survivors)informative++;
    trace.push(next);survivors=next;
  }
  return {initial,final:survivors,informative,trace,bits:Math.log2(Math.max(1,initial))};
}

export function stateAssignment(state,level){
  const out={};for(const slot of level.goal?.slots||[]){const t=state.socketValues?.[slot];const n=tokenValue(t);if(n===null)return null;out[slot]=n;}return out;
}

export function lockSolved(state,level){
  if(level.goal?.type!=='constraintSockets')return false;
  const a=stateAssignment(state,level);if(!a)return false;
  if(level.goal.distinct!==false&&new Set(Object.values(a)).size!==Object.keys(a).length)return false;
  return (level.goal.constraints||[]).every(c=>constraintHolds(c,a));
}
