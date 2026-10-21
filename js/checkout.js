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

const cart = new Map();

const peso = (value) => window.miniMartSettings.formatCurrency(value);

const receiptDate = document.getElementById("receiptDate");

const search = document.getElementById("search");
const barcodeStatus = document.getElementById("barcodeStatus");

const sellButton = document.getElementById("sellButton");

const paymentPanel = document.getElementById("paymentPanel");

const amountGiven = document.getElementById("amountGiven");

const changeAmount = document.getElementById("changeAmount");

const paymentError = document.getElementById("paymentError");

const productsSection = document.getElementById("products");

let productCards = [];
let measuredProduct = null;
let measuredEditName = null;
let measuredMode = "quantity";
let saleInProgress = false;
let measureReturnFocus = null;

const measureModal = document.getElementById("measureModal");
const measureValue = document.getElementById("measureValue");
const measureInputLabel = document.getElementById("measureInputLabel");
const measureInputPrefix = document.getElementById("measureInputPrefix");
const measureInputUnit = document.getElementById("measureInputUnit");
const measureProductSummary = document.getElementById("measureProductSummary");
const measureStock = document.getElementById("measureStock");
const measureResultLabel = document.getElementById("measureResultLabel");
const measureResult = document.getElementById("measureResult");
const measureError = document.getElementById("measureError");
const measureWarning = document.getElementById("measureWarning");
const measureQuickPicks = document.getElementById("measureQuickPicks");
const addMeasuredToCart = document.getElementById("addMeasuredToCart");

function measuredUnit(unit) {
  return ["kg", "g", "L", "mL"].includes(
    window.miniMartDB.normalizeUnit(unit),
  );
}

function unitText(unit) {
  return window.miniMartDB.units()[unit]?.shortLabel || unit;
}

function parseMeasureValue(value) {
  const text = String(value || "").trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(text)) {
    return null;
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function floorQuantity(value, unit) {
  const decimals = window.miniMartDB.unitDecimals(unit);
  const scale = 10 ** decimals;
  return Math.floor((value + Number.EPSILON) * scale) / scale;
}

function closeMeasureModal() {
  measureModal.hidden = true;
  measuredProduct = null;
  measuredEditName = null;
  measureValue.value = "";
  measureReturnFocus?.focus();
  measureReturnFocus = null;
}

function setMeasureMode(mode) {
  measuredMode = mode;
  document.querySelectorAll("[data-measure-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.measureMode === mode);
  });
  measureInputLabel.textContent = mode === "amount" ? "Amount" : "Quantity";
  measureInputPrefix.textContent = mode === "amount" ? "₱" : "";
  measureInputUnit.textContent =
    mode === "amount" ? "" : unitText(measuredProduct?.unit);
  measureResultLabel.textContent =
    mode === "amount" ? "Quantity" : "Price";
  measureQuickPicks.innerHTML = (mode === "amount"
    ? [10, 20, 50, 100].map((value) => ({ label: peso(value), value }))
    : [0.25, 0.5, 0.75, 1].map((value) => ({
        label: window.miniMartDB.formatQuantity(value, measuredProduct.unit),
        value,
      })))
    .map(
      (pick) =>
        `<button type="button" data-measure-pick="${pick.value}">${pick.label}</button>`,
    )
    .join("");
  updateMeasuredPreview();
}

