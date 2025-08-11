// 手机端：单指拖动、两指缩放+旋转（Pointer Events）
import { state, api } from './state.js';
import { clamp } from './utils.js';
import { draw } from './render.js';
import { snapAngle } from './snapping.js';

export function installTouchGestures(canvas, ctx, helpers){
  const { hitTest, autoConstrain } = helpers;
  const pointers = new Map(); // pointerId -> {x,y}
  let gesture = null; // 'pan' | 'transform' | null
  let start = null;

  const getTwo = () => {
    const arr = Array.from(pointers.values());
    return arr.length >= 2 ? [arr[0], arr[1]] : null;
  };
  const dist = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);
  const ang  = (a,b)=>Math.atan2(b.y-a.y, b.x-a.x);

  function onDown(e){
    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, {x:e.offsetX, y:e.offsetY});

    if(!api.getSelected()){
      const id = hitTest(e.offsetX, e.offsetY);
      if(id) api.setSelected(id), draw(ctx);
    }

    if(pointers.size === 1){
      const o = api.getSelected(); if(!o) return;
      const p = pointers.get(e.pointerId);
      gesture = 'pan';
      start = { mode:'pan', id:o.id, dx:p.x-o.cx, dy:p.y-o.cy };
    }else if(pointers.size === 2){
      const o = api.getSelected(); if(!o) return;
      const [p1,p2] = getTwo();
      gesture = 'transform';
      start = {
        mode:'transform', id:o.id,
        startDist: dist(p1,p2), startAng: ang(p1,p2),
        s0: o.scale, a0: o.angle,
        c0: {x:(p1.x+p2.x)/2, y:(p1.y+p2.y)/2},  // 两指中心
        cx0: o.cx, cy0: o.cy
      };
    }
  }

  function onMove(e){
    e.preventDefault();
    if(!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, {x:e.offsetX, y:e.offsetY});
    const o = api.getSelected(); if(!o || !gesture || !start) return;

    if(gesture==='pan' && start.mode==='pan'){
      const p = pointers.get(e.pointerId);
      o.cx = p.x - start.dx; o.cy = p.y - start.dy;
      autoConstrain(o); draw(ctx);
    }else if(gesture==='transform' && start.mode==='transform' && pointers.size>=2){
      const [p1,p2] = getTwo();
      const factor = dist(p1,p2)/Math.max(1,start.startDist);
      o.scale = clamp(start.s0 * factor, 0.3, 3);
      let target = start.a0 + (ang(p1,p2) - start.startAng);
      if(state.snapEnabled) target = snapAngle(target);
      o.angle = target;
      const cNow = {x:(p1.x+p2.x)/2, y:(p1.y+p2.y)/2};
      o.cx = start.cx0 + (cNow.x - start.c0.x);
      o.cy = start.cy0 + (cNow.y - start.c0.y);
      autoConstrain(o); draw(ctx);
    }
  }

  function onUp(e){
    e.preventDefault();
    canvas.releasePointerCapture?.(e.pointerId);
    pointers.delete(e.pointerId);
    if(pointers.size===0){ gesture=null; start=null; }
    else if(gesture==='transform' && pointers.size===1){
      // 从两指回到一指，继续平移
      const p = Array.from(pointers.values())[0];
      const o = api.getSelected(); if(o){
        gesture='pan'; start={mode:'pan', id:o.id, dx:p.x-o.cx, dy:p.y-o.cy};
      }
    }
  }

  canvas.addEventListener('pointerdown', onDown, {passive:false});
  canvas.addEventListener('pointermove', onMove, {passive:false});
  canvas.addEventListener('pointerup', onUp, {passive:false});
  canvas.addEventListener('pointercancel', onUp, {passive:false});
}
