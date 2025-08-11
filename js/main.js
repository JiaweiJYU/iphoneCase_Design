// ========== 小工具 ==========
const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));
function roundedRectPath(ctx, x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}
function aabbSize(w, h, rad){
  const c = Math.abs(Math.cos(rad)), s = Math.abs(Math.sin(rad));
  return {W: w*c + h*s, H: w*s + h*c};
}

// ========== 全局状态 ==========
const state = {
  objects: [],          // {id, img, cx, cy, w, h, scale, angle}
  selectedId: null,
  rKeyDown: false,
  rotateMode: false,
  snapEnabled: true,
  deviceId: 'iphone-14-pro',
  caseArea: { x:30, y:30, w:360, h:760, r:42 },
  outer:    { x:10, y:10, w:400, h:800, r:50 },
  cameraCutouts: []
};
const api = {
  getSelected(){ return state.objects.find(o=>o.id===state.selectedId) || null; },
  setSelected(id){ state.selectedId = id; },
  clearSelection(){ state.selectedId = null; }
};

// ========== 机型数据（3 款，差异明显） ==========
const DEVICE_LIST = [
  { id:'iphone-11',     name:'iPhone 11' },
  { id:'iphone-14-pro', name:'iPhone 14 Pro' },
  { id:'iphone-15-pro', name:'iPhone 15 Pro' }
];
const BASE = { outer:{x:10,y:10,w:400,h:800,r:50}, print:{x:30,y:30,w:360,h:760,r:42}, holes:[] };
const clone = o => JSON.parse(JSON.stringify(o));
const withOverrides = over => {
  const o = clone(BASE);
  if(over.outer) Object.assign(o.outer, over.outer);
  if(over.print) Object.assign(o.print, over.print);
  if(over.holes) o.holes = over.holes;
  return o;
};
const DEVICE_PARAMS = {
  'iphone-11': withOverrides({
    print:{r:48},
    holes:[{type:'circle', x: 360, y: 120, r: 26}]
  }),
  'iphone-14-pro': withOverrides({
    print:{r:42},
    holes:[
      {type:'circle', x: 350, y: 112, r: 26},
      {type:'circle', x: 310, y: 152, r: 22}
    ]
  }),
  'iphone-15-pro': withOverrides({
    print:{x:30, y:24, w:360, h:770, r:44},
    holes:[
      {type:'circle', x: 352, y: 110, r: 26},
      {type:'circle', x: 312, y: 150, r: 22}
    ]
  })
};

// ========== 入口 ==========
window.addEventListener('DOMContentLoaded', ()=>{
  const canvas = document.getElementById('stage');
  const ctx = setupCanvasDPR(canvas);

  // 机型下拉
  const sel = document.getElementById('deviceSelect');
  DEVICE_LIST.forEach(d=>{
    const opt = document.createElement('option');
    opt.value = d.id; opt.textContent = d.name;
    if(d.id === state.deviceId) opt.selected = true;
    sel.appendChild(opt);
  });
  function applyDeviceParams(params){
    state.outer = {...params.outer};
    state.caseArea = {...params.print};
    state.cameraCutouts = params.holes || [];
  }
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

  // 素材库
  initPalette(canvas, ctx);

  // UI
  document.getElementById('snapToggle').addEventListener('change', e=>{
    state.snapEnabled = e.target.checked;
  });
  document.getElementById('rotateMode').addEventListener('change', e=>{
    state.rotateMode = e.target.checked;
  });
  const scaleRange = document.getElementById('scaleRange');
  const scaleVal = document.getElementById('scaleVal');
  scaleRange.addEventListener('input', ()=>{
    const o = api.getSelected(); if(!o) return;
    o.scale = parseFloat(scaleRange.value);
    scaleVal.textContent = o.scale.toFixed(2) + '×';
    draw(ctx);
  });

  // 存取 & 导出
  installStorage(ctx);
  document.getElementById('btnExport').addEventListener('click', ()=> exportPNG());

  // 鼠标交互
  installMouse(canvas, ctx);

  // 首绘
  draw(ctx);
});