function updateMeasuredPreview() {
  if (!measuredProduct) return;

  const unit = measuredProduct.unit;
  const decimals = window.miniMartDB.unitDecimals(unit);
  const inputDecimals = measuredMode === "amount" ? 2 : decimals;
  const entered = parseMeasureValue(measureValue.value);
  let quantity = null;
  let lineTotal = 0;
  let error = "";
  measureWarning.hidden = true;
  measureWarning.textContent = "";

  if (entered === null && measureValue.value.trim()) {
    error = "Enter a valid number using digits, a comma, or a dot.";
  } else if (entered !== null) {
    const decimalPart = String(measureValue.value).replace(",", ".").split(".")[1] || "";
    if (decimalPart.length > inputDecimals) {
      error = `This input allows up to ${inputDecimals} decimal places.`;
    } else if (entered <= 0) {
      error = "Enter an amount greater than zero.";
    } else if (measuredMode === "amount" && Number(measuredProduct.price) <= 0) {
      error = "This product needs a price before it can be sold by amount.";
    } else if (measuredMode === "amount") {
      quantity = floorQuantity(entered / Number(measuredProduct.price), unit);
      lineTotal = window.miniMartDB.roundMoney(entered);
      if (quantity <= 0) error = "That amount is too small for one unit.";
    } else {
      quantity = window.miniMartDB.roundQuantity(entered, unit);
      lineTotal = window.miniMartDB.roundMoney(quantity * measuredProduct.price);
    }
  }

  const alreadyInCart = measuredEditName ? 0 : Number(cart.get(measuredProduct.name)?.quantity || 0);
  const availableStock = window.miniMartDB.roundQuantity(
    Math.max(0, Number(measuredProduct.stock) - alreadyInCart), unit,
  );
  if (!error && quantity !== null && quantity > availableStock) {
    const blocking =
      window.miniMartSettings.get().blockOutOfStockSales !== false;
    if (blocking) {
      error = `Only ${window.miniMartDB.formatQuantity(availableStock, unit)} left to add.`;
    } else {
      measureWarning.hidden = false;
      measureWarning.textContent = "Warning: this quantity is above available stock.";
    }
  }

  measureError.hidden = !error;
  measureError.textContent = error;
  addMeasuredToCart.disabled = Boolean(error) || quantity === null;

  if (quantity !== null) {
    measureResult.textContent =
      measuredMode === "amount"
        ? window.miniMartDB.formatQuantity(quantity, unit)
        : peso(lineTotal);
  } else {
    measureResult.textContent = peso(0);
  }

  measureValue.setAttribute("aria-invalid", String(Boolean(error)));
}

function openMeasureModal(product, editName = null) {
  const unit = window.miniMartDB.normalizeUnit(product.unit);
  const stock = Number(product.stock) || 0;
  const blocking = window.miniMartSettings.get().blockOutOfStockSales !== false;
  if (blocking && stock <= 0) {
    showCheckoutToast("This product is out of stock and cannot be sold.");
    setBarcodeStatus(`${product.name}: no stock available.`, true);
    return false;
  }

  measuredProduct = { ...product, unit };
  measuredEditName = editName;
  measureReturnFocus = editName
    ? null
    : productCards.find((card) => card.dataset.name === product.name);
  measureProductSummary.textContent = `${product.name} — ${peso(product.price)} / ${unitText(unit)}`;
  measureStock.textContent = `${window.miniMartDB.formatQuantity(stock, unit)} left`;
  measureValue.value = editName && cart.get(editName)
    ? cart.get(editName).inputValue || cart.get(editName).quantity
    : "";
  setMeasureMode(editName && cart.get(editName)?.amountMode ? "amount" : "quantity");
  measureModal.hidden = false;
  measureValue.focus();
  return true;
}

function addMeasuredLine() {
  updateMeasuredPreview();
  if (addMeasuredToCart.disabled || !measuredProduct) return;

  const unit = measuredProduct.unit;
  const entered = parseMeasureValue(measureValue.value);
  const quantity =
    measuredMode === "amount"
      ? floorQuantity(entered / Number(measuredProduct.price), unit)
      : window.miniMartDB.roundQuantity(entered, unit);
  const lineTotal = window.miniMartDB.roundMoney(
    measuredMode === "amount" ? entered : quantity * measuredProduct.price,
  );
  const existing = measuredEditName ? cart.get(measuredEditName) : cart.get(measuredProduct.name);
  const item = existing && !measuredEditName ? { ...existing } : {
    name: measuredProduct.name,
    price: Number(measuredProduct.price),
    quantity: 0,
    unit,
    lineTotal: 0,
  };

  if (measuredEditName) {
    item.quantity = quantity;
    item.lineTotal = lineTotal;
  } else {
    item.quantity = window.miniMartDB.roundQuantity(item.quantity + quantity, unit);
    item.lineTotal = window.miniMartDB.roundMoney(item.lineTotal + lineTotal);
  }
  item.unit = unit;
  item.amountMode = measuredMode === "amount";
  item.inputValue = measureValue.value;
  if (measuredEditName) cart.delete(measuredEditName);
  cart.set(item.name, item);
  closeMeasureModal();
  renderCart();
}

/* =========================================================
   SUKI REWARD RULES
========================================================= */

const SUKI_STORAGE_KEY = "miniMartSukis";

const STAMP_SPEND_AMOUNT = 50;
const MAX_STAMPS = 40;
const REWARD_PER_10_STAMPS = 50;
const MAX_REWARD_BALANCE = 200;

let selectedSukiId = "";

