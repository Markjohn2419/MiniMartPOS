void (async () => {
  const client = window.supabaseClient;
  const { data, error } = client
    ? await client.auth.getSession()
    : { data: null, error: true };
  if (error || !data.session?.user?.email_confirmed_at) {
    if (client) await client.auth.signOut();
    window.location.replace("login.html");
  }
})();

const peso = (value) => window.miniMartSettings.formatCurrency(value);
const products = window.miniMartDB.products();
const allSales = window.miniMartDB.sales().filter((sale) => sale.status !== "voided");
const itemCounts = new Map();
const categoryCounts = new Map();
const categoryRevenue = new Map();
const lastUpdated = document.getElementById("lastUpdated");
function numericValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const LOW_STOCK_THRESHOLD = Number.isInteger(
  Number(window.miniMartSettings?.get().lowStockThreshold),
)
  ? Number(window.miniMartSettings.get().lowStockThreshold)
  : 10;
const lowStockThreshold = (product) => {
  const configured = numericValue(product?.restockMin);
  return configured > 0 ? configured : LOW_STOCK_THRESHOLD;
};
const lowStockProductNames = new Set(
  products
    .filter((product) => product.stock <= lowStockThreshold(product))
    .map((product) => product.name),
);

const CATEGORY_ORDER = [
  "Beverages",
  "Instant Food",
  "Snacks",
  "Dairy",
  "Other",
];
const CATEGORY_COLORS = {
  Beverages: "var(--blue)",
  "Instant Food": "var(--red)",
  Snacks: "var(--gold)",
  Dairy: "var(--green)",
  Other: "#8a7663",
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

const reportParams = new URLSearchParams(window.location.search);
const reportPeriod = document.getElementById("reportPeriod");
const reportCategory = document.getElementById("reportCategory");
const reportProduct = document.getElementById("reportProduct");
const reportCustomRange = document.getElementById("reportCustomRange");
const reportFrom = document.getElementById("reportFrom");
const reportTo = document.getElementById("reportTo");
const todayKey = new Date().toISOString().slice(0, 10);
const categoryOptions = [...new Set(products.map((product) => product.category || "Other"))].sort();
categoryOptions.forEach((category) => {
  reportCategory.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`);
});
products
  .slice()
  .sort((first, second) => first.name.localeCompare(second.name))
  .forEach((product) => {
    reportProduct.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(product.name)}">${escapeHtml(product.name)}</option>`);
  });
reportPeriod.value = reportParams.get("period") || "today";
reportCategory.value = reportParams.get("category") || "all";
reportProduct.value = reportParams.get("product") || "all";
reportFrom.value = reportParams.get("from") || "";
reportTo.value = reportParams.get("to") || "";
reportCustomRange.hidden = reportPeriod.value !== "custom";
const periodLabel = reportPeriod.value === "today"
  ? "Today"
  : reportPeriod.value === "all"
    ? "All time"
    : reportPeriod.value === "custom"
      ? "Custom range"
      : `Last ${reportPeriod.value} days`;
["revenueMetricLabel", "salesMetricLabel", "profitMetricLabel"].forEach((id) => {
  const metric = id === "salesMetricLabel" ? "Sales" : id === "profitMetricLabel" ? "Profit" : "Revenue";
  document.getElementById(id).textContent = periodLabel === "Today" ? `Today's ${metric}` : `${periodLabel} ${metric}`;
});
document.getElementById("productsMetricLabel").textContent = `${periodLabel} Products Sold`;
document.getElementById("salesTrendNote").textContent = "Last 7 days";
document.getElementById("profitTrendNote").textContent = "Last 7 days";
function reloadWithReportFilters() {
  const params = new URLSearchParams();
  params.set("period", reportPeriod.value);
  if (reportCategory.value !== "all") params.set("category", reportCategory.value);
  if (reportProduct.value !== "all") params.set("product", reportProduct.value);
  if (reportPeriod.value === "custom") {
    if (reportFrom.value) params.set("from", reportFrom.value);
    if (reportTo.value) params.set("to", reportTo.value);
  }
  window.location.search = params.toString();
}
reportPeriod.addEventListener("change", () => {
  reportCustomRange.hidden = reportPeriod.value !== "custom";
  if (reportPeriod.value !== "custom" || (reportFrom.value && reportTo.value)) reloadWithReportFilters();
});
[reportCategory, reportProduct, reportFrom, reportTo].forEach((control) => {
  control.addEventListener("change", reloadWithReportFilters);
});
document.getElementById("resetReportFilters").addEventListener("click", () => {
  window.location.search = "";
});
document.getElementById("refreshReports").addEventListener("click", () => window.location.reload());

function itemsForReport(sale) {
  return (sale.items || []).filter((item) => {
    const category = categoryForItem(item);
    return (reportCategory.value === "all" || category === reportCategory.value) &&
      (reportProduct.value === "all" || item.name === reportProduct.value);
  });
}

function saleMatchesReport(sale) {
  const saleDate = new Date(sale.date);
  const saleKey = saleDate.toISOString().slice(0, 10);
  const period = reportPeriod.value;
  if (period === "today" && saleKey !== todayKey) return false;
  if (period === "7" || period === "30") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - Number(period) + 1);
    if (saleDate < start) return false;
  }
  if (period === "custom" && ((reportFrom.value && saleKey < reportFrom.value) || (reportTo.value && saleKey > reportTo.value))) return false;
  return itemsForReport(sale).length > 0;
}

const sales = allSales.filter(saleMatchesReport);

