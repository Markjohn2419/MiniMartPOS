const storeInfoForm = document.getElementById("storeInfoForm");
const settingsStatus = document.getElementById("settingsStatus");
const storeLogoInput = document.getElementById("storeLogo");
const logoPreview = document.getElementById("logoPreview");
const receiptPreviewLogo = document.getElementById("receiptPreviewLogo");
const receiptPreviewStore = document.getElementById("receiptPreviewStore");
const receiptPreviewContact = document.getElementById("receiptPreviewContact");
const receiptPreviewFooter = document.getElementById("receiptPreviewFooter");
const datePreview = document.getElementById("datePreview");
const logoFileName = document.getElementById("logoFileName");
const removeLogo = document.getElementById("removeLogo");
const maxLogoSize = 200 * 1024;
const appearanceForm = document.getElementById("appearanceForm");
const themeToggle = document.getElementById("themeToggle");
const checkNfcStatus = document.getElementById("checkNfcStatus");
const nfcStatusBadge = document.getElementById("nfcStatusBadge");
const nfcStatusText = document.getElementById("nfcStatusText");
const nfcStatusExplanation = document.getElementById("nfcStatusExplanation");
const nfcStatusDetails = document.getElementById("nfcStatusDetails");
const nfcStatusConfirmation = document.getElementById("nfcStatusConfirmation");
const inventoryRulesForm = document.getElementById("inventoryRulesForm");
const inventoryRulesStatus = document.getElementById("inventoryRulesStatus");
const lowStockThreshold = document.getElementById("lowStockThreshold");
const blockOutOfStockSales = document.getElementById("blockOutOfStockSales");
const sukiSettingsForm = document.getElementById("sukiSettingsForm");
const sukiSettingsStatus = document.getElementById("sukiSettingsStatus");
const sukiEnabled = document.getElementById("sukiEnabled");
const sukiPesosPerPoint = document.getElementById("sukiPesosPerPoint");
const sukiPesoValue = document.getElementById("sukiPesoValue");
const sukiMinPointsToRedeem = document.getElementById("sukiMinPointsToRedeem");
const sukiPointsExpiry = document.getElementById("sukiPointsExpiry");
const sukiPointsExpiryDays = document.getElementById("sukiPointsExpiryDays");
const sukiPointsExpiryDaysField = document.getElementById("sukiPointsExpiryDaysField");
const backupStatus = document.getElementById("backupStatus");
const backupSummary = document.getElementById("backupSummary");
const backupRestorePreview = document.getElementById("backupRestorePreview");
const backupRestorePreviewText = document.getElementById("backupRestorePreviewText");
const runDataHealthCheck = document.getElementById("runDataHealthCheck");
const dataHealthResults = document.getElementById("dataHealthResults");
const settingsSearch = document.getElementById("settingsSearch");
const settingsSearchEmpty = document.getElementById("settingsSearchEmpty");
const exportInventoryHistory = document.getElementById("exportInventoryHistory");
const restoreBackup = document.getElementById("restoreBackup");
const reportExportData = document.getElementById("reportExportData");
const salesRange = document.getElementById("salesRange");
const salesRangeField = document.getElementById("salesRangeField");
const customDateFields = document.getElementById("customDateFields");
const salesStartDate = document.getElementById("salesStartDate");
const salesEndDate = document.getElementById("salesEndDate");
const customerExportNote = document.getElementById("customerExportNote");
const reportExportSummary = document.getElementById("reportExportSummary");
const reportExportStatus = document.getElementById("reportExportStatus");
const exportExcel = document.getElementById("exportExcel");
const exportPdf = document.getElementById("exportPdf");
const downloadProductTemplate = document.getElementById("downloadProductTemplate");
const productImportFile = document.getElementById("productImportFile");
const productImportFileName = document.getElementById("productImportFileName");
const removeProductImportFile = document.getElementById("removeProductImportFile");
const productImportStatus = document.getElementById("productImportStatus");
const downloadProductErrors = document.getElementById("downloadProductErrors");
const productImportModal = document.getElementById("productImportModal");
const closeProductImport = document.getElementById("closeProductImport");
const cancelProductImport = document.getElementById("cancelProductImport");
const productDuplicateMode = document.getElementById("productDuplicateMode");
const productMissingCategoryMode = document.getElementById("productMissingCategoryMode");
const productImportFilter = document.getElementById("productImportFilter");
const productImportSummary = document.getElementById("productImportSummary");
const productImportPreview = document.getElementById("productImportPreview");
const productImportEmpty = document.getElementById("productImportEmpty");
const productImportModalStatus = document.getElementById("productImportModalStatus");
const confirmProductImport = document.getElementById("confirmProductImport");
const openResetData = document.getElementById("openResetData");
const resetDataModal = document.getElementById("resetDataModal");
const closeResetData = document.getElementById("closeResetData");
const cancelResetData = document.getElementById("cancelResetData");
const resetDataCounts = document.getElementById("resetDataCounts");
const resetConfirmText = document.getElementById("resetConfirmText");
const confirmResetData = document.getElementById("confirmResetData");
const backupBeforeReset = document.getElementById("backupBeforeReset");
const resetDataStatus = document.getElementById("resetDataStatus");
const categoryManagementList = document.getElementById("categoryManagementList");
const categoryManagementStatus = document.getElementById("categoryManagementStatus");
const categorySummaryChips = document.getElementById("categorySummaryChips");
const categoryManagementModal = document.getElementById("categoryManagementModal");
const openCategoryManagement = document.getElementById("openCategoryManagement");
const closeCategoryManagement = document.getElementById("closeCategoryManagement");
const doneCategoryManagement = document.getElementById("doneCategoryManagement");
const categoryManagementSearch = document.getElementById("categoryManagementSearch");
const clearCategoryManagementSearch = document.getElementById("clearCategoryManagementSearch");
const categoryManagementEmpty = document.getElementById("categoryManagementEmpty");
const categoryManagementModalSummary = document.getElementById("categoryManagementModalSummary");
const categoryManagementReorderNote = document.getElementById("categoryManagementReorderNote");
const categoryDeleteModal = document.getElementById("categoryDeleteModal");
const categoryDeleteCopy = document.getElementById("categoryDeleteCopy");
const categoryMoveTarget = document.getElementById("categoryMoveTarget");
const settingsTabs = [...document.querySelectorAll("[data-settings-panel]")];
const resetStoreInfo = document.getElementById("resetStoreInfo");
const resetInventoryRules = document.getElementById("resetInventoryRules");
const resetSukiSettings = document.getElementById("resetSukiSettings");
let pendingCategoryDelete = "";
let categoryManagementReturnFocus = null;
let categoryManagementScrollLocked = false;
let productImportRows = [];
let productImportFileData = null;
let productImportReturnFocus = null;
let resetDataReturnFocus = null;
let pendingRestoreData = null;
const backupKeys = {
  products: "miniMartProducts",
  sales: "miniMartSales",
  categories: "miniMartCategories",
  categoryIcons: "miniMartCategoryIcons",
  deletedProducts: "miniMartDeletedProducts",
  customers: "miniMartSukis",
  settings: "miniMartSettings",
  inventoryAdjustments: "miniMartInventoryAdjustments",
};

const fields = {
  storeName: document.getElementById("storeName"),
  address: document.getElementById("storeAddress"),
  contactNumber: document.getElementById("contactNumber"),
  registerName: document.getElementById("registerName"),
  receiptFooter: document.getElementById("receiptFooter"),
  timezone: document.getElementById("timezone"),
  dateFormat: document.getElementById("dateFormat"),
};

let logoDataUrl = "";
const currentSettings = window.miniMartSettings.get();
const categoryActionIcons = {
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6" /></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6" /></svg>',
  rename: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" /><path d="m13 7.5 3.5 3.5" /></svg>',
  delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M9 7l1-2h4l1 2m-9 0 1 13h8l1-13" /></svg>',
};
const categoryIconOptions = [
  ["beverages", "Icons/beverages.png", "Beverages"],
  ["instant-food", "Icons/instant-food.png", "Instant food"],
  ["snacks", "Icons/snacks.png", "Snacks"],
  ["dairy", "Icons/dairy.png", "Dairy"],
  ["bread", "Icons/bread.png", "Bread"],
  ["canned-food", "Icons/canned-food.png", "Canned food"],
  ["frozen", "Icons/frozengoods.png", "Frozen goods"],
  ["vegetables", "Icons/vegetables.svg", "Vegetables"],
  ["meat-fish", "Icons/meat-fish.svg", "Meat and fish"],
  ["rice-grains", "Icons/rice&grains.png", "Rice and grains"],
  ["sauces", "Icons/sauces.png", "Sauces"],
  ["cooking-oil", "Icons/cooking-oil.svg", "Cooking oil"],
  ["detergent", "Icons/detergent.png", "Cleaning"],
  ["toiletries", "Icons/toiletries.svg", "Toiletries"],
  ["school-supplies", "Icons/school_supplies.png", "School supplies"],
  ["cigarette", "Icons/cigarette.png", "Cigarettes"],
  ["amenities", "Icons/amenities.png", "Amenities"],
  ["category", "Icons/category.png", "General"],
];

function showFieldError(fieldName, message) {
  const error = document.getElementById(`${fieldName}Error`);
  if (error) error.textContent = message;
  if (fields[fieldName]) fields[fieldName].setAttribute("aria-invalid", String(Boolean(message)));
}

function clearErrors() {
  Object.keys(fields).forEach((fieldName) => showFieldError(fieldName, ""));
  showFieldError("storeLogo", "");
}

function updateStorePreviews() {
  receiptPreviewStore.textContent = fields.storeName.value.trim() || "Mini Mart";
  receiptPreviewContact.textContent =
    [fields.address.value.trim(), fields.contactNumber.value.trim()]
      .filter(Boolean)
      .join(" · ") || "No contact details";
  receiptPreviewFooter.textContent =
    fields.receiptFooter.value.trim() || "Receipt footer";
  if (logoDataUrl) {
    receiptPreviewLogo.src = logoDataUrl;
    receiptPreviewLogo.hidden = false;
  } else {
    receiptPreviewLogo.removeAttribute("src");
    receiptPreviewLogo.hidden = true;
  }
  datePreview.textContent = `Date preview: ${window.miniMartSettings.formatDate(new Date(), {
    timezone: fields.timezone.value,
    dateFormat: fields.dateFormat.value,
  })}`;
}

function updateBrandLogo() {
  document.querySelectorAll(".brand-mark img").forEach((image) => {
    image.src = logoDataUrl || "Icons/grocery-store.png";
    image.classList.toggle("custom-store-logo", Boolean(logoDataUrl));
  });
}

function setFormValues(settings) {
  Object.entries(fields).forEach(([fieldName, field]) => {
    field.value = settings[fieldName] ?? "";
  });
  logoDataUrl = settings.logoDataUrl || "";
  if (logoDataUrl && window.miniMartSettings.isValidLogoDataUrl(logoDataUrl)) {
    logoPreview.src = logoDataUrl;
    logoPreview.hidden = false;
    logoFileName.textContent = "Saved logo";
    removeLogo.hidden = false;
  } else {
    logoPreview.removeAttribute("src");
    logoPreview.hidden = true;
    logoFileName.textContent = "No file chosen";
    removeLogo.hidden = true;
  }
  updateBrandLogo();
  updateStorePreviews();
}

