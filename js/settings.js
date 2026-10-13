const storeInfoForm = document.getElementById("storeInfoForm");
const settingsStatus = document.getElementById("settingsStatus");
const storeLogoInput = document.getElementById("storeLogo");
const logoPreview = document.getElementById("logoPreview");
const maxLogoSize = 200 * 1024;
const appearanceForm = document.getElementById("appearanceForm");
const themeToggle = document.getElementById("themeToggle");
const inventoryRulesForm = document.getElementById("inventoryRulesForm");
const inventoryRulesStatus = document.getElementById("inventoryRulesStatus");
const lowStockThreshold = document.getElementById("lowStockThreshold");
const blockOutOfStockSales = document.getElementById("blockOutOfStockSales");

const fields = {
  storeName: document.getElementById("storeName"),
  address: document.getElementById("storeAddress"),
  contactNumber: document.getElementById("contactNumber"),
  receiptFooter: document.getElementById("receiptFooter"),
  timezone: document.getElementById("timezone"),
  dateFormat: document.getElementById("dateFormat"),
};

let logoDataUrl = "";
const currentSettings = window.miniMartSettings.get();

function showFieldError(fieldName, message) {
  const error = document.getElementById(`${fieldName}Error`);
  if (error) error.textContent = message;
  if (fields[fieldName]) fields[fieldName].setAttribute("aria-invalid", String(Boolean(message)));
}

function clearErrors() {
  Object.keys(fields).forEach((fieldName) => showFieldError(fieldName, ""));
  showFieldError("storeLogo", "");
}

function setFormValues(settings) {
  Object.entries(fields).forEach(([fieldName, field]) => {
    field.value = settings[fieldName] ?? "";
  });
  logoDataUrl = settings.logoDataUrl || "";
  if (logoDataUrl && window.miniMartSettings.isValidLogoDataUrl(logoDataUrl)) {
    logoPreview.src = logoDataUrl;
    logoPreview.hidden = false;
  }
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
function updateThemeToggle(theme) {
  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-checked", String(isDark));
  themeToggle.classList.toggle("is-on", isDark);
  themeToggle.querySelector(".theme-toggle-icon").textContent = isDark ? "☾" : "☀";
}

updateThemeToggle(window.miniMartSettings.get().theme);

storeLogoInput.addEventListener("change", () => {
  const [file] = storeLogoInput.files;
  showFieldError("storeLogo", "");
  if (!file) return;

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    showFieldError("storeLogo", "Use a PNG, JPG, or WebP image.");
    storeLogoInput.value = "";
    return;
  }
  if (file.size > maxLogoSize) {
    showFieldError("storeLogo", "Logo must be 200 KB or smaller.");
    storeLogoInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") {
      showFieldError("storeLogo", "Could not read that logo.");
      return;
    }
    logoDataUrl = reader.result;
    logoPreview.src = logoDataUrl;
    logoPreview.hidden = false;
  });
  reader.addEventListener("error", () => {
    showFieldError("storeLogo", "Could not read that logo.");
  });
  reader.readAsDataURL(file);
});

storeInfoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setStatus("");
  if (!validateForm()) return;

  const { error } = window.miniMartSettings.save({
    storeName: fields.storeName.value.trim(),
    address: fields.address.value.trim(),
    contactNumber: fields.contactNumber.value.trim(),
    receiptFooter: fields.receiptFooter.value.trim(),
    timezone: fields.timezone.value,
    dateFormat: fields.dateFormat.value,
    logoDataUrl,
  });

  if (error) {
    setStatus("Could not save settings.", true);
    return;
  }

  setStatus("Saved");
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
});

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
