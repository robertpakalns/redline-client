import {
  createEl,
  formatDuration,
  output,
} from "../../preload/preloadFunctions.js";
import { ipcRenderer } from "electron";

const pieBlocks = new Map<string, HTMLElement>();

const dayToLocaleString = (day: number): string => {
  const date = new Date(day * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString();
};

const hueOf = (i: number, count: number): number => (i * 360) / count;

const colorsFor = (hue: number) => ({
  fill: `hsla(${hue}, 50%, 50%, 0.6)`,
  stroke: `hsla(${hue}, 50%, 50%, 1)`,
});

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

const attachTooltip = (el: SVGElement, text: string, hue: number): void => {
  const tip = getTooltip();
  const base = colorsFor(hue);

  el.setAttribute("vector-effect", "non-scaling-stroke");
  el.style.fill = base.fill;
  el.style.stroke = base.stroke;
  el.style.strokeWidth = "2px";
  el.style.cursor = "pointer";

  el.addEventListener("mouseenter", () => {
    el.style.fill = "#ffffff80";
    el.style.stroke = "white";
    tip.textContent = text;
    tip.style.display = "block";
  });

  el.addEventListener("mousemove", (e: MouseEvent) => {
    tip.style.left = `${e.clientX + 12}px`;
    tip.style.top = `${e.clientY + 12}px`;
  });

  el.addEventListener("mouseleave", () => {
    el.style.fill = base.fill;
    el.style.stroke = base.stroke;
    tip.style.display = "none";
  });
};

const buildLegend = (items: { label: string; hue: number }[]): HTMLElement => {
  const legend = document.createElement("div");
  Object.assign(legend.style, {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "8px",
    fontSize: "12px",
  });

  for (const { label, hue } of items) {
    const item = document.createElement("span");
    Object.assign(item.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    });

    const c = colorsFor(hue);
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

const createPieChart = (
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

  const entries = Object.entries(obj).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    body.textContent = "No data";
    return;
  }

  const svg = svgEl("svg", {
    viewBox: "-1.05 -1.05 2.1 2.1",
    class: "pie",
    overflow: "visible",
  });
  let angle = -Math.PI / 2;

  entries.forEach(([name, value], i) => {
    const hue = hueOf(i, entries.length);
    let el: SVGElement;

    if (entries.length === 1) {
      el = svgEl("circle", { cx: 0, cy: 0, r: 1 });
    } else {
      const slice = (value / total) * 2 * Math.PI;
      const end = angle + slice;
      const [x1, y1] = [Math.cos(angle), Math.sin(angle)];
      const [x2, y2] = [Math.cos(end), Math.sin(end)];
      const large = slice > Math.PI ? 1 : 0;

      el = svgEl("path", {
        d: `M0,0 L${x1},${y1} A1,1 0 ${large},1 ${x2},${y2} Z`,
      });
      angle = end;
    }

    attachTooltip(el, `${name}: ${format(value)}`, hue);
    svg.appendChild(el);
  });

  body.append(
    svg,
    buildLegend(
      entries.map(([name], i) => ({
        label: name,
        hue: hueOf(i, entries.length),
      })),
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

const lastWeekChart = (data: any[]): void => {
  const container = document.getElementById("lastWeekChart");
  if (!container) return;
  if (!(container instanceof HTMLDivElement)) {
    console.warn("#lastWeekChart must be a <div>, not a <canvas>");
  }
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
      hue: hueOf(1, 2),
    },
    {
      label: "In-Game",
      values: days.map((d) => d.gameTimeSpent as number),
      widthRatio: 0.6,
      hue: hueOf(0, 2),
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

    layers.forEach((layer) => {
      const value = layer.values[j];
      if (value <= 0) return;

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
        layer.hue,
      );
      svg.appendChild(bar);
    });

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
    buildLegend([
      { label: "In-Game", hue: hueOf(0, 2) },
      { label: "In Client", hue: hueOf(1, 2) },
    ]),
  );
};

const setValues = (
  totalTimeSpent = 0,
  totalGameTimeSpent = 0,
  totalGamesPlayed = 0,
) => {
  document.getElementById("totalTimeSpentInClient")!.textContent =
    formatDuration(totalTimeSpent);
  document.getElementById("totalTimeSpentInGame")!.textContent =
    formatDuration(totalGameTimeSpent);
  document.getElementById("totalGamesPlayed")!.textContent =
    totalGamesPlayed.toString();
};

const createAnalyticsSection = async (cont: HTMLElement) => {
  getTooltip().style.display = "none";

  const data = JSON.parse(await ipcRenderer.invoke("get-analytics-data"));

  setValues(
    data.totalTimeSpent,
    data.totalGameTimeSpent,
    data.totalGamesPlayed,
  );

  // Last week activity
  lastWeekChart(data.weekData);

  createPieChart(
    cont,
    data.timeSpentPerHost,
    "Time Spent on Proxies",
    "proxies",
    (n) => formatDuration(n),
  );
  createPieChart(
    cont,
    data.timeSpentPerRegion,
    "Time Spent on Regions",
    "regions",
    (n) => formatDuration(n),
  );
  createPieChart(
    cont,
    data.entriesPerRegion,
    "Played matches on Regions",
    "matches",
    (n) => String(n),
  );

  document
    .getElementById("updateAnalyticsData")
    ?.addEventListener("click", () => createAnalyticsSection(cont));
};

export default createAnalyticsSection;
