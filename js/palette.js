// 简单示例素材：3 个 SVG 转为 dataURL
const RAW_SVGS = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#f59e0b"/><circle cx="24" cy="26" r="6" fill="#fff"/><circle cx="40" cy="26" r="6" fill="#fff"/><path d="M20 44c6-6 18-6 24 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="6" y="18" width="52" height="32" rx="6" fill="#22c55e"/><rect x="12" y="24" width="40" height="20" rx="4" fill="#fff"/><circle cx="32" cy="34" r="6" fill="#22c55e"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6l7.8 15.8 17.5 2.6-12.6 12.3 3 17.4L32 45.6 16.3 54l3-17.4L6.6 24.4l17.5-2.6L32 6z" fill="#60a5fa"/></svg>`
];
const ICONS = RAW_SVGS.map(svg => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));

import { state, api } from './state.js';
import { draw } from './render.js';

export function initPalette(canvas, ctx){
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
