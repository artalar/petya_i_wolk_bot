import { Menu } from "@grammyjs/menu";
import { MyContext } from "../types/context";
import { DRINKS } from "../config/menu";
import { logger } from "../logger";

export const createDrinkMenus = () => {
  const log = logger.child({ action: "create_drink_menus" });
  log.debug("Creating drink menus");

  const blackMenu = new Menu<MyContext>("black-coffee-menu")
    .text("← Назад", (ctx) => ctx.menu.back())
    .row();

  DRINKS.black.forEach((drink) => {
    blackMenu.text(drink.name, async (ctx) => {
      const log = logger.child({
        action: "drink_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        drinkId: drink.id,
        category: "black",
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
      ctx.session.currentOrder.userId = ctx.from.id;
      ctx.session.currentOrder.chatId = ctx.chat.id;

      log.debug({ drinkId: drink.id }, "Drink saved to session");

      await ctx.conversation.enter("order-conversation");
    });
    blackMenu.row();
  });

  const milkMenu = new Menu<MyContext>("milk-coffee-menu")
    .text("← Назад", (ctx) => ctx.menu.back())
    .row();

  DRINKS.milk.forEach((drink) => {
    milkMenu.text(drink.name, async (ctx) => {
      const log = logger.child({
        action: "drink_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        drinkId: drink.id,
        category: "milk",
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
      ctx.session.currentOrder.userId = ctx.from.id;
      ctx.session.currentOrder.chatId = ctx.chat.id;

      log.debug({ drinkId: drink.id }, "Drink saved to session");

      await ctx.conversation.enter("order-conversation");
    });
    milkMenu.row();
  });

  const signatureMenu = new Menu<MyContext>("signature-menu")
    .text("← Назад", (ctx) => ctx.menu.back())
    .row();

  DRINKS.signature.forEach((drink) => {
    signatureMenu.text(drink.name, async (ctx) => {
      const log = logger.child({
        action: "drink_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        drinkId: drink.id,
        category: "signature",
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
      ctx.session.currentOrder.userId = ctx.from.id;
      ctx.session.currentOrder.chatId = ctx.chat.id;

      log.debug({ drinkId: drink.id }, "Drink saved to session");

      await ctx.conversation.enter("order-conversation");
    });
    signatureMenu.row();
  });

  const nonCoffeeMenu = new Menu<MyContext>("non-coffee-menu")
    .text("← Назад", (ctx) => ctx.menu.back())
    .row();

  DRINKS["non-coffee"].forEach((drink) => {
    nonCoffeeMenu.text(drink.name, async (ctx) => {
      const log = logger.child({
        action: "drink_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        drinkId: drink.id,
        category: "non-coffee",
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
      ctx.session.currentOrder.userId = ctx.from.id;
      ctx.session.currentOrder.chatId = ctx.chat.id;

      log.debug({ drinkId: drink.id }, "Drink saved to session");

      await ctx.conversation.enter("order-conversation");
    });
    nonCoffeeMenu.row();
  });

  const teaMenu = new Menu<MyContext>("tea-menu")
    .text("← Назад", (ctx) => ctx.menu.back())
    .row();

  DRINKS.tea.forEach((drink) => {
    teaMenu.text(drink.name, async (ctx) => {
      const log = logger.child({
        action: "drink_selected",
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        drinkId: drink.id,
        category: "tea",
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
      ctx.session.currentOrder.userId = ctx.from.id;
      ctx.session.currentOrder.chatId = ctx.chat.id;

      log.debug({ drinkId: drink.id }, "Drink saved to session");

      await ctx.conversation.enter("order-conversation");
    });
    teaMenu.row();
  });

  log.debug("Drink menus created successfully");

  return {
    black: blackMenu,
    milk: milkMenu,
    signature: signatureMenu,
    nonCoffee: nonCoffeeMenu,
    tea: teaMenu,
  };
};

