// interactions.js —— 负责鼠标交互（命中检测、拖动、旋转、缩放、删除等）
// 版本说明：
// - 图标允许超出手机壳可印区（不自动夹回）
// - 出界部分会在 render.js 中被裁剪（destination-out）
// - 保留贴靠功能（snapMove / snapAngle）
// - 可选地限制在画布边界（代码已注释，按需开启）

window.Interactions = (function () {
  const { state } = State;              // 全局状态（对象列表、选中状态等）
  const { clamp, aabbSize } = Utils;    // 工具方法：值夹取、旋转矩形外包尺寸
  const { snapMove, snapAngle } = Snapping; // 贴靠移动 / 贴靠旋转功能

  /**
   * 安装鼠标事件
   * @param {HTMLCanvasElement} canvas - 绘图用 canvas
   * @param {CanvasRenderingContext2D} ctx - 2D 上下文
   */
  function install(canvas, ctx) {
    let dragging = null;   // 当前是否处于拖动状态：{id, dx, dy}
    let rotating = null;   // 当前是否处于旋转状态：{id, startAngle, startPointerAngle}
    let lastPos = { x: 0, y: 0 }; // 记录鼠标最后位置（用于键盘触发旋转）

    // 鼠标按下
    canvas.addEventListener('mousedown', e => {
      canvas.focus(); // 确保 canvas 能接收键盘事件（R键等）
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      lastPos = { x: mx, y: my };

      // 命中检测：找到被点击的对象 id（从上往下找最后一个命中的）
      const id = Render.hitTest(mx, my);
      state.selectedId = id;

      if (id) {

        // [ADDED] 命中后立即把对象移到数组末尾（最顶层）
        const hitIndex = state.objects.findIndex(o => o.id === id);      // [ADDED]
        if (hitIndex >= 0 && hitIndex !== state.objects.length - 1) {     // [ADDED]
          const [hitObj] = state.objects.splice(hitIndex, 1);             // [ADDED]
          state.objects.push(hitObj);                                     // [ADDED]
          state.selectedId = hitObj.id;                                   // [ADDED]
        }                                                                 // [ADDED]

        // const o = state.objects.find(x=>x.id === id);                  // [REMOVED]
        const o = state.objects[state.objects.length - 1];                // [ADDED] 顶层就是刚选中的对象

        // 如果处于旋转模式（R 键按住或开启了 rotateMode）
        if (Rotation.getRKeyDown() || Rotation.getRotateMode()) {
          rotating = Rotation.beginRotation(o, mx, my); // 初始化旋转参数
          canvas.style.cursor = 'grabbing';
        } else {
          // 普通拖动模式：记录鼠标与对象中心的偏移
          dragging = { id: o.id, dx: mx - o.cx, dy: my - o.cy };            // [CHANGED] 使用置顶后的对象 id
          canvas.style.cursor = 'grabbing';
        }
      }
      Render.draw(ctx);
    });


    // 鼠标移动
    window.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      lastPos = { x: mx, y: my };

      if (dragging) {
        // 找到当前拖动的对象
        const o = state.objects.find(x => x.id === dragging.id);
        // 根据鼠标位置更新中心点
        o.cx = mx - dragging.dx;
        o.cy = my - dragging.dy;

        // 应用贴靠（吸附到网格 / 中心线）
        snapMove(o);

        // ✅ 不再把对象夹回可印区（允许出界）
        // 如果需要防止完全拖出画布，可以启用以下画布边界限制：
        /*
        const { W, H } = aabbSize(o.w*o.scale, o.h*o.scale, o.angle);
        o.cx = clamp(o.cx, W/2, ctx.canvas.width  - W/2);
        o.cy = clamp(o.cy, H/2, ctx.canvas.height - H/2);
        */

        Render.draw(ctx);
      }
      else if (rotating) {
        const o = state.objects.find(x => x.id === rotating.id);
        // 计算旋转角度，支持吸附角度（snapAngle）
        Rotation.updateRotation(o, rotating, mx, my, state.snapEnabled, snapAngle);

        // ✅ 不再夹回可印区
        // 如果需要画布边界限制，也可以像上面那样启用 clamp

        Render.draw(ctx);
      }
    });

    // 鼠标抬起：结束拖动/旋转
    window.addEventListener('mouseup', () => {
      dragging = null;
      rotating = null;
      canvas.style.cursor = 'default';
      Render.draw(ctx);
    });

    // 键盘事件：R键旋转模式 / 删除
    document.addEventListener('keydown', e => {
      ({ dragging, rotating } = Rotation.handleKeyDown(
        e, state, lastPos, dragging, rotating,
        () => state.objects.find(o => o.id === state.selectedId)
      ));

      // 删除当前选中的对象
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
        state.objects = state.objects.filter(o => o.id !== state.selectedId);
        state.selectedId = null;
        Render.draw(ctx);
      }
    });

    // 键盘抬起事件：交给 Rotation 模块处理 R 键状态
    document.addEventListener('keyup', e => {
      Rotation.handleKeyUp(e, state);
    });

    // 滚轮缩放
    canvas.addEventListener('wheel', e => {
      if (!state.selectedId) return;
      e.preventDefault();

      const o = state.objects.find(x => x.id === state.selectedId);
      const old = o.scale;
      // 根据滚轮方向调整缩放比例（限制在 0.3~3 倍）
      o.scale = clamp(o.scale * (e.deltaY < 0 ? 1.06 : 0.94), 0.3, 3);

      if (Math.abs(o.scale - old) > 1e-6) {
        // ✅ 不再夹回可印区
        // 如果需要画布边界限制，可在此加 clamp

        // 更新 UI 缩放数值
        document.getElementById('scaleRange').value = o.scale.toFixed(2);
        document.getElementById('scaleVal').textContent = o.scale.toFixed(2) + '×';
        Render.draw(ctx);
      }
    }, { passive: false });
  }

  // 对外暴露安装函数
  return { install };
})();



