(() => {
  if (window.__rafYieldInstalled) return;
  window.__rafYieldInstalled = true;

  const _requestAnimationFrame = window.requestAnimationFrame.bind(window);
  const _cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

  // While the button is held, force a yield at most once per this many ms.
  // Lower = safer against the freeze; higher = smoother. Try 4 / 8 / 16
  const HOP_INTERVAL_MS = 8;
  let lastHop = 0;

  // Left button state (capture phase, registered before any page script)
  let held = false;
  const track = (event) => {
    held = (event.buttons & 1) !== 0;
  };
  const opts = { capture: true, passive: true };
  window.addEventListener("mousedown", track, opts);
  window.addEventListener("mousemove", track, opts);
  window.addEventListener("mouseup", track, opts);
  window.addEventListener("blur", () => {
    held = false;
  });

  // One normal-priority task hop per deferred rAF registration
  const { port1, port2 } = new MessageChannel();
  const jobs = [];

  port1.onmessage = () => {
    const job = jobs.shift();
    if (job) job();
  };

  const hop = (fn) => {
    jobs.push(fn);
    port2.postMessage(0);
  };

  // Deferred requests get negative ids so they can't collide with real (positive) ids
  let seq = 0;
  const pending = new Map();

  window.requestAnimationFrame = (cb) => {
    if (!held) return _requestAnimationFrame(cb);

    // Not time to yield yet: let frames run back to back
    const now = performance.now();
    if (now - lastHop < HOP_INTERVAL_MS) return _requestAnimationFrame(cb);
    lastHop = now;

    const id = -++seq;
    const entry = { raf: 0 };
    pending.set(id, entry);

    hop(() => {
      if (!pending.has(id)) return; // Cancelled while waiting for the hop

      entry.raf = _requestAnimationFrame((timestamp) => {
        pending.delete(id);
        cb(timestamp);
      });
    });

    return id;
  };

  window.cancelAnimationFrame = (id) => {
    if (id >= 0) return _cancelAnimationFrame(id);

    const entry = pending.get(id);
    if (!entry) return;

    pending.delete(id);
    if (entry.raf) _cancelAnimationFrame(entry.raf);
  };
})();