function showCheckoutToast(message, type = "error") {
  const toast = document.createElement("div");

  toast.className = `checkout-toast checkout-toast-${type}`;

  toast.setAttribute("role", "status");

  toast.textContent = message;

  document.body.append(toast);

  setTimeout(() => toast.remove(), 4000);
}

window.showNfcToast = showCheckoutToast;

/* =========================================================
   SUKI STORAGE
========================================================= */

function getSukis() {
  try {
    const saved = JSON.parse(localStorage.getItem(SUKI_STORAGE_KEY) || "[]");

    if (!Array.isArray(saved)) {
      return [];
    }

    return saved.map((suki) => ({
      ...suki,

      stamps: Number.isFinite(Number(suki.stamps))
        ? Math.max(0, Math.min(MAX_STAMPS, Number(suki.stamps)))
        : 0,

      rewardBalance: Number.isFinite(Number(suki.rewardBalance))
        ? Math.max(0, Math.min(MAX_REWARD_BALANCE, Number(suki.rewardBalance)))
        : 0,

      active: suki.active !== false,

      history: Array.isArray(suki.history) ? suki.history : [],
    }));
  } catch {
    return [];
  }
}

function saveSukis(sukis) {
  localStorage.setItem(SUKI_STORAGE_KEY, JSON.stringify(sukis));
}

/* =========================================================
   SUKI CHECKOUT UI
========================================================= */

function createSukiCheckoutUI() {
  if (document.getElementById("checkoutSukiPanel")) {
    return;
  }

  const panel = document.createElement("div");

  panel.id = "checkoutSukiPanel";

  panel.style.margin = "12px 0";

  panel.innerHTML = `
    <div class="checkout-suki-heading">
      Suki Rewards
    </div>

    <button
      id="checkoutSukiScanButton"
      class="checkout-suki-scan-button"
      type="button"
    >
      Tap Suki's Card
    </button>

    <small
      id="checkoutSukiScanStatus"
      class="checkout-suki-scan-status"
      role="status"
      aria-live="polite"
    >
      Tap the customer's NFC card to apply rewards.
    </small>

    <div
      id="checkoutSukiInfo"
      style="margin-top:8px;font-size:.9rem;"
    ></div>

    <div
      id="checkoutRewardControls"
      hidden
      style="margin-top:8px;"
    >
      <label
        for="rewardAmount"
        style="display:block;margin-bottom:6px;"
      >
        Reward amount to use
      </label>

      <input
        id="rewardAmount"
        type="number"
        min="0"
        step="0.01"
        value="0"
        placeholder="0.00"
        style="width:100%;padding:10px;border-radius:8px;"
      />

      <small>
        Maximum available reward will be shown above.
      </small>
    </div>
  `;

  paymentPanel.prepend(panel);

  const scanButton = document.getElementById("checkoutSukiScanButton");

  const rewardInput = document.getElementById("rewardAmount");

  scanButton.addEventListener("click", scanSukiCard);

  rewardInput.addEventListener("input", updatePayment);

  refreshSukiSelector();
}

function refreshSukiSelector() {
  const sukis = getSukis();

  const current = selectedSukiId;

  if (current && sukis.some((suki) => suki.id === current && suki.active)) {
    updateSukiCheckoutInfo();
  } else {
    selectedSukiId = "";
    updateSukiCheckoutInfo();
  }
}

