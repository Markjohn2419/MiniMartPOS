"use strict";

/* =========================================================
   MINI MART - SUKI REWARDS + NFC
========================================================= */

const SUKI_STORAGE_KEY = "miniMartSukis";

const STAMP_SPEND_AMOUNT = 50;
const MAX_STAMPS = 40;
const REWARD_PER_10_STAMPS = 50;
const MAX_REWARD_BALANCE = 200;

let selectedSukiId = "";
let pendingNfcId = "";
let unlinkSukiId = "";

const isNfcSupported = window.isNfcSupported;

const normalizeNfcId = window.normalizeNfcId;

const scanNfcCard = window.scanNfcCard;

/* =========================================================
   ELEMENTS
========================================================= */

const addSukiModal = document.getElementById("addSukiModal");

const addSukiForm = document.getElementById("addSukiForm");

const openAddSuki = document.getElementById("openAddSuki");

const closeAddSuki = document.getElementById("closeAddSuki");

const cancelAddSuki = document.getElementById("cancelAddSuki");

const linkNfcButton = document.getElementById("linkNfcButton");

const linkStatus = document.getElementById("linkStatus");

const sukiName = document.getElementById("sukiName");

const sukiPhone = document.getElementById("sukiPhone");

const sukiNameError = document.getElementById("sukiNameError");

const sukiPhoneError = document.getElementById("sukiPhoneError");

const saveSukiButton = document.getElementById("saveSukiButton");

const sukiJoined = document.getElementById("sukiJoined");

const sukiJoinedError = document.getElementById("sukiJoinedError");

const scanButton = document.getElementById("scanButton");

const scanTitle = document.getElementById("scanTitle");

const scanStatus = document.getElementById("scanStatus");

const scanTab = document.getElementById("scanTab");

const allSukisTab = document.getElementById("allSukisTab");

const scanView = document.getElementById("scanView");

const allSukisView = document.getElementById("allSukisView");

const sukiSearch = document.getElementById("sukiSearch");

const sukiList = document.getElementById("sukiList");

const detailModal = document.getElementById("detailModal");

const closeDetail = document.getElementById("closeDetail");

const detailTitle = document.getElementById("detailTitle");

const detailContent = document.getElementById("detailContent");

const deleteSukiModal = document.getElementById("deleteSukiModal");

const closeDeleteSuki = document.getElementById("closeDeleteSuki");

const cancelDeleteSuki = document.getElementById("cancelDeleteSuki");

const confirmDeleteSuki = document.getElementById("confirmDeleteSuki");

const deleteSukiCopy = document.getElementById("deleteSukiCopy");

const unlinkNfcModal = document.getElementById("unlinkNfcModal");

const closeUnlinkNfc = document.getElementById("closeUnlinkNfc");

const cancelUnlinkNfc = document.getElementById("cancelUnlinkNfc");

const confirmUnlinkNfc = document.getElementById("confirmUnlinkNfc");

const unlinkNfcCopy = document.getElementById("unlinkNfcCopy");
const sukiDisabledNotice = document.getElementById("sukiDisabledNotice");
const sukiContent = document.querySelector(".suki-content");

if (window.miniMartSettings?.get().sukiEnabled === false) {
  sukiDisabledNotice.hidden = false;
  sukiContent.hidden = true;
}

