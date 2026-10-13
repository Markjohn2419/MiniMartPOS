const SETTINGS_KEY = "miniMartSettings";
const SETTINGS_VERSION = 1;

const defaultSettings = {
  version: SETTINGS_VERSION,
  storeName: "Mini Mart",
  address: "",
  contactNumber: "",
  receiptFooter: "Salamat, balik po!",
  timezone: "Asia/Manila",
  dateFormat: "short",
  lowStockThreshold: 10,
  blockOutOfStockSales: true,
  registerName: "REGISTER 01",
  logoDataUrl: "",
  currency: "PHP",
  theme: "light",
  sukiEnabled: true,
  sukiPesosPerPoint: 20,
  sukiPesoValue: 1,
  sukiMinPointsToRedeem: 10,
  sukiPointsExpiry: "none",
  sukiPointsExpiryDays: 90,
};

function cloneSettings(value) {
  return JSON.parse(JSON.stringify(value));
}

function deviceTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function normalizeTheme(theme, hasSavedSettings) {
  if (theme === "dark" || theme === "light") return theme;
  if (theme === "system") return deviceTheme();
  return hasSavedSettings ? defaultSettings.theme : deviceTheme();
}

function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      const initialSettings = {
        ...cloneSettings(defaultSettings),
        theme: deviceTheme(),
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
      return initialSettings;
    }

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return cloneSettings(defaultSettings);
    }

    const settings = {
      ...cloneSettings(defaultSettings),
      ...parsed,
      version: SETTINGS_VERSION,
    };
    const threshold = Number(settings.lowStockThreshold);
    settings.lowStockThreshold =
      Number.isInteger(threshold) && threshold >= 0
        ? threshold
        : defaultSettings.lowStockThreshold;
    settings.blockOutOfStockSales = settings.blockOutOfStockSales !== false;
    settings.sukiEnabled = settings.sukiEnabled !== false;
    const sukiPesosPerPoint = Number(settings.sukiPesosPerPoint);
    settings.sukiPesosPerPoint =
      Number.isFinite(sukiPesosPerPoint) && sukiPesosPerPoint > 0
        ? sukiPesosPerPoint
        : defaultSettings.sukiPesosPerPoint;
    const sukiPesoValue = Number(settings.sukiPesoValue);
    settings.sukiPesoValue =
      Number.isFinite(sukiPesoValue) && sukiPesoValue > 0
        ? sukiPesoValue
        : defaultSettings.sukiPesoValue;
    const sukiMinPoints = Number(settings.sukiMinPointsToRedeem);
    settings.sukiMinPointsToRedeem =
      Number.isInteger(sukiMinPoints) && sukiMinPoints >= 0
        ? sukiMinPoints
        : defaultSettings.sukiMinPointsToRedeem;
    settings.sukiPointsExpiry =
      settings.sukiPointsExpiry === "days" ? "days" : "none";
    const sukiExpiryDays = Number(settings.sukiPointsExpiryDays);
    settings.sukiPointsExpiryDays =
      Number.isInteger(sukiExpiryDays) && sukiExpiryDays > 0
        ? sukiExpiryDays
        : defaultSettings.sukiPointsExpiryDays;
    const theme = normalizeTheme(settings.theme, true);
    if (settings.theme !== theme) {
      settings.theme = theme;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
    return settings;
  } catch (error) {
    console.error("Failed to read settings:", error);
    return cloneSettings(defaultSettings);
  }
}

function saveSettings(changes) {
  const nextSettings = {
    ...getSettings(),
    ...changes,
    version: SETTINGS_VERSION,
  };

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(
      new CustomEvent("miniMartSettingsChanged", {
        detail: cloneSettings(nextSettings),
      }),
    );
    return { settings: nextSettings, error: null };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { settings: getSettings(), error };
  }
}

function formatStoreDate(date = new Date(), settings = getSettings()) {
  const options = {
    timeZone: settings.timezone,
    weekday: settings.dateFormat === "long" ? "long" : "short",
    month: settings.dateFormat === "numeric" ? "numeric" : "short",
    day: "numeric",
  };

  try {
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch (error) {
    console.error("Failed to format store date:", error);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: defaultSettings.timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  }
}

function isValidLogoDataUrl(value) {
  return (
    typeof value === "string" &&
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)
  );
}

function formatCurrency(value) {
  const amount = Number(value);
  return `₱${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function applyTheme(settings = getSettings()) {
  const theme = normalizeTheme(settings.theme, true);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = theme;
}

window.miniMartSettings = {
  SETTINGS_KEY,
  defaults: cloneSettings(defaultSettings),
  get: getSettings,
  save: saveSettings,
  formatDate: formatStoreDate,
  formatCurrency,
  applyTheme,
  isValidLogoDataUrl,
};
