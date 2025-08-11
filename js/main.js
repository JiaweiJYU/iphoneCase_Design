import { setupCanvasDPR, applyDeviceParams } from './canvasSetup.js';
import { initPalette } from './palette.js';
import { installMouse } from './interactionsMouse.js';
import { installTouchGestures } from './touchGestures.js';
import { installStorage } from './storage.js';
import { exportPNG } from './exporter.js';
import { DEVICE_LIST, DEVICE_PARAMS } from './devices.js';
import { state, api } from './state.js';
import { draw } from './render.js';

// 画布
const canvas = document.getElementById('stage');
const { ctx } = setupCanvasDPR(canvas);

// 机型下拉
const sel = document.getElementById('deviceSelect');
DEVICE_LIST.forEach(d=>{
  const opt = document.createElement('option');
  opt.value = d.id; opt.textContent = d.name;
  if(d.id === state.deviceId) opt.selected = true;
  sel.appendChild(opt);
});
function applyDevice(deviceId){
  state.deviceId = deviceId;
  const params = DEVICE_PARAMS[deviceId];
  applyDeviceParams(params);
  draw(ctx);
}
applyDevice(state.deviceId);
sel.addEventListener('change', ()=> applyDevice(sel.value));

// 素材 & 交互 & 存取 & 导出
initPalette(canvas, ctx);
const helpers = installMouse(canvas, ctx);
installTouchGestures(canvas, ctx, helpers);
installStorage(canvas, ctx);
document.getElementById('btnExport').addEventListener('click', exportPNG);

// UI：贴靠与旋转模式
document.getElementById('snapToggle').addEventListener('change', (e)=>{
  state.snapEnabled = e.target.checked;
});
document.getElementById('rotateMode').addEventListener('change', (e)=>{
  state.rotateMode = e.target.checked;
});

// 缩放滑条
const scaleRange = document.getElementById('scaleRange');
const scaleVal = document.getElementById('scaleVal');
scaleRange.addEventListener('input', ()=>{
  const o = api.getSelected(); if(!o) return;
  o.scale = parseFloat(scaleRange.value);
  scaleVal.textContent = o.scale.toFixed(2) + '×';
  draw(ctx);
});

// 首次绘制
draw(ctx);

