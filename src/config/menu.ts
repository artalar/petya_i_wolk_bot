import { Drink, AlternativeMilk, Syrup, Timing, DrinkCategory } from "../types";

export const DRINKS: Record<DrinkCategory, Drink[]> = {
  black: [
    { id: "espresso", name: "Эспрессо 42 мл", category: "black", prices: { "0.2": 150 } },
    { id: "americano", name: "Американо", category: "black", prices: { "0.2": 180, "0.3": 200, "0.4": 260 } },
    { id: "filter", name: "Фильтр кофе", category: "black", prices: { "0.2": 170, "0.3": 210, "0.4": 270 } },
    { id: "espresso-tonic", name: "Эспрессо-тоник", category: "black", prices: { "0.3": 260 } },
    { id: "bumble", name: "Бамбл", category: "black", prices: { "0.3": 290 } },
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
    { id: "latte", name: "Латте", category: "milk", prices: { "0.3": 260, "0.4": 290 } },
    { id: "flat-white", name: "Флэт уайт", category: "milk", prices: { "0.2": 230 } },
    { id: "raf", name: "Раф", category: "milk", prices: { "0.3": 290 } },
  ],
  signature: [
    { id: "mimosa", name: "Мимоза", category: "signature", prices: { "0.3": 300 } },
    { id: "creme-brulee", name: "Крем-брюле", category: "signature", prices: { "0.3": 260 } },
    { id: "peanut-crunch", name: "Арахисовый кранч", category: "signature", prices: { "0.3": 300 } },
  ],
  "non-coffee": [
    { id: "cocoa-shot", name: "Какао-шот 60 мл", category: "non-coffee", prices: { "0.2": 190 } },
    { id: "cocoa", name: "Какао", category: "non-coffee", prices: { "0.2": 200, "0.3": 230, "0.4": 280 } },
    { id: "hot-chocolate", name: "Горячий шоколад", category: "non-coffee", prices: { "0.2": 230, "0.3": 280 } },
    { id: "matcha-latte", name: "Матча-латте", category: "non-coffee", prices: { "0.3": 230, "0.4": 270 } },
  ],
  tea: [
    { id: "tea-black", name: "Чёрный", category: "tea", prices: {} },
    { id: "tea-sencha", name: "Сенча", category: "tea", prices: {} },
    { id: "tea-milk-oolong", name: "Улун молочный", category: "tea", prices: {} },
    { id: "tea-melon-caramel", name: "Дыня / карамель", category: "tea", prices: {} },
    { id: "tea-cherry", name: "Вишневый", category: "tea", prices: { "0.2": 180, "0.3": 250 } },
    { id: "tea-mint", name: "Мятный", category: "tea", prices: {} },
    { id: "tea-blackcurrant", name: "Черная смородина", category: "tea", prices: {} },
    { id: "tea-mulled-wine", name: "Глинтвейн", category: "tea", prices: {} },
    { id: "tea-buckwheat", name: "Гречишный", category: "tea", prices: {} },
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
  { id: "syrup", name: "Сироп", price: 40 },
  { id: "thyme", name: "Чабрец", price: 30 },
  { id: "lemon", name: "Лимон", price: 20 },
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

