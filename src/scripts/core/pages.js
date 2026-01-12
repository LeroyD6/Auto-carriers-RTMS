(() => {
  "use strict";

  function applyFilter(input, table) {
    const query = input.value.trim().toLowerCase();
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    let visibleRows = 0;
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const matches = text.includes(query);
      row.hidden = Boolean(query) && !matches;
      row.classList.toggle("highlight", Boolean(query) && matches);
      if (!row.hidden) visibleRows += 1;
    });
    const emptyState = table.parentElement?.querySelector(".table-empty-state");
    if (emptyState) {
      emptyState.hidden = visibleRows > 0;
    }
  }

  function initTableFilters() {
    document.querySelectorAll("[data-table-filter]").forEach((input) => {
      const targetId = input.getAttribute("data-table-filter");
      const table = targetId ? document.getElementById(targetId) : null;
      if (!table) return;

      input.addEventListener("input", () => applyFilter(input, table));

      const observerTarget = table.querySelector("tbody") || table;
      const observer = new MutationObserver(() => {
        if (input.value.trim()) {
          applyFilter(input, table);
        }
      });
      observer.observe(observerTarget, { subtree: true, childList: true });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTableFilters();
  });
})();
