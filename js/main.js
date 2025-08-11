import { setupCanvasDPR, applyDeviceParams } from './canvasSetup.js';
import { initPalette } from './palette.js';
import { installMouse } from './interactionsMouse.js';
import { installStorage } from './storage.js';
import { exportPNG } from './exporter.js';
import { DEVICE_LIST, DEVICE_PARAMS } from './devices.js';
import { state, api } from './state.js';
import { draw } from './render.js';

// 画布与 DPR
const canvas = document.getElementById('stage');
const { ctx } = setupCanvasDPR(canvas);

// 机型下拉（确保 id 与 DEVICE_PARAMS 完全一致）
const sel = document.getElementById('deviceSelect');
DEVICE_LIST.forEach(d=>{
  const opt = document.createElement('option');
  opt.value = d.id; opt.textContent = d.name;
  if(d.id === state.deviceId) opt.selected = true;
  sel.appendChild(opt);
});

// 应用机型参数（含兜底与日志）
function applyDevice(deviceId){
  state.deviceId = deviceId;
  const params = DEVICE_PARAMS[deviceId];
  if(!params){
    console.warn('[device] 未找到机型参数：', deviceId, '，回退到演示默认。');
    const fallback = {
      outer:{x:10,y:10,w:400,h:800,r:60},
      print:{x:40,y:40,w:340,h:740,r:30},
      holes:[{type:'circle', x: 340, y: 120, r: 30}]
    };
    applyDeviceParams(fallback);
  }else{
    applyDeviceParams(params);
  }
  draw(ctx);
}
applyDevice(state.deviceId);
sel.addEventListener('change', ()=> applyDevice(sel.value));

// 左侧素材、鼠标交互、存取、导出
initPalette(canvas, ctx);
installStorage(canvas, ctx);
document.getElementById('btnExport').addEventListener('click', exportPNG);

// 贴靠与旋转模式 UI
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

// 绑定桌面鼠标交互（最后绑定，确保 state/UI 都就绪）
installMouse(canvas, ctx);

// 首绘
draw(ctx);

