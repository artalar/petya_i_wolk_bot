import { Context, SessionFlavor } from "grammy";
import { ConversationFlavor } from "@grammyjs/conversations";
import { SessionData } from "../types";

export interface Session extends SessionData {}

type BaseContext = Context & SessionFlavor<Session>;

export type MyContext = BaseContext & ConversationFlavor<BaseContext>;

