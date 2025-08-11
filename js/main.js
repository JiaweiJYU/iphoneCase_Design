(function(){
  const canvas = document.getElementById('stage');
  const ctx = CanvasSetup.setupCanvasDPR(canvas);

  // 机型下拉
  const sel = document.getElementById('deviceSelect');
  Devices.DEVICE_LIST.forEach(d=>{
    const opt = document.createElement('option');
    opt.value = d.id; opt.textContent = d.name;
    if(d.id === State.state.deviceId) opt.selected = true;
    sel.appendChild(opt);
  });

  function applyDeviceParams(params){
    State.state.outer = {...params.outer};
    State.state.caseArea = {...params.print};
    // 这里直接用机型给的孔；显示/导出层会保证不越界
    State.state.cameraCutouts = params.holes || [];
  }

  function applyDevice(deviceId){
    State.state.deviceId = deviceId;
    const params = Devices.DEVICE_PARAMS[deviceId];
    if(!params){
      console.warn('[device] 未找到机型参数：', deviceId, '，回退到演示默认。');
      const fallback = {
        outer:{x:10,y:10,w:400,h:800,r:60},
        print:{x:40,y:40,w:340,h:740,r:30},
        holes:[{ type:'rect', x: 340, y: 110, w: 60, h: 80, r: 12 }]
      };
      applyDeviceParams(fallback);
    }else{
      applyDeviceParams(params);
    }
    Render.draw(ctx);
  }
  applyDevice(State.state.deviceId);
  sel.addEventListener('change', ()=> applyDevice(sel.value));

  // 素材库
  Palette.init(canvas, ctx);

  // UI
  document.getElementById('snapToggle').addEventListener('change', e=>{
    State.state.snapEnabled = e.target.checked;
  });
  document.getElementById('rotateMode').addEventListener('change', e=>{
    Rotation.setRotateMode(e.target.checked);
  });

  // 缩放滑条
  const scaleRange = document.getElementById('scaleRange');
  const scaleVal = document.getElementById('scaleVal');
  scaleRange.addEventListener('input', ()=>{
    const o = State.api.getSelected(); if(!o) return;
    o.scale = parseFloat(scaleRange.value);
    scaleVal.textContent = o.scale.toFixed(2) + '×';
    Render.draw(ctx);
  });

  // 存取与导出
  StorageIO.install(ctx);
  document.getElementById('btnExport').addEventListener('click', ()=> Exporter.exportPNG());

  // 交互
  Interactions.install(canvas, ctx);

  // 首绘
  Render.draw(ctx);
})();