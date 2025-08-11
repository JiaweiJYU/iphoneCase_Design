// 旋转功能（全局，无ESM）
window.Rotation = (function(){
  let rKeyDown = false;
  let rotateMode = false;

  function getRKeyDown(){ return rKeyDown; }
  function setRKeyDown(v){ rKeyDown = !!v; }
  function getRotateMode(){ return rotateMode; }
  function setRotateMode(v){ rotateMode = !!v; }

  function beginRotation(obj, pointerX, pointerY){
    const startPointerAngle = Math.atan2(pointerY - obj.cy, pointerX - obj.cx);
    return { id: obj.id, startAngle: obj.angle, startPointerAngle };
  }
  function updateRotation(obj, rotating, pointerX, pointerY, snapEnabled, snapAngleFn){
    const now = Math.atan2(pointerY - obj.cy, pointerX - obj.cx);
    let ang = rotating.startAngle + (now - rotating.startPointerAngle);
    if (snapEnabled && typeof snapAngleFn === 'function') ang = snapAngleFn(ang);
    obj.angle = ang;
  }
  function handleKeyDown(e, state, lastPos, dragging, rotating, findSelected){
    if (e.key === 'r' || e.key === 'R') {
      if (!rKeyDown) {
        rKeyDown = true;
        if (dragging && state.selectedId) {
          const o = findSelected();
          if (o) { rotating = beginRotation(o, lastPos.x, lastPos.y); dragging = null; }
        }
      }
    }
    return { dragging, rotating };
  }
  function handleKeyUp(e, state, lastPos, dragging, rotating, findSelected){
    if (e.key === 'r' || e.key === 'R') {
      if (rKeyDown) {
        rKeyDown = false;
        if (rotating && state.selectedId) {
          const o = findSelected();
          if (o) { const dx = lastPos.x - o.cx, dy = lastPos.y - o.cy; dragging = { id:o.id, dx, dy }; rotating = null; }
        }
      }
    }
    return { dragging, rotating };
  }
  return {
    getRKeyDown, setRKeyDown, getRotateMode, setRotateMode,
    beginRotation, updateRotation, handleKeyDown, handleKeyUp
  };
})();
