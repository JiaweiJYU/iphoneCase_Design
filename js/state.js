window.State = (function(){
  const state = {
    objects: [],          // {id, img, cx, cy, w, h, scale, angle}
    selectedId: null,
    snapEnabled: true,
    deviceId: 'iphone-14-pro',
    caseArea: { x:30, y:30, w:360, h:760, r:42 },
    outer:    { x:10, y:10, w:400, h:800, r:50 },
    cameraCutouts: []
  };
  const api = {
    getSelected(){ return state.objects.find(o=>o.id===state.selectedId) || null; },
    setSelected(id){ state.selectedId = id; },
    clearSelection(){ state.selectedId = null; }
  };
  return { state, api };
})();


