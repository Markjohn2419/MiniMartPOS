const settingsApi = window.miniMartSettings;
const mobileMenuButton = document.querySelector(".mobile-menu-button");
const mainNavigation = document.getElementById("mainNavigation");
const logoutButton = document.getElementById("logoutButton");
const mobileLogoutButton = document.getElementById("mobileLogoutButton");
const settings = settingsApi ? settingsApi.get() : {};

settingsApi?.applyTheme(settings);

function applyStoreLogo(nextSettings) {
  const logoIsValid =
    nextSettings?.logoDataUrl &&
    settingsApi?.isValidLogoDataUrl(nextSettings.logoDataUrl);
  document.querySelectorAll(".brand-mark img").forEach((image) => {
    if (logoIsValid) {
      image.src = nextSettings.logoDataUrl;
      image.classList.add("custom-store-logo");
    } else {
      image.src = "Icons/grocery-store.png";
      image.classList.remove("custom-store-logo");
    }
  });
}

document.querySelectorAll(".suki-link").forEach((link) => {
  link.hidden = settings.sukiEnabled === false;
});

document.querySelectorAll(".date").forEach((element) => {
  element.textContent = settingsApi
    ? settingsApi.formatDate(new Date(), settings)
    : new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
});

document.querySelectorAll(".brand h1").forEach((element) => {
  element.textContent = settings.storeName || "Mini Mart";
});
document.querySelectorAll(".brand .eyebrow").forEach((element) => {
  element.textContent = settings.registerName || "REGISTER 01";
});
applyStoreLogo(settings);
window.addEventListener("miniMartSettingsChanged", (event) => {
  const nextSettings = event.detail || settingsApi?.get();
  settingsApi?.applyTheme(nextSettings);
  applyStoreLogo(nextSettings);
});
window.addEventListener("storage", (event) => {
  if (event.key === settingsApi?.SETTINGS_KEY) {
    applyStoreLogo(settingsApi.get());
  }
});

if (mobileMenuButton && mainNavigation) {
  mobileMenuButton.addEventListener("click", () => {
    const isOpen = mainNavigation.classList.toggle("is-open");
    mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
  });

  mainNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      mainNavigation.classList.remove("is-open");
      mobileMenuButton.setAttribute("aria-expanded", "false");
    }
  });
}

if (logoutButton || mobileLogoutButton) {
  const signOut = async (button) => {
    button.disabled = true;
    try {
      if (window.supabaseClient) await window.supabaseClient.auth.signOut();
    } finally {
      window.location.replace("login.html");
    }
  };
  logoutButton?.addEventListener("click", () => signOut(logoutButton));
  mobileLogoutButton?.addEventListener("click", () =>
    signOut(mobileLogoutButton),
  );
}