function categoryForItem(item) {
  const product = products.find((entry) => entry.name === item.name);
  return item.category || product?.category || "Other";
}

function orderedCategoryEntriesFrom(map) {
  return [
    ...CATEGORY_ORDER.filter((category) => map.has(category)),
    ...[...map.keys()]
      .filter((category) => !CATEGORY_ORDER.includes(category))
      .sort((first, second) => first.localeCompare(second)),
  ].map((category) => [category, map.get(category)]);
}

lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
let reportRefreshPending = false;
const refreshReports = () => {
  if (reportRefreshPending) return;
  reportRefreshPending = true;
  setTimeout(() => window.location.reload(), 0);
};
window.addEventListener("storage", (event) => {
  if (event.key === "miniMartProducts" || event.key === "miniMartSales")
    refreshReports();
});
window.addEventListener("miniMartDatabaseChanged", (event) => {
  if (
    event.detail.key === "miniMartProducts" ||
    event.detail.key === "miniMartSales"
  )
    refreshReports();
});

sales.forEach((sale) =>
  itemsForReport(sale).forEach((item) => {
    itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity);
    const category = categoryForItem(item);
    categoryCounts.set(
      category,
      (categoryCounts.get(category) || 0) + item.quantity,
    );
    categoryRevenue.set(
      category,
      (categoryRevenue.get(category) || 0) +
        numericValue(
          item.lineTotal,
          numericValue(item.price) * numericValue(item.quantity),
        ),
    );
  }),
);

const categoryOverview = new Map();
products.forEach((product) => {
  const category = product.category || "Other";
  const current = categoryOverview.get(category) || {
    units: categoryCounts.get(category) || 0,
    revenue: categoryRevenue.get(category) || 0,
    stock: 0,
    lowStock: 0,
  };
  current.stock += numericValue(product.stock);
  if (numericValue(product.stock) <= lowStockThreshold(product)) current.lowStock += 1;
  categoryOverview.set(category, current);
});
categoryCounts.forEach((units, category) => {
  if (!categoryOverview.has(category)) {
    categoryOverview.set(category, {
      units,
      revenue: categoryRevenue.get(category) || 0,
      stock: 0,
      lowStock: 0,
    });
  }
});
document.getElementById("categoryOverview").innerHTML =
  orderedCategoryEntriesFrom(categoryOverview)
    .map(([category, values]) => {
      const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
      return `<article class="category-overview-card" style="--category-color:${color}" data-category="${escapeHtml(category)}" tabindex="0" role="button" aria-label="View ${escapeHtml(category)} inventory"><h3>${escapeHtml(category)}</h3><strong>${peso(values.revenue)}</strong><small>Revenue</small><div class="category-overview-stats"><span><b>${values.units}</b>Units sold</span><span><b>${values.stock}</b>Current stock</span><span class="${values.lowStock ? "is-low" : ""}"><b>${values.lowStock}</b>Low stock</span><span><b>${categoryCounts.has(category) ? "Active" : "No sales"}</b>Sales status</span></div></article>`;
    })
    .join("") ||
  '<div class="category-overview-card"><h3>No categories yet</h3><small>Add products to see category reports.</small></div>';

const salesByDay = sales.reduce((groups, sale) => {
  const key = new Date(sale.date).toDateString();
  const current = groups.get(key) || [];
  current.push(sale);
  groups.set(key, current);
  return groups;
}, new Map());

const trendDays = [...Array(7)].map((_, index) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (6 - index));
  return date;
});
const trendDayStats = trendDays.map((day) => {
  const key = day.toDateString();
  const daySales = salesByDay.get(key) || [];
  return {
    day,
    revenue: daySales.reduce(
      (sum, sale) =>
        sum + itemsForReport(sale).reduce(
          (total, item) => total + numericValue(item.lineTotal, numericValue(item.price) * numericValue(item.quantity)),
          0,
        ),
      0,
    ),
    transactions: daySales.length,
    items: daySales.reduce(
      (sum, sale) =>
        sum +
        itemsForReport(sale).reduce((itemTotal, item) => itemTotal + item.quantity, 0),
      0,
    ),
    lowStockItemSales: daySales.reduce(
      (sum, sale) =>
        sum +
        itemsForReport(sale).reduce(
          (itemTotal, item) =>
            itemTotal +
            (lowStockProductNames.has(item.name) ? item.quantity : 0),
          0,
        ),
      0,
    ),
  };
});

const percentageDelta = (current, previous) => {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
};

const setTrendNote = (elementId, current, previous, label) => {
  const note = document.getElementById(elementId);
  const delta = percentageDelta(current, previous);
  if (current === previous) {
    note.textContent = `0% vs yesterday ${label}`;
    note.classList.remove("trend-up", "trend-down");
    note.classList.add("trend-flat");
    return;
  }
  const direction = delta >= 0 ? "up" : "down";
  const arrow = delta >= 0 ? "▲" : "▼";
  note.textContent = `${arrow} ${Math.abs(delta).toFixed(0)}% vs yesterday ${label}`;
  note.classList.remove("trend-up", "trend-down", "trend-flat");
  note.classList.add(`trend-${direction}`);
};

const todayStats = trendDayStats[trendDayStats.length - 1] || {
  revenue: 0,
  transactions: 0,
  items: 0,
};
const yesterdayStats = trendDayStats[trendDayStats.length - 2] || {
  revenue: 0,
  transactions: 0,
  items: 0,
};

