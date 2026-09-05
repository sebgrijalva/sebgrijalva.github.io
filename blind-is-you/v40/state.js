export const BUILD = '4.1.0';
export const STORAGE_KEYS = {
  sessions: 'biy_v40_sessions',
  trials: 'biy_v40_trials',
  pairs: 'biy_v40_pairs',
  atlas: 'biy_v40_atlas',
  active: 'biy_v40_active'
};
export const TEST_MODE = typeof location !== 'undefined' && new URLSearchParams(location.search).get('test') === '1';
export const TIMING = TEST_MODE ? {
  flash: 45, gap: 18, retention: 60, calibrationRetention: 35, noiseRetention: 260, retro: 45, feedback: 35, pauseExtra: 65, interference: 55, deadline: 180
} : {
  flash: 520, gap: 180, retention: 1050, calibrationRetention: 420, noiseRetention: 3600, retro: 620, feedback: 420, pauseExtra: 900, interference: 850, deadline: 1500
};
export const EXPEDITIONS = ['focus','structure','breath','noise'];
export const QUESTIONS = {
  focus: 'What can attention rescue?',
  structure: 'When does a pattern become easier than its pieces?',
  breath: 'What does extra time change?',
  noise: 'What survives interruption?'
};
export const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
export const copy = x => JSON.parse(JSON.stringify(x));
export const iso = () => new Date().toISOString();
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export function rng32(seed){
  let a = seed >>> 0;
  return function(){ let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const randint = (rng,n) => Math.floor(rng()*n);
export function shuffled(xs,rng){ const a=xs.slice(); for(let i=a.length-1;i>0;i--){const j=randint(rng,i+1); [a[i],a[j]]=[a[j],a[i]];} return a; }
export function seedFrom(...parts){
  let h=2166136261>>>0; const s=parts.join('|');
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0;
}
export function randomSeed(){
  if(typeof crypto!=='undefined' && crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0;}
  return seedFrom(Date.now(), Math.random());
}
export function allCells(n){const out=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)out.push({r,c});return out;}
export const cellKey = p => `${p.r},${p.c}`;
export const sameCell = (a,b) => !!a&&!!b&&a.r===b.r&&a.c===b.c;
export function distinctCells(n,count,rng){return shuffled(allCells(n),rng).slice(0,count);}
export function extent(seq){const rs=seq.map(p=>p.r),cs=seq.map(p=>p.c);return {h:Math.max(...rs)-Math.min(...rs)+1,w:Math.max(...cs)-Math.min(...cs)+1};}
export function avgStep(seq){if(seq.length<2)return 0;let s=0;for(let i=1;i<seq.length;i++)s+=Math.hypot(seq[i].r-seq[i-1].r,seq[i].c-seq[i-1].c);return s/(seq.length-1);}