/* =========================================================
   UTILITY
========================================================= */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function formatPeso(value) {
  return window.miniMartSettings.formatCurrency(value);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function showSukiToast(message, type = "error") {
  const toast = document.createElement("div");

  toast.className = `suki-toast suki-toast-${type}`;

  toast.setAttribute("role", "status");

  toast.textContent = message;

  document.body.append(toast);

  setTimeout(() => toast.remove(), 4000);
}

window.showNfcToast = showSukiToast;

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return "suki-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

/* =========================================================
   MODALS
========================================================= */

function openModal(modal) {
  if (!modal) {
    return;
  }

  modal.hidden = false;

  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  if (!modal) {
    return;
  }

  modal.hidden = true;

  const allClosed =
    (!addSukiModal || addSukiModal.hidden) &&
    (!detailModal || detailModal.hidden) &&
    (!deleteSukiModal || deleteSukiModal.hidden) &&
    (!unlinkNfcModal || unlinkNfcModal.hidden);

  if (allClosed) {
    document.body.classList.remove("modal-open");
  }
}

/* =========================================================
   STORAGE
========================================================= */

function getSukis() {
  try {
    const saved = JSON.parse(localStorage.getItem(SUKI_STORAGE_KEY) || "[]");

    if (!Array.isArray(saved)) {
      return [];
    }

    return saved.map((suki) => ({
      ...suki,

      id: suki.id || createId(),

      name: suki.name || "",

      phone: suki.phone || "",

      joined: suki.joined || "",

      nfcId: suki.nfcId || "",

      stamps: clamp(Number(suki.stamps) || 0, 0, MAX_STAMPS),

      rewardBalance: clamp(
        Number(suki.rewardBalance) || 0,
        0,
        MAX_REWARD_BALANCE,
      ),

      active: suki.active !== false,

      history: Array.isArray(suki.history) ? suki.history : [],
    }));
  } catch (error) {
    console.error("Suki storage error:", error);

    return [];
  }
}

function saveSukis(sukis) {
  localStorage.setItem(SUKI_STORAGE_KEY, JSON.stringify(sukis));
}

/* =========================================================
   ADD SUKI
========================================================= */

function validateSukiFields() {
  const name = sukiName?.value.trim() || "";

  const phone = sukiPhone?.value.trim() || "";

  const validName =
    /^[\p{L}]+(?:[.'-][\p{L}]+)*\.?(?: +[\p{L}]+(?:[.'-][\p{L}]+)*\.?)*$/u.test(
      name,
    );

  const normalizedPhone =
    phone.length === 11 && phone.startsWith("09") ? phone.slice(1) : phone;

  if (sukiPhone && normalizedPhone !== phone) {
    sukiPhone.value = normalizedPhone;
  }

  const validPhone = normalizedPhone === "" || /^9\d{9}$/.test(normalizedPhone);

  if (sukiNameError) {
    sukiNameError.hidden = validName;
  }

  if (sukiPhoneError) {
    sukiPhoneError.hidden = validPhone;
  }

  sukiName?.setAttribute("aria-invalid", String(!validName));

  sukiPhone?.setAttribute("aria-invalid", String(!validPhone));

  if (saveSukiButton) {
    saveSukiButton.disabled = !validName || !validPhone;
  }

  return validName && validPhone;
}

function openAddSukiForm() {
  if (!addSukiForm) {
    return;
  }

  addSukiForm.reset();

  pendingNfcId = "";

  if (sukiJoined) {
    sukiJoined.value = new Date().toISOString().split("T")[0];
  }

  if (linkStatus) {
    linkStatus.textContent = "No card linked.";
  }

  if (linkNfcButton) {
    linkNfcButton.disabled = false;

    linkNfcButton.textContent = "Tap Card";
  }

  if (sukiJoinedError) {
    sukiJoinedError.hidden = true;
  }

  validateSukiFields();

  openModal(addSukiModal);

  setTimeout(() => {
    sukiName?.focus();
  }, 100);
}

function closeAddSukiForm() {
  closeModal(addSukiModal);

  pendingNfcId = "";

  if (linkNfcButton) {
    linkNfcButton.disabled = false;

    linkNfcButton.textContent = "Tap Card";
  }
}

/* =========================================================
   LINK NFC
========================================================= */