const todayRevenue = todayStats.revenue;
const productsSold = sales.reduce(
  (sum, sale) =>
    sum + itemsForReport(sale).reduce((items, item) => items + item.quantity, 0),
  0,
);
const scopedRevenue = sales.reduce(
  (sum, sale) =>
    sum + itemsForReport(sale).reduce(
      (total, item) => total + numericValue(item.lineTotal, numericValue(item.price) * numericValue(item.quantity)),
      0,
    ),
  0,
);
const scopedTransactions = sales.length;
const scopedItems = productsSold;
document.getElementById("todayRevenue").innerHTML = peso(scopedRevenue);
document.getElementById("todaySales").textContent = scopedTransactions;
document.getElementById("productsSold").textContent = productsSold;
document.getElementById("productsSoldNote").textContent = "Across all sales";
const lowStockProducts = products
  .filter((product) => product.stock <= lowStockThreshold(product))
  .sort((first, second) => first.stock - second.stock);
const expiryLimit = new Date();
expiryLimit.setHours(23, 59, 59, 999);
expiryLimit.setDate(expiryLimit.getDate() + 30);
const outOfStockProducts = products.filter((product) => numericValue(product.stock) <= 0);
const expiringProducts = products.filter((product) => {
  if (!product.expiryDate) return false;
  const expiry = new Date(`${product.expiryDate}T23:59:59`);
  return expiry >= new Date() && expiry <= expiryLimit;
});
document.getElementById("lowStockItems").textContent = lowStockProducts.length;
document.getElementById("outOfStockItems").textContent = outOfStockProducts.length;
document.getElementById("alertLowStockItems").textContent = lowStockProducts.length;
document.getElementById("expiringItems").textContent = expiringProducts.length;
setTrendNote(
  "todayRevenueNote",
  scopedRevenue,
  reportPeriod.value === "today" ? yesterdayStats.revenue : 0,
  "revenue",
);
setTrendNote(
  "todaySalesNote",
  scopedTransactions,
  reportPeriod.value === "today" ? yesterdayStats.transactions : 0,
  "transactions",
);
setTrendNote(
  "productsSoldNote",
  scopedItems,
  reportPeriod.value === "today" ? yesterdayStats.items : 0,
  "items sold",
);
setTrendNote(
  "lowStockNote",
  todayStats.lowStockItemSales,
  yesterdayStats.lowStockItemSales,
  "low-stock sales",
);
document.getElementById("lowStockIntro").textContent =
  "Products at or below their configured restock minimum.";
document.getElementById("lowStockList").innerHTML =
  lowStockProducts
    .map(
      (product) =>
        `<div class="low-stock-row"><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${peso(product.price)} per unit</small></span><b class="low-stock-amount">${product.stock} left</b></div>`,
    )
    .join("") ||
  '<div class="low-stock-empty">All products have healthy stock levels.</div>';

const lowStockModal = document.getElementById("lowStockModal");
const closeLowStock = () => {
  lowStockModal.hidden = true;
  document.getElementById("lowStockTitle").textContent = "Low Stock Products";
  [...inventoryBarsElement.querySelectorAll(".inventory-bar")].forEach(
    (bar) => {
      bar.classList.remove("active");
    },
  );
};
const openLowStock = () => {
  lowStockModal.hidden = false;
  document.getElementById("closeLowStock").focus();
};
document
  .getElementById("closeLowStock")
  .addEventListener("click", closeLowStock);
document
  .getElementById("cancelLowStock")
  .addEventListener("click", closeLowStock);
lowStockModal.addEventListener("click", (event) => {
  if (event.target === lowStockModal) closeLowStock();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lowStockModal.hidden) closeLowStock();
});

const productLastSoldTime = sales.reduce((latest, sale) => {
  const saleTimestamp = new Date(sale.date).getTime();
  itemsForReport(sale).forEach((item) => {
    const current = latest.get(item.name) || 0;
    if (saleTimestamp > current) latest.set(item.name, saleTimestamp);
  });
  return latest;
}, new Map());
const topProducts = [...itemCounts.entries()]
  .sort((first, second) => {
    const quantityDifference = second[1] - first[1];
    if (quantityDifference !== 0) return quantityDifference;
    const secondRecent = productLastSoldTime.get(second[0]) || 0;
    const firstRecent = productLastSoldTime.get(first[0]) || 0;
    if (secondRecent !== firstRecent) return secondRecent - firstRecent;
    return first[0].localeCompare(second[0]);
  })
  .slice(0, 5);
const maxSold = Math.max(...topProducts.map(([, quantity]) => quantity), 1);
document.getElementById("topProducts").innerHTML =
  topProducts
    .map(
      ([name, quantity], index) =>
      `<li><span class="rank-badge rank-${index + 1}">${String(index + 1).padStart(2, "0")}</span><span class="product-name">${escapeHtml(name)}</span><span class="product-meter" style="--fill:${Math.round((quantity / maxSold) * 100)}%"><i></i></span><span class="report-quantity">${quantity} sold</span></li>`,
    )
    .join("") ||
  `<li><span class="rank-badge">--</span><span class="product-name">No sales yet</span><span class="product-meter"><i></i></span><span class="report-quantity">0 sold</span></li>`;

const categoryTotal = [...categoryCounts.values()].reduce(
  (sum, value) => sum + value,
  0,
);
let categoryPosition = 0;
const orderedCategoryEntries = orderedCategoryEntriesFrom(categoryCounts);
const categoryStops = orderedCategoryEntries
  .map(([category, amount]) => {
    const start = categoryPosition;
    categoryPosition += categoryTotal ? (amount / categoryTotal) * 100 : 0;
    return `${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other} ${start}% ${categoryPosition}%`;
  })
  .join(", ");
