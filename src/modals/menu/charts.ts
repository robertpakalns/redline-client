import {
  createEl,
  formatDuration,
  output,
} from "../../preload/preloadFunctions.js";

const pieBlocks = new Map<string, HTMLElement>();

const pieIndexes = new Map<string, Map<string, number>>();

const dayToLocaleString = (day: number): string => {
  const date = new Date(day * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString();
};

// Deterministic color for a given index
const colorForIndex = (i: number): { fill: string; stroke: string } => {
  const hue = (i * 137.508) % 360;
  const lightness = [45, 65, 55][i % 3];
  return {
    fill: `hsla(${hue}, 65%, ${lightness}%, 0.7)`,
    stroke: `hsla(${hue}, 65%, ${lightness}%, 1)`,
  };
};

const stableIndexes = (key: string, names: string[]): Map<string, number> => {
  let registry = pieIndexes.get(key);
  if (!registry) {
    registry = new Map();
    pieIndexes.set(key, registry);
  }
  for (const name of [...names].sort()) {
    if (!registry.has(name)) registry.set(name, registry.size);
  }
  return registry;
};

const svgEl = (
  tag: string,
  attrs: Record<string, string | number> = {},
): SVGElement => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

const getTooltip = (): HTMLDivElement => {
  let tip = document.getElementById("chart-tooltip") as HTMLDivElement | null;
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "chart-tooltip";
    Object.assign(tip.style, {
      position: "fixed",
      display: "none",
      pointerEvents: "none",
      padding: "4px 8px",
      borderRadius: "4px",
      background: "rgba(0, 0, 0, 0.8)",
      color: "white",
      fontSize: "12px",
      whiteSpace: "nowrap",
    });
    document.body.appendChild(tip);
  }
  return tip;
};

export const hideTooltip = (): void => {
  getTooltip().style.display = "none";
};

const attachTooltip = (
  el: SVGElement,
  text: string,
  i: number,
  edges: SVGElement[] = [],
): void => {
  const tip = getTooltip();
  const base = colorForIndex(i);

  el.setAttribute("vector-effect", "non-scaling-stroke");
  el.setAttribute("stroke-linejoin", "round");
  el.style.fill = base.fill;
  el.style.stroke = base.stroke;
  el.style.strokeWidth = "2px";
  el.style.cursor = "pointer";

  el.addEventListener("mouseenter", () => {
    el.style.fill = "#ffffff80";
    if (edges.length) {
      edges.forEach((e) => (e.style.stroke = "white"));
    } else {
      el.style.stroke = "white";
    }
    tip.textContent = text;
    tip.style.display = "block";
  });

  el.addEventListener("mousemove", (e: MouseEvent) => {
    tip.style.left = `${e.clientX + 12}px`;
    tip.style.top = `${e.clientY + 12}px`;
  });

  el.addEventListener("mouseleave", () => {
    el.style.fill = base.fill;
    if (edges.length) {
      edges.forEach((e) => (e.style.stroke = "none"));
    } else {
      el.style.stroke = base.stroke;
    }
    tip.style.display = "none";
  });
};

const radialEdge = (a: number): SVGElement => {
  const line = svgEl("line", {
    x1: 0,
    y1: 0,
    x2: Math.cos(a),
    y2: Math.sin(a),
  });
  line.setAttribute("vector-effect", "non-scaling-stroke");
  line.setAttribute("stroke-linecap", "round");
  line.style.strokeWidth = "2px";
  line.style.stroke = "none";
  line.style.pointerEvents = "none";
  return line;
};

const arcEdge = (start: number, end: number): SVGElement => {
  const large = end - start > Math.PI ? 1 : 0;
  const arc = svgEl("path", {
    d: `M${Math.cos(start)},${Math.sin(start)} A1,1 0 ${large},1 ${Math.cos(end)},${Math.sin(end)}`,
  });

  arc.setAttribute("vector-effect", "non-scaling-stroke");
  arc.setAttribute("stroke-linecap", "round");
  arc.style.fill = "none";
  arc.style.strokeWidth = "2px";
  arc.style.stroke = "none";
  arc.style.pointerEvents = "none";

  return arc;
};

const buildLegend = (
  items: { label: string; index: number }[],
): HTMLElement => {
  const legend = document.createElement("div");
  Object.assign(legend.style, {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "8px",
    fontSize: "12px",
  });

  for (const { label, index } of items) {
    const item = document.createElement("span");
    Object.assign(item.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    });

    const c = colorForIndex(index);
    const dot = document.createElement("span");
    Object.assign(dot.style, {
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      background: c.fill,
      border: `1px solid ${c.stroke}`,
    });

    item.append(dot, label);
    legend.appendChild(item);
  }
  return legend;
};

