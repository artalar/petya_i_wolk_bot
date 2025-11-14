import { Menu } from "@grammyjs/menu";
import { MyContext } from "../types/context";
import { logger } from "../logger";
import { createDrinkMenus } from "./drinks";

export const createMainMenu = (): Menu<MyContext> => {
  const log = logger.child({ action: "create_main_menu" });
  log.debug("Creating main menu");

  const drinkMenus = createDrinkMenus();

  const mainMenu = new Menu<MyContext>("main-menu")
    .text("Чёрный кофе", async (ctx) => {
      const log = logger.child({
        action: "category_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        category: "black",
      });
      log.info("Black coffee category selected");
      await ctx.menu.nav("black-coffee-menu");
    })
    .text("Молочный кофе", async (ctx) => {
      const log = logger.child({
        action: "category_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        category: "milk",
      });
      log.info("Milk coffee category selected");
      await ctx.menu.nav("milk-coffee-menu");
    })
    .row()
    .text("Авторское 0.1", async (ctx) => {
      const log = logger.child({
        action: "category_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        category: "signature",
      });
      log.info("Signature category selected");
      await ctx.menu.nav("signature-menu");
    })
    .text("Не кофе", async (ctx) => {
      const log = logger.child({
        action: "category_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        category: "non-coffee",
      });
      log.info("Non-coffee category selected");
      await ctx.menu.nav("non-coffee-menu");
    })
    .row()
    .text("Чай 0.3", async (ctx) => {
      const log = logger.child({
        action: "category_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        category: "tea",
      });
      log.info("Tea category selected");
      await ctx.menu.nav("tea-menu");
    });

  mainMenu.register(drinkMenus.black);
  mainMenu.register(drinkMenus.milk);
  mainMenu.register(drinkMenus.signature);
  mainMenu.register(drinkMenus.nonCoffee);
  mainMenu.register(drinkMenus.tea);

  log.debug("Main menu created successfully");
  return mainMenu;
};