document.getElementById("categoryChart").style.background = categoryTotal
  ? `conic-gradient(${categoryStops})`
  : "conic-gradient(#d9d7cd 0 100%)";
document.getElementById("categoryTotal").textContent = categoryTotal;
document.getElementById("categoryLegend").innerHTML =
  orderedCategoryEntries
    .map(
      ([category, amount]) =>
        `<span style="--legend:${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}"><i></i><b>${escapeHtml(category)}</b><em>${categoryTotal ? Math.round((amount / categoryTotal) * 100) : 0}%</em></span>`,
    )
    .join("") ||
  '<span style="--legend:#d9d7cd"><i></i><b>No sales</b><em>0%</em></span>';
let labelPosition = 0;
document.getElementById("categoryLabels").innerHTML = orderedCategoryEntries
  .map(([category, amount]) => {
    const percentage = categoryTotal ? (amount / categoryTotal) * 100 : 0;
    const angle =
      (((labelPosition + percentage / 2) * 3.6 - 90) * Math.PI) / 180;
    labelPosition += percentage;
    const left = 50 + Math.cos(angle) * 38;
    const top = 50 + Math.sin(angle) * 38;
    return `<span class="donut-label" style="left:${left}%;top:${top}%">${Math.round(percentage)}%</span>`;
  })
  .join("");

const trendValues = trendDayStats.map((entry) => entry.revenue);
const maxTrend = Math.max(...trendValues, 1);
const points = trendValues
  .map(
    (value, index) => `${(index / 6) * 100},${138 - (value / maxTrend) * 112}`,
  )
  .join(" ");
document.getElementById("trendChart").innerHTML =
  `<svg class="trend-line" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" fill="none" stroke="var(--blue)" stroke-width="1.8" vector-effect="non-scaling-stroke"/><polyline points="${points} 100,150 0,150" fill="rgba(43,117,145,.08)" stroke="none"/></svg>`;
document.getElementById("trendLabels").innerHTML = trendDays
  .map((day, index) => `<span>${day.toLocaleDateString("en-US", { weekday: "short" })}<b>${peso(trendDayStats[index].revenue)}</b></span>`)
  .join("");

function renderStackedChart(
  elementId,
  buckets,
  labels,
  colors,
  metric = "revenue",
) {
  const values =
    metric === "transactions"
      ? buckets.map((bucket) => ({ Transactions: bucket.sales.length }))
      : buckets.map((bucket) => {
          const totals = {};
          bucket.sales.forEach((sale) =>
            itemsForReport(sale).forEach((item) => {
              const category = categoryForItem(item);
              totals[category] =
                (totals[category] || 0) +
                numericValue(item.lineTotal, numericValue(item.price) * numericValue(item.quantity));
            }),
          );
          return totals;
        });
  const totals = values.map((value) =>
    Object.values(value).reduce((sum, amount) => sum + amount, 0),
  );
  const maxValue = Math.max(...totals, 1);
  const chartMax =
    metric === "transactions"
      ? Math.max(4, Math.ceil(maxValue / 4) * 4)
      : maxValue;
  const points = totals
    .map(
      (value, index) =>
        `${((index + 0.5) / buckets.length) * 100},${138 - (value / chartMax) * 125}`,
    )
    .join(" ");
  const ticks =
    metric === "transactions"
      ? [chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0]
      : [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];
  const axisLabels =
    metric === "transactions"
      ? ticks.map((value) => Math.round(value).toString())
      : ticks.map((value) => peso(value).replace(".00", ""));
  const bars = values
    .map(
      (value, index) =>
        `<div class="period-column" data-value="${totals[index]}" data-period="${escapeHtml(labels[index])}"><div class="period-stack">${Object.entries(
          value,
        )
          .map(
            ([category, amount]) =>
              `<i aria-hidden="true" style="height:${(amount / chartMax) * 125}px;background:${
                metric === "transactions"
                  ? "var(--blue)"
                  : colors[category] || "#8a7663"
              }"></i>`,
          )
          .join("")}</div><span>${labels[index]}</span></div>`,
    )
    .join("");
  const chart = document.getElementById(elementId);
  chart.innerHTML = `<div class="period-y-axis">${axisLabels.map((value) => `<span>${value}</span>`).join("")}</div><div class="period-plot"><div class="period-columns">${bars}</div><svg class="period-line" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" fill="none" stroke="var(--ink)" stroke-width="2" vector-effect="non-scaling-stroke"/><polyline points="${points} 100,140 0,140" fill="rgba(24,35,29,.06)" stroke="none"/></svg><div class="period-tooltip" role="status"></div></div>`;
  const plot = chart.querySelector(".period-plot");
  const tooltip = chart.querySelector(".period-tooltip");
  let dragging = false;
  const showValue = (event) => {
    const rect = plot.getBoundingClientRect();
    const columns = [...plot.querySelectorAll(".period-column")];
    const index = Math.max(
      0,
      Math.min(
        columns.length - 1,
        Math.round(
          ((event.clientX - rect.left) / rect.width) * (columns.length - 1),
        ),
      ),
    );
    const column = columns[index];
    const numericValue = Number(column.dataset.value);
    const primaryValue =
      metric === "transactions"
        ? `${Math.round(numericValue)} transactions`
        : peso(numericValue);
    const helperText =
      metric === "transactions" ? "completed transactions" : "income generated";
    tooltip.innerHTML = `<b>${column.dataset.period}</b><strong>${primaryValue}</strong><small>${helperText}</small>`;
    tooltip.style.left = `${column.offsetLeft + column.offsetWidth / 2}px`;
    tooltip.classList.add("visible");
  };
  plot.addEventListener("pointerdown", (event) => {
    dragging = true;
    plot.setPointerCapture(event.pointerId);
    showValue(event);
  });
  plot.addEventListener("pointermove", (event) => {
    if (dragging) showValue(event);
  });
  plot.addEventListener("pointerup", () => {
    dragging = false;
  });
  plot.addEventListener("pointerleave", () => {
    if (!dragging) tooltip.classList.remove("visible");
  });
}
const weekBuckets = trendDays.map((day) => ({
  sales: sales.filter(
    (sale) => new Date(sale.date).toDateString() === day.toDateString(),
  ),
}));
renderStackedChart(
  "weeklyChart",
  weekBuckets,
  trendDays.map((day) => day.toLocaleDateString("en-US", { weekday: "short" })),
  CATEGORY_COLORS,
  "transactions",
);

