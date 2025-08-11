// 桌面：命中、拖动、R+拖动旋转（或旋转模式）、滚轮缩放、删除
import { state } from './state.js';
import { clamp, aabbSize } from './utils.js';
import { draw } from './render.js';
import { snapMove, snapAngle } from './snapping.js';

function pointInObject(px, py, o){
  const dx = px - o.cx, dy = py - o.cy;
  const cos = Math.cos(-o.angle), sin = Math.sin(-o.angle);
  const ux = dx*cos - dy*sin, uy = dx*sin + dy*cos;
  const hw = (o.w*o.scale)/2, hh = (o.h*o.scale)/2;
  return (ux>=-hw && ux<=hw && uy>=-hh && uy<=hh);
}
function hitTest(px, py){
  for(let i=state.objects.length-1;i>=0;i--){
    if(pointInObject(px, py, state.objects[i])) return state.objects[i].id;
  }
  return null;
}
function autoConstrain(o){
  const {W,H} = aabbSize(o.w*o.scale, o.h*o.scale, o.angle);
  const minX = state.caseArea.x + W/2, maxX = state.caseArea.x + state.caseArea.w - W/2;
  const minY = state.caseArea.y + H/2, maxY = state.caseArea.y + state.caseArea.h - H/2;
  o.cx = clamp(o.cx, minX, maxX);
  o.cy = clamp(o.cy, minY, maxY);
}

export function installMouse(canvas, ctx){
  let dragging = null;  // {id, dx, dy}
  let rotating = null;  // {id, startAngle, startPointerAngle}

  canvas.addEventListener('mousedown', e=>{
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left), my = (e.clientY - rect.top);
    const id = hitTest(mx, my);
    state.selectedId = id;

    if(id){
      const o = state.objects.find(x=>x.id===id);
      if(state.rKeyDown || state.rotateMode){
        const pointerAngle = Math.atan2(my - o.cy, mx - o.cx);
        rotating = {id, startAngle: o.angle, startPointerAngle: pointerAngle};
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

    if(dragging){
      const o = state.objects.find(x=>x.id===dragging.id);
      o.cx = mx - dragging.dx; o.cy = my - dragging.dy;
      snapMove(o); autoConstrain(o); draw(ctx);
    }else if(rotating){
      const o = state.objects.find(x=>x.id===rotating.id);
      const now = Math.atan2(my - o.cy, mx - o.cx);
      let ang = rotating.startAngle + (now - rotating.startPointerAngle);
      if(state.snapEnabled) ang = snapAngle(ang);
      o.angle = ang; autoConstrain(o); draw(ctx);
    }
  });

  window.addEventListener('mouseup', ()=>{
    dragging = null; rotating = null; canvas.style.cursor = 'default';
    draw(ctx);
  });

  window.addEventListener('keydown', e=>{
    if(e.key === 'r' || e.key === 'R') state.rKeyDown = true;
    if((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId){
      state.objects = state.objects.filter(o=>o.id!==state.selectedId);
      state.selectedId = null; draw(ctx);
    }
  });
  window.addEventListener('keyup', e=>{
    if(e.key === 'r' || e.key === 'R'){ state.rKeyDown = false; }
  });

  canvas.addEventListener('wheel', e=>{
    if(!state.selectedId) return;
    e.preventDefault();
    const o = state.objects.find(x=>x.id===state.selectedId);
    const old = o.scale;
    o.scale = clamp(o.scale * (e.deltaY < 0 ? 1.06 : 0.94), 0.3, 3);
    if(Math.abs(o.scale - old) > 1e-6){
      autoConstrain(o);
      document.getElementById('scaleRange').value = o.scale.toFixed(2);
      document.getElementById('scaleVal').textContent = o.scale.toFixed(2) + '×';
      draw(ctx);
    }
  }, {passive:false});

  // 让触控模块复用
  return { hitTest, autoConstrain };
}
