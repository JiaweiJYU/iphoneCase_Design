window.Devices = (function(){
  const DEVICE_LIST = [
    { id:'iphone-11',     name:'iPhone 11' },
    { id:'iphone-14-pro', name:'iPhone 14 Pro' },
    { id:'iphone-15-pro', name:'iPhone 15 Pro' }
  ];
  const BASE = { outer:{x:10,y:10,w:400,h:800,r:50}, print:{x:30,y:30,w:360,h:760,r:42}, holes:[] };
  const clone = o => JSON.parse(JSON.stringify(o));
  const withOverrides = over => {
    const o = clone(BASE);
    if(over.outer) Object.assign(o.outer, over.outer);
    if(over.print) Object.assign(o.print, over.print);
    if(over.holes) o.holes = over.holes;
    return o;
  };
  const DEVICE_PARAMS = {
    'iphone-11': withOverrides({
      print:{r:48},
      holes:[{ type:'rect', x: 300, y: 90, w: 90, h: 120, r: 16 }]
    }),
    'iphone-14-pro': withOverrides({
      print:{r:42},
      holes:[{ type:'rect', x: 292, y: 84, w: 110, h: 130, r: 18 }]
    }),
    'iphone-15-pro': withOverrides({
      print:{x:30, y:24, w:360, h:770, r:44},
      holes:[{ type:'rect', x: 295, y: 86, w: 112, h: 132, r: 18 }]
    })
  };
  return { DEVICE_LIST, DEVICE_PARAMS };
})();



