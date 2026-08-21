(function(){'use strict';
var VERSION='1.2';
var phase=document.getElementById('phase'),grid=document.getElementById('grid'),app=document.getElementById('app'),dpad=document.getElementById('dpad'),reveal=document.getElementById('reveal');
var dist=document.getElementById('distractor')||document.getElementById('interference');
if(!phase||!grid||!app)return;

var oldGuide=document.getElementById('turnGuide');if(oldGuide)oldGuide.remove();
var guide=document.createElement('div');guide.id='turnGuide';guide.className='turn-guide';guide.setAttribute('aria-live','polite');guide.setAttribute('aria-atomic','true');
guide.innerHTML='<div class="guide-icon" aria-hidden="true"></div><div class="guide-version">v1.2</div><div id="guideKicker" class="guide-kicker">READY</div><div id="guideAction" class="guide-action">WATCH ONLY</div><div id="guideTitle" class="guide-title">Watch the board</div><div id="guideDetail" class="guide-detail">The next required gesture will appear here.</div>';
var top=document.querySelector('.topbar');top.parentNode.insertBefore(guide,top.nextSibling);
var kicker=document.getElementById('guideKicker'),action=document.getElementById('guideAction'),title=document.getElementById('guideTitle'),detail=document.getElementById('guideDetail');

function phaseText(){return (phase.textContent||'').trim().toLowerCase()}
function studyMode(){if(grid.querySelector('.avatar'))return'path';if(grid.querySelector('.token,.mini-token'))return'update';if(grid.querySelector('.memory-dot'))return'span';return''}
function isDistractor(){return !!(dist&&dist.classList.contains('on'))}
function uiMode(){var p=phaseText();if(isDistractor())return'interrupt';if(p==='move'||p==='commit')return'path';if(p==='place'||p==='recall')return'tap';return'watch'}
function setGuide(k,a,t,d){kicker.textContent=k;action.textContent=a;title.textContent=t;detail.textContent=d}
function setInteractiveState(mode){app.setAttribute('data-input-mode',mode);if(!dpad)return;var show=mode==='path';dpad.setAttribute('aria-hidden',show?'false':'true');if('inert' in dpad)dpad.inert=!show;dpad.classList.toggle('biy12-hidden',!show)}
function refresh(){var p=phaseText(),mode=uiMode();setInteractiveState(mode);
  if(isDistractor())return setGuide('SPAN · INTERRUPT','TAP THE LARGER ORB','Choose the larger orb','One clean tap. Keep the remembered cell in mind.');
  if(reveal&&reveal.classList.contains('on'))return setGuide('RESULT','WATCH ONLY',reveal.classList.contains('win')?'Correct':'Review the board','The next trial starts automatically.');
  if(p==='move'||p==='commit')return setGuide('PATH · RECALL','SWIPE OR TAP AN ARROW','Recreate the route','One swipe or one arrow tap equals exactly one move. No undo.');
  if(p==='update')return setGuide('UPDATE · MENTAL MOVE','WATCH ONLY','Move the shown rune in your head','Do not touch the board yet. Keep every other rune fixed.');
  if(p==='place')return setGuide('UPDATE · PLACE','TAP A CELL','Place the shown rune','Tap its final empty cell. Swipes are ignored in this phase.');
  if(p==='remember')return setGuide('SPAN · REMEMBER','WATCH ONLY','Remember this glowing cell','Keep its position and order through the interruption.');
  if(p==='recall')return setGuide('SPAN · RECALL','TAP A CELL','Recall the cells in order','Tap one remembered cell at a time. Swipes are ignored.');
  if(p==='study'){var m=studyMode();if(m==='path')return setGuide('PATH · STUDY','WATCH ONLY','Memorize the route','Remember the hero, flag, walls, and movers.');if(m==='update')return setGuide('UPDATE · STUDY','WATCH ONLY','Remember every rune','Their positions matter. Movement comes next.');if(m==='span')return setGuide('SPAN · REMEMBER','WATCH ONLY','Remember this glowing cell','Keep the location in mind.');}
  setGuide('GET READY','WATCH ONLY','Watch the board','The required gesture will change only when the phase changes.');
}

var obs=new MutationObserver(function(){requestAnimationFrame(refresh)});obs.observe(phase,{childList:true,characterData:true,subtree:true});obs.observe(grid,{childList:true,subtree:true});if(dist)obs.observe(dist,{attributes:true,attributeFilter:['class']});if(reveal)obs.observe(reveal,{attributes:true,attributeFilter:['class']});

var TAP_MAX=22,SWIPE_MIN=34,AXIS_DOMINANCE=1.15,SUPPRESS_MS=650;
var active=null,dispatching=false,lastProgrammaticTarget=null,lastProgrammaticAt=0;
function closest(el,sel){return el&&el.closest?el.closest(sel):null}
function gameplayTarget(el){return closest(el,'.dir')||closest(el,'.cell')||closest(el,'.dotbtn')}
function pointInStage(el){return !!closest(el,'#stage')}
function flash(el){if(!el)return;var c=closest(el,'.cell')||el;c.classList.remove('biy12-pick');void c.offsetWidth;c.classList.add('biy12-pick');setTimeout(function(){c.classList.remove('biy12-pick')},130)}
function coreActivate(el){if(!el||el.disabled)return false;dispatching=true;lastProgrammaticTarget=el;lastProgrammaticAt=performance.now();try{el.click()}finally{dispatching=false}flash(el);return true}
function dirButton(d){return dpad&&dpad.querySelector('.dir[data-dir="'+d+'"]')}
function swipeDir(dx,dy){var ax=Math.abs(dx),ay=Math.abs(dy);if(Math.max(ax,ay)<SWIPE_MIN)return null;if(ax>ay*AXIS_DOMINANCE)return dx>0?'R':'L';if(ay>ax*AXIS_DOMINANCE)return dy>0?'D':'U';return null}
function sameTapTarget(a,b,sel){var x=closest(a,sel),y=closest(b,sel);return x&&x===y?x:null}
function pointerRelevant(e){if(!app.classList.contains('playing'))return false;var mode=uiMode();if(mode==='interrupt')return !!closest(e.target,'.dotbtn');if(mode==='tap')return !!closest(e.target,'.cell');if(mode==='path')return pointInStage(e.target)||!!closest(e.target,'.dir');return false}

document.addEventListener('pointerdown',function(e){if(!pointerRelevant(e))return;if(active)return;e.preventDefault();e.stopPropagation();active={id:e.pointerId,type:e.pointerType||'mouse',x:e.clientX,y:e.clientY,target:e.target,mode:uiMode(),acted:false};try{if(e.target.setPointerCapture)e.target.setPointerCapture(e.pointerId)}catch(_){}},true);
document.addEventListener('pointerup',function(e){if(!active||e.pointerId!==active.id)return;var a=active;active=null;e.preventDefault();e.stopPropagation();var dx=e.clientX-a.x,dy=e.clientY-a.y,dist2=Math.hypot(dx,dy);if(a.mode==='interrupt'){var orb=sameTapTarget(a.target,e.target,'.dotbtn');if(orb&&dist2<=TAP_MAX)coreActivate(orb);return}if(a.mode==='tap'){var cell=sameTapTarget(a.target,e.target,'.cell');if(cell&&dist2<=TAP_MAX)coreActivate(cell);return}if(a.mode==='path'){var dir=sameTapTarget(a.target,e.target,'.dir');if(dir&&dist2<=TAP_MAX){coreActivate(dir);return}var d=swipeDir(dx,dy);if(d&&pointInStage(a.target))coreActivate(dirButton(d));}},true);
document.addEventListener('pointercancel',function(e){if(active&&e.pointerId===active.id)active=null},true);

function stopLegacyTouch(e){if(!app.classList.contains('playing'))return;if(pointInStage(e.target)||closest(e.target,'.dir')){e.preventDefault();e.stopImmediatePropagation()}}
document.addEventListener('touchstart',stopLegacyTouch,{capture:true,passive:false});document.addEventListener('touchmove',stopLegacyTouch,{capture:true,passive:false});document.addEventListener('touchend',stopLegacyTouch,{capture:true,passive:false});document.addEventListener('touchcancel',stopLegacyTouch,{capture:true,passive:false});

document.addEventListener('click',function(e){if(dispatching)return;var t=gameplayTarget(e.target);if(!t||!app.classList.contains('playing'))return;var now=performance.now();if(t===lastProgrammaticTarget&&now-lastProgrammaticAt<SUPPRESS_MS){e.preventDefault();e.stopImmediatePropagation();return}if(e.isTrusted&&((e.sourceCapabilities&&e.sourceCapabilities.firesTouchEvents)||uiMode()!=='watch')){e.preventDefault();e.stopImmediatePropagation()}},true);

document.addEventListener('keydown',function(e){if(e.repeat&&/^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|w|a|s|d)$/i.test(e.key)){e.preventDefault();e.stopImmediatePropagation()}},true);

window.__BIY_V12__={version:VERSION,thresholds:{tap:TAP_MAX,swipe:SWIPE_MIN,axisDominance:AXIS_DOMINANCE},uiMode:uiMode,refresh:refresh,swipeDir:swipeDir};
refresh();console.info('[Blind Is You v1.2] pointer input + presentation layer active');
})();
