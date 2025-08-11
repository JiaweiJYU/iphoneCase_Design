import { state } from './state.js';

// DPR 适配
export function setupCanvasDPR(canvas){
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const cssW = canvas.width, cssH = canvas.height;
  canvas.width = cssW * DPR;
  canvas.height = cssH * DPR;
  canvas.style.width = cssW+'px';
  canvas.style.height = cssH+'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR,0,0,DPR,0,0);
  return {ctx, DPR};
}

// 根据机型应用外框、可印区、孔位
export function applyDeviceParams(params){
  state.outer = {...params.outer};
  state.caseArea = {...params.print};
  state.cameraCutouts = params.holes || [];
}


