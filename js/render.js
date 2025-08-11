window.Render = (function(){
  const { state } = State;
  const { roundedRectPath, aabbSize, appendHolePath } = Utils;

  // 主渲染：使用“可印区 − 孔”的奇偶裁剪，保证图标与孔相交处被裁掉
  function draw(ctx){
    const { outer, caseArea } = state;
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);

    // 外框
    ctx.save();
    roundedRectPath(ctx, outer.x, outer.y, outer.w, outer.h, outer.r);
    ctx.fillStyle = '#0b1224'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#1f2937'; ctx.stroke();

    // —— 可印区-孔 裁剪区 —— //
    ctx.save();
    ctx.beginPath();
    // 外轮廓
    roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
    // 内轮廓（孔）
    for(const h of state.cameraCutouts){ appendHolePath(ctx, h); }
    ctx.clip('evenodd');

    // 网格
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

    // 对象
    for(const o of state.objects){
      ctx.save();
      ctx.translate(o.cx, o.cy);
      ctx.rotate(o.angle);
      const dw = o.w*o.scale, dh = o.h*o.scale;
      ctx.drawImage(o.img, -dw/2, -dh/2, dw, dh);
      ctx.restore();
    }
    ctx.restore(); // 结束裁剪

    // 可印区外轮廓细线
    ctx.save();
    roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();

    // 孔边线（裁在可印区内展示，避免越界）
    ctx.save();
    roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
    ctx.clip();
    ctx.globalAlpha = .25;
    ctx.beginPath();
    for(const h of state.cameraCutouts){ appendHolePath(ctx, h); }
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.stroke();
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
    ctx.restore();
  }

  // 命中（像素级，透明穿透）
  const alphaCache = new WeakMap();
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
    const ux = dx*cos - dy*sin, uy = dx*sin + dy*cos;
    const hw = (o.w*o.scale)/2, hh = (o.h*o.scale)/2;
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

  return { draw, hitTest };
})();

