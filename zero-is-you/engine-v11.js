export * from './engine.js';
import {createState as baseCreateState,stepState as baseStepState,checkWin as baseCheckWin} from './engine.js';
import {lockSolved} from './constraints-v11.js';

export function createState(level){
  const s=baseCreateState(level);
  if(level.goal?.type==='constraintSockets')s.won=false;
  return s;
}

export function checkWin(state,level){
  if(level.goal?.type==='constraintSockets'){
    state.won=lockSolved(state,level);
    if(state.won)state.message='LOCK SOLVED';
    return state.won;
  }
  return baseCheckWin(state,level);
}

export function stepState(state,level,dir){
  const next=baseStepState(state,level,dir);
  if(level.goal?.type==='constraintSockets')checkWin(next,level);
  return next;
}
