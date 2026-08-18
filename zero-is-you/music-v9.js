// ZERO IS YOU v9 tracker-style music engine.
// No recorded audio or external MIDI is bundled. Classical melodies are newly encoded
// arrangements of public-domain compositions; original tracks are CC0-style project assets.

const hz=m=>440*Math.pow(2,(m-69)/12);
const R=-1;
const TRACKS={
  0:{name:'ORBITAL BOOT',bpm:118,lead:[72,R,79,R,76,R,81,R,79,R,76,R,74,R,71,R,67,R],bass:[36,R,R,R,43,R,R,R,41,R,R,R,38,R,R,R],arp:[60,64,67,72,59,62,67,71,57,60,64,69,55,59,62,67]},
  1:{name:'BACH GRID',credit:'J.S. Bach, Prelude in C major BWV 846, public-domain composition; new chiptune arrangement',bpm:112,lead:[72,76,79,84,76,79,84,88,71,74,79,83,74,79,83,86],bass:[48,R,R,R,48,R,R,R,47,R,R,R,47,R,R,R],arp:[60,64,67,72,64,67,72,76,59,62,67,71,62,67,71,74]},
  2:{name:'MOZART STAR SONATA',credit:'W.A. Mozart, Sonata K.545, public-domain composition; new chiptune arrangement',bpm:126,lead:[72,76,79,84,83,81,79,77,76,74,72,71,72,74,76,72],bass:[48,R,55,R,52,R,55,R,48,R,55,R,47,R,55,R],arp:[60,64,67,64,59,62,67,62,57,60,64,60,55,59,62,59]},
  3:{name:'NEBULA ENGINE',bpm:104,lead:[69,R,72,76,74,R,69,67,64,R,67,71,69,R,64,62],bass:[33,R,R,40,R,R,38,R,36,R,R,43,R,R,40,R],arp:[57,60,64,69,55,59,62,67,52,57,60,64,50,55,59,62]},
  4:{name:'ODE TO ORBIT',credit:'L. van Beethoven, Ode to Joy theme, public-domain composition; new chiptune arrangement',bpm:120,lead:[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,R,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60,R],bass:[36,R,43,R,41,R,43,R,36,R,43,R,41,R,43,R],arp:[60,64,67,64,62,65,69,65,59,62,67,62,60,64,67,64]},
  5:{name:'VOID FUGUE',bpm:138,lead:[72,75,79,82,79,75,74,77,81,84,81,77,76,72,79,83],bass:[36,R,39,R,43,R,41,R,34,R,38,R,41,R,43,R],arp:[60,63,67,72,63,67,72,75,58,62,65,70,55,59,62,67]},
  6:{name:'FACT FORGE',bpm:132,lead:[76,79,83,88,86,83,79,76,74,77,81,86,84,81,77,74],bass:[40,R,47,R,45,R,43,R,38,R,45,R,43,R,40,R],arp:[64,67,71,76,62,65,69,74,60,64,67,72,59,62,66,71]},
};

function tone(ctx,midi,when,dur,type,gain,detune=0){if(midi<0)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(hz(midi),when);o.detune.setValueAtTime(detune,when);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(gain,when+.006);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(g).connect(ctx.destination);o.start(when);o.stop(when+dur+.02);}
function kick(ctx,when,gain=.018){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(105,when);o.frequency.exponentialRampToValueAtTime(42,when+.08);g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+.1);o.connect(g).connect(ctx.destination);o.start(when);o.stop(when+.11);}
function tick(ctx,when,gain=.006){const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=1800;g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+.025);o.connect(g).connect(ctx.destination);o.start(when);o.stop(when+.03);}

export function createMusicV9(getContext){
  let running=false,scene=0,step=0,next=0,timer=null;
  const schedule=()=>{
    if(!running)return;const ctx=getContext(),tr=TRACKS[scene]||TRACKS[0],beat=60/tr.bpm/2;
    if(next<ctx.currentTime+.02)next=ctx.currentTime+.03;
    while(next<ctx.currentTime+.22){const i=step%tr.lead.length;tone(ctx,tr.lead[i],next,beat*.78,'square',.010,i%4===0?-5:5);tone(ctx,tr.bass[i%tr.bass.length],next,beat*.9,'triangle',.014);tone(ctx,tr.arp[i%tr.arp.length],next,beat*.42,'square',.0045,7);if(i%4===0)kick(ctx,next);else if(i%2===0)tick(ctx,next);step++;next+=beat;}
  };
  return {
    start(nextScene=scene){scene=nextScene;const ctx=getContext();ctx.resume?.();if(running)return;running=true;step=0;next=ctx.currentTime+.04;schedule();timer=setInterval(schedule,80);},
    stop(){running=false;if(timer)clearInterval(timer);timer=null;},
    setScene(s){const n=Number.isFinite(s)?s:0;if(n===scene)return;scene=n;step=0;try{next=getContext().currentTime+.04}catch{}},
    get track(){return TRACKS[scene]||TRACKS[0];},
    get running(){return running;},
  };
}

export const MUSIC_CREDITS=Object.values(TRACKS).filter(t=>t.credit).map(t=>({name:t.name,credit:t.credit}));
