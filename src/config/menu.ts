import { Drink, AlternativeMilk, Syrup, Timing, DrinkCategory } from "../types";

export const DRINKS: Record<DrinkCategory, Drink[]> = {
  black: [
    { id: "espresso", name: "Эспрессо 42 мл", category: "black", prices: { "0.042": 150 } },
    { id: "americano", name: "Американо", category: "black", prices: { "0.2": 180, "0.3": 200, "0.4": 260 } },
    { id: "espresso-tonic", name: "Эспрессо-тоник 0,3", category: "black", prices: { "0.3": 260 } },
    { id: "bumble", name: "Бамбл 0,3", category: "black", prices: { "0.3": 290 } },
    { id: "filter", name: "Фильтр", category: "black", prices: { "0.2": 170, "0.3": 210, "0.4": 270 } },
  ],
  alternative: [
    { id: "v60", name: "Воронка V60", category: "alternative", prices: { "0.3": 240 } },
    { id: "immersion", name: "Иммерсионная воронка", category: "alternative", prices: { "0.3": 240 } },
    { id: "chemex", name: "Кемекс", category: "alternative", prices: { "0.3": 240 } },
    { id: "hoop", name: "Хуп", category: "alternative", prices: { "0.3": 240 } },
    { id: "aeropress", name: "Аэропресс", category: "alternative", prices: { "0.2": 220 } },
  ],
  milk: [
    { id: "cappuccino", name: "Капучино", category: "milk", prices: { "0.2": 200, "0.3": 240, "0.4": 280 } },
    { id: "latte", name: "Латте", category: "milk", prices: { "0.3": 250, "0.4": 290 } },
    { id: "flat-white", name: "Флэт уайт", category: "milk", prices: { "0.2": 230 } },
    { id: "raf", name: "Раф", category: "milk", prices: { "0.3": 290 } },
  ],
  signature: [
    { id: "mimosa", name: "Мимоза", category: "signature", prices: { "0.3": 300 } },
    { id: "creme-brulee", name: "Крем-брюле", category: "signature", prices: { "0.3": 260 } },
    { id: "peanut-crunch", name: "Арахисовый кранч", category: "signature", prices: { "0.3": 300 } },
  ],
  "non-coffee": [
    { id: "cocoa-shot", name: "Какао-шот 60 мл", category: "non-coffee", prices: { "0.06": 190 } },
    { id: "cocoa", name: "Какао", category: "non-coffee", prices: { "0.2": 200, "0.3": 230, "0.4": 280 } },
    { id: "hot-chocolate", name: "Горячий шоколад", category: "non-coffee", prices: { "0.2": 230, "0.3": 280 } },
    { id: "matcha-latte", name: "Матча-латте", category: "non-coffee", prices: { "0.3": 230, "0.4": 270 } },
  ],
  tea: [
    { id: "tea-black", name: "Черный", category: "tea", prices: { "0.3": 180 } },
    { id: "tea-mint", name: "Мятный", category: "tea", prices: { "0.3": 180 } },
    { id: "tea-milk-oolong", name: "Улун молочный", category: "tea", prices: { "0.3": 180 } },
    { id: "tea-melon-caramel", name: "Дыня/карамель", category: "tea", prices: { "0.3": 180 } },
    { id: "tea-sencha", name: "Сенча", category: "tea", prices: { "0.3": 180 } },
    { id: "tea-cherry", name: "Вишневый", category: "tea", prices: { "0.3": 180 } },
    { id: "tea-blackcurrant", name: "Черная смородина", category: "tea", prices: { "0.3": 180 } },
    { id: "tea-mulled-wine", name: "Глинтвейн", category: "tea", prices: { "0.3": 180 } },
    { id: "tea-buckwheat", name: "Гречишный", category: "tea", prices: { "0.3": 180 } },
  ],
};

export const ALTERNATIVE_MILKS: AlternativeMilk[] = [
  { id: "coconut", name: "Кокосовое", price: 60 },
  { id: "hazelnut", name: "Фундучное", price: 60 },
  { id: "banana", name: "Банановое", price: 60 },
  { id: "almond", name: "Миндальное", price: 60 },
  { id: "oat", name: "Овсяное", price: 60 },
  { id: "lactose-free", name: "Безлактозное", price: 60 },
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

export const VOLUMES: Array<{ value: "0.042" | "0.06" | "0.2" | "0.3" | "0.4"; label: string }> = [
  { value: "0.042", label: "42 мл" },
  { value: "0.06", label: "60 мл" },
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