async function linkNfcCard() {
  if (!isNfcSupported()) {
    if (linkStatus) {
      linkStatus.textContent = "Web NFC is not supported.";
    }

    return;
  }

  linkNfcButton.disabled = true;

  linkNfcButton.textContent = "Waiting...";

  if (linkStatus) {
    linkStatus.textContent = "Hold the NFC card near the back of your phone.";
  }

  await scanNfcCard((nfcId) => {
    const sukis = getSukis();

    const existing = sukis.find((suki) => suki.nfcId === nfcId);

    if (existing) {
      pendingNfcId = "";

      linkStatus.textContent =
        "This card is already linked to an existing account.";

      linkNfcButton.disabled = false;

      linkNfcButton.textContent = "Tap Card";

      return;
    }

    pendingNfcId = nfcId;

    linkStatus.innerHTML = `
        <strong>
          ✓ NFC Card Detected
        </strong>
        <br>
        <small>
          Serial Number:
          ${escapeHtml(nfcId)}
        </small>
      `;

    linkNfcButton.disabled = false;

    linkNfcButton.textContent = "Card Linked";
  });
}

/* =========================================================
   SAVE NEW SUKI
========================================================= */

function saveSuki(event) {
  event.preventDefault();

  if (!validateSukiFields()) {
    return;
  }

  const name = sukiName?.value.trim();

  const phoneInput = sukiPhone?.value.trim();

  const phone = phoneInput ? `+63${phoneInput}` : "";

  const joined = sukiJoined?.value;

  if (!name) {
    showSukiToast("Please enter the customer's name.");

    sukiName?.focus();

    return;
  }

  if (!joined) {
    if (sukiJoinedError) {
      sukiJoinedError.hidden = false;
    }

    sukiJoined?.focus();

    return;
  }

  const sukis = getSukis();

  if (pendingNfcId) {
    const duplicate = sukis.find((suki) => suki.nfcId === pendingNfcId);

    if (duplicate) {
      showSukiToast("This card is already linked to an existing account.");

      return;
    }
  }

  const newSuki = {
    id: createId(),

    name,

    phone,

    joined,

    nfcId: pendingNfcId,

    stamps: 0,

    rewardBalance: 0,

    active: true,

    history: [],
  };

  sukis.push(newSuki);

  saveSukis(sukis);

  pendingNfcId = "";

  closeAddSukiForm();

  renderSukiList();

  showSukiToast(`${name} has been added successfully.`, "success");
}

/* =========================================================
   SCAN EXISTING SUKI
========================================================= */

async function scanExistingSuki() {
  if (!isNfcSupported()) {
    if (scanTitle) {
      scanTitle.textContent = "NFC Not Supported";
    }

    if (scanStatus) {
      scanStatus.textContent = "Web NFC is not supported.";
    }

    return;
  }

  if (scanButton) {
    scanButton.disabled = true;
  }

  if (scanTitle) {
    scanTitle.textContent = "Waiting for Card...";
  }

  if (scanStatus) {
    scanStatus.textContent = "Hold the Suki card near the back of your phone.";
  }

  await scanNfcCard((nfcId) => {
    const suki = getSukis().find((entry) => entry.nfcId === nfcId);

    if (!suki) {
      if (scanTitle) {
        scanTitle.textContent = "Unknown Card";
      }

      if (scanStatus) {
        scanStatus.textContent = `NFC ID ${nfcId} is not linked to a Suki customer.`;
      }

      if (scanButton) {
        scanButton.disabled = false;
      }

      return;
    }

    if (!suki.id || !suki.name) {
      if (scanTitle) {
        scanTitle.textContent = "Suki Card Unavailable";
      }

      if (scanStatus) {
        scanStatus.textContent =
          "This card can't be used right now. Please ask the manager to check the Suki account.";
      }

      if (scanButton) {
        scanButton.disabled = false;
      }

      return;
    }

    if (scanTitle) {
      scanTitle.textContent = suki.name;
    }

    if (scanStatus) {
      scanStatus.textContent = `${suki.stamps}/${MAX_STAMPS} stamps • ${formatPeso(
        suki.rewardBalance,
      )} reward`;
    }

    if (scanButton) {
      scanButton.disabled = false;
    }

    showSukiDetails(suki.id);
  });

  if (scanButton) {
    scanButton.disabled = false;
  }
}

/* =========================================================
   TABS
========================================================= */

