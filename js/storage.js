import { state } from './state.js';
import { draw } from './render.js';

export function installStorage(canvas, ctx){
  document.getElementById('btnClear').addEventListener('click', ()=>{
    state.objects = []; state.selectedId = null; draw(ctx);
  });

  document.getElementById('btnSave').addEventListener('click', ()=>{
    const data = state.objects.map(o=>({
      id:o.id, src:o.img.src, cx:o.cx, cy:o.cy, w:o.w, h:o.h, scale:o.scale, angle:o.angle
    }));
    const blob = new Blob([JSON.stringify({deviceId:state.deviceId, objects:data}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'phonecase_project.json'; a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('btnLoad').addEventListener('click', ()=>{
    const input = document.createElement('input');
    input.type='file'; input.accept='application/json';
    input.onchange = ()=>{
      const file = input.files[0]; if(!file) return;
      const fr = new FileReader();
      fr.onload = ()=>{
        try{
          const parsed = JSON.parse(fr.result);
          const list = parsed.objects || [];
          state.objects = [];
          if(list.length===0){ draw(ctx); return; }
          let loaded = 0;
          list.forEach(item=>{
            const img = new Image();
            img.onload = ()=>{
              state.objects.push({...item, img});
              loaded++; if(loaded===list.length){ draw(ctx); }
            };
            img.src = item.src;
          });
        }catch(err){ alert('载入失败：' + err.message); }
      };
      fr.readAsText(file);
    };
    input.click();
  });
}
