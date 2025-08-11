// 全局状态（中心坐标模型）+ 简易读写 API
export const state = {
  objects: [],          // {id, img, cx, cy, w, h, scale, angle}
  selectedId: null,
  rKeyDown: false,
  snapEnabled: true,
  deviceId: 'iphone-14-pro',  // 默认机型
  caseArea: { x:30, y:30, w:360, h:760, r:42 }, // 可印区，随机型切换
  outer:    { x:10, y:10, w:400, h:800, r:50 }, // 外框，随机型切换
  cameraCutouts: []     // 相机开孔（绘制遮罩）：[{x,y,r}] 圆形示例
};

export const api = {
  getSelected(){ return state.objects.find(o=>o.id===state.selectedId) || null; },
  setSelected(id){ state.selectedId = id; },
  clearSelection(){ state.selectedId = null; },
  setSnapEnabled(v){ state.snapEnabled = !!v; },
  isSnapEnabled(){ return state.snapEnabled; },
};
