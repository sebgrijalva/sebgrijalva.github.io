const TAP_MAX_PX = 14,
  TAP_MAX_MS = 950;
export function bindTap(el, handler) {
  let active = null;
  const down = (e) => {
    if (!e.isPrimary || active) return;
    active = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
    };
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {}
    e.preventDefault();
  };
  const up = (e) => {
    if (!active || e.pointerId !== active.id) return;
    const a = active;
    active = null;
    const d = Math.hypot(e.clientX - a.x, e.clientY - a.y),
      dt = performance.now() - a.t;
    e.preventDefault();
    e.stopPropagation();
    if (d <= TAP_MAX_PX && dt <= TAP_MAX_MS) handler(e);
  };
  const cancel = (e) => {
    if (active && e.pointerId === active.id) active = null;
  };
  const key = (e) => {
    if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
      e.preventDefault();
      handler(e);
    }
  };
  el.addEventListener("pointerdown", down, { passive: false });
  el.addEventListener("pointerup", up, { passive: false });
  el.addEventListener("pointercancel", cancel, { passive: true });
  el.addEventListener("keydown", key);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", cancel);
    el.removeEventListener("keydown", key);
  };
}
export function waitForBoardTap(board, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("cancelled"));
      return;
    }
    let active = null,
      done = false;
    const clean = () => {
      board.removeEventListener("keydown", key);
      board.removeEventListener("pointerdown", down);
      board.removeEventListener("pointerup", up);
      board.removeEventListener("pointercancel", cancel);
      signal?.removeEventListener("abort", abort);
    };
    const finish = (x) => {
      if (done) return;
      done = true;
      clean();
      resolve({ r: +x.dataset.r, c: +x.dataset.c });
    };
    const down = (e) => {
      if (!e.isPrimary || active) return;
      const x = e.target.closest(".cell");
      if (!x) return;
      active = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
        cell: x,
      };
      try {
        board.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
    };
    const up = (e) => {
      if (!active || e.pointerId !== active.id) return;
      const a = active;
      active = null;
      const d = Math.hypot(e.clientX - a.x, e.clientY - a.y),
        dt = performance.now() - a.t;
      e.preventDefault();
      e.stopPropagation();
      if (d <= TAP_MAX_PX && dt <= TAP_MAX_MS) finish(a.cell);
    };
    const cancel = (e) => {
      if (active && e.pointerId === active.id) active = null;
    };
    const key = (e) => {
      if (
        (e.key === "Enter" || e.key === " ") &&
        !e.repeat &&
        e.target.closest(".cell")
      ) {
        e.preventDefault();
        finish(e.target.closest(".cell"));
      }
    };
    const abort = () => {
      clean();
      reject(new Error("cancelled"));
    };
    board.addEventListener("keydown", key);
    board.addEventListener("pointerdown", down, { passive: false });
    board.addEventListener("pointerup", up, { passive: false });
    board.addEventListener("pointercancel", cancel, { passive: true });
    signal?.addEventListener("abort", abort, { once: true });
  });
}
export function inputAudit() {
  const host = document.createElement("button");
  document.body.appendChild(host);
  let n = 0;
  const off = bindTap(host, () => n++);
  const ev = (type, x, y, id = 1) =>
    host.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        isPrimary: true,
        pointerId: id,
        clientX: x,
        clientY: y,
        pointerType: "touch",
      }),
    );
  ev("pointerdown", 10, 10);
  ev("pointerup", 10, 10);
  const deliberate = n === 1;
  ev("pointerdown", 10, 10);
  ev("pointerup", 40, 10);
  const swipeRejected = n === 1;
  ev("pointerdown", 10, 10);
  ev("pointerup", 10, 10);
  host.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const duplicatePrevented = n === 2;
  off();
  host.remove();
  return { deliberate, swipeRejected, duplicatePrevented, actions: n };
}