export const createPieChart = (
  cont: HTMLElement,
  obj: Record<string, number>,
  label: string,
  key: string,
  format: (n: number) => string,
): void => {
  let block = pieBlocks.get(key);
  if (!block) {
    block = createEl("div", {}, "chartBlock") as HTMLElement;
    block.append(createEl("h1", {}, "", [label]));
    cont.appendChild(block);
    pieBlocks.set(key, block);
  }

  block.querySelector(".chart-body")?.remove();
  const body = document.createElement("div");
  body.className = "chart-body";
  block.appendChild(body);

  const nonZero = Object.entries(obj).filter(([, v]) => v > 0);
  const total = nonZero.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    body.textContent = "No data";
    return;
  }

  const registry = stableIndexes(
    key,
    nonZero.map(([name]) => name),
  );
  const entries = nonZero.sort(
    ([a], [b]) => registry.get(a)! - registry.get(b)!,
  );

  const svg = svgEl("svg", {
    viewBox: "-1.05 -1.05 2.1 2.1",
    class: "pie",
    overflow: "visible",
  });

  const starts: number[] = [];
  let angle = -Math.PI / 2;
  for (const [, value] of entries) {
    starts.push(angle);
    angle += (value / total) * 2 * Math.PI;
  }

  const boundaries = entries.length > 1 ? starts.map((a) => radialEdge(a)) : [];
  svg.append(...boundaries);

  entries.forEach(([name, value], i) => {
    const index = registry.get(name)!;
    let el: SVGElement;
    let edges: SVGElement[] = [];

    if (entries.length === 1) {
      el = svgEl("circle", { cx: 0, cy: 0, r: 1 });
    } else {
      const start = starts[i];
      const slice = (value / total) * 2 * Math.PI;
      const end = start + slice;
      const [x1, y1] = [Math.cos(start), Math.sin(start)];
      const [x2, y2] = [Math.cos(end), Math.sin(end)];
      const large = slice > Math.PI ? 1 : 0;

      el = svgEl("path", {
        d: `M0,0 L${x1},${y1} A1,1 0 ${large},1 ${x2},${y2} Z`,
      });

      const arc = arcEdge(start, end);
      svg.appendChild(arc);

      edges = [boundaries[i], boundaries[(i + 1) % entries.length], arc];
    }

    attachTooltip(el, `${name}: ${format(value)}`, index, edges);
    svg.insertBefore(el, boundaries[0] ?? null);
  });

  body.append(
    svg,
    buildLegend(
      entries.map(([name]) => ({ label: name, index: registry.get(name)! })),
    ),
  );
};

const niceMax = (v: number): number => {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
};

const roundedTopBar = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string =>
  `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} ` +
  `L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h}`;

export const lastWeekChart = (data: any[]): void => {
  const container = document.getElementById("lastWeekChart");
  if (!container) return;
  container.replaceChildren();

  if (!data.length) {
    container.textContent = "No data";
    return;
  }

  const W = 800;
  const H = 340;
  const m = { top: 16, right: 16, bottom: 48, left: 110 };
  const plotW = W - m.left - m.right;
  const plotH = H - m.top - m.bottom;

  const days = [...data].reverse();
  const labels = days.map((d) => dayToLocaleString(d.date));

  const layers = [
    {
      label: "In Client",
      values: days.map((d) => d.totalTimeSpent as number),
      widthRatio: 0.8,
    },
    {
      label: "In-Game",
      values: days.map((d) => d.gameTimeSpent as number),
      widthRatio: 0.6,
    },
  ];

  const maxValue = Math.max(...layers.flatMap((l) => l.values));
  const max = niceMax(maxValue);

  const [unit, divisor] =
    maxValue < 60000
      ? ["second", 1000]
      : maxValue < 3600000
        ? ["minute", 60000]
        : ["hour", 3600000];

  const svg = svgEl("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "bar-chart",
    preserveAspectRatio: "xMidYMid meet",
    overflow: "visible",
  });

  for (let i = 0; i <= 4; i++) {
    const value = (max * i) / 4;
    const y = m.top + plotH - (value / max) * plotH;

    svg.appendChild(
      svgEl("line", {
        x1: m.left,
        x2: W - m.right,
        y1: y,
        y2: y,
        class: "grid-line",
      }),
    );

    const tick = svgEl("text", {
      x: m.left - 8,
      y,
      "text-anchor": "end",
      "dominant-baseline": "central",
      class: "axis-text",
    });
    tick.textContent = String(output((value / divisor).toFixed(2), unit));
    svg.appendChild(tick);
  }

  const colWidth = plotW / days.length;

  days.forEach((_, j) => {
    const cx = m.left + colWidth * (j + 0.5);

    const drawOrder = layers
      .map((layer, index) => ({ layer, index }))
      .sort((a, b) => b.layer.widthRatio - a.layer.widthRatio);

    for (const { layer, index } of drawOrder) {
      const value = layer.values[j];
      if (value <= 0) continue;

      const barWidth = colWidth * 0.8 * layer.widthRatio;
      const top = m.top + plotH - (value / max) * plotH;
      const height = m.top + plotH - top;
      const r = Math.min(6, barWidth / 2, height);

      const bar = svgEl("path", {
        d: roundedTopBar(cx - barWidth / 2, top, barWidth, height, r),
      });

      attachTooltip(
        bar,
        `${labels[j]} · ${layer.label}: ${formatDuration(value)}`,
        index,
      );
      svg.appendChild(bar);
    }

    const xLabel = svgEl("text", {
      x: cx,
      y: m.top + plotH + 22,
      "text-anchor": "middle",
      class: "axis-text",
    });
    xLabel.textContent = labels[j];
    svg.appendChild(xLabel);
  });

  container.append(
    svg,
    buildLegend(layers.map((l, index) => ({ label: l.label, index }))),
  );
};
