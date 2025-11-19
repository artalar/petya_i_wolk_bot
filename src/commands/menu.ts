import { InputFile } from 'grammy';
import { Context } from '../context.js';

export async function showMenu(ctx: Context) {
  await ctx.replyWithPhoto(new InputFile("menu.jpeg"));
}

