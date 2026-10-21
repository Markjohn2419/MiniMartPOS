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
const productPrice = document.getElementById("productPrice");
const productCost = document.getElementById("productCost");
const productStock = document.getElementById("productStock");
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
let pendingDeleteName = null;
let editingName = null;
let modalMode = "create-category";
let selectedCategoryIcon = "Icons/bread.png";
let rows = [];

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
    sale.items?.some((item) => item.name === product.name || item.productId === product.name),
  );
}

function validateForm() {
  setFieldError(categoryName, categoryNameError, categoryName.value.trim() ? "" : "Category name is required.");
  setFieldError(productName, productNameError, productName.value.trim() ? "" : "Product name is required.");
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

function categoryIconPath(category) {
  return window.miniMartDB.categoryIcon(category);
}

function updateCategoryOptions() {
  document.getElementById("categoryOptions").innerHTML = window.miniMartDB
    .categories()
    .map((category) => `<option value="${category}"></option>`)
    .join("");
}

function updateIconPicker() {
  document
    .querySelectorAll(".icon-option")
    .forEach((button) =>
      button.classList.toggle(
        "selected",
        button.dataset.icon === selectedCategoryIcon,
      ),
    );
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
        .sort((first, second) => first.name.localeCompare(second.name));
      const safeCategory = escapeHtml(category);
      const categoryUnit = window.miniMartDB.categoryDefaultUnit(category);
      const header = `<tr class="category-group" style="--accent:${categoryAccent(category)}" data-category="${safeCategory}" data-open="false" tabindex="0" aria-expanded="false"><td colspan="6"><span><img src="${categoryIconPath(category)}" alt="" /></span><strong>${safeCategory}</strong><small>${categoryProducts.length} products</small>${categoryUnit !== "piece" ? `<em class="unit-tag">${unitLabel(categoryUnit)}</em>` : ""}<b>＋</b></td></tr>`;
      const productRows = categoryProducts
        .map(
          (product) => {
            const unit = window.miniMartDB.normalizeUnit(product.unit);
            const price = window.miniMartSettings.formatCurrency(product.price);
            const stock =
              unit === "piece"
                ? String(window.miniMartDB.roundQuantity(product.stock, unit))
                : window.miniMartDB.formatQuantity(product.stock, unit);
            return `<tr data-product="${escapeHtml(product.name)}" data-category="${escapeHtml(product.category)}" data-barcode="${escapeHtml(product.barcode || "")}"><td>${escapeHtml(product.name)}${product.barcode ? `<small class="product-barcode">Barcode: ${escapeHtml(product.barcode)}</small>` : ""}</td><td><span class="category-label" style="--accent:${categoryAccent(product.category)}"><img src="${categoryIconPath(product.category)}" alt="" />${escapeHtml(product.category)}</span></td><td class="inventory-price">${window.miniMartDB.isKnownCost(product.costPrice) ? window.miniMartSettings.formatCurrency(product.costPrice) : "—"}</td><td class="inventory-price">${price}${unit === "piece" ? "" : ` / ${unitLabel(unit)}`}</td><td class="inventory-stock">${stock}</td><td class="row-actions"><button class="edit-action" type="button">♢ Edit</button><button class="delete-action" type="button">♧ Delete</button></td></tr>`;
          },
        )
        .join("");
      return header + productRows;
    })
    .join("");
  rows = [...tbody.querySelectorAll("tr[data-product]")];
  updateVisibleRows();
}

function updateVisibleRows() {
  const query = search.value.toLowerCase().trim();
  const matches = (row) =>
    row.dataset.product.toLowerCase().includes(query) ||
    row.dataset.barcode.toLowerCase().includes(query);
  let visible = 0;
  rows.forEach((row) => {
    const match = matches(row);
    const group = tbody.querySelector(
      `.category-group[data-category="${CSS.escape(row.dataset.category)}"]`,
    );
    const open = group?.dataset.open === "true" || query.length > 0;
    row.style.display = match && open ? "" : "none";
    if (match) visible += 1;
  });
  tbody.querySelectorAll(".category-group").forEach((group) => {
    group.style.display =
      !query ||
      rows.some(
        (row) =>
          row.dataset.category === group.dataset.category &&
          matches(row),
      )
        ? ""
        : "none";
  });
  count.textContent = query ? visible : rows.length;
  noProducts.style.display = visible === 0 ? "block" : "none";
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
  setFieldError(productBarcode, productBarcodeError, "");
  productCost.value = window.miniMartDB.isKnownCost(product?.costPrice)
    ? product.costPrice
    : "";
  productPrice.value = product?.price ?? "";
  productStock.value = product?.stock ?? "";
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
  setFieldError(productBarcode, productBarcodeError, "");
  productCost.value = "";
  productPrice.value = "";
  productStock.value = "";
  productUnit.value =
    window.miniMartDB.categoryDefaultUnit(category) || "piece";
  categoryDefaultUnit.value = productUnit.value;
  categoryUnitField.hidden = false;
  updateProductUnitUi();
  lossConfirm.checked = false;
  modal.hidden = false;
  productName.focus();
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
search.addEventListener("input", updateVisibleRows);
productBarcode.addEventListener("input", () => setFieldError(productBarcode, productBarcodeError, ""));
productBarcode.addEventListener("keydown", (event) => {
  // A scanner's Enter suffix must not save a partially completed product form.
  if (event.key === "Enter") {
    event.preventDefault();
    productBarcode.value = productBarcode.value.trim();
    productBarcode.select();
  }
});

tbody.addEventListener("click", (event) => {
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
  if (group && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    group.click();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const products = window.miniMartDB.products();
  const category = categoryName.value.trim();
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
    if (index !== -1)
      products[index] = {
        ...products[index],
        name,
        barcode,
        category,
        costPrice,
        price,
        stock: normalizedStock,
        unit,
      };
  } else {
    if (
      products.some((entry) => entry.name.toLowerCase() === name.toLowerCase())
    )
      return;
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
    const confirmed = window.confirm("Past sales keep their old unit, and stock will not be converted automatically.");
    if (!confirmed) productUnit.value = product.unit;
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
