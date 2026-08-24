import {protocol as focus} from './protocols/focus.js';
import {protocol as structure} from './protocols/structure.js';
import {protocol as breath} from './protocols/breath.js';
import {protocol as noise} from './protocols/noise.js';
import {seedFrom} from './state.js';
export const PROTOCOLS={focus,structure,breath,noise};
export function generatePair(explorationId,args){return PROTOCOLS[explorationId].generatePair(args);}
export function scoreTrial(spec,response){return PROTOCOLS[spec.explorationId].score(spec,response);}
export function classifyError(spec,response){return PROTOCOLS[spec.explorationId].classifyError(spec,response);}
export function resumeDecision(active){if(!active)return 'none';const p=PROTOCOLS[active.explorationId];return p&&p.id===active.protocolVersion?'resume':'restart';}
export function pairPurity(pair){
  const a=pair.trials[pair.order[0]],b=pair.trials[pair.order[1]],errors=[];for(const k of ['gridSize','memoryLoad','responseMode'])if(a[k]!==b[k])errors.push(`unmatched ${k}`);
  if(a.condition===b.condition)errors.push('conditions identical');return {ok:!errors.length,errors};
}
export function runGeneratorAudit(iterations=10000){
  const report={iterations,protocols:{},ok:true};for(const [id,p] of Object.entries(PROTOCOLS)){let failures=0;const examples=[];for(let i=0;i<iterations;i++){try{const args={pairSeed:seedFrom(id,i),calibratedLoad:3+(i%3),counterbalanceState:i};const x=p.generatePair(args),y=p.generatePair(args);if(JSON.stringify(x)!==JSON.stringify(y))throw new Error('non-deterministic');const purity=pairPurity(x);if(!purity.ok)throw new Error(purity.errors.join(','));for(const t of Object.values(x.trials)){if(t.target){const targets=Array.isArray(t.target)?t.target:[t.target];for(const cell of targets){if(cell&&typeof cell.r==='number'&&(cell.r<0||cell.r>=t.gridSize||cell.c<0||cell.c>=t.gridSize))throw new Error('out of bounds');}}}if(id==='noise'&&x.trials.noise.interferenceParameters.count!==2)throw new Error('noise count');if(id==='focus'&&x.trials.focus.retroCue==='neutral')throw new Error('focus cue');if(id==='breath'&&x.trials.breath.presentationTiming.pauseExtraMs<=0)throw new Error('breath pause');if(id==='structure'&&x.trials.structured.grammar!=='translation')throw new Error('structure grammar');}catch(e){failures++;if(examples.length<3)examples.push(String(e.message||e));}}
    report.protocols[id]={failures,examples};if(failures)report.ok=false;}return report;
}
export function runCounterbalanceAudit(iterations=100){const out={ok:true,protocols:{}};for(const id of Object.keys(PROTOCOLS)){const first={};for(let i=0;i<iterations;i++){const p=generatePair(id,{pairSeed:i+1,calibratedLoad:4,counterbalanceState:i});first[p.order[0]]=(first[p.order[0]]||0)+1;}const vals=Object.values(first);const ok=vals.length===2&&Math.abs(vals[0]-vals[1])<=1;out.protocols[id]={first,ok};if(!ok)out.ok=false;}return out;}
export function runPairPurityAudit(iterations=1000){const out={ok:true,failures:[]};for(const id of Object.keys(PROTOCOLS))for(let i=0;i<iterations;i++){const p=generatePair(id,{pairSeed:seedFrom(id,'purity',i),calibratedLoad:4,counterbalanceState:i}),r=pairPurity(p);if(!r.ok){out.ok=false;if(out.failures.length<10)out.failures.push({id,i,errors:r.errors});}}return out;}

export function runSimulationAudit(){
  const report={ok:true,protocols:{}};
  for(const [id,p] of Object.entries(PROTOCOLS)){
    const pairs=[];
    for(let i=0;i<6;i++){
      const pair=generatePair(id,{pairSeed:seedFrom(id,'sim',i),calibratedLoad:4,counterbalanceState:i});
      const records=[];
      for(const condition of pair.order){
        const spec=pair.trials[condition];
        let response;
        if(id==='focus') response={...spec.target};
        else if(id==='noise') response={locations:spec.target.map(x=>({...x})),interference:(spec.interferenceParameters?.arrows||[]).map(answer=>({answer,side:answer,correct:true,rtMs:250}))};
        else response=spec.target.map(x=>({...x}));
        const scored=p.score(spec,response);
        if(!scored.correct) report.ok=false;
        if(id==='noise'&&spec.condition==='noise'&&!scored.interferenceValid) report.ok=false;
        records.push({condition:spec.condition,correct:scored.correct});
      }
      pairs.push(p.pairOutcome(records));
    }
    report.protocols[id]={pairs:pairs.length,allIdealCorrect:pairs.every(x=>x.delta===0)};
    if(!report.protocols[id].allIdealCorrect)report.ok=false;
  }
  return report;
}
