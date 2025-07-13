import { Chart, PieController, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController } from "chart.js"
import { getAllData } from "../../../src-rust/analytics/index.js"
import { formatDuration, output } from "../../utils/functions.js"

Chart.register(PieController, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController)

const generateColors = (arr, i) => {
    const hue = (i * 360 / arr.length) % 360
    return {
        bg: `hsla(${hue}, 50%, 50%, 0.6)`,
        border: `hsla(${hue}, 50%, 50%, 1)`
    }
}

const proxyChart = data => {

    const labels = Object.keys(data)
    const durations = Object.values(data)

    const colors = labels.map((_, i) => generateColors(labels, i))

    const ctx = document.getElementById("durationByHostChart").getContext("2d")

    const existingChart = Chart.getChart(ctx)
    if (existingChart) existingChart.destroy()

    new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: durations,
                backgroundColor: colors.map(c => c.bg),
                borderColor: colors.map(c => c.border),
                borderWidth: 2,
                hoverBackgroundColor: "#ffffff80",
                hoverBorderColor: "white"
            }]
        },
        options: {
            plugins: {
                legend: { labels: { usePointStyle: true, boxHeight: 5 } },
                tooltip: {
                    usePointStyle: true,
                    callbacks: {
                        label: el => formatDuration(el.raw, "hour"),
                        labelPointStyle: () => ({ pointStyle: "circle" })
                    }
                }
            }
        }
    })
}

const lastWeekChart = data => {
    const labels = data.map(el => el.date).reverse()
    const gameTimes = data.map(el => el.gameTimeSpent)
    const totalTimes = data.map(el => el.totalTimeSpent - el.gameTimeSpent)

    const maxTime = Math.max(...gameTimes, ...totalTimes)

    const [unit, divisor] = maxTime < 60000 ? ["second", 1000] : maxTime < 3600000 ? ["minute", 60000] : ["hour", 3600000]

    const ctx = document.getElementById("lastWeekChart").getContext("2d")

    const existingChart = Chart.getChart(ctx)
    if (existingChart) existingChart.destroy()

    const categories = ["In-Game", "In Client"]
    const times = [gameTimes, totalTimes]
    const colors = categories.map((_, i) => generateColors(categories, i))

    const datasets = categories.map((label, i) => ({
        label,
        data: times[i],
        borderColor: colors[i].border,
        backgroundColor: colors[i].bg,
        borderWidth: 2,
        borderRadius: 10,
        hoverBackgroundColor: "#ffffff80",
        hoverBorderColor: "white",
        barPercentage: 0.6 + i * 0.2,
    }))

    new Chart(ctx, {
        type: "bar",
        data: { labels, datasets },
        options: {
            scales: {
                x: { stacked: true },
                y: { ticks: { callback: value => output((value / divisor).toFixed(2), unit) } }
            },
            plugins: {
                legend: { labels: { usePointStyle: true, boxHeight: 5 } },
                tooltip: {
                    usePointStyle: true,
                    callbacks: {
                        label: el => formatDuration(el.raw, unit),
                        labelPointStyle: () => ({ pointStyle: "circle" })
                    }
                }
            }
        }
    })
}

const setValues = ({ totalTimeSpent = 0, totalGameTimeSpent = 0 }) => {
    document.getElementById("totalTimeSpentInClient").textContent = formatDuration(totalTimeSpent)
    document.getElementById("totalTimeSpentInGame").textContent = formatDuration(totalGameTimeSpent)
}

const createAnalyticsSection = async () => {
    const { entries, totalTimeSpent, totalGameTimeSpent, timeSpentPerHost, weekData } = getAllData()

    console.log({ entries, totalTimeSpent, totalGameTimeSpent, timeSpentPerHost, weekData })

    proxyChart(timeSpentPerHost)
    lastWeekChart(weekData)
    setValues({ totalTimeSpent, totalGameTimeSpent })

    document.getElementById("updateAnalyticsData").addEventListener("click", createAnalyticsSection)
}

export default createAnalyticsSection