function showScanTab() {
  if (scanTab) {
    scanTab.classList.add("is-active");

    scanTab.setAttribute("aria-selected", "true");
  }

  if (allSukisTab) {
    allSukisTab.classList.remove("is-active");

    allSukisTab.setAttribute("aria-selected", "false");
  }

  if (scanView) {
    scanView.hidden = false;
  }

  if (allSukisView) {
    allSukisView.hidden = true;
  }
}

function showAllSukisTab() {
  if (allSukisTab) {
    allSukisTab.classList.add("is-active");

    allSukisTab.setAttribute("aria-selected", "true");
  }

  if (scanTab) {
    scanTab.classList.remove("is-active");

    scanTab.setAttribute("aria-selected", "false");
  }

  if (scanView) {
    scanView.hidden = true;
  }

  if (allSukisView) {
    allSukisView.hidden = false;
  }

  renderSukiList();
}

/* =========================================================
   SUKI LIST
========================================================= */

function renderSukiList() {
  if (!sukiList) {
    return;
  }

  const query = sukiSearch?.value.toLowerCase().trim() || "";

  const sukis = getSukis().filter((suki) => {
    const name = String(suki.name || "").toLowerCase();

    const phone = String(suki.phone || "").toLowerCase();

    const nfc = String(suki.nfcId || "").toLowerCase();

    return name.includes(query) || phone.includes(query) || nfc.includes(query);
  });

  if (!sukis.length) {
    sukiList.innerHTML = `
      <div class="empty-results">
        No Suki customers found.
      </div>
    `;

    return;
  }

  sukiList.innerHTML = sukis
    .map(
      (suki) => `
          <button
            class="suki-card"
            type="button"
            data-suki-id="${escapeHtml(suki.id)}"
          >

            <div class="suki-card-main">

              <strong class="suki-card-name">
                ${escapeHtml(suki.name)}
              </strong>

              <small class="suki-card-phone">
                ${suki.phone ? escapeHtml(suki.phone) : "No phone number"}
              </small>

            </div>

            <div class="suki-card-stats">

              <div>
                <strong>
                  ${suki.stamps}/${MAX_STAMPS}
                </strong>

                <small>
                  Stamps
                </small>
              </div>

              <div>
                <strong>
                  ${formatPeso(suki.rewardBalance)}
                </strong>

                <small>
                  Reward
                </small>
              </div>

            </div>

          </button>
        `,
    )
    .join("");

  sukiList.querySelectorAll("[data-suki-id]").forEach((button) => {
    button.addEventListener("click", () => {
      showSukiDetails(button.dataset.sukiId);
    });
  });
}

/* =========================================================
   SUKI DETAILS
   CLEAN / ORGANIZED DESIGN
========================================================= */

