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

const tbody = document.getElementById("inventoryRows");
const search = document.getElementById("inventorySearch");
const count = document.getElementById("productCount");
const noProducts = document.getElementById("noProducts");
const modal = document.getElementById("categoryModal");
const form = document.getElementById("categoryForm");
const categoryName = document.getElementById("categoryName");
const categoryNameError = document.getElementById("categoryNameError");
const productFields = document.getElementById("productFields");
const categoryHelp = document.getElementById("categoryHelp");
const productName = document.getElementById("productName");
const productBarcode = document.getElementById("productBarcode");
const productBarcodeError = document.getElementById("productBarcodeError");
const productLookupSection = document.getElementById("productLookupSection");
const productLookup = document.getElementById("productLookup");
const productLookupResults = document.getElementById("productLookupResults");
const productLookupStatus = document.getElementById("productLookupStatus");
const useLookupBarcode = document.getElementById("useLookupBarcode");
const productPrice = document.getElementById("productPrice");
const productCost = document.getElementById("productCost");
const productStock = document.getElementById("productStock");
const productSupplier = document.getElementById("productSupplier");
const productBatch = document.getElementById("productBatch");
const productExpiry = document.getElementById("productExpiry");
const productRestockMin = document.getElementById("productRestockMin");
const productRestockTarget = document.getElementById("productRestockTarget");
const productUnit = document.getElementById("productUnit");
const productCostLabel = document.getElementById("productCostLabel");
const productPriceLabel = document.getElementById("productPriceLabel");
const productStockLabel = document.getElementById("productStockLabel");
const stockSuffix = document.getElementById("stockSuffix");
const productNameError = document.getElementById("productNameError");
const productCostError = document.getElementById("productCostError");
const productPriceError = document.getElementById("productPriceError");
const productStockError = document.getElementById("productStockError");
const lossWarning = document.getElementById("lossWarning");
const lossConfirmField = document.getElementById("lossConfirmField");
const lossConfirm = document.getElementById("lossConfirm");
const categoryDefaultUnit = document.getElementById("categoryDefaultUnit");
const categoryUnitField = document.getElementById("categoryUnitField");
const categoryIconPicker = document.getElementById("categoryIconPicker");
const deleteProductModal = document.getElementById("deleteProductModal");
const deleteProductCopy = document.getElementById("deleteProductCopy");
const stockAdjustmentModal = document.getElementById("stockAdjustmentModal");
const stockAdjustmentProducts = document.getElementById("stockAdjustmentProducts");
const stockAdjustmentAction = document.getElementById("stockAdjustmentAction");
const stockAdjustmentQuantity = document.getElementById("stockAdjustmentQuantity");
const stockAdjustmentReason = document.getElementById("stockAdjustmentReason");
const stockAdjustmentError = document.getElementById("stockAdjustmentError");
const stockHistoryModal = document.getElementById("stockHistoryModal");
const stockHistoryList = document.getElementById("stockHistoryList");
const selectedProductCount = document.getElementById("selectedProductCount");
const inventoryBulkBar = document.getElementById("inventoryBulkBar");
const selectAllProducts = document.getElementById("selectVisibleProducts");
const selectedProductNames = new Set();
const inventoryFilter = document.getElementById("inventoryFilter");
const inventorySort = document.getElementById("inventorySort");
const inventorySummary = document.getElementById("inventorySummary");
const undoStockAdjustment = document.getElementById("undoStockAdjustment");
let adjustmentProductNames = [];
let pendingDeleteName = null;
let editingName = null;
let modalMode = "create-category";
let selectedCategoryIcon = "Icons/bread.png";
let rows = [];
let lastAdjustment = null;
const inventoryParams = new URLSearchParams(window.location.search);
if (["all", "low", "out", "expiring"].includes(inventoryParams.get("filter"))) {
  inventoryFilter.value = inventoryParams.get("filter");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unitLabel(unit) {
  return window.miniMartDB.units()[
    window.miniMartDB.normalizeUnit(unit)
  ].shortLabel;
}

function updateProductUnitUi() {
  const unit = window.miniMartDB.normalizeUnit(productUnit.value);
  const label = unitLabel(unit);
  productCostLabel.textContent = `Cost per ${label} (₱)`;
  productPriceLabel.textContent = `Sell price per ${label} (₱)`;
  productStockLabel.textContent = `Stock (${label})`;
  stockSuffix.textContent = label;
  productStock.step = 10 ** -window.miniMartDB.unitDecimals(unit);
  productStock.placeholder = unit === "piece" || unit === "pack" || unit === "g" || unit === "mL" ? "0" : "0.000";
  updateLossWarning();
}

function setFieldError(field, element, message) {
  field.setAttribute("aria-invalid", String(Boolean(message)));
  element.textContent = message;
}

function updateLossWarning() {
  const cost = Number(productCost.value);
  const price = Number(productPrice.value);
  const hasValues = productCost.value !== "" && productPrice.value !== "";
  const loss = hasValues && Number.isFinite(cost) && Number.isFinite(price) && price < cost;
  const equal = hasValues && Number.isFinite(cost) && Number.isFinite(price) && price === cost;
  lossWarning.hidden = !loss && !equal;
  lossWarning.textContent = loss
    ? "You would sell at a loss. Confirm to continue."
    : "No profit on this item.";
  lossConfirmField.hidden = !loss;
  if (!loss) lossConfirm.checked = false;
}

function hasProductHistory(product) {
  return Number(product.stock) > 0 || window.miniMartDB.sales().some((sale) =>
    sale.items?.some((item) =>
      item.productId === product.id ||
      (!item.productId && item.name === product.name),
    ),
  );
}

function validateForm() {
  setFieldError(categoryName, categoryNameError, categoryName.value.trim() ? "" : "Category name is required.");
  const name = productName.value.trim();
  const sameName = window.miniMartDB.products().find((entry) =>
    entry.name !== editingName && entry.name.toLowerCase() === name.toLowerCase(),
  );
  setFieldError(productName, productNameError, !name ? "Product name is required." : sameName ? "This product already exists. Find it above to edit its stock or details." : "");
  const barcode = productBarcode.value.trim();
  const duplicate = barcode && window.miniMartDB.products().find((entry) =>
    entry.name !== editingName && String(entry.barcode || "").trim() === barcode,
  );
  setFieldError(productBarcode, productBarcodeError, duplicate
    ? `This barcode is already assigned to ${duplicate.name}.`
    : "");
  const moneyPattern = /^\d+(?:\.\d{1,2})?$/;
  setFieldError(productCost, productCostError, productCost.value === "" ? "Cost is required." : !moneyPattern.test(productCost.value) || Number(productCost.value) < 0 ? "Enter a valid amount with up to 2 decimals." : "");
  setFieldError(productPrice, productPriceError, productPrice.value === "" ? "Sell price is required." : !moneyPattern.test(productPrice.value) || Number(productPrice.value) < 0 ? "Enter a valid amount with up to 2 decimals." : "");
  const unit = window.miniMartDB.normalizeUnit(productUnit.value);
  const stockPattern = unit === "kg" || unit === "L" ? /^\d+(?:\.\d{1,3})?$/ : /^\d+$/;
  setFieldError(productStock, productStockError, productStock.value === "" ? "Stock is required." : !stockPattern.test(productStock.value) || Number(productStock.value) < 0 ? `Enter a valid ${unitLabel(unit)} quantity.` : "");
  return ![categoryNameError, productNameError, productBarcodeError, productCostError, productPriceError, productStockError].some((error) => error.textContent);
}

function categoryAccent(category) {
  return (
    {
      Beverages: "var(--blue)",
      "Instant Food": "var(--red)",
      Snacks: "var(--gold)",
      Dairy: "var(--green)",
    }[category] || "var(--blue)"
  );
}

function safeAccent(value) {
  return /^var\(--[a-z0-9-]+\)$/.test(String(value || ""))
    ? value
    : "var(--blue)";
}

function categoryIconPath(category) {
  const path = window.miniMartDB.categoryIcon(category);
  return /^Icons\/[A-Za-z0-9._-]+\.(?:png|svg)$/.test(path)
    ? path
    : "Icons/bread.png";
}

function canonicalCategory(value, categories = window.miniMartDB.categories()) {
  const normalized = String(value || "").trim().toLowerCase();
  return (
    categories.find(
      (category) => String(category).trim().toLowerCase() === normalized,
    ) || String(value || "").trim()
  );
}

function updateCategoryOptions() {
  document.getElementById("categoryOptions").innerHTML = window.miniMartDB
    .categories()
    .map((category) => `<option value="${escapeHtml(category)}"></option>`)
    .join("");
}

function updateIconPicker() {
  document
    .querySelectorAll(".icon-option")
    .forEach((button) => {
      const selected = button.dataset.icon === selectedCategoryIcon;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
}

function renderRows() {
  const products = window.miniMartDB.products();
  const categories = [
    ...window.miniMartDB.categories(),
    ...new Set(products.map((product) => product.category)),
  ].filter((category, index, all) => all.indexOf(category) === index);
  tbody.innerHTML = categories
    .map((category) => {
      const categoryProducts = products
        .filter((product) => product.category === category)
        .sort(sortProducts);
      const safeCategory = escapeHtml(category);
      const categoryUnit = window.miniMartDB.categoryDefaultUnit(category);
      const header = `<tr class="category-group" style="--accent:${safeAccent(categoryAccent(category))}" data-category="${safeCategory}" data-open="false" tabindex="0" aria-expanded="false"><td colspan="7"><span><img src="${categoryIconPath(category)}" alt="" /></span><strong>${safeCategory}</strong><small>${categoryProducts.length} products</small>${categoryUnit !== "piece" ? `<em class="unit-tag">${unitLabel(categoryUnit)}</em>` : ""}<button type="button" class="category-add-product" data-add-category="${safeCategory}" aria-label="Add product to ${safeCategory}">＋ Add product</button><b>＋</b></td></tr>`;
      const productRows = categoryProducts
        .map(
          (product) => {
            const unit = window.miniMartDB.normalizeUnit(product.unit);
            const price = window.miniMartSettings.formatCurrency(product.price);
            const stock =
              unit === "piece"
                ? String(window.miniMartDB.roundQuantity(product.stock, unit))
                : window.miniMartDB.formatQuantity(product.stock, unit);
            const threshold = Number(window.miniMartSettings.get().lowStockThreshold) || 0;
            const stockClass = Number(product.stock) <= 0 ? "is-out" : Number(product.stock) <= threshold ? "is-low" : "";
            return `<tr data-product="${escapeHtml(product.name)}" data-category="${escapeHtml(product.category)}" data-barcode="${escapeHtml(product.barcode || "")}" tabindex="0"><td><label class="select-products-label"><input class="product-select" type="checkbox" data-select-product="${escapeHtml(product.name)}" aria-label="Select ${escapeHtml(product.name)}" ${selectedProductNames.has(product.name) ? "checked" : ""} /></label><span>${escapeHtml(product.name)}</span></td><td><span class="category-label" style="--accent:${safeAccent(categoryAccent(product.category))}"><img src="${categoryIconPath(product.category)}" alt="" />${escapeHtml(product.category)}</span></td><td class="inventory-price">${window.miniMartDB.isKnownCost(product.costPrice) ? window.miniMartSettings.formatCurrency(product.costPrice) : "—"}</td><td class="inventory-price">${price}${unit === "piece" ? "" : ` / ${unitLabel(unit)}`}</td><td class="inventory-stock ${stockClass}">${stock}${stockClass === "is-low" ? " <small>LOW</small>" : stockClass === "is-out" ? " <small>OUT</small>" : ""}</td><td class="inventory-expiry">${product.expiryDate ? escapeHtml(product.expiryDate) : "—"}</td><td class="row-actions"><button class="adjust-action" type="button">＋ Stock</button><button class="history-action" type="button">▤ History</button><button class="edit-action" type="button">♢ Edit</button><button class="delete-action" type="button">♧ Delete</button></td></tr>`;
          },
        )
        .join("");
      return header + productRows;
    })
    .join("");
  rows = [...tbody.querySelectorAll("tr[data-product]")];
  updateVisibleRows();
}

function lowStockThreshold(product) {
  const configured = Number(product?.restockMin);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : Number(window.miniMartSettings.get().lowStockThreshold) || 0;
}

function updateVisibleRows() {
  const rawQuery = search.value.trim();
  const query = rawQuery.toLowerCase();
  const products = window.miniMartDB.products();
  const matches = (row) =>
    row.dataset.product.toLowerCase().startsWith(query) ||
    (rawQuery !== "" && row.dataset.barcode === rawQuery);
  let visible = 0;
  const groups = [...tbody.querySelectorAll(".category-group")];
  groups.forEach((group, index) => {
    const categoryRows = rows
      .filter((row) => row.dataset.category === group.dataset.category)
      .sort((first, second) => {
        const firstName = first.dataset.product.toLowerCase();
        const secondName = second.dataset.product.toLowerCase();
        const firstRank = query && firstName.startsWith(query) ? 0 : 1;
        const secondRank = query && secondName.startsWith(query) ? 0 : 1;
        return firstRank - secondRank || firstName.localeCompare(secondName);
      });
    categoryRows.forEach((row) => tbody.insertBefore(row, groups[index + 1] || null));
  });
  rows.forEach((row) => {
    const product = products.find((entry) => entry.name === row.dataset.product);
    const filterMatch = inventoryFilter.value === "all" ||
      (inventoryFilter.value === "low" && Number(product?.stock) <= lowStockThreshold(product)) ||
      (inventoryFilter.value === "out" && Number(product?.stock) <= 0) ||
      (inventoryFilter.value === "expiring" && product?.expiryDate && product.expiryDate >= new Date().toISOString().slice(0, 10) && product.expiryDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    const match = filterMatch && (matches(row) || row.dataset.product.toLowerCase().includes(query));
    const group = tbody.querySelector(
      `.category-group[data-category="${CSS.escape(row.dataset.category)}"]`,
    );
    const open = group?.dataset.open === "true" || query.length > 0;
    row.style.display = match && open ? "" : "none";
    if (match) visible += 1;
  });
  tbody.querySelectorAll(".category-group").forEach((group) => {
    group.style.display =
      rows.some(
        (row) => {
          if (row.dataset.category !== group.dataset.category || !matches(row)) return false;
          const product = products.find((entry) => entry.name === row.dataset.product);
          return inventoryFilter.value === "all" ||
            (inventoryFilter.value === "low" && Number(product?.stock) <= lowStockThreshold(product)) ||
            (inventoryFilter.value === "out" && Number(product?.stock) <= 0) ||
            (inventoryFilter.value === "expiring" && product?.expiryDate && product.expiryDate >= new Date().toISOString().slice(0, 10) && product.expiryDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
        },
      )
        ? ""
        : "none";
  });
  count.textContent = visible;
  const totalCost = products.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.costPrice || 0), 0);
  const totalRetail = products.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.price || 0), 0);
  inventorySummary.textContent = `${products.length} products · Cost value ${window.miniMartSettings.formatCurrency(totalCost)} · Retail value ${window.miniMartSettings.formatCurrency(totalRetail)}`;
  noProducts.style.display = visible === 0 ? "block" : "none";
  document.dispatchEvent(new CustomEvent("miniMartInventoryViewChanged"));
  updateSelectionUi();
}

function sortProducts(first, second) {
  const key = inventorySort.value;
  if (key === "category") return first.category.localeCompare(second.category) || first.name.localeCompare(second.name);
  if (key === "stock") return Number(first.stock) - Number(second.stock);
  if (key === "price") return Number(first.price) - Number(second.price);
  if (key === "value") return Number(first.stock) * Number(first.costPrice || 0) - Number(second.stock) * Number(second.costPrice || 0);
  if (key === "expiry") return (first.expiryDate || "9999").localeCompare(second.expiryDate || "9999");
  return first.name.localeCompare(second.name);
}

function setLookupStatus(message, isError = false) {
  productLookupStatus.textContent = message;
  productLookupStatus.classList.toggle("is-error", isError);
}

function resetProductLookup() {
  productLookupSection.hidden = modalMode === "create-category";
  productLookup.value = "";
  productLookupResults.innerHTML = "";
  productLookupResults.hidden = true;
  useLookupBarcode.hidden = true;
  setLookupStatus("");
  [
    [categoryName, categoryNameError], [productName, productNameError],
    [productBarcode, productBarcodeError], [productCost, productCostError],
    [productPrice, productPriceError], [productStock, productStockError],
  ].forEach(([field, error]) => setFieldError(field, error, ""));
}

function lookupMatches(value) {
  const query = value.trim();
  if (!query) return [];
  return window.miniMartDB.products().filter((entry) =>
    entry.name.toLowerCase().startsWith(query.toLowerCase()) ||
    String(entry.barcode || "").trim() === query,
  ).sort((a, b) => a.name.localeCompare(b.name));
}

function renderLookupResults() {
  const query = productLookup.value.trim();
  const matches = lookupMatches(query);
  productLookupResults.innerHTML = matches.map((product) =>
    `<li><button type="button" data-lookup-name="${escapeHtml(product.name)}"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${window.miniMartSettings.formatCurrency(product.price)} / ${unitLabel(product.unit)} · ${window.miniMartDB.formatQuantity(product.stock, product.unit)} in stock</small></button></li>`,
  ).join("");
  productLookupResults.hidden = matches.length === 0;
  useLookupBarcode.hidden = !query || matches.length > 0;
  setLookupStatus(!query ? "" : matches.length
    ? `${matches.length} matching product${matches.length === 1 ? "" : "s"}. Choose one to edit it.`
    : "No matching product. Use this as a new barcode, or enter the product details below.");
}

function loadLookupProduct(product, scanned = false) {
  openModal(product);
  if (scanned) productBarcode.type = "text";
  setLookupStatus(`Found ${product.name} in ${product.category}. You are editing this existing product. Stock is the total on hand.`);
  productStock.focus();
  productStock.select();
}

function useNewBarcode(value) {
  const barcode = value.trim();
  if (!barcode) return;
  // Looking up a new code while editing must not replace an existing product's identity.
  if (modalMode === "edit-product") openProductModal(categoryName.value);
  productBarcode.type = "text";
  productBarcode.value = barcode;
  setFieldError(productBarcode, productBarcodeError, "");
  productLookup.value = "";
  productLookupResults.hidden = true;
  useLookupBarcode.hidden = true;
  setLookupStatus("New barcode captured. Enter the product name, cost, price and stock, then save.");
  productName.focus();
}

function findLookupProduct() {
  const query = productLookup.value.trim();
  if (!query) return;
  const matches = window.miniMartDB.products().filter((entry) => String(entry.barcode || "").trim() === query);
  if (matches.length > 1) {
    setLookupStatus("This barcode belongs to multiple products. Correct their barcodes before using it.", true);
    return;
  }
  if (matches.length === 1) return loadLookupProduct(matches[0], true);
  const names = lookupMatches(query);
  const exactName = names.find((entry) => entry.name.toLowerCase() === query.toLowerCase());
  if (exactName || names.length === 1) return loadLookupProduct(exactName || names[0]);
  if (!names.length && /^[^\s]+$/.test(query) && /\d/.test(query)) return useNewBarcode(query);
  renderLookupResults();
  productLookupResults.querySelector("button")?.focus();
}

function updateSelectionUi() {
  selectedProductCount.textContent = selectedProductNames.size;
  inventoryBulkBar.hidden = selectedProductNames.size === 0;
  const visibleNames = rows
    .filter((row) => row.style.display !== "none")
    .map((row) => row.dataset.product);
  selectAllProducts.checked =
    visibleNames.length > 0 && visibleNames.every((name) => selectedProductNames.has(name));
  selectAllProducts.indeterminate =
    visibleNames.some((name) => selectedProductNames.has(name)) &&
    !selectAllProducts.checked;
}

function openModal(product) {
  updateCategoryOptions();
  modalMode = product ? "edit-product" : "create-category";
  categoryName.readOnly = false;
  categoryName.placeholder = "e.g. Bakery";
  editingName = product?.name || null;
  document.getElementById("categoryModalTitle").textContent = editingName
    ? "Edit Product"
    : "Create Category";
  document.getElementById("modalSaveButton").textContent = editingName
    ? "SAVE PRODUCT"
    : "CREATE CATEGORY";
  productFields.hidden = false;
  categoryIconPicker.hidden = Boolean(product);
  categoryHelp.textContent = editingName
    ? "Update the product details and category."
    : "Create the category and add its first product.";
  productName.value = product?.name || "";
  productBarcode.value = product?.barcode || "";
  productBarcode.type = product?.barcode ? "password" : "text";
  setFieldError(productBarcode, productBarcodeError, "");
  productCost.value = window.miniMartDB.isKnownCost(product?.costPrice)
    ? product.costPrice
    : "";
  productPrice.value = product?.price ?? "";
  productStock.value = product?.stock ?? "";
  productSupplier.value = product?.supplier || "";
  productBatch.value = product?.batch || "";
  productExpiry.value = product?.expiryDate || "";
  productRestockMin.value = product?.restockMin ?? "";
  productRestockTarget.value = product?.restockTarget ?? "";
  categoryName.value = product?.category || "";
  productUnit.value =
    product?.unit || window.miniMartDB.categoryDefaultUnit(product?.category);
  categoryDefaultUnit.value = window.miniMartDB.categoryDefaultUnit(
    product?.category || "",
  );
  categoryUnitField.hidden = Boolean(product);
  updateProductUnitUi();
  lossConfirm.checked = false;
  selectedCategoryIcon = product
    ? categoryIconPath(product.category)
    : "Icons/bread.png";
  updateIconPicker();
  resetProductLookup();
  modal.hidden = false;
  productName.focus();
}

function openProductModal(category) {
  updateCategoryOptions();
  modalMode = "add-product";
  editingName = null;
  document.getElementById("categoryModalTitle").textContent = "Add Product";
  document.getElementById("modalSaveButton").textContent = "ADD PRODUCT";
  categoryName.value = category;
  categoryName.readOnly = Boolean(category);
  categoryName.placeholder = "Choose or type a category";
  productFields.hidden = false;
  categoryIconPicker.hidden = true;
  categoryHelp.textContent = category
    ? `Add a new product to ${category}.`
    : "Add a product to an existing or new category.";
  productName.value = "";
  productBarcode.value = "";
  productBarcode.type = "text";
  setFieldError(productBarcode, productBarcodeError, "");
  productCost.value = "";
  productPrice.value = "";
  productStock.value = "";
  productSupplier.value = "";
  productBatch.value = "";
  productExpiry.value = "";
  productRestockMin.value = "";
  productRestockTarget.value = "";
  productUnit.value =
    window.miniMartDB.categoryDefaultUnit(category) || "piece";
  categoryDefaultUnit.value = productUnit.value;
  categoryUnitField.hidden = false;
  updateProductUnitUi();
  lossConfirm.checked = false;
  resetProductLookup();
  modal.hidden = false;
  modal.querySelector(".product-modal").scrollTop = 0;
  productLookup.focus({ preventScroll: true });
}

function closeModal() {
  modal.hidden = true;
  form.reset();
  categoryName.readOnly = false;
  categoryIconPicker.hidden = false;
  categoryUnitField.hidden = false;
  modalMode = "create-category";
  editingName = null;
  [productNameError, productCostError, productPriceError, productStockError].forEach((error) => {
    error.textContent = "";
  });
  categoryNameError.textContent = "";
  setFieldError(productBarcode, productBarcodeError, "");
  lossWarning.hidden = true;
  lossConfirmField.hidden = true;
}

renderRows();
document.addEventListener("miniMartInventoryRefresh", renderRows);
window.addEventListener("storage", (event) => {
  if (event.key === null || ["miniMartProducts", "miniMartCategories"].includes(event.key)) renderRows();
});
search.addEventListener("input", updateVisibleRows);
inventoryFilter.addEventListener("change", updateVisibleRows);
inventorySort.addEventListener("change", renderRows);
search.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing) return;
  event.preventDefault();
  const matches = window.miniMartDB.products().filter((entry) => String(entry.barcode || "").trim() === search.value.trim());
  if (matches.length === 1) {
    // After a complete scan, show the product's name rather than its barcode.
    search.value = matches[0].name;
    updateVisibleRows();
    search.select();
  }
});
productLookup.addEventListener("input", renderLookupResults);
productLookup.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) findLookupProduct();
  }
  if (event.key === "ArrowDown") {
    const first = productLookupResults.querySelector("button");
    if (first && !productLookupResults.hidden) { event.preventDefault(); first.focus(); }
  }
});
productLookupResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lookup-name]");
  if (!button) return;
  const product = window.miniMartDB.products().find((entry) => entry.name === button.dataset.lookupName);
  if (product) loadLookupProduct(product, String(product.barcode || "").trim() === productLookup.value.trim());
});
useLookupBarcode.addEventListener("click", () => useNewBarcode(productLookup.value));
productBarcode.addEventListener("input", () => {
  productBarcode.type = "text";
  setFieldError(productBarcode, productBarcodeError, "");
});
productBarcode.addEventListener("focus", () => productBarcode.select());
productBarcode.addEventListener("keydown", (event) => {
  // A scanner's Enter suffix must not save a partially completed product form.
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    productBarcode.value = productBarcode.value.trim();
    productBarcode.type = "text";
    const barcode = productBarcode.value;
    const matches = barcode ? window.miniMartDB.products().filter((entry) => String(entry.barcode || "").trim() === barcode) : [];
    if (matches.length === 1 && modalMode === "add-product" && ![productName, productCost, productPrice, productStock].some((field) => field.value.trim())) {
      loadLookupProduct(matches[0], true);
      return;
    }
    const duplicate = matches.find((entry) => entry.name !== editingName);
    setFieldError(productBarcode, productBarcodeError, duplicate ? `This barcode is already assigned to ${duplicate.name}. Find that product above to edit it.` : "");
    productBarcode.select();
  }
});

