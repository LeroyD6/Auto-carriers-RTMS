(() => {
  "use strict";

  const emissionConfig = {
    labels: [
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
    series: {
      2024: [
        968928.5, 1130023, 816683, 618009.9, 606827.4, 861581.1, 620495.8, 635687, 576068,
        1310736.6, 1193778.8, 690519.5,
      ],
      2025: [
        900508.5, 1072075.9, 1392782.9, 1059320.4, 979158.3, 993335.1, 1474883.6, 1377606.3,
        1491469.7, 1584296.9, 1596951.1, 755148.1,
      ],
    },
    baselineYear: "2024",
    currentYear: "2025",
  };

  const csvFilePath = "../../public/data/KMS1.csv";
  const numberFormatter = new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 });
  const decimalFormatter = new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 1 });
  const intensityFormatter = new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 2 });
  const state = {
    emissionTotals: {},
    kilometerTotals: {},
  };
  let myChart;

  function initializeChart() {
    const ctx = document.getElementById("myChart");
    if (!ctx || typeof Chart === "undefined") return;
    if (myChart) {
      myChart.destroy();
    }

    myChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: emissionConfig.labels,
        datasets: [
          {
            label: emissionConfig.baselineYear,
            data: emissionConfig.series[emissionConfig.baselineYear],
            fill: false,
            tension: 0.25,
            borderColor: "rgba(247, 162, 82, 1)",
            pointBackgroundColor: "rgba(247, 162, 82, 1)",
            pointRadius: 4,
            borderWidth: 3,
          },
          {
            label: emissionConfig.currentYear,
            data: emissionConfig.series[emissionConfig.currentYear],
            fill: false,
            tension: 0.25,
            borderColor: "rgba(15, 179, 108, 1)",
            pointBackgroundColor: "rgba(15, 179, 108, 1)",
            pointRadius: 4,
            borderWidth: 3,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#c8d5cf",
              font: {
                family: "Space Grotesk",
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(3, 12, 8, 0.9)",
            borderColor: "rgba(147, 247, 202, 0.3)",
            borderWidth: 1,
            padding: 12,
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
            },
            ticks: {
              color: "#9aa79f",
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.08)",
            },
            ticks: {
              color: "#9aa79f",
              callback: (value) => `${numberFormatter.format(value)} kg`,
            },
            title: {
              display: true,
              text: "Total CO2-e emissions [kg]",
              color: "#c8d5cf",
            },
          },
        },
        maintainAspectRatio: false,
      },
    });
  }

  function populateEmissionStats() {
    const baselineTotal = sumSeries(emissionConfig.baselineYear);
    const currentTotal = sumSeries(emissionConfig.currentYear);
    const changeRatio = baselineTotal ? (currentTotal - baselineTotal) / baselineTotal : 0;
    const percentText = `${changeRatio > 0 ? "+" : ""}${decimalFormatter.format(
      changeRatio * 100
    )}% YoY`;
    setText("stat-total", `${numberFormatter.format(currentTotal)} kg`);
    const changeEl = document.getElementById("stat-change");
    if (changeEl) {
      changeEl.textContent = percentText;
      changeEl.classList.toggle("negative", changeRatio > 0);
      changeEl.classList.toggle("positive", changeRatio <= 0);
    }
    const extremes = getExtremes(emissionConfig.currentYear);
    setText(
      "stat-peak",
      `${extremes.max.month} - ${numberFormatter.format(extremes.max.value)} kg`
    );
    setText(
      "stat-best",
      `${extremes.min.month} - ${numberFormatter.format(extremes.min.value)} kg`
    );
    setText("baseline-year-copy", emissionConfig.baselineYear);
    setText("current-year-copy", emissionConfig.currentYear);
    setText("baseline-total", numberFormatter.format(baselineTotal));
    setText("current-total", numberFormatter.format(currentTotal));
    setText("carousel-change", percentText);
    state.emissionTotals[emissionConfig.baselineYear] = baselineTotal;
    state.emissionTotals[emissionConfig.currentYear] = currentTotal;
    updateIntensityStat();
  }

  function sumSeries(year) {
    const series = emissionConfig.series[year] || [];
    return series.reduce((sum, value) => sum + value, 0);
  }

  function getExtremes(year) {
    const series = emissionConfig.series[year] || [];
    let max = { month: "-", value: 0 };
    let min = { month: "-", value: Number.POSITIVE_INFINITY };
    series.forEach((value, index) => {
      const month = emissionConfig.labels[index];
      if (value > max.value) {
        max = { month, value };
      }
      if (value < min.value) {
        min = { month, value };
      }
    });
    return { max, min };
  }

  async function loadKilometerData() {
    try {
      const response = await fetch(csvFilePath);
      if (!response.ok) throw new Error("Unable to load fleet CSV");
      const csvText = await response.text();
      const parsed = parseCsv(csvText);
      const pivot = pivotKilometerData(parsed);
      if (!pivot) return;
      const tableRows = renderKilometerTable(pivot);
      setupTableSearch(tableRows);
      updateKilometerStats(pivot);
    } catch (error) {
      console.error(error);
      setText("stat-kms", "N/A");
      setText("stat-kms-delta", "Fleet data unavailable");
    }
  }

  function parseCsv(text) {
    return text
      .trim()
      .split(/\r?\n/)
      .map((row) => row.split(",").map((cell) => cell.replace(/\s+/g, " ").trim()));
  }

  function pivotKilometerData(data) {
    const [headers, ...rows] = data;
    if (!headers || rows.length === 0) return null;
    const months = headers.slice(1).map((header) => header.replace(/\s+/g, "").trim());
    const yearProfiles = rows
      .map((row) => ({
        year: row[0].replace(/\s+/g, "").trim(),
        values: row.slice(1).map(parseNumericValue),
      }))
      .filter((profile) => profile.year);
    yearProfiles.sort((a, b) => {
      const yearA = parseInt(a.year, 10);
      const yearB = parseInt(b.year, 10);
      if (!Number.isNaN(yearA) && !Number.isNaN(yearB)) {
        return yearA - yearB;
      }
      return a.year.localeCompare(b.year);
    });
    const pivotRows = months.map((month, monthIndex) => {
      const record = { month };
      yearProfiles.forEach((profile) => {
        record[profile.year] = profile.values[monthIndex];
      });
      if (yearProfiles.length >= 2) {
        const baselineYear = yearProfiles[0].year;
        const latestYear = yearProfiles[yearProfiles.length - 1].year;
        record.variance = record[latestYear] - record[baselineYear];
      }
      return record;
    });
    const totals = yearProfiles.reduce((acc, profile) => {
      acc[profile.year] = profile.values.reduce((sum, value) => sum + value, 0);
      return acc;
    }, {});
    return { rows: pivotRows, years: yearProfiles.map((profile) => profile.year), totals };
  }

  function parseNumericValue(value) {
    if (!value) return 0;
    const sanitized = value.replace(/[^0-9.-]/g, "");
    return Number(sanitized) || 0;
  }

  function renderKilometerTable(pivot) {
    const table = document.getElementById("data-table");
    if (!table) return [];
    const tableHeaders = ["Month", ...pivot.years.map((year) => `${year} km`)];
    if (pivot.years.length >= 2) {
      tableHeaders.push("Delta km");
    }
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const headerRow = document.createElement("tr");
    tableHeaders.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    pivot.rows.forEach((row) => {
      const tr = document.createElement("tr");
      const monthCell = document.createElement("td");
      monthCell.textContent = row.month;
      tr.appendChild(monthCell);
      pivot.years.forEach((year) => {
        const td = document.createElement("td");
        td.textContent = numberFormatter.format(row[year]);
        tr.appendChild(td);
      });
      if (typeof row.variance === "number") {
        const varianceCell = document.createElement("td");
        varianceCell.textContent = `${row.variance >= 0 ? "+" : ""}${numberFormatter.format(
          row.variance
        )}`;
        varianceCell.classList.add(row.variance > 0 ? "variance-positive" : "variance-negative");
        tr.appendChild(varianceCell);
      }
      tbody.appendChild(tr);
    });
    table.innerHTML = "";
    table.appendChild(thead);
    table.appendChild(tbody);
    return Array.from(tbody.querySelectorAll("tr"));
  }

  function setupTableSearch(tableRows) {
    const searchInput = document.getElementById("tableSearch");
    if (!searchInput) return;
    searchInput.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      tableRows.forEach((row) => {
        const match = row.textContent.toLowerCase().includes(query);
        row.hidden = Boolean(query) && !match;
        row.classList.toggle("highlight", Boolean(query) && match);
      });
    });
  }

  function updateKilometerStats(pivot) {
    const desiredBaseline = emissionConfig.baselineYear;
    const desiredCurrent = emissionConfig.currentYear;
    const baselineYear =
      pivot.totals[desiredBaseline] !== undefined ? desiredBaseline : pivot.years[0];
    const latestYear =
      pivot.totals[desiredCurrent] !== undefined
        ? desiredCurrent
        : pivot.years[pivot.years.length - 1];
    const latestTotal = pivot.totals[latestYear] || 0;
    const baselineTotal = pivot.totals[baselineYear] || 0;
    setText("stat-kms", `${numberFormatter.format(latestTotal)} km`);
    const deltaElement = document.getElementById("stat-kms-delta");
    if (deltaElement && baselineTotal) {
      const delta = latestTotal - baselineTotal;
      const percent = baselineTotal ? (delta / baselineTotal) * 100 : 0;
      deltaElement.textContent = `${delta >= 0 ? "+" : ""}${numberFormatter.format(
        delta
      )} km (${decimalFormatter.format(percent)}% vs ${baselineYear})`;
    }
    state.kilometerTotals[baselineYear] = baselineTotal;
    state.kilometerTotals[latestYear] = latestTotal;
    updateIntensityStat();
  }

  function updateIntensityStat() {
    const baselineYear = emissionConfig.baselineYear;
    const currentYear = emissionConfig.currentYear;
    const currentEmissions = state.emissionTotals[currentYear];
    const baselineEmissions = state.emissionTotals[baselineYear];
    const currentKilometers = state.kilometerTotals[currentYear];
    const baselineKilometers = state.kilometerTotals[baselineYear];

    const missingData = [
      currentEmissions,
      baselineEmissions,
      currentKilometers,
      baselineKilometers,
    ].some((value) => typeof value !== "number" || value <= 0);
    if (missingData) {
      return;
    }

    const currentIntensity = currentEmissions / currentKilometers;
    const baselineIntensity = baselineEmissions / baselineKilometers;
    setText("stat-intensity", `${intensityFormatter.format(currentIntensity)} kg/km`);
    const deltaElement = document.getElementById("stat-intensity-delta");
    if (deltaElement && baselineIntensity) {
      const deltaPercent = ((currentIntensity - baselineIntensity) / baselineIntensity) * 100;
      deltaElement.textContent = `${deltaPercent >= 0 ? "+" : ""}${decimalFormatter.format(
        deltaPercent
      )}% vs ${baselineYear}`;
    }
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element && typeof value !== "undefined") {
      element.textContent = value;
    }
  }

  function wireScrollLinks() {
    document.querySelectorAll("[data-scroll-target]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        if (trigger.tagName.toLowerCase() === "a") {
          event.preventDefault();
        }
        const selector = trigger.getAttribute("data-scroll-target");
        const target = selector ? document.querySelector(selector) : null;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function wireDownloadButton() {
    const downloadButton = document.getElementById("downloadCsv");
    if (!downloadButton) return;
    downloadButton.addEventListener("click", () => {
      window.open(csvFilePath, "_blank");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeChart();
    populateEmissionStats();
    loadKilometerData();
    wireScrollLinks();
    wireDownloadButton();
  });
})();
