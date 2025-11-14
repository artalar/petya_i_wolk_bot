import { Menu } from "@grammyjs/menu";
import { MyContext } from "../types/context";
import { DRINKS } from "../config/menu";
import { Drink, DrinkCategory } from "../types";
import { logger } from "../logger";

const createDrinkSelectionHandler = (drink: Drink) => {
  return async (ctx: MyContext) => {
    const log = logger.child({
      action: "drink_selected",
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      drinkId: drink.id,
      category: drink.category,
    });
    log.info("Drink selected");

    if (!ctx.from || !ctx.chat) {
      log.warn("Missing user or chat information");
      await ctx.reply("Ошибка: не удалось определить пользователя");
      return;
    }

    if (!ctx.session.currentOrder) {
      ctx.session.currentOrder = {};
    }

    ctx.session.currentOrder.drink = drink;

    log.debug({ drinkId: drink.id }, "Drink saved to session");

    log.info("Attempting to enter order conversation");
    try {
      await ctx.conversation.enter("order-conversation");
      log.info("Successfully entered order conversation");
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Failed to enter order conversation"
      );
      await ctx.reply("Ошибка при запуске диалога заказа. Пожалуйста, попробуйте еще раз.");
    }
  };
};

const createCategoryMenu = (
  menuId: string,
  category: DrinkCategory
): Menu<MyContext> => {
  const menu = new Menu<MyContext>(menuId)
    .text("← Назад", (ctx) => ctx.menu.back())
    .row();

  DRINKS[category].forEach((drink) => {
    menu.text(drink.name, createDrinkSelectionHandler(drink));
    menu.row();
  });

  return menu;
};

export const createDrinkMenus = () => {
  const log = logger.child({ action: "create_drink_menus" });
  log.debug("Creating drink menus");

  const blackMenu = createCategoryMenu("black-coffee-menu", "black");
  const alternativeMenu = createCategoryMenu("alternative-menu", "alternative");
  const milkMenu = createCategoryMenu("milk-coffee-menu", "milk");
  const signatureMenu = createCategoryMenu("signature-menu", "signature");
  const nonCoffeeMenu = createCategoryMenu("non-coffee-menu", "non-coffee");
  const teaMenu = createCategoryMenu("tea-menu", "tea");

  log.debug("Drink menus created successfully");

  return {
    black: blackMenu,
    alternative: alternativeMenu,
    milk: milkMenu,
    signature: signatureMenu,
    nonCoffee: nonCoffeeMenu,
    tea: teaMenu,
  };
};
