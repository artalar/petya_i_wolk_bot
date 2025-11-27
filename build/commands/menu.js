"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showMenu = showMenu;
const grammy_1 = require("grammy");
async function showMenu(ctx) {
    await ctx.replyWithPhoto(new grammy_1.InputFile("menu.jpeg"));
}
//# sourceMappingURL=menu.js.map