function showSukiDetails(id) {
  const suki = getSukis().find((entry) => entry.id === id);

  if (!suki) {
    return;
  }

  selectedSukiId = suki.id;

  if (detailTitle) {
    detailTitle.textContent = suki.name;
  }

  if (!detailContent) {
    return;
  }

  const history = Array.isArray(suki.history) ? suki.history : [];

  const stampProgress = Math.min(100, (suki.stamps / MAX_STAMPS) * 100);

  const remainingStamps = Math.max(0, MAX_STAMPS - suki.stamps);

  const rewardBalance = Number(suki.rewardBalance) || 0;

  detailContent.innerHTML = `

    <div class="suki-detail-layout">

      <!-- ===============================================
           CUSTOMER HEADER
      ================================================ -->

      <div class="suki-profile-card">

        <div class="suki-profile-avatar">
          ${escapeHtml(suki.name.charAt(0).toUpperCase())}
        </div>

        <div class="suki-profile-info">

          <h3>
            ${escapeHtml(suki.name)}
          </h3>

          <p>
            Suki Customer
          </p>

        </div>

      </div>


      <!-- ===============================================
           CUSTOMER INFORMATION
      ================================================ -->

      <section class="suki-info-section">

        <div class="suki-section-heading">

          <div>
            <span class="suki-section-label">
              CUSTOMER INFORMATION
            </span>

            <h4>
              Personal Details
            </h4>
          </div>

        </div>

        <div class="suki-info-grid">

          <div class="suki-info-item">

            <span>
              Full Name
            </span>

            <strong>
              ${escapeHtml(suki.name)}
            </strong>

          </div>


          <div class="suki-info-item">

            <span>
              Phone Number
            </span>

            <strong>
              ${suki.phone ? escapeHtml(suki.phone) : "Not provided"}
            </strong>

          </div>


          <div class="suki-info-item">

            <span>
              Date Joined
            </span>

            <strong>
              ${formatDate(suki.joined)}
            </strong>

          </div>


          <div class="suki-info-item">

            <span>
              Account Status
            </span>

            <strong class="suki-status-active">
              ${suki.active ? "Active" : "Inactive"}
            </strong>

          </div>

        </div>

      </section>


      <!-- ===============================================
           REWARDS SUMMARY
      ================================================ -->

      <section class="suki-info-section">

        <div class="suki-section-heading">

          <div>

            <span class="suki-section-label">
              REWARDS
            </span>

            <h4>
              Loyalty Progress
            </h4>

          </div>

        </div>


        <div class="suki-reward-grid">

          <div class="suki-reward-stat">

            <span>
              Stamps
            </span>

            <strong>
              ${suki.stamps}
              <small>
                / ${MAX_STAMPS}
              </small>
            </strong>

          </div>


          <div class="suki-reward-stat">

            <span>
              Reward Balance
            </span>

            <strong>
              ${formatPeso(rewardBalance)}
            </strong>

          </div>

        </div>


        <div class="suki-progress-box">

          <div class="suki-progress-header">

            <span>
              Stamp Progress
            </span>

            <strong>
              ${Math.round(stampProgress)}%
            </strong>

          </div>


          <div
            class="suki-progress-track"
            aria-label="Stamp progress"
          >

            <div
              class="suki-progress-fill"
              style="
                width:${stampProgress}%;
              "
            ></div>

          </div>


          <div class="suki-progress-footer">

            <span>
              ${
                remainingStamps === 0
                  ? "Maximum stamps reached"
                  : `${remainingStamps} stamps remaining`
              }
            </span>

            <span>
              ${suki.stamps}/${MAX_STAMPS}
            </span>

          </div>

        </div>

      </section>


      <!-- ===============================================
           NFC INFORMATION
      ================================================ -->

      <section class="suki-info-section">

        <div class="suki-section-heading">

          <div>

            <span class="suki-section-label">
              NFC CARD
            </span>

            <h4>
              Card Information
            </h4>

          </div>

        </div>


        <div class="suki-nfc-card">

          <div class="suki-nfc-icon">
            NFC
          </div>

          <div class="suki-nfc-info">

            <span>
              Card Serial Number
            </span>

            <strong
              class="suki-nfc-serial${
                suki.nfcId ? "" : " suki-nfc-serial-empty"
              }"
            >
              ${suki.nfcId ? escapeHtml(suki.nfcId) : "No NFC card linked"}
            </strong>

            ${
              suki.nfcId
                ? ""
                : `
                  <div class="suki-nfc-actions">

                    <button
                      type="button"
                      id="linkNfcDetailButton"
                      class="secondary-button suki-nfc-link-button"
                    >
                      Link NFC Card
                    </button>

                    <small
                      id="linkNfcDetailStatus"
                      class="suki-nfc-link-status"
                    >
                      Ready to link a card.
                    </small>

                  </div>
                `
            }

          </div>

          <div
            class="suki-nfc-status${
              suki.nfcId
                ? " suki-nfc-status-linked"
                : " suki-nfc-status-unlinked"
            }"
          >

            ${suki.nfcId ? "Linked" : "Not Linked"}

          </div>

        </div>

      </section>


      <!-- ===============================================
           TRANSACTION HISTORY
      ================================================ -->

      <section class="suki-info-section">

        <div class="suki-section-heading">

          <div>

            <span class="suki-section-label">
              ACTIVITY
            </span>

            <h4>
              Transaction History
            </h4>

          </div>

          <span class="suki-history-count">
            ${history.length}
            ${history.length === 1 ? "transaction" : "transactions"}
          </span>

        </div>


        ${
          history.length
            ? `

              <div class="suki-history-list">

                ${history
                  .slice()
                  .reverse()
                  .map(
                    (entry) => `

                      <div class="suki-history-item">

                        <div class="suki-history-icon">
                          ✓
                        </div>

                        <div class="suki-history-main">

                          <div class="suki-history-top">

                            <strong>
                              ${escapeHtml(entry.type || "Purchase")}
                            </strong>

                            <span>
                              ${formatDate(entry.date)}
                            </span>

                          </div>


                          <div class="suki-history-details">

                            <span>
                              Purchase:
                              <strong>
                                ${formatPeso(entry.purchaseTotal)}
                              </strong>
                            </span>

                            <span>
                              Stamps:
                              <strong>
                                ${entry.stampsEarned ?? 0}
                              </strong>
                            </span>

                            ${
                              Number(entry.rewardUsed) > 0
                                ? `
                                  <span>
                                    Reward used:
                                    <strong>
                                      ${formatPeso(entry.rewardUsed)}
                                    </strong>
                                  </span>
                                `
                                : ""
                            }

                          </div>

                        </div>

                      </div>

                    `,
                  )
                  .join("")}

              </div>

            `
            : `

              <div class="suki-empty-history">

                <div class="suki-empty-history-icon">
                  —
                </div>

                <strong>
                  No transactions yet
                </strong>

                <span>
                  This customer's purchases
                  will appear here.
                </span>

              </div>

            `
        }

      </section>


      <!-- ===============================================
           ACTIONS
      ================================================ -->

      <div class="suki-detail-actions">

        ${
          suki.nfcId
            ? `
              <button
                type="button"
                id="unlinkNfcButton"
                class="secondary-button"
              >
                Unlink NFC
              </button>
            `
            : ""
        }

        <button
          type="button"
          id="deleteFromDetail"
          class="secondary-button delete-button"
        >
          Delete Suki
        </button>

        <button
          type="button"
          id="detailCloseButton"
          class="cancel-button"
        >
          Close
        </button>

      </div>

    </div>
  `;

  /* =======================================================
     DETAIL EVENTS
  ======================================================= */

  document
    .getElementById("detailCloseButton")
    ?.addEventListener("click", () => {
      closeModal(detailModal);
    });

  document.getElementById("deleteFromDetail")?.addEventListener("click", () => {
    closeModal(detailModal);

    openDeleteSuki(suki.id);
  });

  document
    .getElementById("unlinkNfcButton")
    ?.addEventListener("click", unlinkSelectedNfc);

  document
    .getElementById("linkNfcDetailButton")
    ?.addEventListener("click", linkNfcToSelectedSuki);

  openModal(detailModal);
}