const monthBuckets = [...Array(6)].map((_, index) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - (5 - index));
  return date;
});
const monthValues = monthBuckets.map((month) =>
  sales
    .filter((sale) => {
      const date = new Date(sale.date);
      return (
        date.getFullYear() === month.getFullYear() &&
        date.getMonth() === month.getMonth()
      );
    })
    .reduce(
      (sum, sale) =>
        sum + itemsForReport(sale).reduce(
          (total, item) => total + numericValue(item.lineTotal, numericValue(item.price) * numericValue(item.quantity)),
          0,
        ),
      0,
    ),
);
const monthSalesBuckets = monthBuckets.map((month) => ({
  sales: sales.filter((sale) => {
    const date = new Date(sale.date);
    return (
      date.getFullYear() === month.getFullYear() &&
      date.getMonth() === month.getMonth()
    );
  }),
}));
renderStackedChart(
  "monthlyChart",
  monthSalesBuckets,
  monthBuckets.map((month) =>
    month.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
  ),
  CATEGORY_COLORS,
);

const categoryInventory = [
  ...products.reduce((groups, product) => {
    const current = groups.get(product.category) || {
      total: 0,
      products: [],
      lowItems: [],
    };
    current.total += product.stock;
    current.products.push(product);
    if (product.stock <= lowStockThreshold(product))
      current.lowItems.push(product.name);
    groups.set(product.category, current);
    return groups;
  }, new Map()),
];
const orderedCategoryInventory = orderedCategoryEntriesFrom(
  new Map(categoryInventory),
);
const maxStock = Math.max(
  ...orderedCategoryInventory.map(([, values]) => values.total),
  1,
);
const inventoryBarsElement = document.getElementById("inventoryBars");
inventoryBarsElement.innerHTML = orderedCategoryInventory
  .map(([category, values]) => {
    const height = Math.max((values.total / maxStock) * 100, 4);
    const thresholdHeight = (LOW_STOCK_THRESHOLD / maxStock) * 100;
    return `<button type="button" class="inventory-bar ${values.lowItems.length ? "is-low" : ""}" data-category="${escapeHtml(category)}" data-low-count="${values.lowItems.length}" title="${escapeHtml(category)}: ${values.total} units across products"><strong>${values.total}</strong><div class="bar-stack"><span class="bar-stock" style="height:${height}%;background:${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}"></span><span class="bar-threshold" style="bottom:${Math.min(thresholdHeight, 100)}%"></span></div><span>${escapeHtml(category)}</span></button>`;
  })
  .join("");

const highlightLowStockCategory = (category) => {
  [...inventoryBarsElement.querySelectorAll(".inventory-bar")].forEach(
    (bar) => {
      bar.classList.toggle("active", bar.dataset.category === category);
    },
  );
  const categoryInfo = orderedCategoryInventory.find(
    ([name]) => name === category,
  );
  if (!categoryInfo) return;
  const [, values] = categoryInfo;
  const lowList = values.products
    .filter((product) => product.stock <= lowStockThreshold(product))
    .sort((first, second) => first.stock - second.stock)
    .map(
      (product) =>
        `<div class="low-stock-row"><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${peso(product.price)} per unit</small></span><b class="low-stock-amount">${product.stock} left</b></div>`,
    )
    .join("");
  document.getElementById("lowStockTitle").textContent =
    `${category} Low Stock`;
  document.getElementById("lowStockList").innerHTML =
    lowList ||
    '<div class="low-stock-empty">No low-stock products in this category.</div>';
  openLowStock();
};

inventoryBarsElement.querySelectorAll(".inventory-bar").forEach((bar) => {
  bar.addEventListener("click", () => {
    highlightLowStockCategory(bar.dataset.category);
  });
});

function focusCategoryInventory(category) {
  const bar = [...inventoryBarsElement.querySelectorAll(".inventory-bar")].find(
    (entry) => entry.dataset.category === category,
  );
  if (!bar) return;
  [...inventoryBarsElement.querySelectorAll(".inventory-bar")].forEach((entry) => {
    entry.classList.toggle("active", entry === bar);
  });
  bar.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.querySelectorAll(".category-overview-card[data-category]").forEach((card) => {
  const activate = () => focusCategoryInventory(card.dataset.category);
  card.addEventListener("click", activate);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activate();
  });
});

