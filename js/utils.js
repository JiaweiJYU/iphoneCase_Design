export const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));

export function roundedRectPath(ctx, x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

// 旋转后外接矩形（约束用）
export function aabbSize(w, h, rad){
  const c = Math.abs(Math.cos(rad)), s = Math.abs(Math.sin(rad));
  return {W: w*c + h*s, H: w*s + h*c};
}