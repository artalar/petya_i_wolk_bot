import { MenuItem } from './types.js';

export const PRICES = {
  SYRUP: 40,
  ALT_MILK: 60,
  THYME: 30,
  LEMON: 20
};

export const MENU: Record<string, MenuItem[]> = {
  black_coffee: [
    { id: 'espresso', name: 'Эспрессо', price: 150, category: 'black_coffee' }, // 42ml
    { id: 'americano', name: 'Американо', volumes: { '0.2': 180, '0.3': 200, '0.4': 260 }, category: 'black_coffee' },
    { id: 'filter', name: 'Фильтр кофе', volumes: { '0.2': 170, '0.3': 210, '0.4': 270 }, category: 'black_coffee' },
    { id: 'espresso_tonic', name: 'Эспрессо-тоник', volumes: { '0.3': 260 }, category: 'black_coffee' },
    { id: 'bumble', name: 'Бамбл', volumes: { '0.3': 290 }, category: 'black_coffee' },
  ],
  milk_coffee: [
    { id: 'cappuccino', name: 'Капучино', volumes: { '0.2': 200, '0.3': 240, '0.4': 280 }, category: 'milk_coffee' },
    { id: 'latte', name: 'Латте', volumes: { '0.3': 250, '0.4': 290 }, category: 'milk_coffee' },
    { id: 'flat_white', name: 'Флэт уайт', volumes: { '0.2': 230 }, category: 'milk_coffee' },
    { id: 'raf', name: 'Раф', volumes: { '0.3': 290 }, category: 'milk_coffee' },
  ],
  tea: [
    { id: 'tea_black', name: 'Чёрный', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
    { id: 'tea_sencha', name: 'Сенча', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
    { id: 'tea_oolong', name: 'Улун молочный', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
    { id: 'tea_melon', name: 'Дыня / карамель', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
    { id: 'tea_cherry', name: 'Вишневый', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
    { id: 'tea_mint', name: 'Мятный', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
    { id: 'tea_currant', name: 'Черная смородина', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
    { id: 'tea_mulled', name: 'Глинтвейн', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
    { id: 'tea_buckwheat', name: 'Гречишный', volumes: { '0.3': 180, '0.5': 250 }, category: 'tea' },
  ],
  alternative: [
    { id: 'v60', name: 'Воронка V60', volumes: { '0.3': 240 }, category: 'alternative' },
    { id: 'immersion', name: 'Иммерсионная воронка', volumes: { '0.3': 240 }, category: 'alternative' },
    { id: 'chemex', name: 'Кемекс', volumes: { '0.3': 240 }, category: 'alternative' },
    { id: 'hoop', name: 'Хуп', volumes: { '0.3': 240 }, category: 'alternative' },
    { id: 'aeropress', name: 'Аэропресс', volumes: { '0.2': 220 }, category: 'alternative' },
  ],
  special: [
    { id: 'mimosa', name: 'Мимоза', volumes: { '0.3': 300 }, category: 'special' },
    { id: 'creme_brunet', name: 'Крем-брюнет', volumes: { '0.3': 260 }, category: 'special' },
    { id: 'peanut_crunch', name: 'Арахисовый кранч', volumes: { '0.3': 300 }, category: 'special' },
  ],
  not_coffee: [
    { id: 'cocoa_shot', name: 'Какао-шот 60 мл', price: 190, category: 'not_coffee' },
    { id: 'cocoa', name: 'Какао', volumes: { '0.2': 200, '0.3': 230, '0.4': 280 }, category: 'not_coffee' },
    { id: 'hot_chocolate', name: 'Горячий шоколад', volumes: { '0.2': 230, '0.3': 290 }, category: 'not_coffee' },
    { id: 'matcha_latte', name: 'Матча-латте', volumes: { '0.3': 230, '0.4': 270 }, category: 'not_coffee' },
  ]
};

export const SYRUPS = [
  'Кокос', 'Двойная соленая карамель', 'Мята с эвкалиптом', 'Двойная карамель', 
  'Вишня', 'Ирландский крем', 'Красный апельсин', 'Лесной орех', 
  'Малина', 'Ваниль', 'Попкорн'
];

export const ALT_MILKS = [
  'Кокосовое', 'Фундучное', 'Банановое', 'Миндальное', 'Овсяное', 'Безлактозное'
];

