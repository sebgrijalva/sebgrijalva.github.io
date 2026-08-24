export function pairCounts(pairs){let b=0,a=0,t=0;for(const p of pairs.filter(x=>x.valid)){const d=p.pairedOutcome?.delta??0;if(d>0)b++;else if(d<0)a++;else t++;}return {favoredB:b,favoredA:a,tied:t,n:b+a+t};}
export function evidenceState(n,agreement){if(n<4)return 'NOT ENOUGH OBSERVATIONS';if(n>=8&&agreement>=0.7)return 'REPEATED OBSERVATION';return 'DIRECTION EMERGING';}
export function pairedBootstrap(values,seed=0x4a11ce,iterations=1000){
  if(!values.length)return {mean:null,lo:null,hi:null}; const mean=values.reduce((a,b)=>a+b,0)/values.length; let x=seed>>>0;
  const rnd=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}; const sims=[];
  for(let k=0;k<iterations;k++){let s=0;for(let i=0;i<values.length;i++)s+=values[Math.floor(rnd()*values.length)];sims.push(s/values.length);}sims.sort((a,b)=>a-b);
  return {mean,lo:sims[Math.floor(iterations*.025)],hi:sims[Math.floor(iterations*.975)]};
}
export function updateAtlas(atlas, expeditionId, protocolVersion, pairs, summary){
  const prev=atlas[expeditionId]; const compatible=prev&&prev.protocolVersion===protocolVersion?prev.pairs:[]; const all=[...compatible,...pairs];
  const valid=all.filter(p=>p.valid); const deltas=valid.map(p=>p.pairedOutcome.delta); const pos=deltas.filter(x=>x>0).length, neg=deltas.filter(x=>x<0).length; const agreement=valid.length?Math.max(pos,neg)/valid.length:0;
  return {...atlas,[expeditionId]:{protocolVersion,pairs:all,validPairs:valid.length,evidence:evidenceState(valid.length,agreement),uncertainty:pairedBootstrap(deltas),summary:summary(all),updatedAt:new Date().toISOString()}};
}