function validateForm() {
  clearErrors();
  let isValid = true;

  if (!fields.storeName.value.trim()) {
    showFieldError("storeName", "Store name is required.");
    isValid = false;
  }
  if (!fields.receiptFooter.value.trim()) {
    showFieldError("receiptFooter", "Receipt footer message is required.");
    isValid = false;
  }
  if (!fields.registerName.value.trim()) {
    showFieldError("registerName", "Register name is required.");
    isValid = false;
  }
  if (!fields.timezone.value) {
    showFieldError("timezone", "Choose a timezone.");
    isValid = false;
  }
  if (!fields.dateFormat.value) {
    showFieldError("dateFormat", "Choose a date format.");
    isValid = false;
  }

  return isValid;
}

function setStatus(message, isError = false) {
  settingsStatus.textContent = message;
  settingsStatus.className = `settings-status${isError ? " settings-status-error" : ""}`;
}

function setInventoryRulesValues(settings) {
  lowStockThreshold.value = settings.lowStockThreshold;
  blockOutOfStockSales.checked = settings.blockOutOfStockSales !== false;
}

function setInventoryRulesStatus(message, isError = false) {
  inventoryRulesStatus.textContent = message;
  inventoryRulesStatus.className = `settings-status${isError ? " settings-status-error" : ""}`;
}

function setBackupStatus(message, isError = false) {
  backupStatus.textContent = message;
  backupStatus.className = `settings-status${isError ? " settings-status-error" : ""}`;
}

function readBackupData() {
  const data = {};
  Object.entries(backupKeys).forEach(([name, key]) => {
    const raw = localStorage.getItem(key);
    if (!raw) {
      data[name] = name === "settings" ? window.miniMartSettings.get() : [];
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (name === "settings") {
        data[name] =
          parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : window.miniMartSettings.get();
      } else if (name === "categoryIcons") {
        data[name] =
          parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : {};
      } else {
        data[name] = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error(`Could not read ${name} backup data:`, error);
      data[name] = name === "settings" ? window.miniMartSettings.get() : [];
    }
  });
  return data;
}

function storeDateParts(date = new Date()) {
  const settings = window.miniMartSettings.get();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: settings.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function storeDateString(date = new Date()) {
  const parts = storeDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function reportFilename(dataType, extension) {
  const storeName = String(window.miniMartSettings.get().storeName || "MiniMart")
    .replace(/[^a-z0-9]/gi, "");
  const labels = {
    sales: "Sales",
    products: "Products",
    customers: "Customers",
    inventoryHistory: "Inventory_History",
  };
  return `${storeName || "MiniMart"}_${labels[dataType]}_${storeDateString()}.${extension}`;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function safeSpreadsheetText(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function productTemplateFilename() {
  const storeName = String(window.miniMartSettings.get().storeName || "MiniMart").replace(/[^a-z0-9]/gi, "");
  return `${storeName || "MiniMart"}_Products_Template.xlsx`;
}

function styleTemplateHeader(sheet, columnCount) {
  for (let column = 0; column < columnCount; column += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: column })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "18231D" } },
      };
    }
  }
}

function downloadProductTemplateFile() {
  const workbook = XLSX.utils.book_new();
  const products = XLSX.utils.aoa_to_sheet([
    ["Name", "Category", "Cost", "Price", "Stock"],
    ["Example: Delete this row", "Snacks", 10, 12, 10],
    ["Example: Add your product", "Beverages", 20, 25, 5],
  ]);
  products["!freeze"] = { xSplit: 0, ySplit: 1 };
  products["!autofilter"] = { ref: "A1:E3" };
  products["!cols"] = [30, 20, 14, 14, 12].map((wch) => ({ wch }));
  styleTemplateHeader(products, 5);
  [2, 3].forEach((column) => {
    for (let row = 1; row <= 2; row += 1) {
      products[XLSX.utils.encode_cell({ r: row, c: column })].z = "₱#,##0.00";
    }
  });
  const instructions = XLSX.utils.aoa_to_sheet([
    ["Column", "Rule"],
    ["Name", "Required; trimmed; maximum 80 characters."],
    ["Category", "Optional only when following the existing Create Product category rule; match an existing category or choose to create missing categories."],
    ["Cost", "Number greater than or equal to 0. Peso signs, spaces, and thousands commas are accepted."],
    ["Price", "Number greater than or equal to 0. Peso signs, spaces, and thousands commas are accepted."],
    ["Stock", "Whole number greater than or equal to 0."],
    ["Examples", "Delete rows whose name starts with Example: before importing."],
  ]);
  instructions["!cols"] = [{ wch: 18 }, { wch: 90 }];
  instructions["!freeze"] = { xSplit: 0, ySplit: 1 };
  styleTemplateHeader(instructions, 2);
  XLSX.utils.book_append_sheet(workbook, products, "Products");
  XLSX.utils.book_append_sheet(workbook, instructions, "Instructions");
  XLSX.writeFile(workbook, productTemplateFilename(), { bookType: "xlsx", cellStyles: true });
  setBackupStatus("Product template downloaded.");
}

function importCellValue(cell) {
  if (!cell) return "";
  if (cell.f) return `=${cell.f}`;
  return cell.v ?? "";
}

function normalizeImportHeader(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseImportNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value ?? "").trim().replace(/[₱,\s]/g, "");
  if (!text || /^[=+\-@]/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function productImportRowStatus(row) {
  if (row.error) return { label: `Error: ${row.error}`, className: "is-error" };
  if (row.duplicate) return { label: row.warning ? "Duplicate · Warning" : "Duplicate", className: "is-duplicate" };
  if (row.warning) return { label: "Warning", className: "is-warning" };
  return { label: "New", className: "is-new" };
}

function validateProductImportRows(rawRows) {
  const products = window.miniMartDB.products();
  const categories = window.miniMartDB.categories();
  const existingByName = new Map(products.map((product) => [product.name.trim().toLowerCase(), product]));
  const seen = new Set();
  return rawRows.map((raw, index) => {
    const name = String(raw.name ?? "").trim();
    const categoryInput = String(raw.category ?? "").trim();
    const categoryMatch = categories.find((category) => category.toLowerCase() === categoryInput.toLowerCase());
    const cost = parseImportNumber(raw.cost);
    const price = parseImportNumber(raw.price);
    const stock = parseImportNumber(raw.stock);
    const row = {
      rowNumber: index + 2,
      name,
      category: categoryMatch || categoryInput,
      originalCategory: categoryInput,
      cost,
      price,
      stock,
      duplicate: false,
      warning: false,
      error: "",
      existing: null,
    };
    if (!name) row.error = "Name is required.";
    else if (name.length > 80) row.error = "Name must be 80 characters or fewer.";
    else if (seen.has(name.toLowerCase())) row.error = "Duplicate in file.";
    else seen.add(name.toLowerCase());
    if (!row.error && existingByName.has(name.toLowerCase())) {
      row.duplicate = true;
      row.existing = existingByName.get(name.toLowerCase());
    }
    if (!row.error && categoryInput && !categoryMatch) row.newCategory = true;
    if (!row.error && !categoryInput) row.error = "Category is required.";
    if (!row.error && (cost === null || cost < 0)) row.error = "Cost must be a number 0 or greater.";
    if (!row.error && (price === null || price < 0)) row.error = "Price must be a number 0 or greater.";
    if (!row.error && (stock === null || !Number.isInteger(stock) || stock < 0)) row.error = "Stock must be a whole number 0 or greater.";
    if (!row.error && price < cost) row.warning = true;
    if (name.startsWith("Example:")) row.ignoreExample = true;
    return row;
  }).filter((row) => !row.ignoreExample);
}

function productImportCounts() {
  const rows = productImportRows;
  const errors = rows.filter((row) => row.error).length;
  const duplicates = rows.filter((row) => row.duplicate && !row.error).length;
  const warnings = rows.filter((row) => row.warning && !row.error).length;
  const newCount = rows.filter((row) => !row.error && !row.duplicate).length;
  return { errors, duplicates, warnings, newCount };
}

function productImportIsIncluded(row) {
  if (row.error) return false;
  if (!row.duplicate) return true;
  return productDuplicateMode.value === "update";
}

function productImportChangeText(row) {
  if (!row.duplicate || productDuplicateMode.value !== "update") return "—";
  const existing = row.existing;
  const values = [
    ["Cost", existing.costPrice, row.cost],
    ["Price", existing.price, row.price],
    ["Stock", existing.stock, row.stock],
    ["Category", existing.category, row.category],
  ].filter(([, oldValue, newValue]) => String(oldValue) !== String(newValue));
  return values.length ? values.map(([label, oldValue, newValue]) => `${label}: ${oldValue} → ${newValue}`).join("; ") : "No changes";
}

function renderProductImportPreview() {
  const filter = productImportFilter.value;
  const visible = productImportRows.filter((row) => {
    if (filter === "errors") return Boolean(row.error);
    if (filter === "duplicates") return row.duplicate;
    if (filter === "new") return !row.error && !row.duplicate;
    return true;
  });
  productImportPreview.innerHTML = visible.map((row) => {
    const status = productImportRowStatus(row);
    return `<tr class="${status.className}">
      <td data-label="Row">${row.rowNumber}</td>
      <td data-label="Name">${escapeHtml(row.name)}</td>
      <td data-label="Category">${escapeHtml(row.category || row.originalCategory)}${row.newCategory ? ' <span class="import-new-category">New category</span>' : ""}</td>
      <td data-label="Cost">${row.cost === null ? "—" : escapeHtml(row.cost)}</td>
      <td data-label="Price">${row.price === null ? "—" : escapeHtml(row.price)}</td>
      <td data-label="Stock">${row.stock === null ? "—" : escapeHtml(row.stock)}</td>
      <td data-label="Status"><span class="import-status">${escapeHtml(status.label)}</span></td>
      <td data-label="Will change">${escapeHtml(productImportChangeText(row))}</td>
    </tr>`;
  }).join("");
  productImportEmpty.hidden = visible.length > 0;
  const counts = productImportCounts();
  productImportSummary.textContent = `${counts.newCount} new, ${counts.duplicates} duplicates, ${counts.warnings} warnings, ${counts.errors} errors`;
  const validCount = productImportRows.filter(productImportIsIncluded).length;
  const updateCount = productImportRows.filter(
    (row) => row.duplicate && !row.error && productDuplicateMode.value === "update",
  ).length;
  confirmProductImport.textContent = updateCount
    ? `IMPORT ${validCount} · UPDATE ${updateCount}`
    : `IMPORT ${validCount} PRODUCT${validCount === 1 ? "" : "S"}`;
  productImportModalStatus.textContent = updateCount
    ? `${updateCount} existing product${updateCount === 1 ? "" : "s"} will be updated. Review the changes before confirming.`
    : "";
  productImportModalStatus.className = updateCount
    ? "settings-status settings-status-warning"
    : "settings-status";
  confirmProductImport.disabled = validCount === 0;
}

function setProductImportStatus(message, isError = false) {
  productImportStatus.textContent = message;
  productImportStatus.className = `settings-status${isError ? " settings-status-error" : ""}`;
}

function updateProductImportFileDisplay(hasFile) {
  productImportFileName.hidden = false;
  removeProductImportFile.hidden = !hasFile;
}

function downloadProductErrorRows() {
  const errors = productImportRows.filter((row) => row.error);
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Row", "Name", "Category", "Cost", "Price", "Stock", "Reason"],
    ...errors.map((row) => [row.rowNumber, row.name, row.category || row.originalCategory, row.cost ?? "", row.price ?? "", row.stock ?? "", row.error]),
  ]);
  sheet["!cols"] = [8, 30, 20, 14, 14, 12, 42].map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Errors");
  XLSX.writeFile(workbook, reportFilename("products", "xlsx").replace(".xlsx", "_Errors.xlsx"), { bookType: "xlsx" });
}

