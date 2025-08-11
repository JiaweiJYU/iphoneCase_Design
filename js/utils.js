// 是否支持 CanvasRenderingContext2D.clip(fillRule='evenodd')
window.SUPPORTS_EVENODD = (() => {
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.rect(0,0,10,10);
    ctx.clip('evenodd'); // 某些实现会抛错，或忽略 fillRule
    return true;
  } catch (e) { return false; }
})();

window.Utils = (function(){
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
  function appendHolePath(ctx, h){
    if(h.type === 'circle'){
      ctx.moveTo(h.x + h.r, h.y);
      ctx.arc(h.x, h.y, h.r, 0, Math.PI*2);
    }else if(h.type === 'rect'){
      const r = h.r || 0, x = h.x, y = h.y, w = h.w, he = h.h;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y,     x + w, y + he, r);
      ctx.arcTo(x + w, y + he, x,    y + he, r);
      ctx.arcTo(x,     y + he, x,    y,     r);
      ctx.arcTo(x,     y,      x + w, y,    r);
      ctx.closePath();
    }
  }
  return { clamp, roundedRectPath, aabbSize, appendHolePath };
})();

