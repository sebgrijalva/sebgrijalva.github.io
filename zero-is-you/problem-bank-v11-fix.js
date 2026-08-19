import {PROBLEM_BANK as BASE,BAND_META} from './problem-bank-v11.js';
export {BAND_META};
export const PROBLEM_BANK=structuredClone(BASE);

const web=PROBLEM_BANK.find(p=>p.title==='PRODUCT WEB');
if(!web)throw new Error('PRODUCT WEB missing');
// Original order reached the unique answer but made the final two clues redundant.
// Reordering the same six clues yields survivor counts:
// 5040 -> 560 -> 280 -> 112 -> 5 -> 2 -> 1.
const c=web.data.constraints;
web.data.constraints=[c[0],c[4],c[5],c[1],c[2],c[3]];

export const BANK_BY_WORLD=Object.fromEntries(BAND_META.map(b=>[b.world,PROBLEM_BANK.filter(p=>p.world===b.world)]));
