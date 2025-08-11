import { ICONS } from './constants.js';
import { state, api } from './state.js';
import { setupCanvasDPR, applyDeviceParams } from './canvasSetup.js';
import { draw } from './render.js';
import { initPalette } from './palette.js';
import { installMouse } from './interactionsMouse.js';
import { installTouchGestures } from './touchGestures.js';
import { installStorage } from './storage.js';
import { exportPNG } from './exporter.js';
import { DEVICE_LIST, DEVICE_PARAMS } from './devices.js';

// 1) 画布与 DPR
const canvas = document.getElementById('stage');
const { ctx } = setupCanvasDPR(canvas);

// 2) 机型下拉
const sel = document.getElementById('deviceSelect');
DEVICE_LIST.forEach(d=>{
  const opt = document.createElement('option');
  opt.value = d.id; opt.textContent = d.name;
  if(d.id === state.deviceId) opt.selected = true;
  sel.appendChild(opt);
});
function applyDevice(deviceId){
  state.deviceId = deviceId;
  applyDeviceParams(DEVICE_PARAMS[deviceId]);
  draw(ctx);
}
applyDevice(state.deviceId);
sel.addEventListener('change', ()=> applyDevice(sel.value));

// 3) 素材库 & 交互
initPalette(canvas, ctx);
const helpers = installMouse(canvas, ctx);           // 鼠标交互
installTouchGestures(canvas, ctx, helpers);          // 触控交互
installStorage(canvas, ctx);                         // 保存/载入
document.getElementById('btnExport').addEventListener('click', exportPNG);

// 4) UI：贴靠开关 & 缩放滑条
const scaleRange = document.getElementById('scaleRange');
const scaleVal = document.getElementById('scaleVal');
document.getElementById('snapToggle').addEventListener('change', (e)=>{
  state.snapEnabled = e.target.checked;
});
scaleRange.addEventListener('input', ()=>{
  const o = api.getSelected(); if(!o) return;
  o.scale = parseFloat(scaleRange.value);
  scaleVal.textContent = o.scale.toFixed(2) + '×';
  draw(ctx);
});

// 首绘
draw(ctx);
