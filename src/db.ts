import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'db.json');

interface BotSettings {
  isBotActive: boolean;
  isOnlinePaymentActive: boolean;
  availableTimes: number[];
}

interface DBData {
  lastResetDate: string;
  currentId: number;
  settings: BotSettings;
}

const DEFAULT_SETTINGS: BotSettings = {
  isBotActive: true,
  isOnlinePaymentActive: true,
  availableTimes: [5, 10, 15]
};

async function readDb(): Promise<DBData> {
  let data: DBData = { 
    lastResetDate: '', 
    currentId: 0,
    settings: DEFAULT_SETTINGS
  };

  try {
    const fileContent = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    // Merge with defaults to handle new fields in existing db
    data = { ...data, ...parsed };
    if (!data.settings) {
        data.settings = DEFAULT_SETTINGS;
    } else {
        // Ensure new fields are present in existing settings
        data.settings = { ...DEFAULT_SETTINGS, ...data.settings };
    }
  } catch (error) {
    // File doesn't exist or invalid, start fresh
  }
  return data;
}

async function writeDb(data: DBData): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

function getMoscowDateString(): string {
  const moscowTime = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Moscow' });
  return moscowTime.split(',')[0];
}

export async function getNextOrderId(): Promise<number> {
  const data = await readDb();

  const todayMoscow = getMoscowDateString();

  if (data.lastResetDate !== todayMoscow) {
    data.lastResetDate = todayMoscow;
    data.currentId = 1;
  } else {
    data.currentId += 1;
  }

  await writeDb(data);
  return data.currentId;
}

export async function getSettings(): Promise<BotSettings> {
    const data = await readDb();
    return data.settings;
}

export async function updateSettings(settings: Partial<BotSettings>): Promise<BotSettings> {
    const data = await readDb();
    data.settings = { ...data.settings, ...settings };
    await writeDb(data);
    return data.settings;
}