tbody.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-category]");
  if (addButton) { openProductModal(addButton.dataset.addCategory); return; }
  const group = event.target.closest(".category-group");
  if (group) {
    const open = group.dataset.open === "true";
    group.dataset.open = String(!open);
    group.setAttribute("aria-expanded", String(!open));
    updateVisibleRows();
    return;
  }
  const row = event.target.closest("tr");
  if (!row) return;
  const products = window.miniMartDB.products();
  const product = products.find((entry) => entry.name === row.dataset.product);
  if (event.target.closest(".product-select")) {
    if (event.target.checked) selectedProductNames.add(row.dataset.product);
    else selectedProductNames.delete(row.dataset.product);
    updateSelectionUi();
    return;
  }
  if (event.target.closest(".adjust-action") && product) {
    openStockAdjustment([product.name]);
    return;
  }
  if (event.target.closest(".history-action") && product) {
    openStockHistory(product.name);
    return;
  }
  if (event.target.closest(".edit-action") && product) openModal(product);
  if (event.target.closest(".delete-action")) {
    event.preventDefault();
    event.stopPropagation();
    pendingDeleteName = row.dataset.product;
    deleteProductCopy.textContent = `${pendingDeleteName} will be removed from inventory. This action cannot be undone.`;
    deleteProductModal.hidden = false;
    document.getElementById("confirmDeleteProduct").focus();
  }
});