async function scanSukiCard() {
  const scanButton = document.getElementById("checkoutSukiScanButton");

  const scanStatus = document.getElementById("checkoutSukiScanStatus");

  if (scanButton) {
    scanButton.disabled = true;

    scanButton.textContent = "Scanning...";
  }

  if (scanStatus) {
    scanStatus.textContent = "Hold the Suki card near the back of your phone.";
    scanStatus.classList.remove("is-error");
  }

  await scanNfcCard(
    (nfcId) => {
      const suki = getSukis().find((entry) => entry.nfcId === nfcId);

      if (!suki) {
        selectedSukiId = "";

        if (scanButton) {
          scanButton.disabled = false;

          scanButton.textContent = "Tap Suki's Card";
        }

        if (scanStatus) {
          scanStatus.textContent = "No Suki found for this card.";

          scanStatus.classList.add("is-error");
        }

        showCheckoutToast("No Suki found for this card.");

        updateSukiCheckoutInfo();
        updatePayment();

        return;
      }

      if (!suki.id || !suki.name) {
        selectedSukiId = "";

        if (scanButton) {
          scanButton.disabled = false;

          scanButton.textContent = "Tap Suki's Card";
        }

        if (scanStatus) {
          scanStatus.textContent =
            "This card can't be used right now. Please ask the manager to check the Suki account.";

          scanStatus.classList.add("is-error");
        }

        showCheckoutToast(
          "This card can't be used right now. Please ask the manager to check the Suki account.",
        );

        updateSukiCheckoutInfo();
        updatePayment();

        return;
      }

      selectedSukiId = suki.id;

      updateSukiCheckoutInfo();
      updatePayment();

      if (scanButton) {
        scanButton.disabled = false;

        scanButton.textContent = "Suki Card Selected";
      }

      if (scanStatus) {
        scanStatus.textContent = "Suki card detected.";
      }
    },
    (message) => {
      if (scanButton) {
        scanButton.disabled = false;

        scanButton.textContent = "Tap Suki's Card";
      }

      if (scanStatus) {
        scanStatus.textContent = message;

        scanStatus.classList.add("is-error");
      }
    },
  );
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

function getSelectedSuki() {
  if (!selectedSukiId) {
    return null;
  }

  return getSukis().find((suki) => suki.id === selectedSukiId) || null;
}

function updateSukiCheckoutInfo() {
  const info = document.getElementById("checkoutSukiInfo");

  const controls = document.getElementById("checkoutRewardControls");

  const rewardInput = document.getElementById("rewardAmount");

  if (!info || !controls) {
    return;
  }

  const suki = getSelectedSuki();

  if (!suki) {
    info.textContent = "No Suki customer selected.";

    controls.hidden = true;

    if (rewardInput) {
      rewardInput.value = "0";
    }

    return;
  }

  info.innerHTML = `
    <strong>
      ${escapeHtml(suki.name)}
    </strong>
    <br>
    Stamps:
    ${suki.stamps}/${MAX_STAMPS}
    <br>
    Reward balance:
    ${window.miniMartSettings.formatCurrency(suki.rewardBalance)}
  `;

  controls.hidden = suki.rewardBalance <= 0 || suki.stamps < MAX_STAMPS;

  if (suki.rewardBalance <= 0 || suki.stamps < MAX_STAMPS) {
    if (rewardInput) {
      rewardInput.value = "0";
    }
  }
}

/* =========================================================
   PRODUCTS
========================================================= */

function categoryIconPath(category) {
  return window.miniMartDB.categoryIcon(category);
}

function renderProducts() {
  const products = window.miniMartDB.products();

  const categories = [
    ...window.miniMartDB.categories(),
    ...new Set(products.map((product) => product.category)),
  ];

  productsSection.innerHTML =
    categories
      .filter(
        (category, index) =>
          categories.indexOf(category) === index &&
          products.some((product) => product.category === category),
      )
      .map((category) => {
        const categoryProducts = products
          .filter((product) => product.category === category)
          .sort((first, second) => first.name.localeCompare(second.name));

        const first = categoryProducts[0];

        const categoryIcon = `
          <img
            src="${categoryIconPath(category)}"
            alt=""
          />
        `;

        const header = `
          <div
            class="checkout-category"
            style="--accent:${first.accent}"
            data-category="${category}"
            data-open="false"
            tabindex="0"
            role="button"
            aria-expanded="false"
          >
            <span class="category-toggle">
              ${categoryIcon}
            </span>

            <strong>${category}</strong>

            <small>
              ${categoryProducts.length}
              products
            </small>

            <b>＋</b>
          </div>
        `;

        const cards = categoryProducts
          .map(
            (product) =>
              `
                <article
                  class="product"
                  style="--accent:${product.accent}"
                  data-category="${product.category}"
                  data-name="${escapeHtml(product.name)}"
                  data-barcode="${escapeHtml(product.barcode || "")}"
                  data-price="${product.price}"
                  data-stock="${product.stock}"
                  data-unit="${product.unit || "piece"}"
                >
                  <div class="product-head">
                    <span class="product-icon">
                      <img
                        src="${categoryIconPath(product.category)}"
                        alt=""
                      />
                    </span>

                    <span class="category">
                      ${product.category.toUpperCase()}
                    </span>
                  </div>

                  <h2>
                    ${escapeHtml(product.name)}
                  </h2>

                  <p class="price">
                    ${measuredUnit(product.unit)
                      ? `${peso(product.price)} / ${unitText(product.unit)}`
                      : peso(product.price)}
                  </p>

                  <span class="stock">
                    ${measuredUnit(product.unit)
                      ? `${window.miniMartDB.formatQuantity(product.stock, product.unit)} left`
                      : `${product.stock} left`}
                  </span>
                </article>
                `,
          )
          .join("");

        return header + cards;
      })
      .join("") +
    `
      <div
        class="empty-results"
        id="emptyResults"
      >
        No products found.
      </div>
    `;

  productCards = [...productsSection.querySelectorAll(".product")];

  productCards.forEach((product) =>
    product.addEventListener("click", addToCart),
  );

  filterProducts();
}

function refreshProductCards() {
  const stockByName = new Map(
    window.miniMartDB
      .products()
      .map((product) => [product.name, product.stock]),
  );

  productCards.forEach((product) => {
    const current = window.miniMartDB.products().find(
      (entry) => entry.name === product.dataset.name,
    );
    const stock = stockByName.get(product.dataset.name) ?? 0;

    product.dataset.stock = stock;

    product.querySelector(".stock").textContent =
      current && measuredUnit(current.unit)
        ? `${window.miniMartDB.formatQuantity(stock, current.unit)} left`
        : `${stock} left`;

    product.style.opacity = stock ? "1" : ".55";
  });
}

function addToCart() {
  const product = window.miniMartDB.products().find((entry) => entry.name === this.dataset.name);
  if (product) addProductToCart(product);
}

function addProductToCart(product) {
  if (measuredUnit(product.unit)) {
    return openMeasureModal(product) ? "measure" : false;
  }

  const name = product.name;
  const stock = Number(product.stock);
  const blockOutOfStockSales =
    window.miniMartSettings.get().blockOutOfStockSales !== false;

  const item = cart.get(name) || {
    name,
    price: Number(product.price),
    quantity: 0,
  };

  if (blockOutOfStockSales && item.quantity >= stock) {
    showCheckoutToast(
      stock === 0
        ? "This product is out of stock and cannot be sold."
        : `Only ${stock} unit${stock === 1 ? "" : "s"} available.`,
    );
    setBarcodeStatus(`${name}: no more stock available for this cart.`, true);
    return false;
  }

  item.quantity += 1;

  cart.set(name, item);

  renderCart();
  return "added";
}

function setBarcodeStatus(message, isError = false) {
  barcodeStatus.textContent = message;
  barcodeStatus.classList.toggle("is-error", isError);
}

function addScannedBarcode() {
  // Keep barcodes as strings so codes beginning with zero remain intact.
  const barcode = search.value.trim();
  if (!barcode) return;

  const matches = window.miniMartDB.products().filter((product) =>
    String(product.barcode || "").trim() === barcode,
  );

  if (matches.length !== 1) {
    setBarcodeStatus(matches.length > 1
      ? "This barcode belongs to multiple products. Correct it in Inventory."
      : `Barcode ${barcode} is not registered. Add it to a product in Inventory.`, true);
    search.select();
    return;
  }

  const product = matches[0];
  const result = addProductToCart(product);
  if (!result) {
    search.select();
    return;
  }

  search.value = "";
  filterProducts();
  if (result === "measure") {
    measureReturnFocus = search;
    setBarcodeStatus(`Enter the quantity or amount for ${product.name}.`);
    return;
  }
  setBarcodeStatus(`Added ${product.name}. Quantity: ${cart.get(product.name).quantity}.`);
  search.focus({ preventScroll: true });
}

function filterProducts() {
  const query = search.value.toLowerCase().trim();
  const matches = (product) =>
    product.dataset.name.toLowerCase().includes(query) ||
    product.dataset.barcode.toLowerCase().includes(query);

  let visible = 0;

  productCards.forEach((product) => {
    const match = matches(product);

    const group = productsSection.querySelector(
      `.checkout-category[data-category="${CSS.escape(
        product.dataset.category,
      )}"]`,
    );

    const open = group?.dataset.open === "true" || query.length > 0;

    product.style.display = match && open ? "" : "none";

    if (match) {
      visible += 1;
    }
  });

  productsSection.querySelectorAll(".checkout-category").forEach((group) => {
    group.style.display = productCards.some(
      (product) =>
        product.dataset.category === group.dataset.category &&
        matches(product),
    )
      ? ""
      : "none";
  });

  document.getElementById("emptyResults").style.display = visible
    ? "none"
    : "block";
}

/* =========================================================
   RECEIPT DATE
========================================================= */

receiptDate.textContent = new Date().toLocaleString("en-US", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

/* =========================================================
   PRODUCT EVENTS
========================================================= */

search.addEventListener("input", filterProducts);
search.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) addScannedBarcode();
  }
});

