import { state } from './state.js';

export function snapMove(o){
  if(!state.snapEnabled) return;
  const grid = 10, tol = 6;
  const sx = Math.round(o.cx / grid) * grid;
  const sy = Math.round(o.cy / grid) * grid;
  if(Math.abs(o.cx - sx) < tol) o.cx = sx;
  if(Math.abs(o.cy - sy) < tol) o.cy = sy;

  // 吸附到可印区中心线
  const cx0 = state.caseArea.x + state.caseArea.w/2;
  const cy0 = state.caseArea.y + state.caseArea.h/2;
  if(Math.abs(o.cx - cx0) < 8) o.cx = cx0;
  if(Math.abs(o.cy - cy0) < 8) o.cy = cy0;
}

export function snapAngle(rad){
  if(!state.snapEnabled) return rad;
  const step = Math.PI/12; // 15°
  return Math.round(rad/step)*step;
}
