import {
  Chart,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
} from "chart.js";
import {
  createEl,
  formatDuration,
  output,
} from "../../preload/preloadFunctions.js";
import type { TooltipItem } from "chart.js";
import { ipcRenderer } from "electron";

Chart.register(
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
);

let pieCharts: Record<string, Chart<"pie">> = {};

const generateColors = (
  arr: string[],
  i: number,
): { bg: string; border: string } => {
  const hue = ((i * 360) / arr.length) % 360;
  return {
    bg: `hsla(${hue}, 50%, 50%, 0.6)`,
    border: `hsla(${hue}, 50%, 50%, 1)`,
  };
};

const createPieChart = (
  cont: HTMLElement,
  obj: object,
  label: string,
  key: string,
  labelCallback: (tooltipItem: TooltipItem<"pie">) => string | void | string[],
): void => {
  const labels = Object.keys(obj);
  const data = Object.values(obj);

  const colors = labels.map((_, i) => generateColors(labels, i));

  if (pieCharts[key]) {
    const chart = pieCharts[key];
    chart.data.labels = labels;
    chart.data.datasets[0].data = data as number[];
    chart.data.datasets[0].backgroundColor = colors.map((c) => c.bg);
    chart.data.datasets[0].borderColor = colors.map((c) => c.border);
    chart.update();
    return;
  }

  const chartCont = createEl("div", {}, "chartBlock") as HTMLElement;
  const canvas = createEl("canvas", {}, "pie-chart") as HTMLCanvasElement;
  const labelCont = createEl("h1", {}, "", [label]);

  chartCont.append(labelCont, canvas);
  cont.appendChild(chartCont);

  const ctx = canvas?.getContext("2d");

  pieCharts[key] = new Chart(ctx!, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.map((c) => c.bg),
          borderColor: colors.map((c) => c.border),
          borderWidth: 2,
          hoverBackgroundColor: "#ffffff80",
          hoverBorderColor: "white",
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { usePointStyle: true, boxHeight: 5 } },
        tooltip: {
          usePointStyle: true,
          callbacks: {
            label: labelCallback,
            labelPointStyle: () => ({ pointStyle: "circle", rotation: 0 }),
          },
        },
      },
    },
  });
};

const lastWeekChart = (data: object[]): void => {
  const labels = data.map((el: any) => el.date).reverse();
  const gameTimes = data.map((el: any) => el.gameTimeSpent);
  const totalTimes = data.map((el: any) => el.totalTimeSpent);

  const maxTime = Math.max(...totalTimes);
  const [unit, divisor] =
    maxTime < 60000
      ? ["second", 1000]
      : maxTime < 3600000
        ? ["minute", 60000]
        : ["hour", 3600000];

  const ctx = (
    document.getElementById("lastWeekChart") as HTMLCanvasElement
  )?.getContext("2d");

  const existingChart = Chart.getChart(ctx!);
  if (existingChart) existingChart.destroy();

  const categories = ["In-Game", "In Client"];
  const times = [gameTimes, totalTimes];
  const colors = categories.map((_, i) => generateColors(categories, i));

  const datasets = categories.map((label, i) => ({
    label,
    data: times[i].reverse(),
    borderColor: colors[i].border,
    backgroundColor: colors[i].bg,
    borderWidth: 2,
    borderRadius: 10,
    hoverBackgroundColor: "#ffffff80",
    hoverBorderColor: "white",
    barPercentage: 0.6 + i * 0.2,
  }));

  new Chart(ctx!, {
    type: "bar",
    data: { labels, datasets },
    options: {
      scales: {
        x: { stacked: true },
        y: {
          ticks: {
            callback: (value) =>
              output(((value as number) / divisor).toFixed(2), unit),
          },
        },
      },
      plugins: {
        legend: { labels: { usePointStyle: true, boxHeight: 5 } },
        tooltip: {
          usePointStyle: true,
          callbacks: {
            label: (el) => formatDuration(el.raw as number),
            labelPointStyle: () => ({ pointStyle: "circle", rotation: 0 }),
          },
        },
      },
    },
  });
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
    (el: any) => formatDuration(el.raw),
  );
  createPieChart(
    cont,
    data.timeSpentPerRegion,
    "Time Spent on Regions",
    "regions",
    (el: any) => formatDuration(el.raw),
  );
  createPieChart(
    cont,
    data.entriesPerRegion,
    "Played matches on Regions",
    "matches",
    (el: any) => el.raw,
  );

  document
    .getElementById("updateAnalyticsData")
    ?.addEventListener("click", () => createAnalyticsSection(cont));
};

export default createAnalyticsSection;
