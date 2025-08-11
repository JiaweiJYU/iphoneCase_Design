// 为了验证“确实切换了机型”，先提供 3 款且参数差异明显
export const DEVICE_LIST = [
  { id:'iphone-11',     name:'iPhone 11' },
  { id:'iphone-14-pro', name:'iPhone 14 Pro' },
  { id:'iphone-15-pro', name:'iPhone 15 Pro' }
];

// 基础模板（坐标系以画布 420×820）
const clone = (o)=> JSON.parse(JSON.stringify(o));
const BASE = { outer:{x:10,y:10,w:400,h:800,r:50}, print:{x:30,y:30,w:360,h:760,r:42}, holes:[] };
const withOverrides = (over)=>{
  const o = clone(BASE);
  if(over.outer) Object.assign(o.outer, over.outer);
  if(over.print) Object.assign(o.print, over.print);
  if(over.holes) o.holes = over.holes;
  return o;
};

// 三款机型：调整可印区圆角/位置/孔位，肉眼可见变化
export const DEVICE_PARAMS = {
  'iphone-11': withOverrides({
    print:{r:48},
    holes:[{type:'circle', x: 360, y: 120, r: 26}]
  }),
  'iphone-14-pro': withOverrides({
    print:{r:42},
    holes:[
      {type:'circle', x: 350, y: 112, r: 26},
      {type:'circle', x: 310, y: 152, r: 22}
    ]
  }),
  'iphone-15-pro': withOverrides({
    print:{x:30, y:24, w:360, h:770, r:44},
    holes:[
      {type:'circle', x: 352, y: 110, r: 26},
      {type:'circle', x: 312, y: 150, r: 22}
    ]
  })
};