document.getElementById("lowStockMetric").addEventListener("click", () => {
  const firstLowCategory = orderedCategoryInventory.find(
    ([, values]) => values.lowItems.length > 0,
  );
  if (firstLowCategory) {
    highlightLowStockCategory(firstLowCategory[0]);
    return;
  }
  document.getElementById("lowStockTitle").textContent = "Low Stock Products";
  openLowStock();
});

document
  .getElementById("lowStockMetric")
  .addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      document.getElementById("lowStockMetric").click();
    }
  });

document.getElementById("recentSales").innerHTML =
  sales
    .reverse()
    .map((sale) => {
      const items = itemsForReport(sale)
        .map((item) => `${item.name} x${item.quantity}`)
        .join(", ");
      const reportTotal = itemsForReport(sale).reduce(
        (sum, item) => sum + numericValue(item.lineTotal, numericValue(item.price) * numericValue(item.quantity)),
        0,
      );
      const status = sale.status === "voided" ? " · VOIDED" : "";
      const transaction = sale.transactionNumber || String(sale.id || "SALE").slice(0, 8);
      return `<div class="sale-row"><div class="sale-details"><div class="sale-date">${escapeHtml(transaction)} · ${new Date(sale.date).toLocaleString()}${status}</div><div>${escapeHtml(items)} · ${escapeHtml(sale.paymentMethod || "cash")}</div>${sale.note ? `<small>${escapeHtml(sale.note)}</small>` : ""}</div><strong class="sale-total">${peso(reportTotal)}</strong>${sale.status === "voided" ? "" : `<button type="button" class="sale-void-button" data-void-sale="${escapeHtml(sale.id)}">VOID</button>`}</div>`;
    })
    .join("") || `<div class="sale-details">No sales recorded yet.</div>`;

function voidSale(saleId) {
  const approval = window.prompt("Manager approval required. Type APPROVE to void this sale.");
  if (approval !== "APPROVE") return;
  const currentSales = window.miniMartDB.sales();
  const sale = currentSales.find((entry) => entry.id === saleId);
  if (!sale || sale.status === "voided") return;
  const inventory = window.miniMartDB.products();
  itemsForReport(sale).forEach((item) => {
    const product = inventory.find((entry) =>
      (item.productId && entry.id === item.productId) || entry.name === item.name,
    );
    if (product) {
      product.stock = window.miniMartDB.roundQuantity(
        Number(product.stock) + Number(item.quantity),
        product.unit,
      );
    }
  });
  sale.status = "voided";
  sale.voidedAt = new Date().toISOString();
  sale.voidReason = "Manager-approved void";
  window.miniMartDB.saveProducts(inventory);
  window.miniMartDB.saveSales(currentSales);
  window.location.reload();
}

document.querySelectorAll("[data-void-sale]").forEach((button) => {
  button.addEventListener("click", () => voidSale(button.dataset.voidSale));
});

const currentShift = JSON.parse(localStorage.getItem("miniMartCurrentShift") || "null");
const shiftSummary = document.getElementById("shiftSummary");
if (currentShift) {
  const shiftSales = allSales.filter((sale) => sale.shiftId === currentShift.id);
  const shiftCashSales = shiftSales.reduce((sum, sale) => {
    const payments = sale.payments || {};
    return sum + (sale.paymentMethod === "split"
      ? numericValue(payments.cash)
      : sale.paymentMethod === "cash" ? numericValue(payments.cash, sale.total) : 0);
  }, 0);
  const expectedCash = numericValue(currentShift.openingCash) + shiftCashSales;
  const closingCash = currentShift.closedAt ? numericValue(currentShift.closingCash) : null;
  const variance = closingCash === null ? null : closingCash - expectedCash;
  shiftSummary.innerHTML = `<div class="shift-summary-grid"><span><small>Shift</small><strong>${escapeHtml(currentShift.id)}</strong></span><span><small>Opening cash</small><strong>${peso(currentShift.openingCash)}</strong></span><span><small>Cash sales</small><strong>${peso(shiftCashSales)}</strong></span><span><small>Expected cash</small><strong>${peso(expectedCash)}</strong></span><span><small>Counted cash</small><strong>${closingCash === null ? "Open" : peso(closingCash)}</strong></span><span><small>Variance</small><strong class="${variance === null ? "" : variance < 0 ? "is-negative" : "is-positive"}">${variance === null ? "—" : peso(variance)}</strong></span></div><small>${shiftSales.length} completed transaction(s) in this shift · Opened ${new Date(currentShift.openedAt).toLocaleString()}</small>`;
} else {
  shiftSummary.textContent = "No active shift. Open a shift from Checkout before accepting sales.";
}
const paymentTotals = sales.reduce((totals, sale) => {
  const payments = sale.payments || {};
  const method = sale.paymentMethod || "cash";
  const reportTotal = itemsForReport(sale).reduce(
    (sum, item) => sum + numericValue(item.lineTotal, numericValue(item.price) * numericValue(item.quantity)),
    0,
  );
  const scopeRatio = numericValue(sale.total) > 0 ? reportTotal / numericValue(sale.total) : 0;
  if (method === "split") {
    totals.cash += numericValue(payments.cash) * scopeRatio;
    totals.card += numericValue(payments.card) * scopeRatio;
    totals.gcash += numericValue(payments.gcash) * scopeRatio;
  } else {
    totals[method] =
      (totals[method] || 0) + numericValue(payments[method], numericValue(sale.total)) * scopeRatio;
  }
  return totals;
}, { cash: 0, card: 0, gcash: 0 });
document.getElementById("paymentSummary").innerHTML =
  `<small>Payment totals: Cash ${peso(paymentTotals.cash)} · Card ${peso(paymentTotals.card)} · GCash ${peso(paymentTotals.gcash)}</small>`;
