import { ICONS } from './constants.js';
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
