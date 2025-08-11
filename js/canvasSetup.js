window.CanvasSetup = (function(){
  function setupCanvasDPR(canvas){
    const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = canvas.width, cssH = canvas.height;
    canvas.width = cssW * DPR;
    canvas.height = cssH * DPR;
    canvas.style.width = cssW+'px';
    canvas.style.height = cssH+'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(DPR,0,0,DPR,0,0);
    return ctx;
  }
  return { setupCanvasDPR };
})();


