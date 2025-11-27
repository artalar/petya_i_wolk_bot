"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_js_1 = require("./bot.js");
const logger_js_1 = require("./logger.js");
async function bootstrap() {
    try {
        await bot_js_1.bot.init();
        logger_js_1.logger.info(`Bot started as @${bot_js_1.bot.botInfo.username}`);
        await bot_js_1.bot.start();
    }
    catch (error) {
        logger_js_1.logger.error(error, "Error starting bot");
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map