document.getElementById("paymentCards").innerHTML = [
  ["Cash", paymentTotals.cash],
  ["Card", paymentTotals.card],
  ["GCash", paymentTotals.gcash],
].map(([label, amount]) => `<div><small>${label}</small><strong>${peso(amount)}</strong></div>`).join("");

function lineEconomics(item) {
  const quantity = Number(item.quantity) || 0;
  const sellPrice = Number(item.price) || 0;
  const revenue = sellPrice * quantity;
  if (!window.miniMartDB.isKnownCost(item.costPrice)) {
    return {
      quantity,
      revenue,
      cost: null,
      profit: null,
      margin: null,
      known: false,
    };
  }
  const costPrice = Number(item.costPrice);
  const cost = costPrice * quantity;
  const profit = (sellPrice - costPrice) * quantity;
  return {
    quantity,
    revenue,
    cost,
    profit,
    margin: revenue ? (profit / revenue) * 100 : 0,
    known: true,
  };
}

function economicsForSales(saleList) {
  let profit = 0;
  let revenue = 0;
  let cost = 0;
  let knownUnits = 0;
  let unknownUnits = 0;
  saleList.forEach((sale) => {
    itemsForReport(sale).forEach((item) => {
      const row = lineEconomics(item);
      if (row.known) {
        profit += row.profit;
        revenue += row.revenue;
        cost += row.cost;
        knownUnits += row.quantity;
      } else {
        unknownUnits += row.quantity;
      }
    });
  });
  return {
    profit,
    revenue,
    cost,
    margin: revenue ? (profit / revenue) * 100 : null,
    knownUnits,
    unknownUnits,
    hasKnown: knownUnits > 0,
  };
}

const allProfitStats = economicsForSales(sales);
const profitDataNote = document.getElementById("profitDataNote");
if (allProfitStats.unknownUnits) {
  profitDataNote.textContent = `Excludes ${allProfitStats.unknownUnits} sold unit${allProfitStats.unknownUnits === 1 ? "" : "s"} with no cost data`;
}

const todaySalesList = sales;
const yesterdaySalesList =
  salesByDay.get(yesterdayStats.day?.toDateString?.()) || [];
const todayProfitStats = economicsForSales(todaySalesList);
const yesterdayProfitStats = economicsForSales(yesterdaySalesList);
const todayProfitCard = document.getElementById("todayProfit");
const todayProfitNote = document.getElementById("todayProfitNote");
if (!scopedTransactions) {
  todayProfitCard.innerHTML = peso(0);
  todayProfitNote.textContent = "No sales today";
  todayProfitNote.classList.add("trend-flat");
} else if (!todayProfitStats.hasKnown) {
  todayProfitCard.textContent = "—";
  todayProfitNote.textContent = "No cost data";
  todayProfitNote.classList.add("trend-flat");
} else {
  todayProfitCard.innerHTML = peso(todayProfitStats.profit);
  const marginLabel = `${todayProfitStats.margin.toFixed(0)}% overall margin`;
  const delta = percentageDelta(
    todayProfitStats.profit,
    yesterdayProfitStats.hasKnown ? yesterdayProfitStats.profit : 0,
  );
  if (!yesterdayProfitStats.hasKnown && todayProfitStats.hasKnown) {
    todayProfitNote.textContent = marginLabel;
  } else if (todayProfitStats.profit === yesterdayProfitStats.profit) {
    todayProfitNote.textContent = `${marginLabel} · 0% vs yesterday`;
    todayProfitNote.classList.add("trend-flat");
  } else {
    const direction = delta >= 0 ? "up" : "down";
    const arrow = delta >= 0 ? "▲" : "▼";
    todayProfitNote.textContent = `${marginLabel} · ${arrow} ${Math.abs(delta).toFixed(0)}% vs yesterday`;
    todayProfitNote.classList.add(`trend-${direction}`);
  }
}

const profitTrendValues = trendDays.map((day) => {
  const daySales = salesByDay.get(day.toDateString()) || [];
  const stats = economicsForSales(daySales);
  return stats.hasKnown ? stats.profit : 0;
});
const maxProfitTrend = Math.max(...profitTrendValues.map(Math.abs), 1);
const profitPoints = profitTrendValues
  .map(
    (value, index) =>
      `${(index / 6) * 100},${138 - (Math.max(value, 0) / maxProfitTrend) * 112}`,
  )
  .join(" ");
document.getElementById("profitTrendChart").innerHTML =
  `<svg class="trend-line" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><polyline points="${profitPoints}" fill="none" stroke="var(--green)" stroke-width="1.8" vector-effect="non-scaling-stroke"/><polyline points="${profitPoints} 100,150 0,150" fill="rgba(39,114,85,.08)" stroke="none"/></svg>`;
document.getElementById("profitTrendLabels").innerHTML = trendDays
  .map((day, index) => `<span>${day.toLocaleDateString("en-US", { weekday: "short" })}<b>${peso(profitTrendValues[index])}</b></span>`)
  .join("");