function openStockAdjustment(names) {
  adjustmentProductNames = names;
  stockAdjustmentProducts.textContent =
    names.length === 1
      ? `Adjusting stock for ${names[0]}.`
      : `Adjusting stock for ${names.length} selected products.`;
  stockAdjustmentQuantity.value = "";
  stockAdjustmentError.textContent = "";
  stockAdjustmentModal.hidden = false;
  stockAdjustmentQuantity.focus();
}

function closeStockAdjustment() {
  stockAdjustmentModal.hidden = true;
  adjustmentProductNames = [];
}

function openStockHistory(name) {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem("miniMartInventoryAdjustments") || "[]");
  } catch (error) {
    stockHistoryList.textContent = "Stock history could not be read.";
    stockHistoryModal.hidden = false;
    return;
  }
  const entries = history.filter((entry) => entry.product === name).slice(-20).reverse();
  document.getElementById("stockHistoryTitle").textContent = `${name} history`;
  stockHistoryList.innerHTML = entries.length
    ? entries.map((entry) => `<div class="stock-history-row"><span><strong>${entry.adjustment > 0 ? "+" : ""}${entry.adjustment}</strong> ${escapeHtml(entry.reason)}</span><small>${entry.previousStock} → ${entry.stockAfter} · ${new Date(entry.date).toLocaleString()}</small></div>`).join("")
    : '<p class="modal-help">No stock adjustments recorded yet.</p>';
  stockHistoryModal.hidden = false;
}