// ========== DPR ==========
function setupCanvasDPR(canvas){
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const cssW = canvas.width, cssH = canvas.height;
  canvas.width = cssW * DPR;
  canvas.height = cssH * DPR;
  canvas.style.width = cssW+'px';
  canvas.style.height = cssH+'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR,0,0,DPR,0,0);
  return ctx;
}

// ========== 贴靠 ==========
function snapMove(o){
  if(!state.snapEnabled) return;
  const grid = 10, tol = 6;
  const sx = Math.round(o.cx / grid) * grid;
  const sy = Math.round(o.cy / grid) * grid;
  if(Math.abs(o.cx - sx) < tol) o.cx = sx;
  if(Math.abs(o.cy - sy) < tol) o.cy = sy;

  const cx0 = state.caseArea.x + state.caseArea.w/2;
  const cy0 = state.caseArea.y + state.caseArea.h/2;
  if(Math.abs(o.cx - cx0) < 8) o.cx = cx0;
  if(Math.abs(o.cy - cy0) < 8) o.cy = cy0;
}
function snapAngle(rad){
  if(!state.snapEnabled) return rad;
  const step = Math.PI/12; // 15°
  return Math.round(rad/step)*step;
}

// ========== 渲染 ==========
function draw(ctx){
  const { outer, caseArea } = state;
  ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);

  // 外框
  ctx.save();
  roundedRectPath(ctx, outer.x, outer.y, outer.w, outer.h, outer.r);
  ctx.fillStyle = '#0b1224'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#1f2937'; ctx.stroke();

  // 可印区 + 网格
  roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
  ctx.clip();

  const grid = 20;
  ctx.globalAlpha = .15;
  for(let x=caseArea.x; x<caseArea.x+caseArea.w; x+=grid){
    ctx.beginPath(); ctx.moveTo(x, caseArea.y); ctx.lineTo(x, caseArea.y+caseArea.h);
    ctx.strokeStyle='#22314d'; ctx.lineWidth=1; ctx.stroke();
  }
  for(let y=caseArea.y; y<caseArea.y+caseArea.h; y+=grid){
    ctx.beginPath(); ctx.moveTo(caseArea.x, y); ctx.lineTo(caseArea.x+caseArea.w, y);
    ctx.strokeStyle='#22314d'; ctx.lineWidth=1; ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 孔遮罩
  for(const h of state.cameraCutouts){
    if(h.type === 'circle'){
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI*2);
      ctx.fill(); ctx.restore();
    }
  }

  // 对象
  for(const o of state.objects){
    ctx.save();
    ctx.translate(o.cx, o.cy);
    ctx.rotate(o.angle);
    const dw = o.w*o.scale, dh = o.h*o.scale;
    ctx.drawImage(o.img, -dw/2, -dh/2, dw, dh);
    ctx.restore();
  }
  ctx.restore();

  // 可印区细线
  ctx.save();
  roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();

  // 选框
  const sel = state.objects.find(o=>o.id===state.selectedId);
  if(sel){
    ctx.save();
    ctx.translate(sel.cx, sel.cy);
    ctx.rotate(sel.angle);
    ctx.setLineDash([6,4]);
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
    ctx.strokeRect(-(sel.w*sel.scale)/2 - 2, -(sel.h*sel.scale)/2 - 2, (sel.w*sel.scale) + 4, (sel.h*sel.scale) + 4);
    ctx.restore();
  }
}

