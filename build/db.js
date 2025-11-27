"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextOrderId = getNextOrderId;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.resolve(process.cwd(), 'db.json');
const DEFAULT_SETTINGS = {
    isBotActive: true,
    isOnlinePaymentActive: true,
    availableTimes: [5, 10, 15]
};
async function readDb() {
    let data = {
        lastResetDate: '',
        currentId: 0,
        settings: DEFAULT_SETTINGS
    };
    try {
        const fileContent = await promises_1.default.readFile(DB_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Merge with defaults to handle new fields in existing db
        data = { ...data, ...parsed };
        if (!data.settings) {
            data.settings = DEFAULT_SETTINGS;
        }
        else {
            // Ensure new fields are present in existing settings
            data.settings = { ...DEFAULT_SETTINGS, ...data.settings };
        }
    }
    catch (error) {
        // File doesn't exist or invalid, start fresh
    }
    return data;
}
async function writeDb(data) {
    await promises_1.default.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}
function getMoscowDateString() {
    const moscowTime = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Moscow' });
    return moscowTime.split(',')[0];
}
async function getNextOrderId() {
    const data = await readDb();
    const todayMoscow = getMoscowDateString();
    if (data.lastResetDate !== todayMoscow) {
        data.lastResetDate = todayMoscow;
        data.currentId = 1;
    }
    else {
        data.currentId += 1;
    }
    await writeDb(data);
    return data.currentId;
}
async function getSettings() {
    const data = await readDb();
    return data.settings;
}
async function updateSettings(settings) {
    const data = await readDb();
    data.settings = { ...data.settings, ...settings };
    await writeDb(data);
    return data.settings;
}
//# sourceMappingURL=db.js.map