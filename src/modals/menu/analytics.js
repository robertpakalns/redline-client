import { Chart, PieController, ArcElement, Tooltip, Legend } from "chart.js"
import { getAllData } from "../../../src-rust/analytics/index.js"

Chart.register(PieController, ArcElement, Tooltip, Legend)

const proxyChart = data => {
    const proxyMap = {}

    data.forEach(el => {
        if (!proxyMap[el.host]) proxyMap[el.host] = 0
        proxyMap[el.host] += parseFloat((el.duration / 3600000).toFixed(4))
    })

    const labels = Object.keys(proxyMap)
    const durations = Object.values(proxyMap)

    const generateColors = (arr, i) => {
        const hue = (i * 360 / arr.length) % 360
        return {
            bg: `hsl(${hue}, 70%, 50%)`,
            border: `hsl(${hue}, 70%, 70%)`
        }
    }

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
                legend: { labels: { usePointStyle: true, boxHeight: 10 } },
                tooltip: { callbacks: { label: el => `${Math.round(el.raw * 10000) / 10000} hours` } }
            }
        }
    })
}

const setValues = data => {
    let clientTime = 0
    let gameTime = 0

    data.forEach(el => {
        if (el.path.startsWith("/games/")) gameTime += el.duration
        clientTime += el.duration
    })

    const clientHours = parseFloat((clientTime / 3600000).toFixed(4))
    const gameHours = parseFloat((gameTime / 3600000).toFixed(4))

    document.getElementById("totalTimeSpentInClient").textContent = `${clientHours} hours`
    document.getElementById("totalTimeSpentInGame").textContent = `${gameHours} hours`
}

const createAnalyticsSection = async () => {
    const entries = getAllData()

    proxyChart(entries)
    setValues(entries)
}

export default createAnalyticsSection