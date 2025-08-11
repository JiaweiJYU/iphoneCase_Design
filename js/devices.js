// 机型清单（X 到 16 系列，16 为占位）：
export const DEVICE_LIST = [
  { id:'iphone-11', name:'iPhone 11' },
  { id:'iphone-14-pro', name:'iPhone 14 Pro' },
  { id:'iphone-15-pro', name:'iPhone 15 Pro' }
];

// —— 重要说明 ——
// 下面的参数是为了“立刻能看到机型切换的明显差异”的演示值：
// - 全部在 420×820 的画布坐标系中定义
// - outer：手机壳外框（装饰）
// - print：可印刷区域（导出会裁到这里）
// - holes：相机开孔（destination-out 遮罩），这里只放圆孔示例
// 实际上线请把供应商模板的精确数据填进来。

const clone = (o)=> JSON.parse(JSON.stringify(o));
const BASE = { outer:{x:10,y:10,w:400,h:800,r:50}, print:{x:30,y:30,w:360,h:760,r:42}, holes:[] };

function withOverrides(over){
  const o = clone(BASE);
  // 浅合并
  if(over.outer) Object.assign(o.outer, over.outer);
  if(over.print) Object.assign(o.print, over.print);
  if(over.holes) o.holes = over.holes;
  return o;
}

export const DEVICE_PARAMS = {
  // 小圆角、无孔
  'iphone-x': withOverrides({ print:{r:36} }),
  'iphone-xs': withOverrides({ print:{r:40} }),

  // 较大圆角；演示一枚相机孔
  'iphone-11': withOverrides({
    print:{r:48},
    holes:[{type:'circle', x: 360, y: 120, r: 26}]
  }),

  // 12 直角风；两枚相机孔
  'iphone-12': withOverrides({
    print:{r:28},
    holes:[
      {type:'circle', x: 350, y: 110, r: 22},
      {type:'circle', x: 310, y: 150, r: 22}
    ]
  }),
  'iphone-12-pro': withOverrides({
    print:{r:30},
    holes:[
      {type:'circle', x: 345, y: 115, r: 24},
      {type:'circle', x: 305, y: 155, r: 24}
    ]
  }),

  // 13：改变可印区尺寸（更窄/更高），孔位不同
  'iphone-13': withOverrides({
    print:{x:36, y:26, w:348, h:768, r:34},
    holes:[{type:'circle', x: 335, y: 118, r: 24}]
  }),
  'iphone-13-pro': withOverrides({
    print:{x:34, y:28, w:352, h:764, r:32},
    holes:[
      {type:'circle', x: 345, y: 112, r: 26},
      {type:'circle', x: 305, y: 152, r: 22}
    ]
  }),

  // 14：演示三个孔
  'iphone-14': withOverrides({
    print:{r:38},
    holes:[
      {type:'circle', x: 342, y: 110, r: 24},
      {type:'circle', x: 305, y: 150, r: 22},
      {type:'circle', x: 365, y: 155, r: 18}
    ]
  }),
  'iphone-14-pro': withOverrides({
    print:{r:42},
    holes:[
      {type:'circle', x: 350, y: 112, r: 26},
      {type:'circle', x: 310, y: 152, r: 22}
    ]
  }),

  // 15：改变可印区位置（更靠上）
  'iphone-15': withOverrides({
    print:{x:28, y:22, w:364, h:772, r:40},
    holes:[{type:'circle', x: 355, y: 108, r: 24}]
  }),
  'iphone-15-pro': withOverrides({
    print:{x:30, y:24, w:360, h:770, r:44},
    holes:[
      {type:'circle', x: 352, y: 110, r: 26},
      {type:'circle', x: 312, y: 150, r: 22}
    ]
  }),

  // 16（占位）：给个更大的圆角与不同孔位
  'iphone-16': withOverrides({
    print:{r:50},
    holes:[{type:'circle', x: 360, y: 105, r: 28}]
  }),
  'iphone-16-pro': withOverrides({
    print:{r:48},
    holes:[
      {type:'circle', x: 358, y: 106, r: 28},
      {type:'circle', x: 318, y: 148, r: 24}
    ]
  })
};