// ========== 像素级命中 ==========
const alphaCache = new WeakMap(); // img -> {w,h,data}
function getAlphaCache(img){
  if(alphaCache.has(img)) return alphaCache.get(img);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ictx = c.getContext('2d');
  ictx.drawImage(img, 0, 0);
  const { data } = ictx.getImageData(0, 0, c.width, c.height);
  const cache = { w:c.width, h:c.height, data };
  alphaCache.set(img, cache);
  return cache;
}
function pixelHit(px, py, o){
  const dx = px - o.cx, dy = py - o.cy;
  const cos = Math.cos(-o.angle), sin = Math.sin(-o.angle);
  const ux = dx*cos - dy*sin;
  const uy = dx*sin + dy*cos;

  const hw = (o.w * o.scale)/2, hh = (o.h * o.scale)/2;
  if(ux < -hw || ux > hw || uy < -hh || uy > hh) return false;

  const cache = getAlphaCache(o.img);
  const ix = ((ux + hw) / (o.w * o.scale)) * cache.w;
  const iy = ((uy + hh) / (o.h * o.scale)) * cache.h;
  const x = Math.floor(ix), y = Math.floor(iy);
  if(x < 0 || y < 0 || x >= cache.w || y >= cache.h) return false;

  const idx = (y * cache.w + x) * 4;
  const alpha = cache.data[idx + 3];
  return alpha > 10;
}
function hitTest(px, py){
  for(let i = state.objects.length - 1; i >= 0; i--){
    const o = state.objects[i];
    if(pixelHit(px, py, o)) return o.id;
  }
  return null;
}

// ========== 素材库 ==========
function initPalette(canvas, ctx){
  const RAW_SVGS = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#f59e0b"/><circle cx="24" cy="26" r="6" fill="#fff"/><circle cx="40" cy="26" r="6" fill="#fff"/><path d="M20 44c6-6 18-6 24 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="6" y="18" width="52" height="32" rx="6" fill="#22c55e"/><rect x="12" y="24" width="40" height="20" rx="4" fill="#fff"/><circle cx="32" cy="34" r="6" fill="#22c55e"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6l7.8 15.8 17.5 2.6-12.6 12.3 3 17.4L32 45.6 16.3 54l3-17.4L6.6 24.4l17.5-2.6L32 6z" fill="#60a5fa"/></svg>`
  ];
  const ICONS = RAW_SVGS.map(svg => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));

  const palette = document.getElementById('palette');
  ICONS.forEach(url=>{
    const box = document.createElement('div');
    box.className = 'icon';
    const img = document.createElement('img');
    img.src = url;
    box.appendChild(img);
    box.draggable = true;
    box.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('text/plain', url);
    });
    palette.appendChild(box);
  });

  // 允许拖到画布新建对象
  canvas.addEventListener('dragover', e=> e.preventDefault());
  canvas.addEventListener('drop', e=>{
    e.preventDefault();
    const url = e.dataTransfer.getData('text/plain');
    if(!url) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left), my = (e.clientY - rect.top);
    const img = new Image();
    img.onload = ()=>{
      const baseW = 96, baseH = img.height * (baseW / img.width);
      const id = 'obj_' + Math.random().toString(36).slice(2,9);
      state.objects.push({id, img, cx: mx, cy: my, w: baseW, h: baseH, scale: 1, angle: 0});
      api.setSelected(id);
      document.getElementById('scaleRange').value = '1.00';
      document.getElementById('scaleVal').textContent = '1.00×';
      draw(ctx);
    };
    img.src = url;
  });
}