function closeStockHistory() {
  stockHistoryModal.hidden = true;
}

document.getElementById("saveStockAdjustment").addEventListener("click", () => {
  const quantity = Number(stockAdjustmentQuantity.value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    stockAdjustmentError.textContent = "Enter a quantity greater than zero.";
    return;
  }
  const products = window.miniMartDB.products();
  const previousStocks = adjustmentProductNames.map((name) => {
    const product = products.find((entry) => entry.name === name);
    return { name, stock: Number(product?.stock) || 0 };
  });
  const timestamp = new Date().toISOString();
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem("miniMartInventoryAdjustments") || "[]");
    if (!Array.isArray(history)) history = [];
  } catch (error) {
    stockAdjustmentError.textContent = "Stock history is corrupted. Export or clear it before adjusting stock.";
    return;
  }
  const historyBefore = history.slice(-1000);
  const unitDecimals = Math.min(
    ...adjustmentProductNames.map((name) => {
      const product = products.find((entry) => entry.name === name);
      return window.miniMartDB.unitDecimals(product?.unit);
    }),
  );
  const selectedUnits = new Set(
    adjustmentProductNames.map((name) => {
      const product = products.find((entry) => entry.name === name);
      return window.miniMartDB.normalizeUnit(product?.unit);
    }),
  );
  if (selectedUnits.size > 1) {
    stockAdjustmentError.textContent = "Select products with the same unit for one stock adjustment.";
    return;
  }
  const quantityText = stockAdjustmentQuantity.value.trim();
  const quantityPattern = unitDecimals === 0
    ? /^\d+$/
    : new RegExp(`^\\d+(?:\\.\\d{1,${unitDecimals}})?$`);
  if (!quantityPattern.test(quantityText)) {
    stockAdjustmentError.textContent = `Enter a quantity with up to ${unitDecimals} decimal place${unitDecimals === 1 ? "" : "s"}.`;
    return;
  }
  for (const name of adjustmentProductNames) {
    const product = products.find((entry) => entry.name === name);
    if (!product) continue;
    const oldStock = Number(product.stock) || 0;
    const unit = window.miniMartDB.normalizeUnit(product.unit);
    const nextStock = stockAdjustmentAction.value === "add"
      ? oldStock + quantity
      : oldStock - quantity;
    if (nextStock < 0) {
      stockAdjustmentError.textContent = `${product.name} cannot go below zero stock.`;
      return;
    }
    product.stock = window.miniMartDB.roundQuantity(nextStock, unit);
    history.push({
      product: product.name,
      previousStock: oldStock,
      adjustment: stockAdjustmentAction.value === "add" ? quantity : -quantity,
      stockAfter: product.stock,
      reason: stockAdjustmentReason.value,
      date: timestamp,
    });
  }
  window.miniMartDB.saveProducts(products);
  localStorage.setItem("miniMartInventoryAdjustments", JSON.stringify(history.slice(-1000)));
  lastAdjustment = {
    previousStocks,
    historyBefore,
  };
  undoStockAdjustment.disabled = false;
  closeStockAdjustment();
  renderRows();
});