const profitByCategory = new Map();
sales.forEach((sale) => {
  itemsForReport(sale).forEach((item) => {
    const row = lineEconomics(item);
    if (!row.known) return;
    const category = categoryForItem(item);
    profitByCategory.set(
      category,
      (profitByCategory.get(category) || 0) + row.profit,
    );
  });
});
const profitCategoryTotal = [...profitByCategory.values()].reduce(
  (sum, value) => sum + value,
  0,
);
const orderedProfitCategories = orderedCategoryEntriesFrom(profitByCategory).map(
  ([category]) => category,
);
let profitCategoryPosition = 0;
const profitCategoryStops = orderedProfitCategories
  .map((category) => {
    const amount = profitByCategory.get(category) || 0;
    const start = profitCategoryPosition;
    profitCategoryPosition += profitCategoryTotal
      ? (amount / profitCategoryTotal) * 100
      : 0;
    return `${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other} ${start}% ${profitCategoryPosition}%`;
  })
  .join(", ");
document.getElementById("profitCategoryChart").style.background =
  profitCategoryTotal
    ? `conic-gradient(${profitCategoryStops})`
    : "conic-gradient(#d9d7cd 0 100%)";
document.getElementById("profitCategoryTotal").innerHTML = profitCategoryTotal
  ? peso(profitCategoryTotal).replace(".00", "")
  : "0";
document.getElementById("profitCategoryLegend").innerHTML =
  orderedProfitCategories
    .map((category) => {
      const amount = profitByCategory.get(category) || 0;
      return `<span style="--legend:${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}"><i></i><b>${escapeHtml(category)}</b><em>${profitCategoryTotal ? Math.round((amount / profitCategoryTotal) * 100) : 0}%</em></span>`;
    })
    .join("") ||
  '<span style="--legend:#d9d7cd"><i></i><b>No cost data</b><em>0%</em></span>';
let profitLabelPosition = 0;
document.getElementById("profitCategoryLabels").innerHTML =
  orderedProfitCategories
    .map((category) => {
      const amount = profitByCategory.get(category) || 0;
      const percentage = profitCategoryTotal
        ? (amount / profitCategoryTotal) * 100
        : 0;
      const angle =
        (((profitLabelPosition + percentage / 2) * 3.6 - 90) * Math.PI) / 180;
      profitLabelPosition += percentage;
      const left = 50 + Math.cos(angle) * 38;
      const top = 50 + Math.sin(angle) * 38;
      return `<span class="donut-label" style="left:${left}%;top:${top}%">${Math.round(percentage)}%</span>`;
    })
    .join("");

const profitProductRows = [
  ...sales
    .reduce((groups, sale) => {
      itemsForReport(sale).forEach((item) => {
        const current = groups.get(item.name) || {
          name: item.name,
          units: 0,
          revenue: 0,
          knownRevenue: 0,
          cost: 0,
          profit: 0,
          knownUnits: 0,
          unknownUnits: 0,
        };
        const row = lineEconomics(item);
        current.units += row.quantity;
        current.revenue += row.revenue;
        if (row.known) {
          current.knownRevenue += row.revenue;
          current.cost += row.cost;
          current.profit += row.profit;
          current.knownUnits += row.quantity;
        } else {
          current.unknownUnits += row.quantity;
        }
        groups.set(item.name, current);
      });
      return groups;
    }, new Map())
    .values(),
].map((row) => ({
  ...row,
  hasKnown: row.knownUnits > 0,
  margin: row.knownRevenue ? (row.profit / row.knownRevenue) * 100 : null,
}));

let profitSort = { key: "profit", dir: "desc" };

function sortProfitRows(rows) {
  return [...rows].sort((first, second) => {
    const key = profitSort.key;
    if (
      (key === "profit" || key === "cost" || key === "margin") &&
      first.hasKnown !== second.hasKnown
    )
      return first.hasKnown ? -1 : 1;
    let result = 0;
    if (key === "name") result = first.name.localeCompare(second.name);
    else result = (first[key] ?? -Infinity) - (second[key] ?? -Infinity);
    if (result === 0) result = first.name.localeCompare(second.name);
    return profitSort.dir === "asc" ? result : -result;
  });
}

function renderProfitProductTable() {
  const body = document.getElementById("profitByProduct");
  document.querySelectorAll("[data-profit-sort]").forEach((button) => {
    button.setAttribute(
      "aria-sort",
      button.dataset.profitSort === profitSort.key
        ? profitSort.dir === "asc"
          ? "ascending"
          : "descending"
        : "none",
    );
  });
  body.innerHTML =
    sortProfitRows(profitProductRows)
      .map((row) => {
        const costCell = row.hasKnown ? peso(row.cost) : "—";
        const profitCell = row.hasKnown ? peso(row.profit) : "No cost data";
        const marginCell = row.hasKnown ? `${row.margin.toFixed(0)}%` : "—";
        const note = row.unknownUnits
          ? ` title="Excludes ${row.unknownUnits} unit${row.unknownUnits === 1 ? "" : "s"} with no cost data"`
          : "";
        const rowClass = row.hasKnown
          ? row.unknownUnits
            ? ' class="is-partial"'
            : ""
          : ' class="no-cost"';
        return `<tr${rowClass}${note}><td>${escapeHtml(row.name)}</td><td>${row.units}</td><td>${peso(row.revenue)}</td><td>${costCell}</td><td>${profitCell}</td><td>${marginCell}</td></tr>`;
      })
      .join("") ||
    `<tr class="no-cost"><td colspan="6">No sales recorded yet.</td></tr>`;
}

renderProfitProductTable();
document.querySelectorAll("[data-profit-sort]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.profitSort;
    if (profitSort.key === key)
      profitSort.dir = profitSort.dir === "desc" ? "asc" : "desc";
    else {
      profitSort = {
        key,
        dir: key === "name" ? "asc" : "desc",
      };
    }
    renderProfitProductTable();
  });
});
