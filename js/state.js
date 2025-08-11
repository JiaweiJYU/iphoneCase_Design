// 全局状态（以中心坐标为基准）
export const state = {
  objects: [],          // {id, img, cx, cy, w, h, scale, angle}
  selectedId: null,
  rKeyDown: false,
  rotateMode: false,
  snapEnabled: true,
  deviceId: 'iphone-14-pro',  // 默认机型
  caseArea: { x:30, y:30, w:360, h:760, r:42 }, // 机型切换更新
  outer:    { x:10, y:10, w:400, h:800, r:50 }, // 机型切换更新
  cameraCutouts: []     // 遮罩孔（不可印区域）
};

export const api = {
  getSelected(){ return state.objects.find(o=>o.id===state.selectedId) || null; },
  setSelected(id){ state.selectedId = id; },
  clearSelection(){ state.selectedId = null; }
};

