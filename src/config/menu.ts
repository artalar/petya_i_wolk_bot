import { Drink, AlternativeMilk, Syrup, Timing, DrinkCategory } from "../types";

export const DRINKS: Record<DrinkCategory, Drink[]> = {
  black: [
    { id: "espresso", name: "Эспрессо 42 мл", category: "black", basePrice: 100 },
    { id: "americano", name: "Американо", category: "black", basePrice: 140 },
    { id: "espresso-tonic", name: "Эспрессо-тоник 0,3", category: "black", basePrice: 180 },
    { id: "bumble", name: "Бамбл 0,3", category: "black", basePrice: 180 },
    { id: "filter", name: "Фильтр", category: "black", basePrice: 160 },
  ],
  milk: [
    { id: "cappuccino", name: "Капучино", category: "milk", basePrice: 160 },
    { id: "latte", name: "Латте", category: "milk", basePrice: 180 },
    { id: "flat-white", name: "Флэт уайт", category: "milk", basePrice: 180 },
    { id: "raf", name: "Раф", category: "milk", basePrice: 200 },
  ],
  signature: [
    { id: "mimosa", name: "Мимоза", category: "signature", basePrice: 200 },
    { id: "peanut-crunch", name: "Арахисовый кранч", category: "signature", basePrice: 220 },
    { id: "creme-brulee", name: "Крем-брюле", category: "signature", basePrice: 220 },
  ],
  "non-coffee": [
    { id: "cocoa-no-sugar", name: "Какао без сахара", category: "non-coffee", basePrice: 160 },
    { id: "cocoa-sugar", name: "Какао с сахаром", category: "non-coffee", basePrice: 160 },
    { id: "matcha-latte", name: "Матча-латте", category: "non-coffee", basePrice: 200 },
    { id: "hot-chocolate", name: "Горячий шоколад", category: "non-coffee", basePrice: 180 },
  ],
  tea: [
    { id: "tea-black", name: "Черный", category: "tea", basePrice: 140 },
    { id: "tea-mint", name: "Мятный", category: "tea", basePrice: 140 },
    { id: "tea-milk-oolong", name: "Улун молочный", category: "tea", basePrice: 160 },
    { id: "tea-melon-caramel", name: "Дыня/карамель", category: "tea", basePrice: 160 },
    { id: "tea-sencha", name: "Сенча", category: "tea", basePrice: 160 },
    { id: "tea-cherry", name: "Вишневый", category: "tea", basePrice: 160 },
    { id: "tea-blackcurrant", name: "Черная смородина", category: "tea", basePrice: 160 },
    { id: "tea-mulled-wine", name: "Глинтвейн", category: "tea", basePrice: 180 },
    { id: "tea-buckwheat", name: "Гречишный", category: "tea", basePrice: 160 },
  ],
};

export const ALTERNATIVE_MILKS: AlternativeMilk[] = [
  { id: "coconut", name: "Кокосовое", price: 0 },
  { id: "hazelnut", name: "Фундучное", price: 0 },
  { id: "banana", name: "Банановое", price: 0 },
  { id: "almond", name: "Миндальное", price: 0 },
  { id: "oat", name: "Овсяное", price: 0 },
  { id: "lactose-free", name: "Безлактозное", price: 0 },
];

export const SYRUPS: Syrup[] = [
  { id: "coconut", name: "Кокос", price: 40 },
  { id: "double-salted-caramel", name: "Двойная соленая карамель", price: 40 },
  { id: "mint-eucalyptus", name: "Мята с эвкалиптом", price: 40 },
  { id: "double-caramel", name: "Двойная карамель", price: 40 },
  { id: "cherry", name: "Вишня", price: 40 },
  { id: "irish-cream", name: "Ирландский крем", price: 40 },
  { id: "red-orange", name: "Красный апельсин", price: 40 },
  { id: "hazelnut", name: "Лесной орех", price: 40 },
  { id: "raspberry", name: "Малина", price: 40 },
  { id: "vanilla", name: "Ваниль", price: 40 },
  { id: "popcorn", name: "Попкорн", price: 40 },
];

export const TIMINGS: Timing[] = [
  { minutes: 5, label: "Буду через 5 минут" },
  { minutes: 10, label: "Буду через 10 минут" },
  { minutes: 15, label: "Буду через 15 минут" },
];

export const VOLUMES: Array<{ value: "0.2" | "0.3" | "0.4"; label: string }> = [
  { value: "0.2", label: "0,2 л" },
  { value: "0.3", label: "0,3 л" },
  { value: "0.4", label: "0,4 л" },
];

export const getDrinkById = (id: string): Drink | undefined => {
  for (const category of Object.values(DRINKS)) {
    const drink = category.find((d) => d.id === id);
    if (drink) return drink;
  }
  return undefined;
};

export const getAlternativeMilkById = (id: string): AlternativeMilk | undefined => {
  return ALTERNATIVE_MILKS.find((m) => m.id === id);
};

export const getSyrupById = (id: string): Syrup | undefined => {
  return SYRUPS.find((s) => s.id === id);
};