function setProductImportModalStatus(message, isError = false) {
  productImportModalStatus.textContent = message;
  productImportModalStatus.className = `settings-status${isError ? " settings-status-error" : ""}`;
}

function openProductImportModal() {
  productImportReturnFocus = document.activeElement;
  productImportModal.hidden = false;
  document.body.classList.add("modal-open");
  setProductImportModalStatus("");
  productImportFilter.value = "all";
  renderProductImportPreview();
  closeProductImport.focus();
}

function closeProductImportModal() {
  productImportModal.hidden = true;
  document.body.classList.remove("modal-open");
  if (productImportReturnFocus && typeof productImportReturnFocus.focus === "function") productImportReturnFocus.focus();
}

function productImportFocusable() {
  return [...productImportModal.querySelectorAll("button, select, input")].filter((element) => !element.disabled && !element.hidden);
}

function productImportFocusTrap(event) {
  if (productImportModal.hidden || event.key !== "Tab") return;
  const focusable = productImportFocusable();
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function parseProductImportFile(file) {
  if (!file) return;
  productImportFileData = null;
  downloadProductErrors.hidden = true;
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx")) {
    setProductImportStatus("Choose an .xlsx Excel file.", true);
    productImportFile.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setProductImportStatus("The file must be 2 MB or smaller.", true);
    productImportFile.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const workbook = XLSX.read(reader.result, { type: "array", cellFormula: true, cellNF: false });
      const sheetName = workbook.SheetNames.includes("Products") ? "Products" : workbook.SheetNames[0];
      if (!sheetName) throw new Error("empty");
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
      if (range.e.r > 2000) {
        setProductImportStatus("The Products sheet must contain 2,000 data rows or fewer.", true);
        return;
      }
      const headers = [];
      for (let column = range.s.c; column <= range.e.c; column += 1) headers.push(normalizeImportHeader(importCellValue(sheet[XLSX.utils.encode_cell({ r: range.s.r, c: column })])));
      const required = ["name", "category", "cost", "price", "stock"];
      const missing = required.filter((header) => !headers.includes(header) && header !== "category");
      if (missing.length) {
        setProductImportStatus(`Missing required header: ${missing[0][0].toUpperCase()}${missing[0].slice(1)}.`, true);
        return;
      }
      const rawRows = [];
      for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex += 1) {
        const values = {};
        headers.forEach((header, column) => { if (header) values[header] = importCellValue(sheet[XLSX.utils.encode_cell({ r: rowIndex, c: range.s.c + column })]); });
        if (Object.values(values).some((value) => String(value).trim() !== "")) rawRows.push(values);
      }
      productImportRows = validateProductImportRows(rawRows);
      productImportFileData = { file, sheetName };
      productImportFileName.textContent = file.name;
      updateProductImportFileDisplay(true);
      openProductImportModal();
    } catch (error) {
      console.error("Could not parse product import:", error);
      setProductImportStatus("This file could not be read.", true);
    }
  });
  reader.addEventListener("error", () => setProductImportStatus("This file could not be read.", true));
  reader.readAsArrayBuffer(file);
}

function reportSales() {
  return window.miniMartDB.sales().filter((sale) => {
    const date = new Date(sale.date);
    if (Number.isNaN(date.getTime())) return false;
    const key = storeDateString(date);
    const today = storeDateString();
    if (salesRange.value === "all") return true;
    if (salesRange.value === "today") return key === today;
    if (salesRange.value === "last7") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 6);
      return key >= storeDateString(cutoff) && key <= today;
    }
    if (salesRange.value === "month") return key.slice(0, 7) === today.slice(0, 7);
    if (!salesStartDate.value || !salesEndDate.value) return false;
    return key >= salesStartDate.value && key <= salesEndDate.value;
  });
}

function reportData() {
  if (reportExportData.value === "sales") return reportSales();
  if (reportExportData.value === "products") return window.miniMartDB.products();
  return readBackupData().customers || [];
}

function reportRangeLabel() {
  const labels = { today: "Today", last7: "Last 7 days", month: "This month", all: "All time", custom: `${salesStartDate.value || "—"} to ${salesEndDate.value || "—"}` };
  return labels[salesRange.value];
}

function updateReportExportUi() {
  const isSales = reportExportData.value === "sales";
  const isCustomers = reportExportData.value === "customers";
  salesRangeField.hidden = !isSales;
  customDateFields.hidden = !isSales || salesRange.value !== "custom";
  customerExportNote.hidden = !isCustomers;
  const records = reportData();
  const validRange = !isSales || salesRange.value !== "custom" || (!salesStartDate.value || !salesEndDate.value || salesStartDate.value <= salesEndDate.value);
  reportExportSummary.textContent = `${records.length} records${isSales ? ` · ${reportRangeLabel()}` : ""}`;
  if (!validRange) {
    reportExportStatus.textContent = "Start date must be on or before end date.";
    reportExportStatus.className = "settings-status settings-status-error";
  }
  exportExcel.disabled = exportPdf.disabled = !records.length || !validRange;
}

function handleReportExportInput() {
  reportExportStatus.textContent = "";
  reportExportStatus.className = "settings-status";
  updateReportExportUi();
}

function formatExportDate(value) {
  return value ? window.miniMartSettings.formatDate(new Date(value)) : "";
}

function formatExportDateTime(value) {
  const settings = window.miniMartSettings.get();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: settings.timezone,
    year: "numeric",
    month: settings.dateFormat === "numeric" ? "2-digit" : "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function shortReceiptId(value) {
  const text = String(value || "");
  return text ? text.slice(-8).toUpperCase() : "—";
}

function salePaymentValue(sale, names) {
  for (const name of names) {
    const value = Number(sale[name]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function salesRows(sales) {
  const products = window.miniMartDB.products();
  const productMap = new Map(products.map((product) => [product.name, product]));
  const transactions = [];
  const items = [];
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  sortedSales.forEach((sale) => {
    const saleItems = Array.isArray(sale.items) ? sale.items : [];
    let profit = 0;
    let hasCompleteCost = saleItems.length > 0;
    saleItems.forEach((item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const product = productMap.get(item.name);
      const recordedCost = Object.prototype.hasOwnProperty.call(item, "costPrice") ? item.costPrice : product?.costPrice;
      const cost = Number(recordedCost);
      const hasCost = Number.isFinite(cost);
      if (!hasCost) hasCompleteCost = false;
      if (hasCost) profit += (price - cost) * quantity;
      items.push({
        id: safeSpreadsheetText(sale.id || ""),
        date: formatExportDateTime(sale.date),
        product: safeSpreadsheetText(item.name || ""),
        category: safeSpreadsheetText(product?.category || item.category || ""),
        quantity,
        price,
        lineTotal: quantity * price,
        cost: hasCost ? cost : null,
        profit: hasCost ? (price - cost) * quantity : null,
      });
    });
    transactions.push({
      date: formatExportDateTime(sale.date),
      id: safeSpreadsheetText(sale.id || ""),
      receipt: shortReceiptId(sale.id),
      items: saleItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      total: Number(sale.total) || 0,
      cash: salePaymentValue(sale, ["cashGiven", "cashPaid"]),
      change: salePaymentValue(sale, ["change", "changeAmount"]),
      profit: hasCompleteCost ? profit : null,
    });
  });
  return { transactions, items, missingCostSales: transactions.filter((sale) => sale.profit === null).length };
}

function reportWorkbook() {
  const dataType = reportExportData.value;
  const workbook = XLSX.utils.book_new();
  const settings = window.miniMartSettings.get();
  const styleHeader = (sheet, widths) => {
    sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]).e.r : 0), c: widths.length - 1 } }) };
    sheet["!cols"] = widths.map((width) => ({ wch: width }));
  };
  if (dataType === "sales") {
    const rows = salesRows(reportSales());
    const includePayment = rows.transactions.some((sale) => sale.cash !== null || sale.change !== null);
    const salesHeaders = ["Date & Time", "Transaction ID", "Items", "Total"];
    if (includePayment) salesHeaders.push("Cash", "Change");
    salesHeaders.push("Profit");
    const salesData = rows.transactions.map((sale) => [
      sale.date,
      sale.id,
      sale.items,
      sale.total,
      ...(includePayment ? [sale.cash ?? "—", sale.change ?? "—"] : []),
      sale.profit ?? "—",
    ]);
    const itemsData = rows.items.map((item) => [item.id, item.date, item.product, item.category, item.quantity, item.price, item.lineTotal, item.cost ?? "—", item.profit ?? "—"]);
    const totals = ["TOTAL", "", rows.transactions.reduce((sum, sale) => sum + sale.items, 0), rows.transactions.reduce((sum, sale) => sum + sale.total, 0)];
    if (includePayment) {
      totals.push(
        rows.transactions.every((sale) => sale.cash !== null) ? rows.transactions.reduce((sum, sale) => sum + sale.cash, 0) : "—",
        rows.transactions.every((sale) => sale.change !== null) ? rows.transactions.reduce((sum, sale) => sum + sale.change, 0) : "—",
      );
    }
    totals.push(rows.transactions.every((sale) => sale.profit !== null) ? rows.transactions.reduce((sum, sale) => sum + sale.profit, 0) : "—");
    const salesSheet = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesData, totals]);
    const itemsSheet = XLSX.utils.aoa_to_sheet([["Transaction ID", "Date & Time", "Product", "Category", "Quantity", "Unit Price", "Line Total", "Cost", "Profit"], ...itemsData]);
    styleHeader(salesSheet, includePayment ? [22, 28, 10, 16, 16, 14, 16] : [22, 28, 10, 16, 16]);
    styleHeader(itemsSheet, [28, 22, 28, 18, 12, 16, 16, 14, 16]);
    salesSheet["!rows"] = [{ hpt: 22 }];
    const salesMoneyColumns = [3, ...(includePayment ? [4, 5] : []), includePayment ? 6 : 4];
    salesMoneyColumns.forEach((column) => { for (let row = 1; row <= rows.transactions.length + 1; row += 1) { const cell = salesSheet[XLSX.utils.encode_cell({ r: row, c: column })]; if (cell && typeof cell.v === "number") cell.z = "₱#,##0.00"; } });
    const itemMoneyColumns = [5, 6, 7, 8];
    itemMoneyColumns.forEach((column) => { for (let row = 1; row <= rows.items.length; row += 1) { const cell = itemsSheet[XLSX.utils.encode_cell({ r: row, c: column })]; if (cell && typeof cell.v === "number") cell.z = "₱#,##0.00"; } });
    XLSX.utils.book_append_sheet(workbook, salesSheet, "Sales");
    XLSX.utils.book_append_sheet(workbook, itemsSheet, "Items");
  } else if (dataType === "products") {
    const threshold = Number(settings.lowStockThreshold) || 0;
    const rows = reportData().map((product) => {
      const cost = Number(product.costPrice);
      const price = Number(product.price) || 0;
      return [safeSpreadsheetText(product.name || ""), safeSpreadsheetText(product.category || ""), Number.isFinite(cost) ? cost : null, price, Number.isFinite(cost) && price ? (price - cost) / price : null, Number(product.stock) || 0, Number(product.stock) <= threshold ? "Yes" : "No"];
    });
    const sheet = XLSX.utils.aoa_to_sheet([["Name", "Category", "Cost", "Price", "Margin %", "Stock", "Low Stock"], ...rows]);
    styleHeader(sheet, [30, 18, 14, 14, 14, 12, 14]);
    for (let row = 1; row <= rows.length; row += 1) {
      [2, 3].forEach((column) => {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
        if (cell) cell.z = "₱#,##0.00";
      });
      const margin = sheet[XLSX.utils.encode_cell({ r: row, c: 4 })];
      if (margin) margin.z = "0.00%";
    }
    XLSX.utils.book_append_sheet(workbook, sheet, "Products");
  } else {
    const rows = reportData().map((customer) => [safeSpreadsheetText(customer.name || ""), safeSpreadsheetText(customer.phone || ""), formatExportDate(customer.joined), customer.nfcId ? "Yes" : "No"]);
    const sheet = XLSX.utils.aoa_to_sheet([["Name", "Phone", "Date Joined", "Linked Card"], ...rows]);
    styleHeader(sheet, [28, 18, 18, 16]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Customers");
  }
  return workbook;
}

