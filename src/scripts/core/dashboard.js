(() => {
  "use strict";

  const rtmsDataDefaults = {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    speeding: [3, 1, 1, 0, 1, 3, 2, 2, 3, 2, 3, 0],
    shiftHoursText: [
      "12085:00:00",
      "10287:00:00",
      "13396:00:00",
      "10930:00:00",
      "11170:00:00",
      "12223:00:00",
      "14671:00:00",
      "15415:00:00",
      "16748:00:00",
      "15999:00:00",
      "17107:00:00",
      "10053:00:00",
    ],
    accidents: [4, 1, 0, 1, 3, 2, 4, 2, 2, 4, 1, 2],
    longhaulKm: [
      671330, 586344, 710369, 835590, 631983, 693451, 785219, 835590, 831169, 797752, 853065,
      513865,
    ],
    localKm: [
      134187, 116579, 171016, 108678, 98812, 117274, 184989, 196528, 286081, 261201, 287199, 152781,
    ],
    totalKm: [
      805517, 702923, 881385, 944268, 730795, 810725, 970208, 1032118, 1117250, 1058953, 1140264,
      666646,
    ],
  };

  const rtmsCsvPath = "../../public/data/RTMS_monthly_quantitative.csv";
  const numberFormatter = new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 });
  const decimalFormatter = new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 2 });
  let isInitialized = false;

  let rtmsData = rtmsDataDefaults;

  const parseShiftHours = (value) => {
    const [hours] = String(value).split(":");
    const parsed = Number(hours);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const parseNumericValue = (value) => {
    if (!value) return 0;
    const sanitized = String(value).replace(/[^0-9.-]/g, "");
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const parseCsvRows = (csvText) =>
    csvText
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(",").map((cell) => cell.trim()));

  function transformCsvToRtmsData(rows) {
    if (!rows || rows.length < 2) return null;
    const [headers, ...records] = rows;
    const indexes = {
      month: headers.indexOf("Month"),
      speeding: headers.indexOf("SpeedingOccurrences"),
      shiftHours: headers.indexOf("ShiftHours"),
      accidents: headers.indexOf("Accidents"),
      longhaulKm: headers.indexOf("LonghaulKm"),
      localKm: headers.indexOf("LocalKm"),
      totalKm: headers.indexOf("TotalKm"),
    };

    const requiredFields = Object.values(indexes);
    if (requiredFields.some((index) => index < 0)) return null;

    const mapped = {
      months: [],
      speeding: [],
      shiftHoursText: [],
      accidents: [],
      longhaulKm: [],
      localKm: [],
      totalKm: [],
    };

    records.forEach((record) => {
      const month = record[indexes.month] || "";
      if (!month) return;
      mapped.months.push(month);
      mapped.speeding.push(parseNumericValue(record[indexes.speeding]));
      mapped.shiftHoursText.push(record[indexes.shiftHours] || "0:00:00");
      mapped.accidents.push(parseNumericValue(record[indexes.accidents]));
      mapped.longhaulKm.push(parseNumericValue(record[indexes.longhaulKm]));
      mapped.localKm.push(parseNumericValue(record[indexes.localKm]));
      mapped.totalKm.push(parseNumericValue(record[indexes.totalKm]));
    });

    return mapped.months.length ? mapped : null;
  }

  async function loadRtmsData() {
    try {
      const response = await fetch(rtmsCsvPath, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Unable to load RTMS CSV (${response.status})`);
      }
      const csvText = await response.text();
      const parsedRows = parseCsvRows(csvText);
      const transformed = transformCsvToRtmsData(parsedRows);
      if (!transformed) {
        throw new Error("RTMS CSV format is invalid");
      }
      rtmsData = transformed;
    } catch (error) {
      console.warn("Falling back to embedded RTMS defaults:", error);
      rtmsData = rtmsDataDefaults;
    }
  }

  const sumSeries = (series) => series.reduce((sum, value) => sum + value, 0);

  const calcRatePer100k = (countSeries, distanceSeries) =>
    countSeries.map((count, index) => {
      const distance = distanceSeries[index] || 0;
      return distance ? (count / distance) * 100000 : 0;
    });

  function setText(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = value;
  }

  function updateStatCards(shiftHoursNumeric, accidentRates, speedingRates) {
    const totalDistance = sumSeries(rtmsData.totalKm);
    const totalAccidents = sumSeries(rtmsData.accidents);
    const totalSpeeding = sumSeries(rtmsData.speeding);
    const totalShiftHours = sumSeries(shiftHoursNumeric);
    const averageDistance = totalDistance / rtmsData.months.length;
    const averageShift = totalShiftHours / rtmsData.months.length;
    const overallAccidentRate = totalDistance ? (totalAccidents / totalDistance) * 100000 : 0;
    const overallSpeedingRate = totalDistance ? (totalSpeeding / totalDistance) * 100000 : 0;

    setText("stat-total-distance", `${numberFormatter.format(totalDistance)} km`);
    setText("stat-average-distance", `Avg ${numberFormatter.format(averageDistance)} km / month`);
    setText("stat-total-accidents", numberFormatter.format(totalAccidents));
    setText("stat-accident-rate", `${decimalFormatter.format(overallAccidentRate)} per 100k km`);
    setText("stat-total-speeding", numberFormatter.format(totalSpeeding));
    setText("stat-speeding-rate", `${decimalFormatter.format(overallSpeedingRate)} per 100k km`);
    setText("stat-total-shift", `${numberFormatter.format(totalShiftHours)} h`);
    setText("stat-average-shift", `Avg ${numberFormatter.format(averageShift)} h / month`);

    const accidentTrendEl = document.getElementById("stat-accident-rate");
    const speedingTrendEl = document.getElementById("stat-speeding-rate");
    const peakAccidentMonth = accidentRates.indexOf(Math.max(...accidentRates));
    const peakSpeedMonth = speedingRates.indexOf(Math.max(...speedingRates));

    if (accidentTrendEl && peakAccidentMonth > -1) {
      accidentTrendEl.textContent += ` • Peak ${rtmsData.months[peakAccidentMonth]}`;
    }
    if (speedingTrendEl && peakSpeedMonth > -1) {
      speedingTrendEl.textContent += ` • Peak ${rtmsData.months[peakSpeedMonth]}`;
    }
  }

  function buildOperationsChart() {
    const ctx = document.getElementById("operationsChart");
    if (!ctx || typeof Chart === "undefined") return null;

    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: rtmsData.months,
        datasets: [
          {
            label: "Total distance (km)",
            data: rtmsData.totalKm,
            yAxisID: "yDistance",
            backgroundColor: "rgba(15, 179, 108, 0.60)",
            borderRadius: 6,
          },
          {
            type: "line",
            label: "Accidents",
            data: rtmsData.accidents,
            yAxisID: "yIncidents",
            borderColor: "rgba(247, 162, 82, 1)",
            backgroundColor: "transparent",
            pointBackgroundColor: "rgba(247, 162, 82, 1)",
            tension: 0.25,
            pointRadius: 4,
          },
          {
            type: "line",
            label: "Speeding occurrences",
            data: rtmsData.speeding,
            yAxisID: "yIncidents",
            borderColor: "rgba(147, 247, 202, 1)",
            backgroundColor: "transparent",
            pointBackgroundColor: "rgba(147, 247, 202, 1)",
            tension: 0.25,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: {
            labels: { color: "#c8d5cf", font: { family: "Space Grotesk" } },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (context.dataset.label.includes("distance")) {
                  return `${context.dataset.label}: ${numberFormatter.format(value)} km`;
                }
                return `${context.dataset.label}: ${numberFormatter.format(value)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#9aa79f" },
            grid: { color: "rgba(255,255,255,0.04)" },
          },
          yDistance: {
            position: "left",
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "#9aa79f",
              callback: (value) => `${numberFormatter.format(value)} km`,
            },
            title: {
              display: true,
              text: "Distance",
              color: "#c8d5cf",
            },
          },
          yIncidents: {
            position: "right",
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { color: "#9aa79f", stepSize: 1 },
            title: {
              display: true,
              text: "Incidents",
              color: "#c8d5cf",
            },
          },
        },
      },
    });
  }

  function buildFleetMixChart(shiftHoursNumeric) {
    const ctx = document.getElementById("fleetMixChart");
    if (!ctx || typeof Chart === "undefined") return null;

    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: rtmsData.months,
        datasets: [
          {
            label: "Longhaul distance (km)",
            data: rtmsData.longhaulKm,
            backgroundColor: "rgba(15, 179, 108, 0.60)",
            borderRadius: 6,
            stack: "distance",
            yAxisID: "yKm",
          },
          {
            label: "Local distance (km)",
            data: rtmsData.localKm,
            backgroundColor: "rgba(247, 162, 82, 0.60)",
            borderRadius: 6,
            stack: "distance",
            yAxisID: "yKm",
          },
          {
            type: "line",
            label: "Shift hours",
            data: shiftHoursNumeric,
            borderColor: "rgba(147, 247, 202, 1)",
            pointBackgroundColor: "rgba(147, 247, 202, 1)",
            backgroundColor: "transparent",
            tension: 0.25,
            pointRadius: 4,
            yAxisID: "yHours",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: {
            labels: { color: "#c8d5cf", font: { family: "Space Grotesk" } },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: "#9aa79f" },
            grid: { color: "rgba(255,255,255,0.04)" },
          },
          yKm: {
            stacked: true,
            position: "left",
            ticks: {
              color: "#9aa79f",
              callback: (value) => `${numberFormatter.format(value)} km`,
            },
            grid: { color: "rgba(255,255,255,0.04)" },
            title: {
              display: true,
              text: "Distance",
              color: "#c8d5cf",
            },
          },
          yHours: {
            position: "right",
            grid: { drawOnChartArea: false },
            ticks: {
              color: "#9aa79f",
              callback: (value) => `${numberFormatter.format(value)} h`,
            },
            title: {
              display: true,
              text: "Shift hours",
              color: "#c8d5cf",
            },
          },
        },
      },
    });
  }

  function buildTable(accidentRates, speedingRates) {
    const tbody = document.querySelector("#rtms-table tbody");
    if (!tbody) return [];
    tbody.innerHTML = "";

    const rows = rtmsData.months.map((month, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                    <td>${month}</td>
                    <td>${numberFormatter.format(rtmsData.speeding[index])}</td>
                    <td>${rtmsData.shiftHoursText[index]}</td>
                    <td>${numberFormatter.format(rtmsData.accidents[index])}</td>
                    <td>${numberFormatter.format(rtmsData.longhaulKm[index])}</td>
                    <td>${numberFormatter.format(rtmsData.localKm[index])}</td>
                    <td>${numberFormatter.format(rtmsData.totalKm[index])}</td>
                    <td>${decimalFormatter.format(accidentRates[index])}</td>
                    <td>${decimalFormatter.format(speedingRates[index])}</td>
                `;
      tbody.appendChild(row);
      return row;
    });

    return rows;
  }

  function wireTableSearch(rows) {
    const input = document.getElementById("rtms-table-search");
    if (!input) return;

    input.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      rows.forEach((row) => {
        const match = row.textContent.toLowerCase().includes(query);
        row.hidden = Boolean(query) && !match;
        row.classList.toggle("highlight", Boolean(query) && match);
      });
    });
  }

  function wireToggleButtons(chart) {
    if (!chart) return;

    const toggleByLabel = (labelText) => {
      chart.data.datasets.forEach((dataset) => {
        if (dataset.label.toLowerCase().includes(labelText)) {
          dataset.hidden = !dataset.hidden;
        }
      });
      chart.update();
    };

    const accidentsButton = document.getElementById("toggle-accidents");
    const speedingButton = document.getElementById("toggle-speeding");

    if (accidentsButton) {
      accidentsButton.addEventListener("click", () => toggleByLabel("accidents"));
    }
    if (speedingButton) {
      speedingButton.addEventListener("click", () => toggleByLabel("speeding"));
    }
  }

  function wireScrollLinks() {
    document.querySelectorAll("[data-scroll-target]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const targetSelector = trigger.getAttribute("data-scroll-target");
        const target = targetSelector ? document.querySelector(targetSelector) : null;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  async function initializeRtmsDashboard() {
    if (isInitialized) return;
    const dashboardRoot = document.getElementById("rtms-table");
    if (!dashboardRoot) return;

    await loadRtmsData();
    const shiftHoursNumeric = rtmsData.shiftHoursText.map(parseShiftHours);
    const accidentRates = calcRatePer100k(rtmsData.accidents, rtmsData.totalKm);
    const speedingRates = calcRatePer100k(rtmsData.speeding, rtmsData.totalKm);

    updateStatCards(shiftHoursNumeric, accidentRates, speedingRates);
    const operationsChart = buildOperationsChart();
    buildFleetMixChart(shiftHoursNumeric);
    const tableRows = buildTable(accidentRates, speedingRates);

    wireToggleButtons(operationsChart);
    wireTableSearch(tableRows);
    wireScrollLinks();
    isInitialized = true;
  }

  function startDashboard() {
    initializeRtmsDashboard().catch((error) => {
      console.error("Failed to initialize RTMS dashboard:", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDashboard);
  } else {
    startDashboard();
  }
})();
