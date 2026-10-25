(() => {
  const db = window.miniMartDB;
  const selected = new Set();
  const tbody = document.getElementById("inventoryRows");
  const selectVisible = document.getElementById("selectVisibleProducts");
  const summary = document.getElementById("selectionSummary");
  const editButton = document.getElementById("editSelectedProducts");
  const clearButton = document.getElementById("clearProductSelection");
  const notice = document.getElementById("inventoryNotice");
  const modal = document.getElementById("bulkEditModal");
  const form = document.getElementById("bulkEditForm");
  const rows = document.getElementById("bulkEditRows");
  const message = document.getElementById("bulkEditMessage");
  const lossField = document.getElementById("bulkLossConfirmField");
  const lossConfirm = document.getElementById("bulkLossConfirm");
  const saveButton = document.getElementById("saveBulkEdit");
  const common = {
    category: document.getElementById("bulkCategory"),
    costPrice: document.getElementById("bulkCost"),
    price: document.getElementById("bulkPrice"),
    stock: document.getElementById("bulkStock"),
  };
  let snapshot = [];
  let saving = false;

  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
  const visibleRows = () => [...tbody.querySelectorAll("tr[data-product]")].filter((row) => row.style.display !== "none");
  const categoryNames = () => [...new Set([...db.categories(), ...db.products().map((p) => p.category)])];
  const categoryOptions = (categories, value) => categories.map((category) =>
    `<option value="${escape(category)}"${category === value ? " selected" : ""}>${escape(category)}</option>`,
  ).join("");

  function refreshSelection() {
    const allRows = [...tbody.querySelectorAll("tr[data-product]")];
    const existing = new Set(allRows.map((row) => row.dataset.product));
    for (const name of selected) if (!existing.has(name)) selected.delete(name);
    allRows.forEach((row) => {
      row.querySelector(".product-select").checked = selected.has(row.dataset.product);
      row.classList.toggle("is-selected", selected.has(row.dataset.product));
    });
    const visible = visibleRows();
    const visibleSelected = visible.filter((row) => selected.has(row.dataset.product)).length;
    selectVisible.disabled = visible.length === 0;
    selectVisible.checked = visible.length > 0 && visibleSelected === visible.length;
    selectVisible.indeterminate = visibleSelected > 0 && visibleSelected < visible.length;
    const hiddenCount = selected.size - visibleSelected;
    summary.textContent = selected.size
      ? `${selected.size} selected${hiddenCount ? ` · ${hiddenCount} outside the current view` : ""}`
      : "Select products to edit together.";
    editButton.textContent = `Bulk edit (${selected.size})`;
    editButton.disabled = clearButton.disabled = selected.size === 0;
  }

  function setMessage(text, isError = false) {
    message.textContent = text;
    message.hidden = !text;
    message.classList.toggle("is-error", isError);
  }

  function inputCell(product, field, label, value, step) {
    return `<input data-field="${field}" type="number" min="0" step="${step}" value="${escape(value)}" aria-label="${escape(label + ' for ' + product.name)}" />`;
  }

  function openEditor() {
    snapshot = db.products().filter((p) => selected.has(p.name)).map((p) => ({ ...p }));
    if (!snapshot.length) return refreshSelection();
    form.reset();
    const categories = categoryNames();
    common.category.innerHTML = '<option value="">Keep each category</option>' + categoryOptions(categories, "");
    rows.innerHTML = snapshot.map((p, index) => {
      const unit = db.normalizeUnit(p.unit);
      const unitLabel = db.units()[unit].shortLabel;
      return `<tr data-bulk-index="${index}">
        <th scope="row">${escape(p.name)}<small>${escape(unitLabel)}</small></th>
        <td><select data-field="category" aria-label="${escape('Category for ' + p.name)}">${categoryOptions(categories, p.category)}</select></td>
        <td>${inputCell(p, "costPrice", "Cost", db.isKnownCost(p.costPrice) ? p.costPrice : "", "0.01")}</td>
        <td>${inputCell(p, "price", "Sell price", p.price, "0.01")}</td>
        <td>${inputCell(p, "stock", "Total stock in " + unitLabel, p.stock, 10 ** -db.unitDecimals(unit))}</td>
      </tr>`;
    }).join("");
    document.getElementById("bulkEditTitle").textContent = `Bulk edit ${snapshot.length} product${snapshot.length === 1 ? "" : "s"}`;
    saveButton.textContent = `SAVE ${snapshot.length} PRODUCT${snapshot.length === 1 ? "" : "S"}`;
    lossField.hidden = true;
    lossConfirm.checked = false;
    setMessage("");
    modal.hidden = false;
    common.category.focus();
  }

  function closeEditor() {
    modal.hidden = true;
    snapshot = [];
    rows.innerHTML = "";
    editButton.focus();
  }

  function numberValue(text, field, product, input) {
    const raw = text.trim();
    // Older products can have an unknown cost. An untouched blank preserves it.
    if (field === "costPrice" && !raw && !db.isKnownCost(product.costPrice)) return product.costPrice ?? null;
    const decimals = field === "stock" ? db.unitDecimals(product.unit) : 2;
    const pattern = decimals === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`);
    const value = Number(raw);
    const valid = raw !== "" && pattern.test(raw) && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
    if (input) input.setAttribute("aria-invalid", String(!valid));
    if (!valid) {
      input?.focus();
      const label = field === "stock" ? `stock in ${db.units()[db.normalizeUnit(product.unit)].shortLabel}` : field === "costPrice" ? "cost" : "sell price";
      throw new Error(`${product.name}: enter a non-negative ${label}${decimals ? ` with up to ${decimals} decimal places` : ' as a whole number'}.`);
    }
    return field === "stock" ? db.roundQuantity(value, product.unit) : db.roundMoney(value);
  }

  function applyCommonValues() {
    const fields = Object.entries(common).filter(([, input]) => input.value !== "");
    if (!fields.length) return setMessage("Enter at least one common value to apply.", true);
    try {
      const changes = [];
      for (const row of rows.querySelectorAll("tr")) {
        const product = snapshot[Number(row.dataset.bulkIndex)];
        for (const [field, source] of fields) {
          const target = row.querySelector(`[data-field="${field}"]`);
          let value = source.value;
          if (field !== "category") {
            value = numberValue(value, field, product, source);
            if (field === "stock" && document.getElementById("bulkStockMode").value === "add") {
              const current = numberValue(target.value, field, product, target);
              value = db.roundQuantity(current + value, product.unit);
              value = numberValue(String(value), field, product, target);
            }
          }
          changes.push({ target, value });
        }
      }
      // Fill only after every selected row accepts the common values.
      changes.forEach(({ target, value }) => { target.value = value; target.removeAttribute("aria-invalid"); });
      lossConfirm.checked = false;
      lossField.hidden = true;
      setMessage("Values applied to the rows. Review them, then save your changes.");
    } catch (error) { setMessage(error.message, true); }
  }

  function versionFields(product) {
    return JSON.stringify([product.name, product.category, product.costPrice ?? null, product.price, product.stock, db.normalizeUnit(product.unit), product.barcode ?? ""]);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (saving || !snapshot.length) return;
    try {
      const products = db.products();
      const categories = new Set(categoryNames());
      const changes = new Map();
      const losses = [];
      for (const row of rows.querySelectorAll("tr")) {
        const original = snapshot[Number(row.dataset.bulkIndex)];
        const current = products.find((p) => p.name === original.name);
        if (!current || versionFields(current) !== versionFields(original)) {
          throw new Error(`${original.name} changed in inventory while this editor was open. Close and reopen Bulk edit to load its current values.`);
        }
        const updated = { ...current };
        updated.category = row.querySelector('[data-field="category"]').value;
        if (!categories.has(updated.category)) throw new Error(`${original.name}: choose an existing category.`);
        for (const field of ["costPrice", "price", "stock"]) {
          const input = row.querySelector(`[data-field="${field}"]`);
          updated[field] = numberValue(input.value, field, original, input);
        }
        if (versionFields(updated) !== versionFields(current)) changes.set(original.name, updated);
        if (db.isKnownCost(updated.costPrice) && updated.price < updated.costPrice &&
            (updated.price !== current.price || updated.costPrice !== current.costPrice)) losses.push(original.name);
      }
      if (!changes.size) return setMessage("No changes to save.");
      lossField.hidden = losses.length === 0;
      if (losses.length && !lossConfirm.checked) {
        setMessage(`${losses.length} product${losses.length === 1 ? '' : 's'} will sell below cost. Check the confirmation below to continue.`, true);
        lossConfirm.focus();
        return;
      }
      saving = true;
      saveButton.disabled = true;
      db.saveProducts(products.map((p) => changes.get(p.name) || p));
      closeEditor();
      selected.clear();
      document.dispatchEvent(new CustomEvent("miniMartInventoryRefresh"));
      notice.textContent = `Updated ${changes.size} product${changes.size === 1 ? '' : 's'}.`;
      notice.hidden = false;
    } catch (error) {
      setMessage(error.message || "The changes could not be saved. Please try again.", true);
    } finally {
      saving = false;
      saveButton.disabled = false;
    }
  });

  tbody.addEventListener("change", (event) => {
    if (!event.target.matches(".product-select")) return;
    const name = event.target.dataset.selectProduct;
    if (event.target.checked) selected.add(name); else selected.delete(name);
    refreshSelection();
  });
  selectVisible.addEventListener("change", () => {
    visibleRows().forEach((row) => {
      if (selectVisible.checked) selected.add(row.dataset.product);
      else selected.delete(row.dataset.product);
    });
    refreshSelection();
  });
  clearButton.addEventListener("click", () => { selected.clear(); refreshSelection(); });
  editButton.addEventListener("click", openEditor);
  document.getElementById("applyBulkValues").addEventListener("click", applyCommonValues);
  document.getElementById("closeBulkEdit").addEventListener("click", closeEditor);
  document.getElementById("cancelBulkEdit").addEventListener("click", closeEditor);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeEditor(); });
  form.addEventListener("input", (event) => {
    if (event.target === lossConfirm) return;
    lossConfirm.checked = false;
    lossField.hidden = true;
    setMessage("");
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeEditor(); }
    if (event.key === "Tab") {
      const focusable = [...modal.querySelectorAll("button, input, select, [tabindex='0']")].filter((element) => !element.disabled && !element.closest("[hidden]"));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener("miniMartInventoryViewChanged", refreshSelection);
  refreshSelection();
})();
