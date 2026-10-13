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
const productFields = document.getElementById("productFields");
const categoryHelp = document.getElementById("categoryHelp");
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productCost = document.getElementById("productCost");
const productStock = document.getElementById("productStock");
const categoryIconPicker = document.getElementById("categoryIconPicker");
const deleteProductModal = document.getElementById("deleteProductModal");
const deleteProductCopy = document.getElementById("deleteProductCopy");
let pendingDeleteName = null;
let editingName = null;
let modalMode = "create-category";
let selectedCategoryIcon = "Icons/bread.png";
let rows = [];

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
      const header = `<tr class="category-group" style="--accent:${categoryAccent(category)}" data-category="${category}" data-open="false" tabindex="0" aria-expanded="false"><td colspan="6"><span><img src="${categoryIconPath(category)}" alt="" /></span><strong>${category}</strong><small>${categoryProducts.length} products</small><b>＋</b></td></tr>`;
      const productRows = categoryProducts
        .map(
          (product) =>
            `<tr data-product="${product.name}" data-category="${product.category}"><td>${product.name}</td><td><span class="category-label" style="--accent:${categoryAccent(product.category)}"><img src="${categoryIconPath(product.category)}" alt="" />${product.category}</span></td><td class="inventory-price">${window.miniMartDB.isKnownCost(product.costPrice) ? window.miniMartSettings.formatCurrency(product.costPrice) : "—"}</td><td class="inventory-price">${window.miniMartSettings.formatCurrency(product.price)}</td><td class="inventory-stock">${product.stock}</td><td class="row-actions"><button class="edit-action" type="button">♢ Edit</button><button class="delete-action" type="button">♧ Delete</button></td></tr>`,
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
  let visible = 0;
  rows.forEach((row) => {
    const match = row.dataset.product.toLowerCase().includes(query);
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
          row.dataset.product.toLowerCase().includes(query),
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
  productCost.value = window.miniMartDB.isKnownCost(product?.costPrice)
    ? product.costPrice
    : "";
  productPrice.value = product?.price ?? "";
  productStock.value = product?.stock ?? "";
  categoryName.value = product?.category || "";
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
  productCost.value = "";
  productPrice.value = "";
  productStock.value = "";
  modal.hidden = false;
  productName.focus();
}

function closeModal() {
  modal.hidden = true;
  form.reset();
  categoryName.readOnly = false;
  categoryIconPicker.hidden = false;
  modalMode = "create-category";
  editingName = null;
}

renderRows();
search.addEventListener("input", updateVisibleRows);

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
  const price = Number(productPrice.value);
  const costPrice = Number(productCost.value);
  const stock = Number(productStock.value);
  if (
    !category ||
    !name ||
    Number.isNaN(price) ||
    Number.isNaN(costPrice) ||
    Number.isNaN(stock)
  )
    return;

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
      category,
      costPrice,
      price,
      stock,
      icon: "◇",
      accent: "var(--blue)",
    });
    window.miniMartDB.saveCategories([
      ...window.miniMartDB.categories(),
      category,
    ]);
    window.miniMartDB.saveCategoryIcon(category, selectedCategoryIcon);
  } else if (modalMode === "edit-product") {
    const index = products.findIndex((entry) => entry.name === editingName);
    if (index !== -1)
      products[index] = {
        ...products[index],
        name,
        category,
        costPrice,
        price,
        stock,
      };
  } else {
    if (
      products.some((entry) => entry.name.toLowerCase() === name.toLowerCase())
    )
      return;
    if (
      !window.miniMartDB
        .categories()
        .some((entry) => entry.toLowerCase() === category.toLowerCase())
    )
      window.miniMartDB.saveCategories([
        ...window.miniMartDB.categories(),
        category,
      ]);
    products.push({
      name,
      category,
      costPrice,
      price,
      stock,
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
