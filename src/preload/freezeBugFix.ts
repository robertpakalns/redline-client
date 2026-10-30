(() => {
  if (window.__rafYieldInstalled) return;
  window.__rafYieldInstalled = true;

  const _requestAnimationFrame = window.requestAnimationFrame.bind(window);
  const _cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

  // One normal-priority task hop per requestAnimationFrame registration
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

  let seq = 0;
  const pending = new Map();

  window.requestAnimationFrame = (cb) => {
    const id = ++seq;
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
    const entry = pending.get(id);
    if (!entry) return _cancelAnimationFrame(id);

    pending.delete(id);
    if (entry.raf) _cancelAnimationFrame(entry.raf);
  };
})();
