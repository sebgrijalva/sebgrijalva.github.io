import {STORAGE_KEYS, copy} from './state.js';
function read(key,fallback){try{const x=localStorage.getItem(key);return x?JSON.parse(x):copy(fallback);}catch(_){return copy(fallback);}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
export const storage = {
  getActive:()=>read(STORAGE_KEYS.active,null), setActive:v=>write(STORAGE_KEYS.active,v), clearActive:()=>localStorage.removeItem(STORAGE_KEYS.active),
  sessions:()=>read(STORAGE_KEYS.sessions,[]), trials:()=>read(STORAGE_KEYS.trials,[]), pairs:()=>read(STORAGE_KEYS.pairs,[]), atlas:()=>read(STORAGE_KEYS.atlas,{}),
  addTrial:r=>{const a=read(STORAGE_KEYS.trials,[]);a.push(r);write(STORAGE_KEYS.trials,a);},
  addPair:r=>{const a=read(STORAGE_KEYS.pairs,[]);a.push(r);write(STORAGE_KEYS.pairs,a);},
  addSession:r=>{const a=read(STORAGE_KEYS.sessions,[]);a.push(r);write(STORAGE_KEYS.sessions,a);},
  setAtlas:a=>write(STORAGE_KEYS.atlas,a),
  exportAll:(protocols)=>({schema:'biy-v40-export-1',sessions:read(STORAGE_KEYS.sessions,[]),trials:read(STORAGE_KEYS.trials,[]),pairs:read(STORAGE_KEYS.pairs,[]),atlas:read(STORAGE_KEYS.atlas,{}),protocolMetadata:protocols})
};
