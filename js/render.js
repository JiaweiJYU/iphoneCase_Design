// render.js —— 负责画布渲染 & 命中测试（像素级）
// 设计要点：
// 1) 图标允许出界，但最终只显示在“可印区外轮廓”内；
// 2) 摄像头孔在同一裁剪下用 destination-out 扣掉（孔越界也不会影响外侧）；
// 3) 画布视觉顺序：白底+网格 → 图标 → 扣孔 → 外框线 → 孔边线 → 选中框。
// 4) 像素级命中（透明穿透）；只有点击到图标“非透明像素”才算命中。
// 依赖：window.State, window.Utils（roundedRectPath/appendHolePath）

window.Render = (function () {
  const { state } = State;
  const { roundedRectPath, appendHolePath } = Utils;

  // ========================
  //  工具：像素级命中缓存
  // ========================
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

  /** 像素级命中（考虑旋转/缩放，透明像素不命中） */
  function pixelHit(px, py, o){
    // 把画布坐标(px,py)变换到对象自身坐标
    const dx = px - o.cx, dy = py - o.cy;
    const cos = Math.cos(-o.angle), sin = Math.sin(-o.angle);
    const ux = dx * cos - dy * sin;
    const uy = dx * sin + dy * cos;

    // 先做一个轴对齐矩形快速剔除
    const hw = (o.w * o.scale) / 2, hh = (o.h * o.scale) / 2;
    if (ux < -hw || ux > hw || uy < -hh || uy > hh) return false;

    // 查询像素 alpha
    const cache = getAlphaCache(o.img);
    const ix = ((ux + hw) / (o.w * o.scale)) * cache.w;
    const iy = ((uy + hh) / (o.h * o.scale)) * cache.h;
    const x  = Math.floor(ix), y = Math.floor(iy);
    if (x < 0 || y < 0 || x >= cache.w || y >= cache.h) return false;

    const idx = (y * cache.w + x) * 4;
    const alpha = cache.data[idx + 3];
    return alpha > 10; // 设个阈值：>10 视为可见
  }

  /** 从上往下找命中对象 id（顶层优先） */
  function hitTest(px, py){
    for (let i = state.objects.length - 1; i >= 0; i--){
      const o = state.objects[i];
      if (pixelHit(px, py, o)) return o.id;
    }
    return null;
  }

  // ========================
  //  工具：在“可印区裁剪”内绘制白底+网格
  // ========================
  function paintGridArea(ctx, caseArea){
    // 1) 白底（你想换底色改这里）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(caseArea.x, caseArea.y, caseArea.w, caseArea.h);

    // 2) 网格（在白底上叠加）
    const grid  = 20;
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth   = 1;

    // 竖线
    for (let x = caseArea.x; x <= caseArea.x + caseArea.w; x += grid){
      ctx.beginPath(); ctx.moveTo(x, caseArea.y); ctx.lineTo(x, caseArea.y + caseArea.h); ctx.stroke();
    }
    // 横线
    for (let y = caseArea.y; y <= caseArea.y + caseArea.h; y += grid){
      ctx.beginPath(); ctx.moveTo(caseArea.x, y); ctx.lineTo(caseArea.x + caseArea.w, y); ctx.stroke();
    }
  }

  // ========================
  //  主渲染函数
  // ========================
  function draw(ctx){
    const { outer, caseArea } = state;

    // 先清屏
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 画手机壳外框“底板”（可选：仅作背景与阴影）
    ctx.save();
    roundedRectPath(ctx, outer.x, outer.y, outer.w, outer.h, outer.r);
    ctx.fillStyle = '#0b1224';       // 面板背景（与页面风格统一）
    ctx.fill();
    ctx.lineWidth   = 3;
    ctx.strokeStyle = '#1f2937';     // 外层描边
    ctx.stroke();

    // ==== 可印区：先裁外轮廓，再在同一裁剪下扣孔 ====
    ctx.save();

    // (1) 只裁外轮廓（允许图标出界，但只显示在可印区内）
    roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
    ctx.clip();

    // (2) 网格区（白底 + 网格）
    paintGridArea(ctx, caseArea);

    // (3) 绘制所有对象（图标）——此时只会落在可印区内显示
    for (const o of state.objects){
      ctx.save();
      ctx.translate(o.cx, o.cy);
      ctx.rotate(o.angle);
      const dw = o.w * o.scale, dh = o.h * o.scale;
      ctx.drawImage(o.img, -dw/2, -dh/2, dw, dh);
      ctx.restore();
    }

    // (4) 扣孔：在“仍处于可印区裁剪”的状态下把孔抠掉
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (const h of state.cameraCutouts){
      ctx.beginPath();
      if (h.type === 'circle'){
        ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      } else {
        roundedRectPath(ctx, h.x, h.y, h.w, h.h, h.r || 0);
      }
      ctx.fill();
    }
    ctx.restore();

    // 结束可印区裁剪
    ctx.restore();

    // (5) 可印区外轮廓细线（最上层的参考线）
    ctx.save();
    roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();

    // (6) 孔边线（裁在可印区内，避免越界）
    ctx.save();
    roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
    ctx.clip(); // 限定孔边线只在可印区内部绘制
    ctx.beginPath();
    for (const h of state.cameraCutouts){
      appendHolePath(ctx, h);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();

    // (7) 当前选中对象的选框（最后画）
    const sel = state.objects.find(o => o.id === state.selectedId);
    if (sel){
      ctx.save();
      ctx.translate(sel.cx, sel.cy);
      ctx.rotate(sel.angle);
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth   = 2;
      ctx.strokeRect(-(sel.w*sel.scale)/2 - 2, -(sel.h*sel.scale)/2 - 2,
                      (sel.w*sel.scale) + 4,     (sel.h*sel.scale) + 4);
      ctx.restore();
    }

    // 结束最外层
    ctx.restore();
  }

  return { draw, hitTest };
})();