/* =========================================================
   DELETE
========================================================= */

let deleteSukiId = "";

function openDeleteSuki(id) {
  const suki = getSukis().find((entry) => entry.id === id);

  if (!suki) {
    return;
  }

  deleteSukiId = suki.id;

  if (deleteSukiCopy) {
    deleteSukiCopy.textContent = `${suki.name} will be removed from Suki Rewards.`;
  }

  openModal(deleteSukiModal);
}

function deleteSuki() {
  if (!deleteSukiId) {
    return;
  }

  const sukis = getSukis().filter((suki) => suki.id !== deleteSukiId);

  saveSukis(sukis);

  deleteSukiId = "";

  closeModal(deleteSukiModal);

  renderSukiList();
}

/* =========================================================
   UNLINK NFC
========================================================= */

async function linkNfcToSelectedSuki() {
  const sukiId = selectedSukiId;

  if (!sukiId) {
    return;
  }

  const linkButton = document.getElementById("linkNfcDetailButton");

  const linkStatus = document.getElementById("linkNfcDetailStatus");

  if (!isNfcSupported()) {
    await scanNfcCard(() => {});

    if (linkButton) {
      linkButton.disabled = false;

      linkButton.textContent = "Link NFC Card";
    }

    return;
  }

  if (linkButton) {
    linkButton.disabled = true;

    linkButton.textContent = "Scanning...";
  }

  if (linkStatus) {
    linkStatus.textContent = "Hold the NFC card near the back of your phone.";
  }

  await scanNfcCard((nfcId) => {
    const sukis = getSukis();

    const existing = sukis.find((suki) => suki.nfcId === nfcId);

    if (existing) {
      if (linkButton) {
        linkButton.disabled = false;

        linkButton.textContent = "Link NFC Card";
      }

      if (linkStatus) {
        linkStatus.textContent =
          "This card is already linked to an existing account.";
      }

      return;
    }

    const index = sukis.findIndex((suki) => suki.id === sukiId);

    if (index === -1) {
      return;
    }

    sukis[index].nfcId = nfcId;

    saveSukis(sukis);

    showSukiDetails(sukiId);
  });
}

