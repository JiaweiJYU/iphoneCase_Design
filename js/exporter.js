import { state } from './state.js';

// 导出 PNG（裁到可印区，遮掉相机孔）
export function exportPNG(){
  const scale = 2;
  const out = document.createElement('canvas');
  out.width  = state.caseArea.w * scale;
  out.height = state.caseArea.h * scale;
  const oc = out.getContext('2d');

  oc.fillStyle = '#0b1224';
  oc.fillRect(0,0,out.width,out.height);

  // 可印区圆角裁剪
  oc.save();
  (function(){
    const r = state.caseArea.r * scale;
    const x = 0, y = 0, w = out.width, h = out.height;
    oc.beginPath();
    oc.moveTo(x+r,y);
    oc.arcTo(x+w,y,x+w,y+h,r);
    oc.arcTo(x+w,y+h,x,y+h,r);
    oc.arcTo(x,y+h,x,y,r);
    oc.arcTo(x,y,x+w,y,r);
    oc.closePath();
    oc.clip();
  })();

  // 遮相机孔
  for(const h of state.cameraCutouts){
    if(h.type==='circle'){
      oc.save();
      oc.globalCompositeOperation = 'destination-out';
      oc.beginPath();
      oc.arc((h.x - state.caseArea.x)*scale, (h.y - state.caseArea.y)*scale, h.r*scale, 0, Math.PI*2);
      oc.fill(); oc.restore();
    }
  }

  // 绘制对象
  for(const o of state.objects){
    oc.save();
    oc.translate((o.cx - state.caseArea.x)*scale, (o.cy - state.caseArea.y)*scale);
    oc.rotate(o.angle);
    const dw = (o.w*o.scale)*scale, dh = (o.h*o.scale)*scale;
    oc.drawImage(o.img, -dw/2, -dh/2, dw, dh);
    oc.restore();
  }

  out.toBlob(blob=>{
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `phonecase_${state.deviceId}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}


