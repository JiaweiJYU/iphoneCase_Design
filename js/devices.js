// 机型配置：为了安全，先用通用数值（画布 420x820 上的像素）
// TODO：拿到官方印刷模板后，按机型填入精确的外框圆角/可印区边距/相机开孔坐标与大小
// 提示：开孔是“不可印区域”，用于遮罩（导出时会被裁掉），目前示范圆形，复杂岛/矩形也可加。

export const DEVICE_LIST = [
  // iPhone X ~ XS/XS Max/11/11 Pro/11 Pro Max...
  { id:'iphone-x',        name:'iPhone X' },
  { id:'iphone-xs',       name:'iPhone XS' },
  { id:'iphone-xs-max',   name:'iPhone XS Max' },
  { id:'iphone-11',       name:'iPhone 11' },
  { id:'iphone-11-pro',   name:'iPhone 11 Pro' },
  { id:'iphone-11-pro-max',name:'iPhone 11 Pro Max' },
  { id:'iphone-12-mini',  name:'iPhone 12 mini' },
  { id:'iphone-12',       name:'iPhone 12' },
  { id:'iphone-12-pro',   name:'iPhone 12 Pro' },
  { id:'iphone-12-pro-max',name:'iPhone 12 Pro Max' },
  { id:'iphone-13-mini',  name:'iPhone 13 mini' },
  { id:'iphone-13',       name:'iPhone 13' },
  { id:'iphone-13-pro',   name:'iPhone 13 Pro' },
  { id:'iphone-13-pro-max',name:'iPhone 13 Pro Max' },
  { id:'iphone-14',       name:'iPhone 14' },
  { id:'iphone-14-plus',  name:'iPhone 14 Plus' },
  { id:'iphone-14-pro',   name:'iPhone 14 Pro' },
  { id:'iphone-14-pro-max',name:'iPhone 14 Pro Max' },
  { id:'iphone-15',       name:'iPhone 15' },
  { id:'iphone-15-plus',  name:'iPhone 15 Plus' },
  { id:'iphone-15-pro',   name:'iPhone 15 Pro' },
  { id:'iphone-15-pro-max',name:'iPhone 15 Pro Max' },
  // 预留“最新”系列（占位，等你有模板后替换参数）
  { id:'iphone-16',         name:'iPhone 16（占位）' },
  { id:'iphone-16-plus',    name:'iPhone 16 Plus（占位）' },
  { id:'iphone-16-pro',     name:'iPhone 16 Pro（占位）' },
  { id:'iphone-16-pro-max', name:'iPhone 16 Pro Max（占位）' },
];

// 通用参数（让你先用起来）：可印区距边 30px，外框圆角 50px，可印区圆角 42px
const COMMON = {
  outer:  { x:10, y:10, w:400, h:800, r:50 },
  print:  { x:30, y:30, w:360, h:760, r:42 },
  holes:  [] // [] 表示不遮孔。拿到模板后按需要添加圆/矩形/路径。
};

// 机型到参数映射（先全部用通用；演示两款带“示例相机孔”）
export const DEVICE_PARAMS = Object.fromEntries(DEVICE_LIST.map(d => {
  const params = structuredClone(COMMON);

  // 示例：为 14 Pro/15 Pro 加两枚相机圆孔（演示遮罩效果）
  if (d.id === 'iphone-14-pro' || d.id === 'iphone-15-pro') {
    params.holes = [
      { type:'circle', x: params.print.x + params.print.w - 90, y: params.print.y + 110, r: 26 },
      { type:'circle', x: params.print.x + params.print.w - 50, y: params.print.y + 150, r: 22 },
    ];
  }

  return [d.id, params];
}));