// ========== 鼠标交互（拖动 / R 旋转 / 滚轮缩放 / 删除 / 图层） ==========
function installMouse(canvas, ctx){
  let dragging = null;      // {id, dx, dy}
  let rotating = null;      // {id, startAngle, startPointerAngle}
  let lastPos = { x:0, y:0 };

  canvas.addEventListener('mousedown', e=>{
    canvas.focus(); // 确保能收到键盘事件
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left), my = (e.clientY - rect.top);
    lastPos = {x:mx, y:my};
    const id = hitTest(mx, my);
    state.selectedId = id;

    if(id){
      const o = state.objects.find(x=>x.id===id);
      if(state.rKeyDown || state.rotateMode){
        const pointerAngle = Math.atan2(my - o.cy, mx - o.cx);
        rotating = {id, startAngle:o.angle, startPointerAngle:pointerAngle};
        canvas.style.cursor = 'grabbing';
      }else{
        dragging = {id, dx: mx - o.cx, dy: my - o.cy};
        canvas.style.cursor = 'grabbing';
      }
    }
    draw(ctx);
  });

  window.addEventListener('mousemove', e=>{
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left), my = (e.clientY - rect.top);
    lastPos = {x:mx, y:my};

    if(dragging){
      const o = state.objects.find(x=>x.id===dragging.id);
      o.cx = mx - dragging.dx; o.cy = my - dragging.dy;
      snapMove(o);
      const {W,H} = aabbSize(o.w*o.scale, o.h*o.scale, o.angle);
      const minX = state.caseArea.x + W/2, maxX = state.caseArea.x + state.caseArea.w - W/2;
      const minY = state.caseArea.y + H/2, maxY = state.caseArea.y + state.caseArea.h - H/2;
      o.cx = clamp(o.cx, minX, maxX); o.cy = clamp(o.cy, minY, maxY);
      draw(ctx);
    }else if(rotating){
      const o = state.objects.find(x=>x.id===rotating.id);
      const now = Math.atan2(my - o.cy, mx - o.cx);
      let ang = rotating.startAngle + (now - rotating.startPointerAngle);
      if(state.snapEnabled) ang = snapAngle(ang);
      o.angle = ang;
      const {W,H} = aabbSize(o.w*o.scale, o.h*o.scale, o.angle);
      const minX = state.caseArea.x + W/2, maxX = state.caseArea.x + state.caseArea.w - W/2;
      const minY = state.caseArea.y + H/2, maxY = state.caseArea.y + state.caseArea.h - H/2;
      o.cx = clamp(o.cx, minX, maxX); o.cy = clamp(o.cy, minY, maxY);
      draw(ctx);
    }
  });

  window.addEventListener('mouseup', ()=>{
    dragging = null; rotating = null; canvas.style.cursor = 'default';
    draw(ctx);
  });

  // 拖动中按 R => 立刻切为旋转；旋转中松 R => 切回拖动
  document.addEventListener('keydown', e=>{
    if(e.key === 'r' || e.key === 'R'){
      if(!state.rKeyDown){
        state.rKeyDown = true;
        if(dragging && state.selectedId){
          const o = state.objects.find(x=>x.id===state.selectedId);
          const pointerAngle = Math.atan2(lastPos.y - o.cy, lastPos.x - o.cx);
          rotating = { id:o.id, startAngle:o.angle, startPointerAngle:pointerAngle };
          dragging = null;
        }
      }
    }
    // 删除
    if((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId){
      state.objects = state.objects.filter(o=>o.id!==state.selectedId);
      state.selectedId = null; draw(ctx);
    }
    // 图层顺序
    if(state.selectedId){
      const i = state.objects.findIndex(o=>o.id===state.selectedId);
      if(e.key === ']'){ // 前移
        if(i >= 0 && i < state.objects.length - 1){
          const [o] = state.objects.splice(i,1);
          state.objects.splice(i+1,0,o); draw(ctx);
        }
      }
      if(e.key === '['){ // 后移
        if(i > 0){
          const [o] = state.objects.splice(i,1);
          state.objects.splice(i-1,0,o); draw(ctx);
        }
      }
      if(e.key === 'Home'){ // 置顶
        if(i >= 0){
          const [o] = state.objects.splice(i,1);
          state.objects.push(o); draw(ctx);
        }
      }
      if(e.key === 'End'){ // 置底
        if(i >= 0){
          const [o] = state.objects.splice(i,1);
          state.objects.unshift(o); draw(ctx);
        }
      }
    }
  });
  document.addEventListener('keyup', e=>{
    if(e.key === 'r' || e.key === 'R'){
      if(state.rKeyDown){
        state.rKeyDown = false;
        if(rotating && state.selectedId){
          const o = state.objects.find(x=>x.id===state.selectedId);
          const dx = lastPos.x - o.cx, dy = lastPos.y - o.cy;
          dragging = { id:o.id, dx, dy };
          rotating = null;
        }
      }
    }
  });

  // 滚轮缩放
  canvas.addEventListener('wheel', e=>{
    if(!state.selectedId) return;
    e.preventDefault();
    const o = state.objects.find(x=>x.id===state.selectedId);
    const old = o.scale;
    o.scale = clamp(o.scale * (e.deltaY < 0 ? 1.06 : 0.94), 0.3, 3);
    if(Math.abs(o.scale - old) > 1e-6){
      const {W,H} = aabbSize(o.w*o.scale, o.h*o.scale, o.angle);
      const minX = state.caseArea.x + W/2, maxX = state.caseArea.x + state.caseArea.w - W/2;
      const minY = state.caseArea.y + H/2, maxY = state.caseArea.y + state.caseArea.h - H/2;
      o.cx = clamp(o.cx, minX, maxX); o.cy = clamp(o.cy, minY, maxY);
      document.getElementById('scaleRange').value = o.scale.toFixed(2);
      document.getElementById('scaleVal').textContent = o.scale.toFixed(2) + '×';
      draw(ctx);
    }
  }, {passive:false});
}

