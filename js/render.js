import { state } from './state.js';
import { roundedRectPath } from './utils.js';

// 绘制整张画布（外框、网格、相机孔遮罩、对象、选框）
export function draw(ctx){
  const { outer, caseArea } = state;
  ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
  // 外框
  ctx.save();
  roundedRectPath(ctx, outer.x, outer.y, outer.w, outer.h, outer.r);
  ctx.fillStyle = '#0b1224'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#1f2937'; ctx.stroke();

  // 可印区 + 背景网格 + 相机孔遮罩
  roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
  ctx.clip();

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

  // 遮相机孔（演示：现在只支持圆形，拿到模板可扩展矩形/路径）
  for(const h of state.cameraCutouts){
    if(h.type === 'circle'){
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out'; // 从可印区抠掉
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI*2);
      ctx.fill(); ctx.restore();
    }
  }

  // 画对象
  for(const o of state.objects){
    ctx.save();
    ctx.translate(o.cx, o.cy);
    ctx.rotate(o.angle);
    const dw = o.w*o.scale, dh = o.h*o.scale;
    ctx.drawImage(o.img, -dw/2, -dh/2, dw, dh);
    ctx.restore();
  }
  ctx.restore();

  // 可印区细线
  ctx.save();
  roundedRectPath(ctx, caseArea.x, caseArea.y, caseArea.w, caseArea.h, caseArea.r);
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1; ctx.stroke();
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
}
