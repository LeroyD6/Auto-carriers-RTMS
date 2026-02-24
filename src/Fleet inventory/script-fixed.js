document.addEventListener("DOMContentLoaded", function () {
  console.log("Fleet Inventory script starting...");

  const loading = document.getElementById("cards-loading");
  const container = document.getElementById("cards-container");

  if (!loading) {
    console.error("Loading element not found");
    return;
  }

  if (!container) {
    console.error("Container element not found");
    return;
  }

  console.log("Elements found, attempting to load CSV...");

  // Check if Papa Parse is available
  if (typeof Papa === "undefined") {
    console.error("Papa Parse library not loaded");
    showError("CSV parser not available. Please check the PapaParse library.", loading, container);
    return;
  }

  // Try to load the CSV file
  Papa.parse("data.csv", {
    download: true,
    header: true,
    complete: function (results) {
      console.log("CSV loaded successfully:", results);

      if (results.errors && results.errors.length > 0) {
        console.warn("CSV parsing warnings:", results.errors);
      }

      try {
        if (results.data && results.data.length > 0) {
          displayFleetCards(results.data);
        } else {
          console.warn("No data in CSV, using fallback");
          showFallbackData();
        }
      } catch (e) {
        console.error("Error displaying fleet cards:", e);
        showError("Failed to display fleet data: " + e.message, loading, container);
      }
    },
    error: function (err) {
      console.error("CSV loading failed:", err);
      console.log("Using fallback data instead");
      showFallbackData();
    },
  });

  // Timeout fallback
  setTimeout(function () {
    if (loading && loading.parentNode) {
      console.warn("CSV loading timed out, using fallback data");
      showFallbackData();
    }
  }, 3000);

  function showError(message, loading, container) {
    if (loading) loading.remove();
    container.innerHTML = `<div class="col-12"><div class="rtms-error">${message}</div></div>`;
  }

  function showFallbackData() {
    console.log("Showing fallback data");

    // Sample fleet data
    const sampleData = [
      {
        fleet_number: "EV1",
        HR: "KXB413MP",
        Horse_Make: "FM-E",
        TR: "",
        Trailer_Make: "",
        current_mileage: "3584",
        image_filename: "EV1.jpg",
      },
      {
        fleet_number: "F150",
        HR: "JBN 851 MP",
        Horse_Make: "Volvo FM 330",
        TR: "KZX 167 MP",
        Trailer_Make: "Unipower",
        current_mileage: "1130625",
        image_filename: "F150.jpg",
      },
      {
        fleet_number: "F153",
        HR: "JBN 838 MP",
        Horse_Make: "Volvo FM 330",
        TR: "HYP 896 MP",
        Trailer_Make: "Unipower",
        current_mileage: "1040478",
        image_filename: "F153.jpg",
      },
      {
        fleet_number: "F158",
        HR: "JBS 576 MP",
        Horse_Make: "Volvo FM 330",
        TR: "HYG 484 MP",
        Trailer_Make: "Lohr",
        current_mileage: "1073005",
        image_filename: "F158.jpg",
      },
    ];

    displayFleetCards(sampleData);
  }

  function displayFleetCards(data) {
    console.log("Displaying fleet cards for " + data.length + " vehicles");

    if (loading) loading.remove();

    if (!data || data.length === 0) {
      container.innerHTML =
        '<div class="col-12"><div class="rtms-empty">No fleet data available.</div></div>';
      updateFleetStatistics(0, 0, 0);
      return;
    }

    // Calculate statistics
    let totalVehicles = data.length;
    let activeVehicles = 0;
    let upcomingCoc = 0;

    // Clear container
    container.innerHTML = "";

    data.forEach((vehicle, index) => {
      try {
        const card = document.createElement("div");
        card.className = "col-md-4 mb-4";

        // Vehicle status logic
        let statusClass = "bg-success";
        let statusText = "Active";

        const mileage = parseInt(vehicle.current_mileage) || 0;
        if (mileage > 1200000) {
          statusClass = "bg-warning";
          statusText = "High Mileage";
          upcomingCoc++;
        } else if (mileage > 1000000) {
          statusClass = "bg-warning text-dark";
          statusText = "Monitor";
        }

        activeVehicles++;

        const targetLink = vehicle.fleet_number ? `Vehicle_${vehicle.fleet_number}.html` : "#";

        card.innerHTML = `
          <div class="card h-100 shadow-sm vehicle-card">
            <img src="images/${vehicle.image_filename || "placeholder.jpg"}" 
                 class="card-img-top" 
                 alt="Vehicle ${vehicle.fleet_number}" 
                 style="height: 200px; object-fit: cover;"
                 onerror="this.style.display='none'">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title mb-2 fw-bold text-primary">Fleet: ${
                vehicle.fleet_number || "N/A"
              }</h5>
              <div class="mb-3">
                <span class="badge ${statusClass}">${statusText}</span>
              </div>
              <div class="mb-3">
                <p class="card-text small mb-1">
                  <i class="fas fa-truck text-primary me-2"></i>
                  <strong>Horse Reg:</strong> ${vehicle.HR || "N/A"}
                </p>
                <p class="card-text small mb-1">
                  <i class="fas fa-cogs text-secondary me-2"></i>
                  <strong>Make:</strong> ${vehicle.Horse_Make || "N/A"}
                </p>
                <p class="card-text small mb-1">
                  <i class="fas fa-trailer text-info me-2"></i>
                  <strong>Trailer:</strong> ${vehicle.TR || "N/A"}
                </p>
                <p class="card-text small mb-2">
                  <i class="fas fa-industry text-warning me-2"></i>
                  <strong>Trailer Make:</strong> ${vehicle.Trailer_Make || "N/A"}
                </p>
                <p class="card-text small text-muted">
                  <i class="fas fa-tachometer-alt me-2"></i>
                  <strong>Mileage:</strong> ${formatMileage(vehicle.current_mileage)}
                </p>
              </div>
              <a href="${targetLink}" class="btn btn-outline-primary btn-sm mt-auto">
                <i class="fas fa-eye me-1"></i>View Details
              </a>
            </div>
          </div>`;

        container.appendChild(card);
      } catch (e) {
        console.error("Error creating card for vehicle " + index, e);
      }
    });

    // Update statistics
    updateFleetStatistics(totalVehicles, activeVehicles, upcomingCoc);
    console.log("Fleet cards display completed");
  }

  function updateFleetStatistics(total, active, cocDue) {
    console.log("Updating statistics:", { total, active, cocDue });

    const totalElement = document.getElementById("total-vehicles");
    const activeElement = document.getElementById("active-vehicles");
    const cocElement = document.getElementById("upcoming-coc");

    if (totalElement) totalElement.textContent = total;
    if (activeElement) activeElement.textContent = active;
    if (cocElement) cocElement.textContent = cocDue;
  }

  function formatMileage(mileage) {
    if (!mileage || mileage === "N/A" || mileage === "") return "N/A";
    const miles = parseInt(mileage);
    if (isNaN(miles)) return mileage;
    return miles.toLocaleString() + " km";
  }
});
