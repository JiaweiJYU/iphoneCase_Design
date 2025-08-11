window.Exporter = (function(){
  const { state } = State;

  function exportPNG(){
    const scale = 2;
    const out = document.createElement('canvas');
    out.width  = state.caseArea.w * scale;
    out.height = state.caseArea.h * scale;
    const oc = out.getContext('2d');

    oc.fillStyle = '#0b1224';
    oc.fillRect(0,0,out.width,out.height);

    // 可印区-孔 裁剪（导出坐标从可印区左上为原点）
    oc.save();
    oc.beginPath();
    (function(){
      const r = state.caseArea.r * scale;
      const x = 0, y = 0, w = out.width, h = out.height;
      oc.moveTo(x + r, y);
      oc.arcTo(x + w, y,     x + w, y + h, r);
      oc.arcTo(x + w, y + h, x,     y + h, r);
      oc.arcTo(x,     y + h, x,     y,     r);
      oc.arcTo(x,     y,     x + w, y,     r);
      oc.closePath();
    })();
    for(const h of state.cameraCutouts){
      if(h.type === 'circle'){
        oc.moveTo((h.x - state.caseArea.x) * scale + h.r*scale, (h.y - state.caseArea.y) * scale);
        oc.arc((h.x - state.caseArea.x) * scale, (h.y - state.caseArea.y) * scale, h.r*scale, 0, Math.PI*2);
      }else if(h.type === 'rect'){
        const x = (h.x - state.caseArea.x) * scale;
        const y = (h.y - state.caseArea.y) * scale;
        const w = h.w * scale, he = h.h * scale, r = (h.r || 0) * scale;
        oc.moveTo(x + r, y);
        oc.arcTo(x + w, y,     x + w, y + he, r);
        oc.arcTo(x + w, y + he, x,    y + he, r);
        oc.arcTo(x,     y + he, x,    y,     r);
        oc.arcTo(x,     y,      x + w, y,    r);
        oc.closePath();
      }
    }
    oc.clip('evenodd');

    // 绘制对象
    for(const o of state.objects){
      oc.save();
      oc.translate((o.cx - state.caseArea.x)*scale, (o.cy - state.caseArea.y)*scale);
      oc.rotate(o.angle);
      const dw = (o.w*o.scale)*scale, dh = (o.h*o.scale)*scale;
      oc.drawImage(o.img, -dw/2, -dh/2, dw, dh);
      oc.restore();
    }
    oc.restore();

    out.toBlob(blob=>{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `phonecase_${state.deviceId}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  }

  return { exportPNG };
})();