document.getElementById("closeStockAdjustment").addEventListener("click", closeStockAdjustment);
document.getElementById("cancelStockAdjustment").addEventListener("click", closeStockAdjustment);
stockAdjustmentModal.addEventListener("click", (event) => {
  if (event.target === stockAdjustmentModal) closeStockAdjustment();
});
document.getElementById("closeStockHistory").addEventListener("click", closeStockHistory);
stockHistoryModal.addEventListener("click", (event) => {
  if (event.target === stockHistoryModal) closeStockHistory();
});
selectAllProducts.addEventListener("change", () => {
  rows
    .filter((row) => row.style.display !== "none")
    .forEach((row) => {
      if (selectAllProducts.checked) selectedProductNames.add(row.dataset.product);
      else selectedProductNames.delete(row.dataset.product);
    });
  renderRows();
});
document.getElementById("adjustSelectedStock").addEventListener("click", () => {
  if (selectedProductNames.size) openStockAdjustment([...selectedProductNames]);
});
undoStockAdjustment.addEventListener("click", () => {
  if (!lastAdjustment) return;
  const products = window.miniMartDB.products();
  lastAdjustment.previousStocks.forEach(({ name, stock }) => {
    const product = products.find((entry) => entry.name === name);
    if (product) product.stock = stock;
  });
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem("miniMartInventoryAdjustments") || "[]");
  } catch (error) {
    stockAdjustmentError.textContent = "Stock history is corrupted. Undo could not be completed.";
    return;
  }
  localStorage.setItem(
    "miniMartInventoryAdjustments",
    JSON.stringify(lastAdjustment.historyBefore),
  );
  window.miniMartDB.saveProducts(products);
  lastAdjustment = null;
  undoStockAdjustment.disabled = true;
  renderRows();
});
function closeDeleteProductModal() {
  deleteProductModal.hidden = true;
  pendingDeleteName = null;
}