// ========== 存取 & 导出 ==========
function installStorage(ctx){
  document.getElementById('btnClear').addEventListener('click', ()=>{
    state.objects = []; state.selectedId = null; draw(ctx);
  });

  document.getElementById('btnSave').addEventListener('click', ()=>{
    const data = state.objects.map(o=>({
      id:o.id, src:o.img.src, cx:o.cx, cy:o.cy, w:o.w, h:o.h, scale:o.scale, angle:o.angle
    }));
    const blob = new Blob([JSON.stringify({deviceId:state.deviceId, objects:data}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'phonecase_project.json'; a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('btnLoad').addEventListener('click', ()=>{
    const input = document.createElement('input');
    input.type='file'; input.accept='application/json';
    input.onchange = ()=>{
      const file = input.files[0]; if(!file) return;
      const fr = new FileReader();
      fr.onload = ()=>{
        try{
          const parsed = JSON.parse(fr.result);
          const list = parsed.objects || [];
          state.objects = [];
          if(list.length===0){ draw(ctx); return; }
          let loaded = 0;
          list.forEach(item=>{
            const img = new Image();
            img.onload = ()=>{
              state.objects.push({...item, img});
              loaded++; if(loaded===list.length){ draw(ctx); }
            };
            img.src = item.src;
          });
        }catch(err){ alert('载入失败：' + err.message); }
      };
      fr.readAsText(file);
    };
    input.click();
  });
}

function exportPNG(){
  const scale = 2;
  const out = document.createElement('canvas');
  out.width  = state.caseArea.w * scale;
  out.height = state.caseArea.h * scale;
  const oc = out.getContext('2d');

  oc.fillStyle = '#0b1224';
  oc.fillRect(0,0,out.width,out.height);

  // 可印区圆角裁剪
  oc.save();
  (function(){
    const r = state.caseArea.r * scale;
    const x = 0, y = 0, w = out.width, h = out.height;
    oc.beginPath();
    oc.moveTo(x+r,y);
    oc.arcTo(x+w,y,x+w,y+h,r);
    oc.arcTo(x+w,y+h,x,y+h,r);
    oc.arcTo(x,y+h,x,y,r);
    oc.arcTo(x,y,x+w,y,r);
    oc.closePath();
    oc.clip();
  })();

  // 遮相机孔
  for(const h of state.cameraCutouts){
    if(h.type==='circle'){
      oc.save();
      oc.globalCompositeOperation = 'destination-out';
      oc.beginPath();
      oc.arc((h.x - state.caseArea.x)*scale, (h.y - state.caseArea.y)*scale, h.r*scale, 0, Math.PI*2);
      oc.fill(); oc.restore();
    }
  }

  // 绘制对象
  for(const o of state.objects){
    oc.save();
    oc.translate((o.cx - state.caseArea.x)*scale, (o.cy - state.caseArea.y)*scale);
    oc.rotate(o.angle);
    const dw = (o.w*o.scale)*scale, dh = (o.h*o.scale)*scale;
    oc.drawImage(o.img, -dw/2, -dh/2, dw, dh);
    oc.restore();
  }

  out.toBlob(blob=>{
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `phonecase_${state.deviceId}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}
