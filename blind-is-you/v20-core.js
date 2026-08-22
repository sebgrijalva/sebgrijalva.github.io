(function(){
'use strict';

var BUILD='2.0-core1';
var STORAGE_STATE='biy_v20_core_state';
var STORAGE_ATTEMPTS='biy_v20_core_attempts';
var SESSION_TRIALS=18;
var FORMS=['trace','shift','echo'];
var FORM_NAMES={trace:'TRACE',shift:'SHIFT',echo:'ECHO'};
var FORM_SUB={trace:'serial spatial maintenance',shift:'object-location updating',echo:'maintenance under interference'};
var root=null,activeSession=null,blockedClickUntil=0;

function qs(s,r){return (r||document).querySelector(s)}
function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms)})}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function eqCell(a,b){return a&&b&&a.r===b.r&&a.c===b.c}
function key(p){return p.r+','+p.c}
function deepCopy(x){return JSON.parse(JSON.stringify(x))}
function loadJSON(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(_){return f}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}
function randomSeed(){if(window.crypto&&crypto.getRandomValues){var a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}
function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function randint(rng,n){return Math.floor(rng()*n)}
function shuffle(a,rng){a=a.slice();for(var i=a.length-1;i>0;i--){var j=randint(rng,i+1),t=a[i];a[i]=a[j];a[j]=t}return a}
function playerLabel(){var sel=qs('#welcome select');if(sel&&sel.options&&sel.selectedIndex>=0)return sel.options[sel.selectedIndex].textContent.trim();var active=qs('#welcome [aria-pressed="true"],#welcome .active');return active?(active.textContent||'').trim():'Player'}
function nowIso(){return new Date().toISOString()}

function defaultState(){return {version:BUILD,forms:{trace:{level:0,streak:0},shift:{level:0,streak:0},echo:{level:0,streak:0}},sessions:0}}
function state(){var s=loadJSON(STORAGE_STATE,defaultState());if(!s.forms)s=defaultState();FORMS.forEach(function(f){if(!s.forms[f])s.forms[f]={level:0,streak:0}});return s}
function persistState(s){s.version=BUILD;saveJSON(STORAGE_STATE,s)}
function logAttempt(rec){var a=loadJSON(STORAGE_ATTEMPTS,[]);a.push(rec);if(a.length>1200)a=a.slice(a.length-1200);saveJSON(STORAGE_ATTEMPTS,a)}
function adapt(s,form,correct){var x=s.forms[form];if(correct){x.streak=(x.streak||0)+1;if(x.streak>=2){x.level=clamp((x.level||0)+1,0,5);x.streak=0}}else{x.level=clamp((x.level||0)-1,0,5);x.streak=0}persistState(s)}

function patchWelcome(){
  var doctrine=qs('.biy20-doctrine');
  if(doctrine){
    var laws=qsa('.biy20-law',doctrine);
    laws.forEach(function(law){
      var type=law.getAttribute('data-law');
      var small=qs('small',law),span=qs('span',law),b=qs('b',law);
      if(type==='path'){
        if(b)b.textContent='TRACE';if(span)span.textContent='SEE · VEIL · RETRACE';
        if(small)small.textContent='A continuous luminous trace unfolds, then vanishes. Recreate its cells in order. No walls. No pathfinding. Only the trace.';
      }else if(type==='update'){
        if(b)b.textContent='SHIFT';if(span)span.textContent='BIND · CHANGE IN MIND · PLACE';
        if(small)small.textContent='Hold two runes and their places. Apply each named one-step move mentally. Then return each rune to its final location.';
      }else if(type==='span'){
        if(b)b.textContent='ECHO';if(span)span.textContent='SEE · HOLD THROUGH NOISE · RECALL';
        if(small)small.textContent='Sparse locations arrive one at a time. Hold their order through the same brief interruption, then return them in order.';
      }
    });
    var title=qs('.biy20-doctrine-title',doctrine);if(title)title.textContent='Three phenomena. One clean rule at a time.';
    var kicker=qs('.biy20-doctrine-kicker',doctrine);if(kicker)kicker.textContent='A WORKING-MEMORY INSTRUMENT · CORE 2.0';
  }
  var welcome=qs('#welcome');
  if(welcome){
    var ps=qsa('p',welcome);if(ps[0])ps[0].textContent='Hold a small structure in mind. Let it vanish. Notice exactly where memory begins to bend.';
    qsa('.selftest',welcome).forEach(function(n){n.textContent='Validated: serial trace · mental updating · controlled interference'});
  }
  document.documentElement.setAttribute('data-biy-core',BUILD);
  if(document.body)document.body.setAttribute('data-biy-core',BUILD);
}

function install(){
  patchWelcome();
  var start=qs('#start');if(start){start.disabled=false;start.textContent='Start session'}
  var observer=new MutationObserver(function(){patchWelcome();var s=qs('#start');if(s){s.disabled=false;if(/checking|validating/i.test(s.textContent||''))s.textContent='Start session'}});
  var welcome=qs('#welcome');if(welcome)observer.observe(welcome,{childList:true,subtree:true,characterData:true,attributes:true});

  document.addEventListener('click',function(e){
    var startEl=e.target&&e.target.closest?e.target.closest('#start'):null;
    if(startEl){e.preventDefault();e.stopImmediatePropagation();beginSession();return}
  },true);
}

function makeRoot(){
  if(root)root.remove();
  root=document.createElement('div');root.id='biy2core';
  root.innerHTML='\
    <div class="b2-shell">\
      <header class="b2-top"><div><div class="b2-kicker">WORKING MEMORY · CORE 2.0</div><div id="b2Form" class="b2-form">BETWEEN FORMS</div></div><button id="b2Exit" class="b2-exit" aria-label="Exit session">×</button></header>\
      <section class="b2-instruction"><div id="b2Phase" class="b2-phase">PREPARE</div><div id="b2Title" class="b2-title">The rule will not change.</div><div id="b2Detail" class="b2-detail">Difficulty comes from memory, not interpretation.</div></section>\
      <main class="b2-stage"><div id="b2Board" class="b2-board" aria-label="Working memory field"></div><div id="b2Overlay" class="b2-overlay" aria-live="polite"></div></main>\
      <footer class="b2-foot"><div id="b2Progress" class="b2-progress"></div><div id="b2Note" class="b2-note">accuracy before speed</div></footer>\
    </div>';
  document.body.appendChild(root);
  var old=qs('#app');if(old)old.style.visibility='hidden';
  qs('#b2Exit',root).addEventListener('click',exitInstrument);
  return root;
}
function exitInstrument(){activeSession=null;if(root){root.remove();root=null}var old=qs('#app');if(old)old.style.visibility='';patchWelcome()}
function setHeader(form,phase,title,detail){
  qs('#b2Form',root).textContent=form?('FORM · '+FORM_NAMES[form]):'BETWEEN FORMS';
  qs('#b2Phase',root).textContent=phase||'';qs('#b2Title',root).textContent=title||'';qs('#b2Detail',root).textContent=detail||'';
}
function setProgress(done,total){var p=qs('#b2Progress',root);p.innerHTML='';for(var i=0;i<total;i++){var x=document.createElement('i');if(i<done)x.className='done';if(i===done)x.classList.add('now');p.appendChild(x)}}
function board(size){
  var b=qs('#b2Board',root);b.className='b2-board';b.innerHTML='';b.style.setProperty('--n',size);for(var r=0;r<size;r++)for(var c=0;c<size;c++){var cell=document.createElement('button');cell.type='button';cell.className='b2-cell';cell.dataset.r=r;cell.dataset.c=c;cell.setAttribute('aria-label','row '+(r+1)+' column '+(c+1));b.appendChild(cell)}return b
}
function cellAt(r,c){return qs('.b2-cell[data-r="'+r+'"][data-c="'+c+'"]',root)}
function clearBoardClasses(){qsa('.b2-cell',root).forEach(function(c){c.className='b2-cell';c.innerHTML=''})}
function overlay(html,kind){var o=qs('#b2Overlay',root);o.className='b2-overlay'+(kind?' '+kind:'');o.innerHTML=html||''}
function clearOverlay(){overlay('','')}
function setCell(p,cls,html){var c=cellAt(p.r,p.c);if(!c)return;c.className='b2-cell '+cls;if(html!=null)c.innerHTML=html}
function waitCellTap(allowed){
  return new Promise(function(resolve){
    var b=qs('#b2Board',root),done=false;
    function finish(cell){if(done)return;done=true;b.removeEventListener('pointerup',onUp,true);b.removeEventListener('click',onClick,true);resolve({r:Number(cell.dataset.r),c:Number(cell.dataset.c),el:cell})}
    function valid(cell){if(!cell)return false;var p={r:Number(cell.dataset.r),c:Number(cell.dataset.c)};return !allowed||allowed(p)}
    function onUp(e){var cell=e.target.closest&&e.target.closest('.b2-cell');if(!valid(cell))return;e.preventDefault();e.stopPropagation();blockedClickUntil=performance.now()+500;finish(cell)}
    function onClick(e){if(performance.now()<blockedClickUntil){e.preventDefault();e.stopPropagation();return}var cell=e.target.closest&&e.target.closest('.b2-cell');if(!valid(cell))return;e.preventDefault();finish(cell)}
    b.addEventListener('pointerup',onUp,true);b.addEventListener('click',onClick,true);
  })
}
function waitChoice(){
  return new Promise(function(resolve){
    var o=qs('#b2Overlay',root);function h(e){var b=e.target.closest&&e.target.closest('[data-choice]');if(!b)return;e.preventDefault();o.removeEventListener('click',h,true);resolve(b.getAttribute('data-choice'))}o.addEventListener('click',h,true)
  })
}

function traceSpec(level,rng){
  var n=5,len=3+level,dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(var tries=0;tries<100;tries++){
    var path=[{r:randint(rng,n),c:randint(rng,n)}],used={};used[key(path[0])]=1;
    while(path.length<len){var cur=path[path.length-1],cand=shuffle(dirs,rng).map(function(d){return{r:cur.r+d[0],c:cur.c+d[1]}}).filter(function(p){return p.r>=0&&p.c>=0&&p.r<n&&p.c<n&&!used[key(p)]});if(!cand.length)break;var p=cand[0];path.push(p);used[key(p)]=1}
    if(path.length===len)return{size:n,path:path,load:len}
  }
  return traceSpec(Math.max(0,level-1),rng)
}
async function presentTrace(spec,practice){
  board(spec.size);setHeader('trace',practice?'DEMONSTRATION':'SEE','Watch one continuous trace.','It will vanish. Nothing else on the board matters.');
  for(var i=0;i<spec.path.length;i++){clearBoardClasses();for(var j=0;j<i;j++)setCell(spec.path[j],'trail','');setCell(spec.path[i],'pulse','');await sleep(practice?520:430)}
  clearBoardClasses();await sleep(380);setHeader('trace',practice?'YOUR TURN':'RETRACE','Return the same cells in order.','One tap is one remembered step. No time bonus.');
  var response=[];for(var k=0;k<spec.path.length;k++){var p=await waitCellTap();response.push({r:p.r,c:p.c});setCell(p,'response','');await sleep(80)}
  var correct=response.length===spec.path.length&&response.every(function(p,i){return eqCell(p,spec.path[i])});
  return{correct:correct,response:response,target:spec.path}
}

var RUNES=[{id:'diamond',glyph:'◇'},{id:'circle',glyph:'○'}];
function shiftSpec(level,rng){
  var n=4,updates=1+level;
  for(var attempt=0;attempt<200;attempt++){
    var positions={},used={};RUNES.forEach(function(r){var p;do{p={r:randint(rng,n),c:randint(rng,n)}}while(used[key(p)]);positions[r.id]=p;used[key(p)]=1});
    var initial=deepCopy(positions),ops=[],ok=true;
    for(var u=0;u<updates;u++){
      var possible=[];RUNES.forEach(function(r){[[1,0,'↓'],[-1,0,'↑'],[0,1,'→'],[0,-1,'←']].forEach(function(d){var from=positions[r.id],to={r:from.r+d[0],c:from.c+d[1]};if(to.r<0||to.c<0||to.r>=n||to.c>=n)return;var other=RUNES.filter(function(x){return x.id!==r.id})[0];if(eqCell(to,positions[other.id]))return;possible.push({rune:r.id,glyph:r.glyph,dir:d[2],to:to})})});
      if(!possible.length){ok=false;break}var op=possible[randint(rng,possible.length)];positions[op.rune]=op.to;ops.push({rune:op.rune,glyph:op.glyph,dir:op.dir});
    }
    if(ok)return{size:n,initial:initial,final:deepCopy(positions),ops:ops,load:updates}
  }
  return shiftSpec(Math.max(0,level-1),rng)
}
async function presentShift(spec,practice){
  board(spec.size);setHeader('shift',practice?'DEMONSTRATION':'BIND','Hold both runes and their places.','The board will vanish before anything moves.');
  RUNES.forEach(function(r){setCell(spec.initial[r.id],'rune rune-'+r.id,'<span>'+r.glyph+'</span>')});await sleep(practice?1800:1450);clearBoardClasses();await sleep(260);
  for(var i=0;i<spec.ops.length;i++){var op=spec.ops[i];setHeader('shift','CHANGE IN MIND','Move only '+op.glyph+' one cell '+op.dir+'.','The other rune stays exactly where it was.');overlay('<div class="b2-operation"><span>'+op.glyph+'</span><b>'+op.dir+'</b></div>','operation');await sleep(practice?1200:900)}
  clearOverlay();var response={};
  for(var j=0;j<RUNES.length;j++){var rune=RUNES[j];clearBoardClasses();setHeader('shift','PLACE','Where did '+rune.glyph+' end?','Return only this rune. Your previous answer is hidden.');overlay('<div class="b2-cue '+rune.id+'">'+rune.glyph+'</div>','cue');var p=await waitCellTap();response[rune.id]={r:p.r,c:p.c};setCell(p,'response','');await sleep(180)}
  clearOverlay();var correct=RUNES.every(function(r){return eqCell(response[r.id],spec.final[r.id])});
  return{correct:correct,response:response,target:spec.final}
}

function echoSpec(level,rng){
  var n=5,len=3+level,seq=[],used={};while(seq.length<len){var p={r:randint(rng,n),c:randint(rng,n)};if(used[key(p)])continue;used[key(p)]=1;seq.push(p)}
  var interference=[];for(var i=0;i<2;i++){var a=18+randint(rng,18),b=18+randint(rng,18);if(a===b)b+=3;interference.push({left:a,right:b,answer:a>b?'L':'R'})}
  return{size:n,seq:seq,interference:interference,load:len}
}
async function presentEcho(spec,practice){
  board(spec.size);setHeader('echo',practice?'DEMONSTRATION':'SEE','Take in each isolated location.','Order matters. The locations are not a path.');
  for(var i=0;i<spec.seq.length;i++){clearBoardClasses();setCell(spec.seq[i],'echo','');await sleep(practice?620:500);clearBoardClasses();await sleep(120)}
  setHeader('echo','HOLD THROUGH NOISE','Keep the locations alive.','Choose the larger orb. The memory sequence does not change.');
  var interferenceResponses=[];
  for(var j=0;j<spec.interference.length;j++){var x=spec.interference[j];overlay('<div class="b2-orbs"><button data-choice="L" style="--d:'+x.left+'px"><i></i></button><button data-choice="R" style="--d:'+x.right+'px"><i></i></button></div>','orbs');var choice=await waitChoice();interferenceResponses.push(choice);clearOverlay();await sleep(160)}
  setHeader('echo','RECALL','Return the locations in order.','One tap per location. Ignore the interruption now.');var response=[];for(var k=0;k<spec.seq.length;k++){var p=await waitCellTap();response.push({r:p.r,c:p.c});setCell(p,'response','');await sleep(90)}
  var memoryCorrect=response.every(function(p,i){return eqCell(p,spec.seq[i])});var interferenceCorrect=interferenceResponses.every(function(x,i){return x===spec.interference[i].answer});
  return{correct:memoryCorrect,response:response,target:spec.seq,interferenceCorrect:interferenceCorrect,interferenceResponse:interferenceResponses}
}

function specFor(form,level,rng){if(form==='trace')return traceSpec(level,rng);if(form==='shift')return shiftSpec(level,rng);return echoSpec(level,rng)}
async function runFormTrial(form,level,practice,seed){var rng=mulberry32(seed),spec=specFor(form,level,rng),t0=performance.now(),result;if(form==='trace')result=await presentTrace(spec,practice);else if(form==='shift')result=await presentShift(spec,practice);else result=await presentEcho(spec,practice);result.rtMs=Math.round(performance.now()-t0);result.spec=spec;return result}
async function feedback(form,correct,practice){clearOverlay();setHeader(form,'RESULT',correct?'The structure held.':'The structure drifted.',practice?'Practice is not scored. The rule stays the same.':'Notice the boundary. The next trial changes load, not the rule.');overlay('<div class="b2-result '+(correct?'held':'drift')+'">'+(correct?'HELD':'DRIFTED')+'</div>','result');await sleep(practice?900:720);clearOverlay()}

function schedule(rng){var out=[];for(var i=0;i<SESSION_TRIALS/3;i++)out=out.concat(shuffle(FORMS,rng));return out}
async function beginSession(){
  if(activeSession)return;var old=qs('#app');if(old)old.classList.remove('playing');makeRoot();
  var s=state(),seed=randomSeed(),rng=mulberry32(seed),forms=schedule(rng);activeSession={id:'biy2-'+Date.now()+'-'+seed,seed:seed,player:playerLabel(),forms:forms,index:0,practiced:{},results:[],state:s,startedAt:nowIso()};
  setProgress(0,SESSION_TRIALS);await sleep(180);runSession();
}
async function runSession(){
  var ses=activeSession;if(!ses)return;
  while(ses&&ses.index<ses.forms.length){
    var form=ses.forms[ses.index];
    if(!ses.practiced[form]){
      ses.practiced[form]=true;var pSeed=randomSeed();var pr=await runFormTrial(form,0,true,pSeed);if(!activeSession)return;await feedback(form,pr.correct,true);
    }
    var level=ses.state.forms[form].level||0,trialSeed=randomSeed(),res=await runFormTrial(form,level,false,trialSeed);if(!activeSession)return;
    var rec={version:BUILD,sessionId:ses.id,player:ses.player,startedAt:ses.startedAt,endedAt:nowIso(),form:form,construct:FORM_SUB[form],trialIndex:ses.index,level:level,load:res.spec.load,seed:trialSeed,correct:res.correct,rtMs:res.rtMs,response:res.response,target:res.target};if(form==='echo'){rec.interferenceCorrect=res.interferenceCorrect;rec.interferenceResponse=res.interferenceResponse;rec.interference=res.spec.interference}
    logAttempt(rec);ses.results.push(rec);adapt(ses.state,form,res.correct);ses.index++;setProgress(ses.index,SESSION_TRIALS);await feedback(form,res.correct,false)
  }
  if(activeSession)endSession();
}
function endSession(){
  var ses=activeSession;if(!ses)return;ses.state.sessions=(ses.state.sessions||0)+1;persistState(ses.state);
  var summaries=FORMS.map(function(f){var rs=ses.results.filter(function(x){return x.form===f}),correct=rs.filter(function(x){return x.correct}).length,loads=rs.filter(function(x){return x.correct}).map(function(x){return x.load});return{form:f,correct:correct,total:rs.length,held:loads.length?Math.max.apply(null,loads):Math.max(1,(ses.state.forms[f].level||0)+1)}});
  board(1);qs('#b2Board',root).innerHTML='';setHeader(null,'SESSION COMPLETE','No intelligence score. No single number.','Three different limits were sampled separately.');
  var html='<div class="b2-summary"><div class="b2-summary-lede">The useful object is the shape of your memory, not a rank.</div>';
  summaries.forEach(function(x){html+='<section><b>'+FORM_NAMES[x.form]+'</b><span>'+FORM_SUB[x.form]+'</span><strong>'+x.correct+'/'+x.total+' held</strong><small>highest stable load seen: '+x.held+'</small></section>'});
  html+='<div class="b2-summary-actions"><button id="b2Again">Another session</button><button id="b2Done">Return</button></div></div>';overlay(html,'summary');
  qs('#b2Again',root).onclick=function(){activeSession=null;beginSession()};qs('#b2Done',root).onclick=exitInstrument;
}

window.__BIY_V20_CORE__={build:BUILD,beginSession:beginSession,traceSpec:traceSpec,shiftSpec:shiftSpec,echoSpec:echoSpec,state:state};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
console.info('[Blind Is You] v2.0 core mechanics active:',BUILD);
})();