document
  .getElementById("confirmDeleteProduct")
  .addEventListener("click", () => {
    if (!pendingDeleteName) return;
    const products = window.miniMartDB.products();
    window.miniMartDB.saveProducts(
      products.filter((entry) => entry.name !== pendingDeleteName),
    );
    closeDeleteProductModal();
    renderRows();
  });
document
  .getElementById("closeDeleteProduct")
  .addEventListener("click", closeDeleteProductModal);
document
  .getElementById("cancelDeleteProduct")
  .addEventListener("click", closeDeleteProductModal);
deleteProductModal.addEventListener("click", (event) => {
  if (event.target === deleteProductModal) closeDeleteProductModal();
});

tbody.addEventListener("keydown", (event) => {
  const group = event.target.closest(".category-group");
  if (group && event.target === group && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    group.click();
    return;
  }

  const row = event.target.closest("tr[data-product]");
  if (row && event.key === "Enter") {
    event.preventDefault();
    const product = window.miniMartDB
      .products()
      .find((entry) => entry.name === row.dataset.product);
    if (product) openModal(product);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const products = window.miniMartDB.products();
  let category = canonicalCategory(categoryName.value);
  const name = productName.value.trim();
  const barcode = productBarcode.value.trim();
  if (!validateForm()) return;
  const price = window.miniMartDB.roundMoney(Number(productPrice.value));
  const costPrice = window.miniMartDB.roundMoney(Number(productCost.value));
  const stock = Number(productStock.value);
  const unit = window.miniMartDB.normalizeUnit(productUnit.value);
  const normalizedStock = window.miniMartDB.roundQuantity(stock, unit);
  if (!category) return;
  if (
    modalMode === "create-category" &&
    window.miniMartDB.categories().some(
      (entry) => entry.toLowerCase() === category.toLowerCase(),
    )
  ) {
    setFieldError(categoryName, categoryNameError, "This category already exists.");
    return;
  }
  if (price < costPrice && !lossConfirm.checked) {
    lossWarning.hidden = false;
    lossConfirmField.hidden = false;
    lossConfirm.focus();
    return;
  }

  const duplicateName = products.some(
    (entry) =>
      entry.name.toLowerCase() === name.toLowerCase() &&
      entry.name !== editingName,
  );
  if (duplicateName) {
    setFieldError(
      productName,
      productNameError,
      "A product with this name already exists.",
    );
    return;
  }
  const similarProduct = products.find((entry) => {
    if (entry.name === editingName) return false;
    const existing = entry.name.toLowerCase();
    const candidate = name.toLowerCase();
    return (
      existing.includes(candidate) ||
      candidate.includes(existing) ||
      (existing.split(/\s+/)[0] === candidate.split(/\s+/)[0] &&
        existing.split(/\s+/).length > 1 &&
        candidate.split(/\s+/).length > 1)
    );
  });
  if (similarProduct && !window.confirm(
    `"${name}" is similar to "${similarProduct.name}". Add it anyway?`,
  )) {
    return;
  }

  if (modalMode === "create-category") {
    const existing =
      window.miniMartDB
        .categories()
        .some((entry) => entry.toLowerCase() === category.toLowerCase()) ||
      products.some(
        (entry) => entry.category.toLowerCase() === category.toLowerCase(),
      );
    if (existing) return;
    products.push({
      name,
      barcode,
      category,
      costPrice,
      price,
      stock: normalizedStock,
      unit,
      supplier: productSupplier.value.trim(),
      batch: productBatch.value.trim(),
      expiryDate: productExpiry.value || "",
      restockMin: Math.max(0, Number(productRestockMin.value) || 0),
      restockTarget: Math.max(0, Number(productRestockTarget.value) || 0),
      icon: "◇",
      accent: "var(--blue)",
    });
    window.miniMartDB.saveCategories([
      ...window.miniMartDB.categories(),
      category,
    ]);
    window.miniMartDB.saveCategoryIcon(category, selectedCategoryIcon);
    window.miniMartDB.saveCategoryDefaultUnit(category, categoryDefaultUnit.value);
  } else if (modalMode === "edit-product") {
    const index = products.findIndex((entry) => entry.name === editingName);
    if (index !== -1) {
      const existingCategory = canonicalCategory(category);
      const categoryExists = window.miniMartDB
        .categories()
        .some(
          (entry) =>
            entry.toLowerCase() === existingCategory.toLowerCase(),
        );
      category = existingCategory;
      if (!categoryExists) {
        window.miniMartDB.saveCategories([
          ...window.miniMartDB.categories(),
          category,
        ]);
        window.miniMartDB.saveCategoryDefaultUnit(
          category,
          categoryDefaultUnit.value,
        );
        window.miniMartDB.saveCategoryIcon(category, selectedCategoryIcon);
      }
      products[index] = {
        ...products[index],
        name,
        barcode,
        category,
        costPrice,
        price,
        stock: normalizedStock,
        unit,
        supplier: productSupplier.value.trim(),
        batch: productBatch.value.trim(),
        expiryDate: productExpiry.value || "",
        restockMin: Math.max(0, Number(productRestockMin.value) || 0),
        restockTarget: Math.max(0, Number(productRestockTarget.value) || 0),
      };
    }
  } else {
    const categoryExists = window.miniMartDB
      .categories()
      .some((entry) => entry.toLowerCase() === category.toLowerCase());
    if (!categoryExists)
      window.miniMartDB.saveCategories([
        ...window.miniMartDB.categories(),
        category,
      ]);
    if (!categoryExists)
      window.miniMartDB.saveCategoryDefaultUnit(category, categoryDefaultUnit.value);
    products.push({
      name,
      barcode,
      category,
      costPrice,
      price,
      stock: normalizedStock,
      unit,
      supplier: productSupplier.value.trim(),
      batch: productBatch.value.trim(),
      expiryDate: productExpiry.value || "",
      restockMin: Math.max(0, Number(productRestockMin.value) || 0),
      restockTarget: Math.max(0, Number(productRestockTarget.value) || 0),
      icon: "◇",
      accent: "var(--blue)",
    });
  }
  window.miniMartDB.saveProducts(products);
  closeModal();
  renderRows();
});

document
  .getElementById("createCategory")
  .addEventListener("click", () => openModal());
document
  .getElementById("createProduct")
  .addEventListener("click", () => openProductModal(""));
productUnit.addEventListener("change", updateProductUnitUi);
categoryDefaultUnit.addEventListener("change", () => {
  if (modalMode === "edit-product") return;
  productUnit.value = categoryDefaultUnit.value;
  updateProductUnitUi();
});
productCost.addEventListener("input", updateLossWarning);
productPrice.addEventListener("input", updateLossWarning);
productUnit.addEventListener("change", () => {
  if (modalMode !== "edit-product") return;
  const product = window.miniMartDB.products().find((entry) => entry.name === editingName);
  if (product && product.unit !== productUnit.value && hasProductHistory(product)) {
    window.alert("This product has stock or sales history. Create a new product if you need a different unit; existing inventory cannot be converted safely.");
    productUnit.value = product.unit;
    updateProductUnitUi();
  }
});
categoryName.addEventListener("input", () => {
  if (modalMode === "edit-product") return;
  const unit = window.miniMartDB.categoryDefaultUnit(categoryName.value.trim());
  categoryDefaultUnit.value = unit;
  productUnit.value = unit;
  updateProductUnitUi();
});
document.querySelectorAll(".icon-option").forEach((button) =>
  button.addEventListener("click", () => {
    selectedCategoryIcon = button.dataset.icon;
    updateIconPicker();
    categoryHelp.textContent = `Selected ${button.getAttribute("aria-label") || "category"} for this category.`;
  }),
);
document
  .getElementById("closeCategoryModal")
  .addEventListener("click", closeModal);
document
  .getElementById("cancelCategoryModal")
  .addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
  if (event.key === "Escape" && !deleteProductModal.hidden)
    closeDeleteProductModal();
});

window.addEventListener("miniMartDatabaseChanged", (event) => {
  const key = event.detail?.key;
  if (
    key === "miniMartProducts" ||
    key === "miniMartCategories" ||
    key === "miniMartCategoryIcons" ||
    key === "miniMartCategoryUnits"
  ) {
    renderRows();
    updateCategoryOptions();
  }
});

window.addEventListener("storage", (event) => {
  if (
    event.key === "miniMartProducts" ||
    event.key === "miniMartCategories" ||
    event.key === "miniMartCategoryIcons" ||
    event.key === "miniMartCategoryUnits"
  ) {
    renderRows();
    updateCategoryOptions();
  }
});
