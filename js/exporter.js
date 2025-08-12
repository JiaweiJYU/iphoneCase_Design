// exporter.js —— 导出 PNG，与画布视觉一致：
// 流程：只裁外轮廓 → 白底+网格 → 图标 → destination-out 扣孔 → 外框线 → 孔边线
// 依赖：window.State

window.Exporter = (function(){
  const { state } = State;

  function exportPNG(){
    const scale = 2; // 导出倍率（2x 更清晰，可按需调整）

    // 导出画布大小 = “可印区”的宽高 * scale（以可印区左上为原点）
    const out = document.createElement('canvas');
    out.width  = state.caseArea.w * scale;
    out.height = state.caseArea.h * scale;
    const oc = out.getContext('2d');

    // 颜色与线宽（尽量与 render.js 保持一致）
    const gridStep   = 20 * scale;
    const gridStroke = 'rgba(0,0,0,0.08)';       // 网格线颜色
    const outerStroke= 'rgba(255,255,255,.25)';  // 外轮廓线
    const holeStroke = 'rgba(255,255,255,.25)';  // 孔边线
    const outerLineW = 1 * scale;
    const holeLineW  = 1 * scale;

    oc.save();

    // ===== 1) 只裁外轮廓（导出坐标原点在可印区左上角）=====
    (function(){
      const r = state.caseArea.r * scale;
      const x = 0, y = 0, w = out.width, h = out.height;
      oc.beginPath();
      oc.moveTo(x + r, y);
      oc.arcTo(x + w, y,     x + w, y + h, r);
      oc.arcTo(x + w, y + h, x,     y + h, r);
      oc.arcTo(x,     y + h, x,     y,     r);
      oc.arcTo(x,     y,     x + w, y,     r);
      oc.closePath();
      oc.clip();
    })();

    // ===== 2) 白底 + 网格（只在可印区内）=====
    oc.fillStyle = '#ffffff';
    oc.fillRect(0, 0, out.width, out.height);

    oc.strokeStyle = gridStroke;
    oc.lineWidth   = 1 * scale;
    // 竖线
    for(let x=0; x<=out.width; x+=gridStep){
      oc.beginPath(); oc.moveTo(x, 0); oc.lineTo(x, out.height); oc.stroke();
    }
    // 横线
    for(let y=0; y<=out.height; y+=gridStep){
      oc.beginPath(); oc.moveTo(0, y); oc.lineTo(out.width, y); oc.stroke();
    }

    // ===== 3) 绘制对象（坐标需减去 caseArea 的偏移）=====
    for (const o of state.objects){
      oc.save();
      oc.translate((o.cx - state.caseArea.x) * scale, (o.cy - state.caseArea.y) * scale);
      oc.rotate(o.angle);
      const dw = (o.w * o.scale) * scale, dh = (o.h * o.scale) * scale;
      oc.drawImage(o.img, -dw/2, -dh/2, dw, dh);
      oc.restore();
    }

    // ===== 4) 扣掉摄像头孔（destination-out）=====
    oc.save();
    oc.globalCompositeOperation = 'destination-out';
    for (const h of state.cameraCutouts){
      oc.beginPath();
      if (h.type === 'circle'){
        oc.arc((h.x - state.caseArea.x) * scale, (h.y - state.caseArea.y) * scale, h.r * scale, 0, Math.PI*2);
      } else {
        const x = (h.x - state.caseArea.x) * scale;
        const y = (h.y - state.caseArea.y) * scale;
        const w =  h.w * scale, he = h.h * scale, r = (h.r || 0) * scale;
        oc.moveTo(x + r, y);
        oc.arcTo(x + w, y,     x + w, y + he, r);
        oc.arcTo(x + w, y + he, x,    y + he, r);
        oc.arcTo(x,     y + he, x,    y,     r);
        oc.arcTo(x,     y,      x + w, y,    r);
        oc.closePath();
      }
      oc.fill();
    }
    oc.restore();

    // ===== 5) 外框细线（在最上层描边）=====
    (function(){
      const r = state.caseArea.r * scale;
      const x = 0, y = 0, w = out.width, h = out.height;
      oc.beginPath();
      oc.moveTo(x + r, y);
      oc.arcTo(x + w, y,     x + w, y + h, r);
      oc.arcTo(x + w, y + h, x,     y + h, r);
      oc.arcTo(x,     y + h, x,     y,     r);
      oc.arcTo(x,     y,     x + w, y,     r);
      oc.closePath();
      oc.strokeStyle = outerStroke;
      oc.lineWidth   = outerLineW;
      oc.stroke();
    })();

    // ===== 6) 孔边线（clip 到可印区，避免越界描边）=====
    oc.save();
    (function(){
      const r = state.caseArea.r * scale;
      const x = 0, y = 0, w = out.width, h = out.height;
      oc.beginPath();
      oc.moveTo(x + r, y);
      oc.arcTo(x + w, y,     x + w, y + h, r);
      oc.arcTo(x + w, y + h, x,     y + h, r);
      oc.arcTo(x,     y + h, x,     y,     r);
      oc.arcTo(x,     y,     x + w, y,     r);
      oc.closePath();
      oc.clip();
    })();

    oc.beginPath();
    for (const h of state.cameraCutouts){
      if (h.type === 'circle'){
        const cx = (h.x - state.caseArea.x) * scale;
        const cy = (h.y - state.caseArea.y) * scale;
        oc.moveTo(cx + h.r*scale, cy);
        oc.arc(cx, cy, h.r * scale, 0, Math.PI * 2);
      } else {
        const x = (h.x - state.caseArea.x) * scale;
        const y = (h.y - state.caseArea.y) * scale;
        const w =  h.w * scale, he = h.h * scale, r = (h.r || 0) * scale;
        oc.moveTo(x + r, y);
        oc.arcTo(x + w, y,     x + w, y + he, r);
        oc.arcTo(x + w, y + he, x,    y + he, r);
        oc.arcTo(x,     y + he, x,    y,     r);
        oc.arcTo(x,     y,      x + w, y,    r);
        oc.closePath();
      }
    }
    oc.strokeStyle = holeStroke;
    oc.lineWidth   = holeLineW;
    oc.stroke();
    oc.restore();

    oc.restore(); // 结束最外层保存

    // 输出 PNG 文件
    out.toBlob((blob)=>{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `phonecase_${state.deviceId}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  }

  return { exportPNG };
})();





