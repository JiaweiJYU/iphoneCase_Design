window.Interactions = (function(){
  const { state } = State;
  const { clamp, aabbSize } = Utils;
  const { snapMove, snapAngle } = Snapping;

  function install(canvas, ctx){
    let dragging = null;      // {id, dx, dy}
    let rotating = null;      // {id, startAngle, startPointerAngle}
    let lastPos = {x:0,y:0};

    canvas.addEventListener('mousedown', e=>{
      canvas.focus();
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left), my = (e.clientY - rect.top);
      lastPos = {x:mx, y:my};
      const id = Render.hitTest(mx, my);
      state.selectedId = id;

      if(id){
        const o = state.objects.find(x=>x.id===id);
        if(Rotation.getRKeyDown() || Rotation.getRotateMode()){
          rotating = Rotation.beginRotation(o, mx, my);
          canvas.style.cursor = 'grabbing';
        }else{
          dragging = {id, dx: mx - o.cx, dy: my - o.cy};
          canvas.style.cursor = 'grabbing';
        }
      }
      Render.draw(ctx);
    });

    window.addEventListener('mousemove', e=>{
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left), my = (e.clientY - rect.top);
      lastPos = {x:mx, y:my};

      if(dragging){
        const o = state.objects.find(x=>x.id===dragging.id);
        o.cx = mx - dragging.dx; o.cy = my - dragging.dy;
        snapMove(o);
        const {W,H} = aabbSize(o.w*o.scale, o.h*o.scale, o.angle);
        const minX = state.caseArea.x + W/2, maxX = state.caseArea.x + state.caseArea.w - W/2;
        const minY = state.caseArea.y + H/2, maxY = state.caseArea.y + state.caseArea.h - H/2;
        o.cx = clamp(o.cx, minX, maxX); o.cy = clamp(o.cy, minY, maxY);
        Render.draw(ctx);
      }else if(rotating){
        const o = state.objects.find(x=>x.id===rotating.id);
        Rotation.updateRotation(o, rotating, mx, my, state.snapEnabled, snapAngle);
        const {W,H} = aabbSize(o.w*o.scale, o.h*o.scale, o.angle);
        const minX = state.caseArea.x + W/2, maxX = state.caseArea.x + state.caseArea.w - W/2;
        const minY = state.caseArea.y + H/2, maxY = state.caseArea.y + state.caseArea.h - H/2;
        o.cx = clamp(o.cx, minX, maxX); o.cy = clamp(o.cy, minY, maxY);
        Render.draw(ctx);
      }
    });

    window.addEventListener('mouseup', ()=>{
      dragging = null; rotating = null; canvas.style.cursor = 'default';
      Render.draw(ctx);
    });

    // 键盘：R 切换 拖⇄转；删除；图层
    document.addEventListener('keydown', e=>{
      ({ dragging, rotating } = Rotation.handleKeyDown(
        e, state, lastPos, dragging, rotating,
        ()=> state.objects.find(o=>o.id===state.selectedId)
      ));

      if((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId){
        state.objects = state.objects.filter(o=>o.id!==state.selectedId);
        state.selectedId = null; Render.draw(ctx);
      }
      if(state.selectedId){
        const i = state.objects.findIndex(o=>o.id===state.selectedId);
        if(e.key === ']'){ if(i >= 0 && i < state.objects.length - 1){ const [o] = state.objects.splice(i,1); state.objects.splice(i+1,0,o); Render.draw(ctx);} }
        if(e.key === '['){ if(i > 0){ const [o] = state.objects.splice(i,1); state.objects.splice(i-1,0,o); Render.draw(ctx);} }
        if(e.key === 'Home'){ if(i >= 0){ const [o] = state.objects.splice(i,1); state.objects.push(o); Render.draw(ctx);} }
        if(e.key === 'End'){ if(i >= 0){ const [o] = state.objects.splice(i,1); state.objects.unshift(o); Render.draw(ctx);} }
      }
    });

    document.addEventListener('keyup', e=>{
      ({ dragging, rotating } = Rotation.handleKeyUp(
        e, state, lastPos, dragging, rotating,
        ()=> state.objects.find(o=>o.id===state.selectedId)
      ));
    });

    // 滚轮缩放
    canvas.addEventListener('wheel', e=>{
      if(!state.selectedId) return;
      e.preventDefault();
      const o = state.objects.find(x=>x.id===state.selectedId);
      const old = o.scale;
      o.scale = Utils.clamp(o.scale * (e.deltaY < 0 ? 1.06 : 0.94), 0.3, 3);
      if(Math.abs(o.scale - old) > 1e-6){
        const {W,H} = Utils.aabbSize(o.w*o.scale, o.h*o.scale, o.angle);
        const minX = state.caseArea.x + W/2, maxX = state.caseArea.x + state.caseArea.w - W/2;
        const minY = state.caseArea.y + H/2, maxY = state.caseArea.y + state.caseArea.h - H/2;
        o.cx = Utils.clamp(o.cx, minX, maxX); o.cy = Utils.clamp(o.cy, minY, maxY);
        document.getElementById('scaleRange').value = o.scale.toFixed(2);
        document.getElementById('scaleVal').textContent = o.scale.toFixed(2) + '×';
        Render.draw(ctx);
      }
    }, {passive:false});
  }

  return { install };
})();


