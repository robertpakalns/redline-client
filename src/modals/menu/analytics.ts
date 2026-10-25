import { createPieChart, hideTooltip, lastWeekChart } from "./charts.js";
import { formatDuration } from "../../preload/preloadFunctions.js";
import { ipcRenderer } from "electron";

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
  hideTooltip();

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

  const button = document.getElementById("updateAnalyticsData");
  if (button) {
    button.onclick = () => createAnalyticsSection(cont);
  }
};

export default createAnalyticsSection;