productsSection.addEventListener("click", (event) => {
  const group = event.target.closest(".checkout-category");

  if (!group) return;

  const open = group.dataset.open === "true";

  group.dataset.open = String(!open);

  group.setAttribute("aria-expanded", String(!open));

  filterProducts();
});

productsSection.addEventListener("keydown", (event) => {
  if (
    event.target.closest(".checkout-category") &&
    (event.key === "Enter" || event.key === " ")
  ) {
    event.preventDefault();

    event.target.closest(".checkout-category").click();
  }
});

document.getElementById("closeMeasureModal").addEventListener("click", closeMeasureModal);
document.getElementById("cancelMeasureModal").addEventListener("click", closeMeasureModal);
measureModal.addEventListener("click", (event) => {
  if (event.target === measureModal) closeMeasureModal();
});
measureValue.addEventListener("input", updateMeasuredPreview);
addMeasuredToCart.addEventListener("click", addMeasuredLine);
document.querySelectorAll("[data-measure-mode]").forEach((button) => {
  button.addEventListener("click", () => setMeasureMode(button.dataset.measureMode));
});
measureQuickPicks.addEventListener("click", (event) => {
  const button = event.target.closest("[data-measure-pick]");
  if (!button) return;
  measureValue.value = button.dataset.measurePick;
  updateMeasuredPreview();
});
document.addEventListener("keydown", (event) => {
  if (measureModal.hidden) return;
  if (event.key === "Escape") {
    closeMeasureModal();
    return;
  }
  if (event.key === "Enter" && document.activeElement === measureValue) {
    event.preventDefault();
    addMeasuredLine();
  }
  if (event.key === "Tab") {
    const focusable = [...measureModal.querySelectorAll("button, input")].filter(
      (element) => !element.disabled,
    );
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
});

/* =========================================================
   SELL / COMPLETE PURCHASE
========================================================= */

sellButton.addEventListener("click", () => {
  if (saleInProgress) return;
  saleInProgress = true;
  sellButton.disabled = true;

  const productsSnapshot = localStorage.getItem("miniMartProducts");
  const salesSnapshot = localStorage.getItem("miniMartSales");
  const sukisSnapshot = localStorage.getItem(SUKI_STORAGE_KEY);

  const entries = [...cart.values()];

  const total = getCartTotal();

  const paid = Number(amountGiven.value);

  const suki = getSelectedSuki();

  /*
   * IMPORTANT:
   * This is the only rewardInput
   * declaration needed in this
   * function.
   */
  const rewardInput = document.getElementById("rewardAmount");

  let rewardUsed = Number(rewardInput?.value || 0);

  if (!entries.length || !Number.isFinite(paid)) {
    updatePayment();
    saleInProgress = false;
    return;
  }

  /*
   * Reward can only be redeemed
   * when the customer has reached
   * the 40-stamp limit.
   */
  if (suki) {
    if (!suki.active) {
      paymentError.hidden = false;

      paymentError.textContent = "This Suki customer is inactive.";
      saleInProgress = false;
      return;
    }

    if (suki.stamps < MAX_STAMPS) {
      rewardUsed = 0;

      if (rewardInput) {
        rewardInput.value = "0";
      }
    }

    rewardUsed = Math.max(0, Math.min(rewardUsed, suki.rewardBalance, total));
  } else {
    rewardUsed = 0;
  }

  const cashRequired = Math.max(total - rewardUsed, 0);

  if (!Number.isFinite(paid) || paid < cashRequired) {
    updatePayment();
    saleInProgress = false;
    return;
  }

  const currentInventory = window.miniMartDB.products();
  if (window.miniMartSettings.get().blockOutOfStockSales !== false) {
    for (const item of entries) {
      const product = currentInventory.find((entry) => entry.name === item.name);
      if (
        product &&
        Number(item.quantity) > Number(product.stock)
      ) {
        const unit = window.miniMartDB.normalizeUnit(product.unit);
        saleInProgress = false;
        updatePayment();
        paymentError.hidden = false;
        paymentError.textContent = `Only ${window.miniMartDB.formatQuantity(product.stock, unit)} of ${product.name} is available.`;
        return;
      }
    }
  }

  /* =========================================
       CALCULATE NEW STAMPS
    ========================================= */

  const cashPaid = cashRequired;

  let stampsEarned = 0;

  if (suki && suki.active && suki.stamps < MAX_STAMPS) {
    stampsEarned = Math.floor(cashPaid / STAMP_SPEND_AMOUNT);

    stampsEarned = Math.max(
      0,
      Math.min(stampsEarned, MAX_STAMPS - suki.stamps),
    );
  }

  /* =========================================
       UPDATE SUKI
    ========================================= */

  if (suki) {
    const sukis = getSukis();

    const index = sukis.findIndex((entry) => entry.id === suki.id);

    if (index !== -1) {
      const current = sukis[index];

      let newStamps = current.stamps;

      let newRewardBalance = current.rewardBalance;

      /*
       * Add new stamps.
       */
      if (stampsEarned > 0) {
        newStamps = Math.min(MAX_STAMPS, newStamps + stampsEarned);

        /*
         * Every 10 stamps creates
         * ₱50 reward balance.
         */
        const oldRewardTiers = Math.floor(current.stamps / 10);

        const newRewardTiers = Math.floor(newStamps / 10);

        const newTiers = Math.max(0, newRewardTiers - oldRewardTiers);

        if (newTiers > 0) {
          newRewardBalance = Math.min(
            MAX_REWARD_BALANCE,
            newRewardBalance + newTiers * REWARD_PER_10_STAMPS,
          );
        }
      }

      /*
       * Redeeming any reward at
       * the 40-stamp limit resets
       * the stamp cycle.
       */
      if (rewardUsed > 0 && current.stamps >= MAX_STAMPS) {
        newStamps = 0;

        newRewardBalance = Math.max(0, newRewardBalance - rewardUsed);
      }

      /*
       * Record transaction.
       */
      const historyEntry = {
        type: "Purchase",

        date: new Date().toISOString(),

        description: `${entries.length} item${
          entries.length === 1 ? "" : "s"
        } purchased`,

        purchaseTotal: total,

        rewardUsed: rewardUsed,

        cashPaid: cashPaid,

        stampsEarned: stampsEarned,

        stampsAfter: newStamps,

        rewardBalanceAfter: newRewardBalance,
      };

      sukis[index] = {
        ...current,

        stamps: newStamps,

        rewardBalance: newRewardBalance,

        redeemed: false,

        history: [...(current.history || []), historyEntry],
      };

      saveSukis(sukis);
    }
  }

  /* =========================================
       INVENTORY
    ========================================= */

  const inventory = window.miniMartDB.products();

  entries.forEach((item) => {
    const product = inventory.find((entry) => entry.name === item.name);

    if (product) {
      const unit = window.miniMartDB.normalizeUnit(product.unit);
      const nextStock = Number(product.stock) - Number(item.quantity);
      if (
        window.miniMartSettings.get().blockOutOfStockSales !== false &&
        nextStock < 0
      ) {
        product.stock = Number(product.stock);
        return;
      }
      product.stock = window.miniMartDB.roundQuantity(
        nextStock,
        unit,
      );
    }
  });

  const saleItems = entries.map((item) => {
    const product = inventory.find((entry) => entry.name === item.name);

    return {
      name: item.name,

      price: item.price,

      quantity: item.quantity,

      productId: product?.id || item.name,

      unit: window.miniMartDB.normalizeUnit(item.unit || product?.unit),

      lineTotal: window.miniMartDB.roundMoney(
        item.lineTotal ?? item.price * item.quantity,
      ),

      costPrice: window.miniMartDB.isKnownCost(product?.costPrice)
        ? Number(product.costPrice)
        : null,
    };
  });

  try {
    window.miniMartDB.saveProducts(inventory);
    window.miniMartDB.recordSale(saleItems, total);
  } catch (error) {
    if (productsSnapshot === null) {
      localStorage.removeItem("miniMartProducts");
    } else {
      localStorage.setItem("miniMartProducts", productsSnapshot);
    }
    if (salesSnapshot === null) {
      localStorage.removeItem("miniMartSales");
    } else {
      localStorage.setItem("miniMartSales", salesSnapshot);
    }
    if (sukisSnapshot === null) {
      localStorage.removeItem(SUKI_STORAGE_KEY);
    } else {
      localStorage.setItem(SUKI_STORAGE_KEY, sukisSnapshot);
    }
    saleInProgress = false;
    updatePayment();
    showCheckoutToast(error.message || "The sale could not be saved.");
    return;
  }

  /* =========================================
       RESET CHECKOUT
    ========================================= */

  cart.clear();

  amountGiven.value = "";

  /*
   * FIX:
   * Do NOT declare rewardInput
   * again here.
   *
   * We use the rewardInput
   * declared at the beginning
   * of the SELL function.
   */
  if (rewardInput) {
    rewardInput.value = "0";
  }

  selectedSukiId = "";

  renderProducts();

  renderCart();

  refreshSukiSelector();
  saleInProgress = false;
  search.value = "";
  filterProducts();
  setBarcodeStatus("Sale complete. Ready to scan the next product.");
  search.focus({ preventScroll: true });
});

/* =========================================================
   PAYMENT CALCULATION
========================================================= */

function updatePayment() {
  const total = getCartTotal();

  const paid = Number(amountGiven.value);

  const validPayment = Number.isFinite(paid) && amountGiven.value !== "";

  const suki = getSelectedSuki();

  const rewardInput = document.getElementById("rewardAmount");

  let rewardUsed = Number(rewardInput?.value || 0);

  /*
   * Reward redemption only works
   * at 40 stamps.
   */
  if (!suki || suki.stamps < MAX_STAMPS) {
    rewardUsed = 0;

    if (rewardInput) {
      rewardInput.value = "0";
    }
  } else {
    rewardUsed = Math.max(0, Math.min(rewardUsed, suki.rewardBalance, total));

    if (rewardInput) {
      rewardInput.max = Math.min(suki.rewardBalance, total);
    }
  }

  const cashRequired = Math.max(total - rewardUsed, 0);

  const change = validPayment ? paid - cashRequired : 0;

  changeAmount.innerHTML = peso(Math.max(change, 0));

  const insufficient = validPayment && paid < cashRequired;

  paymentError.hidden = !insufficient;

  if (insufficient) {
    paymentError.textContent = `Need ${peso(cashRequired)} cash after rewards.`;
  }

  sellButton.disabled = !cart.size || insufficient || !validPayment;
}

amountGiven.addEventListener("input", updatePayment);

/* =========================================================
   CART
========================================================= */

function getCartTotal() {
  return window.miniMartDB.roundMoney(
    [...cart.values()].reduce(
      (sum, item) => sum + Number(item.lineTotal ?? item.price * item.quantity),
      0,
    ),
  );
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");

  const entries = [...cart.values()];

  document.getElementById("cartEmpty").style.display = entries.length
    ? "none"
    : "grid";

  cartItems.style.display = entries.length ? "block" : "none";

  document.getElementById("total").hidden = !entries.length;

  paymentPanel.hidden = !entries.length;

  cartItems.innerHTML = entries
    .map(
      (item) =>
        `
          <div class="cart-row" data-measured="${String(Boolean(item.unit && measuredUnit(item.unit)))}" data-edit="${escapeHtml(item.name)}">
            <span>
              ${escapeHtml(item.name)}

              <small>
                ${item.unit && measuredUnit(item.unit)
                  ? `${window.miniMartDB.formatQuantity(item.quantity, item.unit)} x ${peso(item.price)}/${unitText(item.unit)}`
                  : `${item.quantity}`}
                ${item.unit && measuredUnit(item.unit) ? "" : " x"}
                ${item.unit && measuredUnit(item.unit) ? "" : peso(item.price)}
              </small>
            </span>

            <span>
              <strong>
                ${peso(item.lineTotal ?? item.quantity * item.price)}
              </strong>

              <button
                class="remove"
                data-remove="${escapeHtml(item.name)}"
                aria-label="Remove ${escapeHtml(item.name)}"
              >
                x
              </button>
            </span>
          </div>
          `,
    )
    .join("");

  document.getElementById("totalAmount").innerHTML = peso(getCartTotal());

  updatePayment();

  cartItems.querySelectorAll("[data-remove]").forEach((button) =>
    button.addEventListener("click", () => {
      cart.delete(button.dataset.remove);

      renderCart();
    }),
  );

  cartItems.querySelectorAll('[data-measured="true"]').forEach((row) =>
    row.addEventListener("click", (event) => {
      if (event.target.closest("[data-remove]")) return;
      const item = cart.get(row.dataset.edit);
      const product = window.miniMartDB.products().find(
        (entry) => entry.name === row.dataset.edit,
      );
      if (item && product) openMeasureModal(product, item.name);
    }),
  );
}

/* =========================================================
   INITIALIZE
========================================================= */

createSukiCheckoutUI();

renderProducts();

renderCart();

refreshSukiSelector();

search.focus({ preventScroll: true });