async function exportExcelReport() {
  exportExcel.disabled = exportPdf.disabled = true;
  exportExcel.textContent = "PREPARING…";
  try {
    const workbook = reportWorkbook();
    XLSX.writeFile(workbook, reportFilename(reportExportData.value, "xlsx"), { bookType: "xlsx" });
    reportExportStatus.textContent = "Excel report downloaded.";
    reportExportStatus.className = "settings-status";
  } catch (error) {
    console.error("Failed to export Excel report:", error);
    reportExportStatus.textContent = "Could not create the Excel report.";
    reportExportStatus.className = "settings-status settings-status-error";
  } finally {
    exportExcel.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4h11v16H4zM15 8h5v12h-5M8 8l3 4-3 4M11 8l-3 4 3 4" /></svg> EXPORT EXCEL';
    updateReportExportUi();
  }
}

function exportPdfReport() {
  exportExcel.disabled = exportPdf.disabled = true;
  exportPdf.textContent = "PREPARING…";
  try {
    const { jsPDF } = window.jspdf;
    const dataType = reportExportData.value;
    const doc = new jsPDF({ orientation: dataType === "sales" ? "landscape" : "portrait", unit: "mm", format: "a4" });
    const settings = window.miniMartSettings.get();
    doc.addFileToVFS("NotoSans-Regular.ttf", window.miniMartNotoSans);
    doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
    doc.setFont("NotoSans");
    const pageWidth = doc.internal.pageSize.getWidth();
    let headerY = 14;
    if (settings.logoDataUrl && window.miniMartSettings.isValidLogoDataUrl(settings.logoDataUrl)) {
      try {
        const format = settings.logoDataUrl.startsWith("data:image/png") ? "PNG" : settings.logoDataUrl.startsWith("data:image/webp") ? "WEBP" : "JPEG";
        doc.addImage(settings.logoDataUrl, format, 14, 8, 18, 18);
        headerY = 12;
      } catch (error) {
        console.warn("Could not add store logo to sales PDF:", error);
      }
    }
    const headerLeft = settings.logoDataUrl ? 36 : 14;
    doc.setFontSize(15);
    doc.setTextColor(24, 35, 29);
    doc.text(settings.storeName || "Mini Mart", headerLeft, headerY);
    doc.setFontSize(8);
    doc.setTextColor(80, 88, 83);
    const contact = [settings.address, settings.contactNumber].filter(Boolean).join(" · ");
    if (contact) doc.text(contact, headerLeft, headerY + 6);
    doc.setFontSize(12);
    doc.setTextColor(24, 35, 29);
    doc.text(`${dataType === "sales" ? "Sales" : dataType[0].toUpperCase() + dataType.slice(1)} Report`, 14, 32);
    doc.setFontSize(8);
    doc.setTextColor(80, 88, 83);
    doc.text(`Range: ${dataType === "sales" ? reportRangeLabel() : "All records"}`, 14, 38);
    doc.text(`Generated on: ${formatExportDateTime(new Date())}`, pageWidth - 14, 38, { align: "right" });
    let head;
    let body;
    if (dataType === "sales") {
      const rows = salesRows(reportSales());
      const includePayment = rows.transactions.some((sale) => sale.cash !== null || sale.change !== null);
      const totalProfitKnown = rows.transactions.every((sale) => sale.profit !== null);
      const itemsSold = rows.transactions.reduce((sum, sale) => sum + sale.items, 0);
      const revenue = rows.transactions.reduce((sum, sale) => sum + sale.total, 0);
      const profit = rows.transactions.reduce((sum, sale) => sum + (sale.profit || 0), 0);
      const summaryY = 45;
      doc.setFillColor(245, 247, 244);
      doc.roundedRect(14, summaryY, pageWidth - 28, 17, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(24, 35, 29);
      const summary = [
        ["Transactions", String(rows.transactions.length)],
        ["Items sold", String(itemsSold)],
        ["Total revenue", window.miniMartSettings.formatCurrency(revenue)],
        ["Total profit", totalProfitKnown ? window.miniMartSettings.formatCurrency(profit) : "—"],
      ];
      summary.forEach(([label, value], index) => {
        const x = 18 + index * ((pageWidth - 36) / summary.length);
        doc.setTextColor(80, 88, 83);
        doc.text(label, x, summaryY + 6);
        doc.setTextColor(24, 35, 29);
        doc.text(value, x, summaryY + 12);
      });
      head = [["Date & time", "Receipt #", "Items", "Total"]];
      if (includePayment) head[0].push("Cash", "Change");
      head[0].push("Profit");
      body = rows.transactions.map((sale) => [
        sale.date,
        sale.receipt,
        sale.items,
        window.miniMartSettings.formatCurrency(sale.total),
        ...(includePayment ? [sale.cash === null ? "—" : window.miniMartSettings.formatCurrency(sale.cash), sale.change === null ? "—" : window.miniMartSettings.formatCurrency(sale.change)] : []),
        sale.profit === null ? "—" : window.miniMartSettings.formatCurrency(sale.profit),
      ]);
      const totals = ["TOTAL", "", itemsSold, window.miniMartSettings.formatCurrency(revenue)];
      if (includePayment) totals.push(rows.transactions.every((sale) => sale.cash !== null) ? window.miniMartSettings.formatCurrency(rows.transactions.reduce((sum, sale) => sum + sale.cash, 0)) : "—", rows.transactions.every((sale) => sale.change !== null) ? window.miniMartSettings.formatCurrency(rows.transactions.reduce((sum, sale) => sum + sale.change, 0)) : "—");
      totals.push(totalProfitKnown ? window.miniMartSettings.formatCurrency(profit) : "—");
      body.push(totals);
      const numericColumns = [2, 3, ...(includePayment ? [4, 5] : []), includePayment ? 6 : 4];
      const columnStyles = { 0: { cellWidth: 39 }, 1: { cellWidth: 22 } };
      numericColumns.forEach((column) => { columnStyles[column] = { halign: "right" }; });
      const missingNote = rows.missingCostSales ? `Profit excludes ${rows.missingCostSales} sale${rows.missingCostSales === 1 ? "" : "s"} with no cost data.` : "";
      doc.autoTable({
        startY: 66,
        head,
        body,
        theme: "striped",
        margin: { left: 14, right: 14, bottom: 16 },
        styles: { font: "NotoSans", fontSize: 7, cellPadding: 2.2, overflow: "linebreak", textColor: [65, 72, 67], lineColor: [225, 230, 226], lineWidth: 0.15 },
        headStyles: { fillColor: [24, 35, 29], textColor: [255, 255, 255], fontStyle: "normal", halign: "left" },
        columnStyles,
        didParseCell: (data) => {
          if (data.section === "head" && numericColumns.includes(data.column.index)) data.cell.styles.halign = "right";
          if (data.row.index === body.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [232, 237, 233];
          }
          if (data.cell.text[0] === "—") data.cell.styles.textColor = [130, 136, 132];
        },
        rowPageBreak: "avoid",
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor(80, 88, 83);
          doc.text(settings.storeName || "Mini Mart", 14, doc.internal.pageSize.getHeight() - 8);
          doc.text(`Page ${data.pageNumber} of ${doc.getNumberOfPages()}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
        },
      });
      if (missingNote) {
        doc.setFontSize(7);
        doc.setTextColor(100, 106, 101);
        doc.text(missingNote, 14, doc.lastAutoTable.finalY + 7);
      }
      doc.save(reportFilename(dataType, "pdf"));
      reportExportStatus.textContent = "PDF report downloaded.";
      reportExportStatus.className = "settings-status";
      return;
    } else if (dataType === "products") {
      head = [["Name", "Category", "Cost (PHP)", "Price (PHP)", "Margin %", "Stock", "Low stock"]];
      const threshold = Number(settings.lowStockThreshold) || 0;
      body = reportData().map((product) => { const cost = Number(product.costPrice); const price = Number(product.price) || 0; return [product.name || "", product.category || "", Number.isFinite(cost) ? window.miniMartSettings.formatCurrency(cost) : "—", window.miniMartSettings.formatCurrency(price), Number.isFinite(cost) && price ? `${(((price - cost) / price) * 100).toFixed(1)}%` : "—", Number(product.stock) || 0, Number(product.stock) <= threshold ? "Yes" : "No"]; });
    } else {
      head = [["Name", "Phone", "Date Joined", "Linked Card"]];
      body = reportData().map((customer) => [customer.name || "", customer.phone || "", formatExportDate(customer.joined), customer.nfcId ? "Yes" : "No"]);
    }
    doc.autoTable({ startY: 45, head, body, theme: "striped", margin: { left: 14, right: 14, bottom: 16 }, styles: { font: "NotoSans", fontSize: 7, cellPadding: 2, overflow: "linebreak", textColor: [65, 72, 67] }, headStyles: { fillColor: [24, 35, 29], textColor: 255 }, didDrawPage: (data) => { doc.setFontSize(8); doc.setTextColor(80, 88, 83); doc.text(settings.storeName || "Mini Mart", 14, doc.internal.pageSize.getHeight() - 8); doc.text(`Page ${data.pageNumber} of ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" }); } });
    doc.save(reportFilename(dataType, "pdf"));
    reportExportStatus.textContent = "PDF report downloaded.";
    reportExportStatus.className = "settings-status";
  } catch (error) {
    console.error("Failed to export PDF report:", error);
    reportExportStatus.textContent = "Could not create the PDF report.";
    reportExportStatus.className = "settings-status settings-status-error";
  } finally {
    exportPdf.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6zM15 3v4h4M8 13h2a2 2 0 0 0 0-4H8v6M13 9h2a3 3 0 0 1 0 6h-2z" /></svg> EXPORT PDF';
    updateReportExportUi();
  }
}

function downloadBackupFile() {
  const data = readBackupData();
  const exportedAt = new Date().toISOString();
  downloadFile(
    JSON.stringify({ format: "MiniMartPOS backup", version: 1, exportedAt, data }, null, 2),
    todayFilename("mini-mart-pos-backup", "json"),
    "application/json",
  );
  localStorage.setItem("miniMartLastBackup", exportedAt);
  updateBackupSummary();
  setBackupStatus("Backup downloaded.");
}

function updateBackupSummary() {
  const data = readBackupData();
  const lastBackup = localStorage.getItem("miniMartLastBackup");
  const lastBackupDate = lastBackup ? new Date(lastBackup) : null;
  const hasValidBackupDate = lastBackupDate && !Number.isNaN(lastBackupDate.getTime());
  const ageDays = hasValidBackupDate
    ? Math.floor((Date.now() - lastBackupDate.getTime()) / 86400000)
    : null;
  const ageWarning = ageDays === null
    ? lastBackup
      ? " Backup date is invalid."
      : " No backup recorded yet."
    : ageDays > 30
      ? ` Backup is ${ageDays} days old.`
      : "";
  backupSummary.textContent = `${data.products.length} products · ${data.sales.length} sales · ${data.customers.length} customers · ${data.inventoryAdjustments.length} stock adjustments${hasValidBackupDate ? ` · Last backup ${window.miniMartSettings.formatDate(lastBackupDate)}` : ""}${ageWarning}`;
  backupSummary.classList.toggle("is-warning", !hasValidBackupDate || ageDays > 30);
}

function showRestorePreview(data, filename) {
  pendingRestoreData = data;
  backupRestorePreviewText.textContent =
    `${filename}: ${data.products.length} products, ${data.sales.length} sales, ` +
    `${data.categories.length} categories, ${data.customers.length} customers, ` +
    `${(data.inventoryAdjustments || []).length} stock adjustments, and settings.`;
  backupRestorePreview.hidden = false;
}

function clearRestorePreview() {
  pendingRestoreData = null;
  backupRestorePreview.hidden = true;
  backupRestorePreviewText.textContent = "";
}

function runHealthCheck() {
  const products = window.miniMartDB.products();
  const sales = window.miniMartDB.sales();
  const categories = window.miniMartDB.categories();
  const customers = readBackupData().customers;
  const categorySet = new Set(categories.map((category) => category.toLowerCase()));
  const duplicateProducts = products.length - new Set(products.map((product) => product.name.trim().toLowerCase())).size;
  const invalidProducts = products.filter((product) =>
    !product.name?.trim() ||
    !product.category?.trim() ||
    !categorySet.has(product.category.trim().toLowerCase()) ||
    !Number.isFinite(Number(product.price)) ||
    Number(product.price) < 0 ||
    !Number.isFinite(Number(product.stock)) ||
    Number(product.stock) < 0,
  ).length;
  const invalidSales = sales.filter((sale) =>
    !sale || !Array.isArray(sale.items) || !Number.isFinite(Number(sale.total)) ||
    !sale.items.every((item) => item?.name && Number.isFinite(Number(item.quantity))),
  ).length;
  const invalidCustomers = customers.filter((customer) => !customer || !customer.name?.trim()).length;
  const issues = [
    duplicateProducts ? `${duplicateProducts} duplicate product name${duplicateProducts === 1 ? "" : "s"}` : "",
    invalidProducts ? `${invalidProducts} invalid product record${invalidProducts === 1 ? "" : "s"}` : "",
    invalidSales ? `${invalidSales} invalid sale record${invalidSales === 1 ? "" : "s"}` : "",
    invalidCustomers ? `${invalidCustomers} invalid Suki customer${invalidCustomers === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  dataHealthResults.className = `data-health-results${issues.length ? " is-warning" : " is-healthy"}`;
  dataHealthResults.textContent = issues.length
    ? `Issues found: ${issues.join("; ")}.`
    : `Healthy: ${products.length} products, ${sales.length} sales, ${customers.length} customers, and ${categories.length} categories checked.`;
}

function exportInventoryHistoryFile() {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem("miniMartInventoryAdjustments") || "[]");
  } catch (error) {
    console.error("Could not read inventory history:", error);
    setBackupStatus("Could not read inventory history.", true);
    return;
  }
  if (!history.length) {
    setBackupStatus("There is no inventory history to export.", true);
    return;
  }
  const rows = [
    ["Date", "Product", "Previous stock", "Adjustment", "Stock after", "Reason"],
    ...history.map((entry) => [
      safeSpreadsheetText(entry.date || ""),
      safeSpreadsheetText(entry.product || ""),
      entry.previousStock ?? "",
      entry.adjustment ?? "",
      entry.stockAfter ?? "",
      safeSpreadsheetText(entry.reason || ""),
    ]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [22, 30, 16, 14, 14, 36].map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Inventory History");
  XLSX.writeFile(workbook, reportFilename("inventoryHistory", "xlsx"));
  setBackupStatus(`Exported ${history.length} inventory history records.`);
}

function importProducts() {
  const counts = productImportCounts();
  const included = productImportRows.filter(productImportIsIncluded);
  if (productMissingCategoryMode.value === "uncategorized") {
    included.forEach((row) => {
      if (row.newCategory) row.category = "Uncategorized";
    });
  }
  const oldProducts = window.miniMartDB.products();
  const oldCategories = window.miniMartDB.categories();
  const oldCategoryIcons = localStorage.getItem("miniMartCategoryIcons");
  const oldDeletedProducts = localStorage.getItem("miniMartDeletedProducts");
  const byName = new Map(oldProducts.map((product) => [product.name.toLowerCase(), product]));
  const nextProducts = [...oldProducts];
  const nextCategories = [...oldCategories];
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  try {
    if (productDuplicateMode.value === "skip") skipped = counts.duplicates;
    included.forEach((row) => {
      const normalizedName = row.name.toLowerCase();
      const product = byName.get(normalizedName);
      const nextProduct = {
        ...(product || {}),
        name: row.name,
        category: row.category,
        costPrice: row.cost,
        price: row.price,
        stock: row.stock,
        icon: product?.icon || "◇",
        accent: product?.accent || "var(--blue)",
      };
      if (product && productDuplicateMode.value === "update") {
        const index = nextProducts.findIndex((entry) => entry.name.toLowerCase() === normalizedName);
        nextProducts[index] = nextProduct;
        updated += 1;
      } else if (!product) {
        nextProducts.push(nextProduct);
        byName.set(normalizedName, nextProduct);
        imported += 1;
      }
      if (!nextCategories.some((category) => category.toLowerCase() === row.category.toLowerCase())) nextCategories.push(row.category);
    });
    if (productMissingCategoryMode.value === "uncategorized" && !nextCategories.includes("Uncategorized") && included.some((row) => row.newCategory)) nextCategories.push("Uncategorized");
    const deletedNames = oldDeletedProducts ? JSON.parse(oldDeletedProducts) : [];
    const importedNames = new Set(nextProducts.map((product) => product.name));
    const nextDeletedNames = deletedNames.filter((name) => !importedNames.has(name));
    localStorage.setItem("miniMartProducts", JSON.stringify(nextProducts));
    localStorage.setItem("miniMartCategories", JSON.stringify(nextCategories));
    localStorage.setItem("miniMartDeletedProducts", JSON.stringify(nextDeletedNames));
    productImportRows = productImportRows.map((row) => ({ ...row, imported: productImportIsIncluded(row) }));
    closeProductImportModal();
    setProductImportStatus(`Imported ${imported}, updated ${updated}, skipped ${skipped}, errors ${counts.errors}.`);
    downloadProductErrors.hidden = counts.errors === 0;
    window.dispatchEvent(new CustomEvent("miniMartDatabaseChanged", { detail: { key: "miniMartProducts" } }));
  } catch (error) {
    console.error("Could not import products:", error);
    localStorage.setItem("miniMartProducts", JSON.stringify(oldProducts));
    localStorage.setItem("miniMartCategories", JSON.stringify(oldCategories));
    if (oldCategoryIcons === null) localStorage.removeItem("miniMartCategoryIcons"); else localStorage.setItem("miniMartCategoryIcons", oldCategoryIcons);
    if (oldDeletedProducts === null) localStorage.removeItem("miniMartDeletedProducts"); else localStorage.setItem("miniMartDeletedProducts", oldDeletedProducts);
    setProductImportModalStatus("Could not save products. Nothing was changed.", true);
  }
}

function resetDataCountsText() {
  resetDataCounts.textContent = `This will erase ${window.miniMartDB.products().length} products, ${window.miniMartDB.sales().length} sales, ${window.miniMartDB.categories().length} categories, ${readBackupData().customers.length} Suki customers, and ${readBackupData().inventoryAdjustments.length} stock adjustments. Settings and login will be kept.`;
}

function openResetDataModal() {
  resetDataReturnFocus = document.activeElement;
  resetDataCountsText();
  resetConfirmText.value = "";
  confirmResetData.disabled = true;
  resetDataStatus.textContent = "";
  resetDataModal.hidden = false;
  document.body.classList.add("modal-open");
  resetConfirmText.focus();
}

function closeResetDataModal() {
  resetDataModal.hidden = true;
  document.body.classList.remove("modal-open");
  if (resetDataReturnFocus && typeof resetDataReturnFocus.focus === "function") resetDataReturnFocus.focus();
}

function resetAllData() {
  const oldValues = Object.fromEntries(["miniMartProducts", "miniMartSales", "miniMartCategories", "miniMartCategoryIcons", "miniMartDeletedProducts", "miniMartSukis", "miniMartInventoryAdjustments"].map((key) => [key, localStorage.getItem(key)]));
  try {
    ["miniMartProducts", "miniMartSales", "miniMartCategories", "miniMartSukis", "miniMartInventoryAdjustments"].forEach((key) => localStorage.setItem(key, JSON.stringify([])));
    localStorage.setItem("miniMartCategoryIcons", JSON.stringify({}));
    localStorage.setItem("miniMartDeletedProducts", JSON.stringify([]));
    closeResetDataModal();
    setBackupStatus("All data was reset. Restore can bring it back from your backup file.");
    window.dispatchEvent(new CustomEvent("miniMartDatabaseChanged", { detail: { key: "miniMartProducts" } }));
  } catch (error) {
    console.error("Could not reset data:", error);
    Object.entries(oldValues).forEach(([key, value]) => { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); });
    resetDataStatus.textContent = "Could not reset data. Nothing was changed.";
    resetDataStatus.className = "settings-status settings-status-error";
  }
}

function isValidBackup(documentData) {
  const data = documentData?.data;
  return (
    documentData?.format === "MiniMartPOS backup" &&
    documentData?.version === 1 &&
    data &&
    typeof data === "object" &&
    Array.isArray(data.products) &&
    Array.isArray(data.sales) &&
    Array.isArray(data.categories) &&
    (!Object.prototype.hasOwnProperty.call(data, "categoryIcons") ||
      (data.categoryIcons && typeof data.categoryIcons === "object" && !Array.isArray(data.categoryIcons))) &&
    (!Object.prototype.hasOwnProperty.call(data, "deletedProducts") ||
      Array.isArray(data.deletedProducts)) &&
    Array.isArray(data.customers) &&
    (!Object.prototype.hasOwnProperty.call(data, "inventoryAdjustments") ||
      Array.isArray(data.inventoryAdjustments)) &&
    data.settings &&
    typeof data.settings === "object" &&
    !Array.isArray(data.settings)
  );
}

function restoreBackupData(data) {
  const payload = {
    products: data.products,
    sales: data.sales,
    categories: data.categories,
    categoryIcons: data.categoryIcons || {},
    deletedProducts: data.deletedProducts || [],
    customers: data.customers,
    inventoryAdjustments: data.inventoryAdjustments || [],
    settings: data.settings,
  };
  Object.entries(payload).forEach(([name, value]) => {
    localStorage.setItem(backupKeys[name], JSON.stringify(value));
  });
  if (data.exportedAt) {
    localStorage.setItem("miniMartLastBackup", data.exportedAt);
  }
  window.location.reload();
}

function setSukiSettingsValues(settings) {
  sukiEnabled.checked = settings.sukiEnabled !== false;
  sukiPesosPerPoint.value = settings.sukiPesosPerPoint;
  sukiPesoValue.value = settings.sukiPesoValue;
  sukiMinPointsToRedeem.value = settings.sukiMinPointsToRedeem;
  sukiPointsExpiry.value = settings.sukiPointsExpiry;
  sukiPointsExpiryDays.value = settings.sukiPointsExpiryDays;
  sukiPointsExpiryDaysField.hidden = settings.sukiPointsExpiry !== "days";
}

function setSukiSettingsStatus(message, isError = false) {
  sukiSettingsStatus.textContent = message;
  sukiSettingsStatus.className = `settings-status${isError ? " settings-status-error" : ""}`;
}

function resetSettingsSection(section) {
  if (!window.confirm("Reset this settings section to its defaults?")) {
    return;
  }
  const defaults = window.miniMartSettings.defaults;
  const changes = section === "store"
    ? {
        storeName: defaults.storeName,
        address: defaults.address,
        contactNumber: defaults.contactNumber,
        registerName: defaults.registerName,
        receiptFooter: defaults.receiptFooter,
        timezone: defaults.timezone,
        dateFormat: defaults.dateFormat,
        logoDataUrl: defaults.logoDataUrl,
      }
    : section === "inventory"
      ? {
          lowStockThreshold: defaults.lowStockThreshold,
          blockOutOfStockSales: defaults.blockOutOfStockSales,
        }
      : {
          sukiEnabled: defaults.sukiEnabled,
          sukiPesosPerPoint: defaults.sukiPesosPerPoint,
          sukiPesoValue: defaults.sukiPesoValue,
          sukiMinPointsToRedeem: defaults.sukiMinPointsToRedeem,
          sukiPointsExpiry: defaults.sukiPointsExpiry,
          sukiPointsExpiryDays: defaults.sukiPointsExpiryDays,
        };
  const { error, settings } = window.miniMartSettings.save(changes);
  if (error) {
    setBackupStatus("Could not reset that section.", true);
    return;
  }
  setFormValues(settings);
  setInventoryRulesValues(settings);
  setSukiSettingsValues(settings);
  updateThemeToggle(settings.theme);
  markSettingsClean();
  setStatus(section === "store" ? "Reset to defaults." : "");
  setInventoryRulesStatus(section === "inventory" ? "Reset to defaults." : "");
  setSukiSettingsStatus(section === "suki" ? "Reset to defaults." : "");
}

function validateSukiSettings() {
  const checks = [
    [sukiPesosPerPoint, Number(sukiPesosPerPoint.value) > 0, "Enter an amount greater than 0."],
    [sukiPesoValue, Number(sukiPesoValue.value) > 0, "Enter an amount greater than 0."],
    [
      sukiMinPointsToRedeem,
      Number.isInteger(Number(sukiMinPointsToRedeem.value)) &&
        Number(sukiMinPointsToRedeem.value) >= 0,
      "Enter a whole number of 0 or more.",
    ],
    [
      sukiPointsExpiryDays,
      sukiPointsExpiry.value !== "days" ||
        (Number.isInteger(Number(sukiPointsExpiryDays.value)) &&
          Number(sukiPointsExpiryDays.value) > 0),
      "Enter a whole number greater than 0.",
    ],
  ];
  let valid = true;
  checks.forEach(([field, isValid, message]) => {
    field.setAttribute("aria-invalid", String(!isValid));
    const error = document.getElementById(`${field.id}Error`);
    error.textContent = isValid ? "" : message;
    if (!isValid) valid = false;
  });
  return valid;
}

function setCategoryStatus(message, isError = false) {
  categoryManagementStatus.textContent = message;
  categoryManagementStatus.className = `category-management-modal-status${isError ? " is-error" : ""}`;
  window.clearTimeout(setCategoryStatus.timeout);
  if (message) {
    setCategoryStatus.timeout = window.setTimeout(() => {
      categoryManagementStatus.textContent = "";
    }, 1500);
  }
}

function getManagedCategories() {
  const products = window.miniMartDB.products();
  return [
    ...window.miniMartDB.categories(),
    ...new Set(products.map((product) => product.category)),
  ].filter((category, index, all) => all.indexOf(category) === index);
}

function renderCategorySummary(categories = getManagedCategories()) {
  categorySummaryChips.replaceChildren();
  document.getElementById("categoryManagementSummary").textContent =
    `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`;
  categories.slice(0, 6).forEach((category) => {
    const chip = document.createElement("span");
    chip.className = "category-summary-chip";
    const icon = document.createElement("img");
    icon.src = window.miniMartDB.categoryIcon(category);
    icon.alt = "";
    const name = document.createElement("span");
    name.textContent = category;
    const unit = window.miniMartDB.categoryDefaultUnit(category);
    chip.append(icon, name);
    if (unit !== "piece") {
      const unitTag = document.createElement("small");
      unitTag.className = "category-summary-unit";
      unitTag.textContent = window.miniMartDB.units()[unit].shortLabel;
      chip.append(unitTag);
    }
    categorySummaryChips.append(chip);
  });
  if (categories.length > 6) {
    const more = document.createElement("span");
    more.className = "category-summary-chip category-summary-more";
    more.textContent = `+${categories.length - 6} more`;
    categorySummaryChips.append(more);
  }
}

function renderCategoryManagement() {
  categoryManagementList.replaceChildren();
  const categories = getManagedCategories();
  renderCategorySummary(categories);
  categoryManagementModalSummary.textContent =
    `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`;
  const query = categoryManagementSearch.value.trim().toLowerCase();
  const visibleCategories = categories.filter((category) =>
    category.toLowerCase().includes(query),
  );
  categoryManagementEmpty.hidden = visibleCategories.length > 0;
  categoryManagementReorderNote.hidden = !query;
  if (!visibleCategories.length) {
    return;
  }

  visibleCategories.forEach((category) => {
    const index = categories.indexOf(category);
    const row = document.createElement("div");
    row.className = "category-management-row";
    row.dataset.category = category;
    row.draggable = !query;
    const productsCount = window.miniMartDB
      .products()
      .filter((product) => product.category === category).length;
    const icon = document.createElement("img");
    icon.src = window.miniMartDB.categoryIcon(category);
    icon.alt = "";
    icon.className = "category-management-icon";
    const name = document.createElement("button");
    name.type = "button";
    name.className = "category-management-name";
    name.dataset.categoryAction = "rename";
    name.textContent = category;
    name.setAttribute("aria-label", `Rename category ${category}`);
    const count = document.createElement("small");
    count.className = "category-management-count";
    count.textContent = `${productsCount} product${productsCount === 1 ? "" : "s"}`;
    const currentUnit = window.miniMartDB.categoryDefaultUnit(category);
    const unitTag = document.createElement("small");
    unitTag.className = "category-management-unit-tag";
    unitTag.textContent = currentUnit === "piece"
      ? ""
      : window.miniMartDB.units()[currentUnit].shortLabel;
    const details = document.createElement("span");
    details.className = "category-management-details";
    const unit = document.createElement("select");
    unit.className = "category-management-unit";
    unit.setAttribute("aria-label", `Default unit for ${category}`);
    Object.entries(window.miniMartDB.units()).forEach(([value, rule]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = `${rule.label} (${rule.shortLabel})`;
      option.selected = value === currentUnit;
      unit.append(option);
    });
    unit.addEventListener("change", () => {
      window.miniMartDB.saveCategoryDefaultUnit(category, unit.value);
      unitTag.textContent = unit.value === "piece"
        ? ""
        : window.miniMartDB.units()[unit.value].shortLabel;
      setCategoryStatus("Saved");
    });
    details.append(name, count);
    const unitEditor = document.createElement("div");
    unitEditor.className = "category-management-unit-editor";
    const unitLabel = document.createElement("small");
    unitLabel.textContent = "Default unit";
    unitEditor.append(unitLabel, unitTag, unit);
    const iconPicker = document.createElement("div");
    iconPicker.className = "category-management-icon-picker";
    iconPicker.setAttribute("aria-label", `Choose icon for ${category}`);
    const iconPickerLabel = document.createElement("small");
    iconPickerLabel.className = "category-management-icon-label";
    iconPickerLabel.textContent = "Choose category icon";
    iconPicker.append(iconPickerLabel);
    const currentIcon = window.miniMartDB.categoryIcon(category);
    categoryIconOptions.forEach(([key, path, label]) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "category-icon-option";
      option.dataset.categoryIcon = path;
      option.dataset.category = category;
      option.title = label;
      option.setAttribute("aria-label", `${label} icon`);
      option.setAttribute("aria-pressed", String(path === currentIcon));
      if (path === currentIcon) option.classList.add("is-selected");
      const image = document.createElement("img");
      image.src = path;
      image.alt = "";
      option.append(image);
      iconPicker.append(option);
    });
    const iconEditor = document.createElement("details");
    iconEditor.className = "category-management-icon-editor";
    const iconEditorSummary = document.createElement("summary");
    iconEditorSummary.textContent = "Change category icon";
    iconEditor.append(iconEditorSummary, iconPicker);
    const main = document.createElement("div");
    main.className = "category-management-main";
    main.append(icon, details);
    const editPanel = document.createElement("details");
    editPanel.className = "category-management-edit-panel";
    const editSummary = document.createElement("summary");
    editSummary.textContent = "Edit category";
    editPanel.append(editSummary);
    const actions = document.createElement("div");
    actions.className = "category-management-actions";
    actions.innerHTML = `
      <button class="settings-button-ghost" type="button" data-category-action="up" aria-label="Move category up" ${index === 0 ? "disabled" : ""}>${categoryActionIcons.up}</button>
      <button class="settings-button-ghost" type="button" data-category-action="down" aria-label="Move category down" ${index === categories.length - 1 ? "disabled" : ""}>${categoryActionIcons.down}</button>
      <button class="settings-button-ghost" type="button" data-category-action="rename" aria-label="Rename category">${categoryActionIcons.rename}</button>
      <button class="settings-button-ghost" type="button" data-category-action="delete" aria-label="Delete category">${categoryActionIcons.delete}</button>
    `;
    editPanel.append(unitEditor, iconEditor, actions);
    const error = document.createElement("small");
    error.className = "category-management-error";
    error.setAttribute("role", "alert");
    error.hidden = true;
    row.append(main, editPanel, error);
    categoryManagementList.append(row);
  });
}

function closeCategoryDeleteModal() {
  categoryDeleteModal.hidden = true;
  pendingCategoryDelete = "";
}

function openCategoryDeleteModal(category) {
  const products = window.miniMartDB
    .products()
    .filter((product) => product.category === category);
  const targets = getManagedCategories().filter((entry) => entry !== category);
  pendingCategoryDelete = category;
  categoryMoveTarget.replaceChildren();
  targets.forEach((target) => {
    const option = document.createElement("option");
    option.value = target;
    option.textContent = target;
    categoryMoveTarget.append(option);
  });
  categoryDeleteCopy.textContent = `${products.length} product${products.length === 1 ? "" : "s"} belong to ${category}. Choose another category so they are not orphaned.`;
  categoryMoveTarget.disabled = targets.length === 0;
  categoryDeleteModal.hidden = false;
  categoryMoveTarget.focus();
}

function saveCategoryRename(row) {
  const oldName = row.dataset.category;
  const input = row.querySelector(".category-management-edit");
  const newName = input.value.trim();
  const duplicate = getManagedCategories().some(
    (category) =>
      category !== oldName && category.toLowerCase() === newName.toLowerCase(),
  );
  if (!newName) {
    input.setAttribute("aria-invalid", "true");
    const error = row.querySelector(".category-management-error");
    error.textContent = "Category names cannot be empty.";
    error.hidden = false;
    return;
  }
  if (duplicate) {
    input.setAttribute("aria-invalid", "true");
    const error = row.querySelector(".category-management-error");
    error.textContent = "That category name already exists.";
    error.hidden = false;
    return;
  }
  if (newName === oldName) {
    renderCategoryManagement();
    setCategoryStatus("Saved");
    return;
  }
  window.miniMartDB.renameCategory(oldName, newName);
  renderCategoryManagement();
  setCategoryStatus("Saved");
}

function startCategoryRename(row) {
  if (row.querySelector(".category-management-edit")) return;
  const name = row.querySelector(".category-management-name");
  const input = document.createElement("input");
  input.className = "category-management-edit";
  input.type = "text";
  input.maxLength = 60;
  input.value = row.dataset.category;
  input.setAttribute("aria-label", `Rename category ${row.dataset.category}`);
  name.replaceWith(input);
  input.focus();
  input.select();
  const finish = () => {
    if (row.isConnected) saveCategoryRename(row);
  };
  input.addEventListener("blur", finish, { once: true });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      renderCategoryManagement();
    }
  });
}

function lockCategoryManagementScroll() {
  if (!categoryManagementScrollLocked) {
    document.body.dataset.categoryModalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    categoryManagementScrollLocked = true;
  }
}

function unlockCategoryManagementScroll() {
  if (categoryManagementScrollLocked) {
    document.body.style.overflow = document.body.dataset.categoryModalOverflow || "";
    delete document.body.dataset.categoryModalOverflow;
    categoryManagementScrollLocked = false;
  }
}

function openCategoryManagementModal() {
  categoryManagementReturnFocus = document.activeElement;
  categoryManagementSearch.value = "";
  renderCategoryManagement();
  categoryManagementModal.hidden = false;
  lockCategoryManagementScroll();
  categoryManagementSearch.focus();
}

function closeCategoryManagementModal() {
  categoryManagementModal.hidden = true;
  unlockCategoryManagementScroll();
  setCategoryStatus("");
  const returnTarget =
    categoryManagementReturnFocus?.isConnected &&
    typeof categoryManagementReturnFocus.focus === "function"
      ? categoryManagementReturnFocus
      : openCategoryManagement;
  returnTarget.focus();
  categoryManagementReturnFocus = null;
}

function keepCategoryManagementFocus(event) {
  if (event.key !== "Tab" || categoryManagementModal.hidden) return;
  const focusable = [
    ...categoryManagementModal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

renderCategoryManagement();

function validateInventoryRules() {
  const value = Number(lowStockThreshold.value);
  const valid = Number.isInteger(value) && value >= 0;
  lowStockThreshold.setAttribute("aria-invalid", String(!valid));
  document.getElementById("lowStockThresholdError").textContent = valid
    ? ""
    : "Enter a whole number of 0 or more.";
  return valid;
}

setFormValues(currentSettings);
setInventoryRulesValues(currentSettings);
setSukiSettingsValues(currentSettings);

[
  fields.storeName,
  fields.address,
  fields.contactNumber,
  fields.registerName,
  fields.receiptFooter,
].forEach((field) => field.addEventListener("input", updateStorePreviews));
[fields.timezone, fields.dateFormat].forEach((field) =>
  field.addEventListener("change", updateStorePreviews),
);

function updateThemeToggle(theme) {
  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-checked", String(isDark));
  themeToggle.classList.toggle("is-on", isDark);
  themeToggle.querySelector(".theme-toggle-icon").textContent = isDark ? "☾" : "☀";
}

updateThemeToggle(window.miniMartSettings.get().theme);

let nfcPermissionStatus = null;

function setNfcStatusBadge(variant, icon, text) {
  nfcStatusBadge.className = `device-status-badge device-status-badge-${variant}`;
  nfcStatusBadge.querySelector("[aria-hidden]").textContent = icon;
  nfcStatusText.textContent = text;
}

function getNfcPermissionLabel(permission) {
  if (permission === "granted") return "granted";
  if (permission === "denied") return "denied";
  if (permission === "prompt") return "not asked";
  return "unknown";
}

async function checkNfcDeviceStatus(showConfirmation = false) {
  const supported = "NDEFReader" in window;
  const secure = window.isSecureContext;
  let permission = "unknown";

  if (supported && secure && navigator.permissions && typeof navigator.permissions.query === "function") {
    try {
      const status = await navigator.permissions.query({ name: "nfc" });
      permission = status.state;
      if (nfcPermissionStatus !== status) {
        if (nfcPermissionStatus) nfcPermissionStatus.removeEventListener("change", handleNfcPermissionChange);
        nfcPermissionStatus = status;
        nfcPermissionStatus.addEventListener("change", handleNfcPermissionChange);
      }
    } catch (error) {
      permission = "unknown";
    }
  }

  const permissionLabel = getNfcPermissionLabel(permission);
  nfcStatusDetails.textContent = `Browser support: ${supported ? "Yes" : "No"} · Secure connection: ${secure ? "Yes" : "No"} · Permission: ${permissionLabel}`;

  if (!secure) {
    setNfcStatusBadge("warning", "!", "Secure connection required");
    nfcStatusExplanation.textContent = "NFC needs a secure connection. Open Mini Mart POS over HTTPS or on localhost to check NFC availability.";
  } else if (!supported) {
    setNfcStatusBadge("neutral", "?", "Not supported");
    nfcStatusExplanation.textContent = "Web NFC only works in Chrome on an Android phone with NFC, over HTTPS. This device or browser can't read NFC cards. You can still use Suki Rewards by finding a customer by name or phone number.";
  } else if (permission === "granted") {
    setNfcStatusBadge("success", "✓", "Supported and allowed");
    nfcStatusExplanation.textContent = "NFC is ready to use. Make sure NFC is turned on in your phone settings.";
  } else if (permission === "prompt") {
    setNfcStatusBadge("warning", "!", "Supported, not asked yet");
    nfcStatusExplanation.textContent = "NFC is available. The browser will ask for permission the first time you scan a card on the Suki Rewards page.";
  } else if (permission === "denied") {
    setNfcStatusBadge("danger", "×", "Supported, but blocked");
    nfcStatusExplanation.textContent = "NFC access was blocked for this site. Open your browser's site settings, allow NFC for this site, then press Check again.";
  } else {
    setNfcStatusBadge("neutral", "?", "Unknown");
    nfcStatusExplanation.textContent = "The browser supports NFC, but it cannot report the current permission. Check your browser and device settings before scanning.";
  }

  if (showConfirmation) {
    nfcStatusConfirmation.textContent = "Checked just now";
    window.setTimeout(() => {
      nfcStatusConfirmation.textContent = "";
    }, 3000);
  }
}

function handleNfcPermissionChange() {
  checkNfcDeviceStatus();
}

checkNfcStatus.addEventListener("click", () => checkNfcDeviceStatus(true));
checkNfcDeviceStatus();

storeLogoInput.addEventListener("change", () => {
  const [file] = storeLogoInput.files;
  showFieldError("storeLogo", "");
  if (!file) {
    logoFileName.textContent = "No file chosen";
    return;
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    showFieldError("storeLogo", "Use a PNG, JPG, or WebP image.");
    storeLogoInput.value = "";
    logoFileName.textContent = "No file chosen";
    return;
  }
  if (file.size > maxLogoSize) {
    showFieldError("storeLogo", "Logo must be 200 KB or smaller.");
    storeLogoInput.value = "";
    logoFileName.textContent = "No file chosen";
    return;
  }

  logoFileName.textContent = file.name;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") {
      showFieldError("storeLogo", "Could not read that logo.");
      return;
    }
    logoDataUrl = reader.result;
    logoPreview.src = logoDataUrl;
    logoPreview.hidden = false;
    removeLogo.hidden = false;
    updateStorePreviews();
  });
  reader.addEventListener("error", () => {
    showFieldError("storeLogo", "Could not read that logo.");
  });
  reader.readAsDataURL(file);
});

removeLogo.addEventListener("click", () => {
  storeLogoInput.value = "";
  logoDataUrl = "";
  logoPreview.removeAttribute("src");
  logoPreview.hidden = true;
  logoFileName.textContent = "No file chosen";
  removeLogo.hidden = true;
  showFieldError("storeLogo", "");
  updateStorePreviews();
});

storeInfoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setStatus("");
  if (!validateForm()) return;

  const { error } = window.miniMartSettings.save({
    storeName: fields.storeName.value.trim(),
    address: fields.address.value.trim(),
    contactNumber: fields.contactNumber.value.trim(),
    registerName: fields.registerName.value.trim(),
    receiptFooter: fields.receiptFooter.value.trim(),
    timezone: fields.timezone.value,
    dateFormat: fields.dateFormat.value,
    logoDataUrl,
  });

  if (error) {
    setStatus("Could not save settings.", true);
    return;
  }

  updateBrandLogo();
  setStatus("Saved");
  markSettingsClean();
});

inventoryRulesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setInventoryRulesStatus("");
  if (!validateInventoryRules()) return;

  const { error } = window.miniMartSettings.save({
    lowStockThreshold: Number(lowStockThreshold.value),
    blockOutOfStockSales: blockOutOfStockSales.checked,
  });

  if (error) {
    setInventoryRulesStatus("Could not save settings.", true);
    return;
  }

  setInventoryRulesStatus("Saved");
  markSettingsClean();
});

sukiPointsExpiry.addEventListener("change", () => {
  sukiPointsExpiryDaysField.hidden = sukiPointsExpiry.value !== "days";
});

sukiSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setSukiSettingsStatus("");
  if (!validateSukiSettings()) return;

  const { error } = window.miniMartSettings.save({
    sukiEnabled: sukiEnabled.checked,
    sukiPesosPerPoint: Number(sukiPesosPerPoint.value),
    sukiPesoValue: Number(sukiPesoValue.value),
    sukiMinPointsToRedeem: Number(sukiMinPointsToRedeem.value),
    sukiPointsExpiry: sukiPointsExpiry.value,
    sukiPointsExpiryDays: Number(sukiPointsExpiryDays.value),
  });

  if (error) {
    setSukiSettingsStatus("Could not save settings.", true);
    return;
  }

  setSukiSettingsStatus("Saved");
  markSettingsClean();
});

reportExportData.addEventListener("change", handleReportExportInput);
salesRange.addEventListener("change", handleReportExportInput);
salesStartDate.addEventListener("change", handleReportExportInput);
salesEndDate.addEventListener("change", handleReportExportInput);
exportExcel.addEventListener("click", exportExcelReport);
exportPdf.addEventListener("click", exportPdfReport);
updateReportExportUi();
document.getElementById("downloadBackup").addEventListener("click", downloadBackupFile);
downloadProductTemplate.addEventListener("click", downloadProductTemplateFile);
productImportFile.addEventListener("change", () => parseProductImportFile(productImportFile.files[0]));
updateProductImportFileDisplay(Boolean(productImportFile.files?.length));
downloadProductErrors.hidden = true;
removeProductImportFile.addEventListener("click", () => {
  productImportFile.value = "";
  productImportFileData = null;
  productImportRows = [];
  productImportFileName.textContent = "No file chosen";
  updateProductImportFileDisplay(false);
  downloadProductErrors.hidden = true;
  setProductImportStatus("");
});
productDuplicateMode.addEventListener("change", renderProductImportPreview);
productMissingCategoryMode.addEventListener("change", renderProductImportPreview);
productImportFilter.addEventListener("change", renderProductImportPreview);
confirmProductImport.addEventListener("click", importProducts);
downloadProductErrors.addEventListener("click", downloadProductErrorRows);
closeProductImport.addEventListener("click", closeProductImportModal);
cancelProductImport.addEventListener("click", closeProductImportModal);
productImportModal.addEventListener("click", (event) => {
  if (event.target === productImportModal) closeProductImportModal();
});
openResetData.addEventListener("click", openResetDataModal);
closeResetData.addEventListener("click", closeResetDataModal);
cancelResetData.addEventListener("click", closeResetDataModal);
resetDataModal.addEventListener("click", (event) => {
  if (event.target === resetDataModal) closeResetDataModal();
});
resetConfirmText.addEventListener("input", () => {
  confirmResetData.disabled = resetConfirmText.value !== "RESET";
});
backupBeforeReset.addEventListener("click", downloadBackupFile);
confirmResetData.addEventListener("click", resetAllData);

document.addEventListener("keydown", (event) => {
  if (!productImportModal.hidden) {
    if (event.key === "Escape") closeProductImportModal();
    productImportFocusTrap(event);
  }
  if (!resetDataModal.hidden && event.key === "Escape") closeResetDataModal();
});

restoreBackup.addEventListener("change", () => {
  const [file] = restoreBackup.files;
  if (!file) return;
  clearRestorePreview();
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch {
      setBackupStatus("That file is not valid JSON.", true);
      restoreBackup.value = "";
      return;
    }
    const data = parsed?.data;
    if (!isValidBackup(parsed)) {
      setBackupStatus("Invalid backup file. Nothing was changed.", true);
      restoreBackup.value = "";
      return;
    }
    const summary =
      `This will replace ${data.products.length} products, ${data.sales.length} sales, ` +
      `${data.categories.length} categories, ${data.customers.length} customers, ` +
      `${(data.inventoryAdjustments || []).length} stock adjustments, and your settings.`;
    showRestorePreview(data, file.name);
    setBackupStatus(summary);
    if (window.confirm(`${summary}\n\nContinue restoring this backup?`)) {
      restoreBackupData(pendingRestoreData);
      return;
    }
    setBackupStatus("Restore cancelled.");
    clearRestorePreview();
    restoreBackup.value = "";
  });

  reader.addEventListener("error", () => {
    setBackupStatus("Could not read that backup file. Nothing was changed.", true);
    restoreBackup.value = "";
  });
  reader.readAsText(file);
});

runDataHealthCheck.addEventListener("click", runHealthCheck);

categoryManagementList.addEventListener("click", (event) => {
  const iconButton = event.target.closest("[data-category-icon]");
  if (iconButton) {
    const category = iconButton.dataset.category;
    window.miniMartDB.saveCategoryIcon(category, iconButton.dataset.categoryIcon);
    iconButton.closest(".category-management-icon-picker")
      .querySelectorAll("[data-category-icon]")
      .forEach((option) => {
        const selected = option === iconButton;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
    const rowIcon = iconButton.closest(".category-management-row").querySelector(".category-management-icon");
    rowIcon.src = iconButton.dataset.categoryIcon;
    renderCategorySummary();
    setCategoryStatus("Icon saved");
    return;
  }
  const button = event.target.closest("[data-category-action]");
  const row = event.target.closest(".category-management-row");
  if (!button || !row) return;
  const category = row.dataset.category;
  const action = button.dataset.categoryAction;

  if (action === "rename") {
    startCategoryRename(row);
    return;
  }
  if (action === "save") {
    saveCategoryRename(row);
    return;
  }
  if (action === "up" || action === "down") {
    if (categoryManagementSearch.value.trim()) {
      setCategoryStatus("Clear search to reorder.", true);
      return;
    }
    window.miniMartDB.moveCategory(category, action === "up" ? -1 : 1);
    renderCategoryManagement();
    setCategoryStatus("Saved");
    return;
  }
  if (action === "delete") {
    const hasProducts = window.miniMartDB
      .products()
      .some((product) => product.category === category);
    if (hasProducts) {
      openCategoryDeleteModal(category);
    } else if (window.confirm(`Delete the ${category} category?`)) {
      window.miniMartDB.deleteCategory(category);
      renderCategoryManagement();
      setCategoryStatus("Saved");
    }
  }
});

categoryManagementList.addEventListener("dragstart", (event) => {
  const row = event.target.closest(".category-management-row");
  if (!row || categoryManagementSearch.value.trim()) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", row.dataset.category);
});

categoryManagementList.addEventListener("dragover", (event) => {
  const row = event.target.closest(".category-management-row");
  if (!row || categoryManagementSearch.value.trim()) return;
  event.preventDefault();
  row.classList.add("is-drag-over");
});

categoryManagementList.addEventListener("dragleave", (event) => {
  event.target.closest(".category-management-row")?.classList.remove("is-drag-over");
});

categoryManagementList.addEventListener("drop", (event) => {
  const row = event.target.closest(".category-management-row");
  const source = event.dataTransfer.getData("text/plain");
  if (!row || !source || source === row.dataset.category || categoryManagementSearch.value.trim()) return;
  event.preventDefault();
  const categories = getManagedCategories();
  const from = categories.indexOf(source);
  const to = categories.indexOf(row.dataset.category);
  categories.splice(to, 0, categories.splice(from, 1)[0]);
  window.miniMartDB.saveCategories(categories);
  renderCategoryManagement();
  setCategoryStatus("Saved");
});

openCategoryManagement.addEventListener("click", openCategoryManagementModal);
closeCategoryManagement.addEventListener("click", closeCategoryManagementModal);
doneCategoryManagement.addEventListener("click", closeCategoryManagementModal);
categoryManagementSearch.addEventListener("input", () => {
  clearCategoryManagementSearch.hidden = !categoryManagementSearch.value;
  renderCategoryManagement();
});
clearCategoryManagementSearch.addEventListener("click", () => {
  categoryManagementSearch.value = "";
  clearCategoryManagementSearch.hidden = true;
  renderCategoryManagement();
  categoryManagementSearch.focus();
});
categoryManagementModal.addEventListener("click", (event) => {
  if (event.target === categoryManagementModal) closeCategoryManagementModal();
});
document.addEventListener("keydown", (event) => {
  if (categoryManagementModal.hidden) return;
  if (event.key === "Escape") {
    if (categoryDeleteModal.hidden) closeCategoryManagementModal();
    return;
  }
  keepCategoryManagementFocus(event);
});

document
  .getElementById("confirmCategoryDelete")
  .addEventListener("click", () => {
    if (!pendingCategoryDelete || !categoryMoveTarget.value) return;
    const { error } = window.miniMartDB.deleteCategory(
      pendingCategoryDelete,
      categoryMoveTarget.value,
    );
    if (error) {
      setCategoryStatus("Could not delete that category.", true);
      return;
    }
    closeCategoryDeleteModal();
    renderCategoryManagement();
    setCategoryStatus("Saved");
  });
document
  .getElementById("closeCategoryDelete")
  .addEventListener("click", closeCategoryDeleteModal);
document
  .getElementById("cancelCategoryDelete")
  .addEventListener("click", closeCategoryDeleteModal);
categoryDeleteModal.addEventListener("click", (event) => {
  if (event.target === categoryDeleteModal) closeCategoryDeleteModal();
});

settingsTabs.forEach((tab) => {
  const activateTab = () => {
    const panelId = tab.dataset.settingsPanel;
    settingsTabs.forEach((button) => {
      const active = button === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll(".settings-card[role='tabpanel']").forEach((panel) => {
      panel.hidden = panel.id !== panelId;
    });
    document.getElementById(panelId)?.focus({ preventScroll: true });
  };
  tab.addEventListener("click", activateTab);
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const visibleTabs = settingsTabs.filter((button) => !button.hidden);
    const currentIndex = visibleTabs.indexOf(tab);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? visibleTabs.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + visibleTabs.length) % visibleTabs.length;
    visibleTabs[nextIndex]?.focus();
    visibleTabs[nextIndex]?.click();
  });
});

function updateSettingsSearch() {
  const query = settingsSearch.value.trim().toLowerCase();
  let visibleCount = 0;
  settingsTabs.forEach((tab) => {
    const panel = document.getElementById(tab.dataset.settingsPanel);
    const matches = !query ||
      `${tab.textContent} ${panel?.textContent || ""}`.toLowerCase().includes(query);
    tab.hidden = !matches;
    if (matches) visibleCount += 1;
    if (!matches && panel && !panel.hidden) {
      panel.hidden = true;
    }
  });
  settingsSearchEmpty.hidden = visibleCount > 0;
  if (query && visibleCount === 1) {
    const match = settingsTabs.find((tab) => !tab.hidden);
    if (match) match.click();
  } else if (!query) {
    const activeTab = settingsTabs.find((tab) => tab.classList.contains("is-active"));
    if (activeTab) {
      document.querySelectorAll(".settings-card[role='tabpanel']").forEach((panel) => {
        panel.hidden = panel.id !== activeTab.dataset.settingsPanel;
      });
    }
  }
}

settingsSearch.addEventListener("input", updateSettingsSearch);

themeToggle.addEventListener("click", () => {
  const isDark = themeToggle.getAttribute("aria-checked") === "true";
  const { error, settings } = window.miniMartSettings.save({
    theme: isDark ? "light" : "dark",
  });
  if (error) {
    themeToggle.focus();
    return;
  }
  window.miniMartSettings.applyTheme(settings);
  updateThemeToggle(settings.theme);
});

exportInventoryHistory.addEventListener("click", exportInventoryHistoryFile);
resetStoreInfo.addEventListener("click", () => resetSettingsSection("store"));
resetInventoryRules.addEventListener("click", () => resetSettingsSection("inventory"));
resetSukiSettings.addEventListener("click", () => resetSettingsSection("suki"));

function settingsFormSnapshot() {
  return [storeInfoForm, inventoryRulesForm, sukiSettingsForm]
    .map((form) =>
      [...form.elements]
        .filter((element) => element.type !== "file")
        .map((element) => [element.name || element.id, element.type === "checkbox" ? element.checked : element.value]),
    );
}

let savedSettingsSnapshot = "";
let savedFormSnapshots = new Map();
function formSnapshot(form) {
  return JSON.stringify(
    [...form.elements]
      .filter((element) => element.type !== "file")
      .map((element) => [
        element.name || element.id,
        element.type === "checkbox" ? element.checked : element.value,
      ]),
  );
}
function updateUnsavedTabMarkers() {
  settingsTabs.forEach((tab) => {
    const panel = document.getElementById(tab.dataset.settingsPanel);
    const form = panel?.querySelector("form");
    tab.classList.toggle("has-unsaved-changes", Boolean(form?.classList.contains("has-unsaved-changes")));
  });
}
function markSettingsClean() {
  savedSettingsSnapshot = JSON.stringify(settingsFormSnapshot());
  savedFormSnapshots = new Map(
    [storeInfoForm, inventoryRulesForm, sukiSettingsForm].map((form) => [
      form,
      formSnapshot(form),
    ]),
  );
  document.querySelectorAll("form.has-unsaved-changes").forEach((form) => form.classList.remove("has-unsaved-changes"));
  updateUnsavedTabMarkers();
}
function hasUnsavedSettings() {
  return savedSettingsSnapshot !== JSON.stringify(settingsFormSnapshot());
}

[storeInfoForm, inventoryRulesForm, sukiSettingsForm].forEach((form) => {
  form.addEventListener("input", () => {
    form.classList.toggle("has-unsaved-changes", savedFormSnapshots.get(form) !== formSnapshot(form));
    updateUnsavedTabMarkers();
  });
  form.addEventListener("change", () => {
    form.classList.toggle("has-unsaved-changes", savedFormSnapshots.get(form) !== formSnapshot(form));
    updateUnsavedTabMarkers();
  });
});

markSettingsClean();
updateBackupSummary();

window.addEventListener("beforeunload", (event) => {
  if (!hasUnsavedSettings()) return;
  event.preventDefault();
  event.returnValue = "";
});
