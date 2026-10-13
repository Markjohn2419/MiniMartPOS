const PRODUCTS_KEY = "miniMartProducts";
const SALES_KEY = "miniMartSales";
const CATEGORIES_KEY = "miniMartCategories";
const CATEGORY_ICONS_KEY = "miniMartCategoryIcons";
const DELETED_PRODUCTS_KEY = "miniMartDeletedProducts";
const CATEGORY_UNITS_KEY = "miniMartCategoryUnits";

const UNIT_RULES = {
  piece: { label: "piece", shortLabel: "pc", decimals: 0 },
  kg: { label: "kilogram", shortLabel: "kg", decimals: 3 },
  g: { label: "gram", shortLabel: "g", decimals: 0 },
  L: { label: "liter", shortLabel: "L", decimals: 3 },
  mL: { label: "milliliter", shortLabel: "mL", decimals: 0 },
  pack: { label: "pack", shortLabel: "pack", decimals: 0 },
};

const seedProducts = [
  {
    name: "Coke 1.5L",
    category: "Beverages",
    costPrice: 52,
    price: 65,
    stock: 23,
    icon: "▣",
    accent: "var(--blue)",
  },
  {
    name: "Sprite 1.5L",
    category: "Beverages",
    costPrice: 52,
    price: 65,
    stock: 18,
    icon: "▣",
    accent: "var(--blue)",
  },
  {
    name: "Nature's Spring 500ml",
    category: "Beverages",
    costPrice: 8,
    price: 12,
    stock: 35,
    icon: "▣",
    accent: "var(--blue)",
  },
  {
    name: "Nestea Lemon 1L",
    category: "Beverages",
    costPrice: 45,
    price: 58,
    stock: 16,
    icon: "▣",
    accent: "var(--blue)",
  },
  {
    name: "Lucky Me Pancit Canton",
    category: "Instant Food",
    costPrice: 11,
    price: 15,
    stock: 50,
    icon: "⌁",
    accent: "var(--red)",
  },
  {
    name: "Lucky Me Chicken Noodles",
    category: "Instant Food",
    costPrice: 10,
    price: 14,
    stock: 42,
    icon: "⌁",
    accent: "var(--red)",
  },
  {
    name: "Payless Xtra Big",
    category: "Instant Food",
    costPrice: 13,
    price: 18,
    stock: 28,
    icon: "⌁",
    accent: "var(--red)",
  },
  {
    name: "Nissin Cup Noodles",
    category: "Instant Food",
    costPrice: 24,
    price: 32,
    stock: 20,
    icon: "⌁",
    accent: "var(--red)",
  },
  {
    name: "Piattos 40g",
    category: "Snacks",
    costPrice: 16,
    price: 22,
    stock: 29,
    icon: "◉",
    accent: "var(--gold)",
  },
  {
    name: "Chippy Barbecue 110g",
    category: "Snacks",
    costPrice: 13,
    price: 18,
    stock: 34,
    icon: "◉",
    accent: "var(--gold)",
  },
  {
    name: "Choc Nut 24g",
    category: "Snacks",
    costPrice: 7,
    price: 10,
    stock: 45,
    icon: "◉",
    accent: "var(--gold)",
  },
  {
    name: "Nova Country 78g",
    category: "Snacks",
    costPrice: 21,
    price: 28,
    stock: 25,
    icon: "◉",
    accent: "var(--gold)",
  },
  {
    name: "Bear Brand 33g",
    category: "Dairy",
    costPrice: 10,
    price: 14,
    stock: 40,
    icon: "♙",
    accent: "var(--green)",
  },
  {
    name: "Alaska Fortified Milk 1L",
    category: "Dairy",
    costPrice: 78,
    price: 92,
    stock: 14,
    icon: "♙",
    accent: "var(--green)",
  },
  {
    name: "Selecta Ice Cream Cup",
    category: "Dairy",
    costPrice: 26,
    price: 35,
    stock: 22,
    icon: "♙",
    accent: "var(--green)",
  },
  {
    name: "Yakult 5-Pack",
    category: "Dairy",
    costPrice: 38,
    price: 48,
    stock: 19,
    icon: "♙",
    accent: "var(--green)",
  },
  {
    name: "Skyflakes Crackers",
    category: "Snacks",
    costPrice: 6,
    price: 8,
    stock: 60,
    icon: "◉",
    accent: "var(--gold)",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isKnownCost(value) {
  if (value === null || value === undefined || value === "") return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0;
}

function normalizeUnit(value) {
  return Object.prototype.hasOwnProperty.call(UNIT_RULES, value) ? value : "piece";
}

function unitDecimals(unit) {
  return UNIT_RULES[normalizeUnit(unit)].decimals;
}

function roundQuantity(value, unit = "piece") {
  const decimals = unitDecimals(unit);
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function formatQuantity(value, unit = "piece") {
  const normalizedUnit = normalizeUnit(unit);
  const amount = roundQuantity(value, normalizedUnit);
  const formatted = amount
    .toFixed(unitDecimals(normalizedUnit))
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  return `${formatted} ${UNIT_RULES[normalizedUnit].shortLabel}`;
}

function read(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : clone(fallback);
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(
    new CustomEvent("miniMartDatabaseChanged", { detail: { key } }),
  );
}

function normalizeProducts(products) {
  const existingNames = new Set(products.map((product) => product.name));
  const missingProducts = seedProducts.filter(
    (product) => !existingNames.has(product.name),
  );
  return [...products, ...missingProducts].map((product) => {
    const seed =
      seedProducts.find((entry) => entry.name === product.name) || {};
    return {
      ...seed,
      ...product,
      category: product.category || seed.category || "Snacks",
      icon: product.icon || seed.icon || "◇",
      accent: product.accent || seed.accent || "var(--gold)",
      unit: normalizeUnit(product.unit || seed.unit),
      costPrice: isKnownCost(product.costPrice)
        ? Number(product.costPrice)
        : isKnownCost(seed.costPrice)
          ? Number(seed.costPrice)
          : null,
    };
  });
}

window.miniMartDB = {
  isKnownCost,
  units: () => UNIT_RULES,
  normalizeUnit,
  unitDecimals,
  roundQuantity,
  roundMoney,
  formatQuantity,
  categories() {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    const categories = saved
      ? JSON.parse(saved)
      : [...new Set(seedProducts.map((product) => product.category))];
    if (!saved)
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    return categories;
  },
  saveCategories(categories) {
    write(CATEGORIES_KEY, [...new Set(categories)]);
  },
  categoryDefaultUnit(category) {
    const units = read(CATEGORY_UNITS_KEY, {});
    return normalizeUnit(units[category]);
  },
  saveCategoryDefaultUnit(category, unit) {
    const units = read(CATEGORY_UNITS_KEY, {});
    units[category] = normalizeUnit(unit);
    write(CATEGORY_UNITS_KEY, units);
  },
  renameCategory(oldName, newName) {
    const categories = this.categories();
    const products = this.products().map((product) =>
      product.category === oldName ? { ...product, category: newName } : product,
    );
    const renamed = categories.map((category) =>
      category === oldName ? newName : category,
    );
    const icons = read(CATEGORY_ICONS_KEY, {});
    const units = read(CATEGORY_UNITS_KEY, {});
    if (icons[oldName] && !icons[newName]) icons[newName] = icons[oldName];
    delete icons[oldName];
    if (units[oldName] !== undefined && units[newName] === undefined)
      units[newName] = units[oldName];
    delete units[oldName];
    write(CATEGORIES_KEY, renamed);
    write(PRODUCTS_KEY, products);
    write(CATEGORY_ICONS_KEY, icons);
    write(CATEGORY_UNITS_KEY, units);
  },
  moveCategory(category, direction) {
    const categories = this.categories();
    const index = categories.indexOf(category);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= categories.length) return;
    [categories[index], categories[nextIndex]] = [
      categories[nextIndex],
      categories[index],
    ];
    write(CATEGORIES_KEY, categories);
  },
  deleteCategory(category, moveTo = "") {
    const products = this.products();
    const hasProducts = products.some((product) => product.category === category);
    if (hasProducts && !moveTo) {
      return { error: new Error("A destination category is required.") };
    }
    if (hasProducts && !this.categories().includes(moveTo)) {
      return { error: new Error("The destination category does not exist.") };
    }
    if (hasProducts) {
      this.saveProducts(
        products.map((product) =>
          product.category === category
            ? { ...product, category: moveTo }
            : product,
        ),
      );
    }
    const icons = read(CATEGORY_ICONS_KEY, {});
    const units = read(CATEGORY_UNITS_KEY, {});
    delete icons[category];
    delete units[category];
    write(CATEGORIES_KEY, this.categories().filter((entry) => entry !== category));
    write(CATEGORY_ICONS_KEY, icons);
    write(CATEGORY_UNITS_KEY, units);
    return { error: null };
  },
  categoryIcon(category) {
    const defaults = {
      Beverages: "Icons/beverages.png",
      "Instant Food": "Icons/instant-food.png",
      Snacks: "Icons/snacks.png",
      Dairy: "Icons/dairy.png",
      Bakery: "Icons/bread.png",
    };
    const saved = read(CATEGORY_ICONS_KEY, {});
    return saved[category] || defaults[category] || "Icons/bread.png";
  },
  saveCategoryIcon(category, iconPath) {
    const icons = read(CATEGORY_ICONS_KEY, {});
    icons[category] = iconPath;
    write(CATEGORY_ICONS_KEY, icons);
  },
  products() {
    const saved = localStorage.getItem(PRODUCTS_KEY);
    if (!saved) write(PRODUCTS_KEY, seedProducts);
    const deletedNames = new Set(read(DELETED_PRODUCTS_KEY, []));
    const products = normalizeProducts(read(PRODUCTS_KEY, seedProducts)).filter(
      (product) => !deletedNames.has(product.name),
    );
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return products;
  },
  saveProducts(products) {
    const names = new Set(products.map((product) => product.name));
    const deletedNames = new Set(read(DELETED_PRODUCTS_KEY, []));
    seedProducts.forEach((product) => {
      if (names.has(product.name)) deletedNames.delete(product.name);
      else deletedNames.add(product.name);
    });
    write(DELETED_PRODUCTS_KEY, [...deletedNames]);
    write(PRODUCTS_KEY, products);
  },
  sales() {
    return read(SALES_KEY, []);
  },
  recordSale(items, total) {
    const sales = this.sales();
    sales.push({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      items: clone(items),
      total,
    });
    write(SALES_KEY, sales);
  },
};
