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

const sellButton = document.getElementById("sellButton");

const paymentPanel = document.getElementById("paymentPanel");

const amountGiven = document.getElementById("amountGiven");

const changeAmount = document.getElementById("changeAmount");

const paymentError = document.getElementById("paymentError");

const productsSection = document.getElementById("products");

let productCards = [];

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
    "Beverages",
    "Instant Food",
    "Snacks",
    "Dairy",
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
                  data-price="${product.price}"
                  data-stock="${product.stock}"
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
                    ${peso(product.price)}
                  </p>

                  <span class="stock">
                    ${product.stock} left
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
    const stock = stockByName.get(product.dataset.name) ?? 0;

    product.dataset.stock = stock;

    product.querySelector(".stock").textContent = `${stock} left`;

    product.style.opacity = stock ? "1" : ".55";
  });
}

function addToCart() {
  const name = this.dataset.name;

  const stock = Number(this.dataset.stock);
  const blockOutOfStockSales =
    window.miniMartSettings.get().blockOutOfStockSales !== false;

  const item = cart.get(name) || {
    name,
    price: Number(this.dataset.price),
    quantity: 0,
  };

  if (blockOutOfStockSales && item.quantity >= stock) {
    showCheckoutToast(
      stock === 0
        ? "This product is out of stock and cannot be sold."
        : `Only ${stock} unit${stock === 1 ? "" : "s"} available.`,
    );
    return;
  }

  item.quantity += 1;

  cart.set(name, item);

  renderCart();
}

function filterProducts() {
  const query = search.value.toLowerCase().trim();

  let visible = 0;

  productCards.forEach((product) => {
    const match = product.dataset.name.toLowerCase().includes(query);

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
        product.dataset.name.toLowerCase().includes(query),
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

/* =========================================================
   SELL / COMPLETE PURCHASE
========================================================= */

sellButton.addEventListener("click", () => {
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
    return;
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
      product.stock -= item.quantity;
    }
  });

  const saleItems = entries.map((item) => {
    const product = inventory.find((entry) => entry.name === item.name);

    return {
      name: item.name,

      price: item.price,

      quantity: item.quantity,

      costPrice: window.miniMartDB.isKnownCost(product?.costPrice)
        ? Number(product.costPrice)
        : null,
    };
  });

  window.miniMartDB.saveProducts(inventory);

  window.miniMartDB.recordSale(saleItems, total);

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
  return [...cart.values()].reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
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
          <div class="cart-row">
            <span>
              ${escapeHtml(item.name)}

              <small>
                ${item.quantity}
                x
                ${peso(item.price)}
              </small>
            </span>

            <span>
              <strong>
                ${peso(item.quantity * item.price)}
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
}

/* =========================================================
   INITIALIZE
========================================================= */

createSukiCheckoutUI();

renderProducts();

renderCart();

refreshSukiSelector();