function unlinkSelectedNfc() {
  if (!selectedSukiId) {
    return;
  }

  const sukis = getSukis();

  const index = sukis.findIndex((suki) => suki.id === selectedSukiId);

  if (index === -1) {
    return;
  }

  unlinkSukiId = selectedSukiId;

  if (unlinkNfcCopy) {
    unlinkNfcCopy.textContent = `Unlink the NFC card from ${sukis[index].name}?`;
  }

  openModal(unlinkNfcModal);
}

function confirmUnlinkSelectedNfc() {
  if (!unlinkSukiId) {
    return;
  }

  const sukis = getSukis();

  const index = sukis.findIndex((suki) => suki.id === unlinkSukiId);

  if (index === -1) {
    return;
  }

  sukis[index].nfcId = "";

  saveSukis(sukis);

  unlinkSukiId = "";

  closeModal(unlinkNfcModal);

  showSukiDetails(selectedSukiId);
}

function closeUnlinkNfcModal() {
  unlinkSukiId = "";

  closeModal(unlinkNfcModal);
}

/* =========================================================
   EVENTS
========================================================= */

openAddSuki?.addEventListener("click", openAddSukiForm);

closeAddSuki?.addEventListener("click", closeAddSukiForm);

cancelAddSuki?.addEventListener("click", closeAddSukiForm);

addSukiForm?.addEventListener("submit", saveSuki);

sukiName?.addEventListener("input", validateSukiFields);

sukiPhone?.addEventListener("input", validateSukiFields);

validateSukiFields();

linkNfcButton?.addEventListener("click", linkNfcCard);

scanButton?.addEventListener("click", scanExistingSuki);

scanTab?.addEventListener("click", showScanTab);

allSukisTab?.addEventListener("click", showAllSukisTab);

sukiSearch?.addEventListener("input", renderSukiList);

closeDetail?.addEventListener("click", () => {
  closeModal(detailModal);
});

closeDeleteSuki?.addEventListener("click", () => {
  closeModal(deleteSukiModal);
});

cancelDeleteSuki?.addEventListener("click", () => {
  closeModal(deleteSukiModal);
});

confirmDeleteSuki?.addEventListener("click", deleteSuki);

closeUnlinkNfc?.addEventListener("click", closeUnlinkNfcModal);

cancelUnlinkNfc?.addEventListener("click", closeUnlinkNfcModal);

confirmUnlinkNfc?.addEventListener("click", confirmUnlinkSelectedNfc);

/* =========================================================
   CLOSE MODAL OUTSIDE
========================================================= */

[addSukiModal, detailModal, deleteSukiModal, unlinkNfcModal].forEach(
  (modal) => {
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  },
);

/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  closeModal(addSukiModal);

  closeModal(detailModal);

  closeModal(deleteSukiModal);

  closeUnlinkNfcModal();
});

/* =========================================================
   INITIALIZE
========================================================= */

if (sukiJoined) {
  sukiJoined.value = new Date().toISOString().split("T")[0];
}

renderSukiList();
