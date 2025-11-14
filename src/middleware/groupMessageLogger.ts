import { MiddlewareFn } from "grammy";
import { MyContext } from "../types/context";
import { logger } from "../logger";

export const groupMessageLogger: MiddlewareFn<MyContext> = async (
  ctx,
  next
) => {
  if (!ctx.message || !ctx.chat) {
    await next();
    return;
  }

  const chatType = ctx.chat.type;

  if (chatType === "group" || chatType === "supergroup") {
    const log = logger.child({
      action: "group_message_received",
      chatId: ctx.chat?.id,
      chatType: ctx.chat?.type,
      chatTitle:
        ctx.chat?.type === "group" || ctx.chat?.type === "supergroup"
          ? ctx.chat.title
          : undefined,
    });

    const messageData: Record<string, unknown> = {
      messageId: ctx.message.message_id,
      date: new Date(ctx.message.date * 1000).toISOString(),
      from: ctx.from
        ? {
            id: ctx.from.id,
            isBot: ctx.from.is_bot,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
            username: ctx.from.username,
            languageCode: ctx.from.language_code,
          }
        : undefined,
      chat: {
        id: ctx.chat.id,
        type: ctx.chat.type,
        title:
          ctx.chat.type === "group" || ctx.chat.type === "supergroup"
            ? ctx.chat.title
            : undefined,
        username: "username" in ctx.chat ? ctx.chat.username : undefined,
      },
      text: ctx.message.text,
      caption: ctx.message.caption,
      messageThreadId: ctx.message.message_thread_id,
      replyToMessage: ctx.message.reply_to_message
        ? {
            messageId: ctx.message.reply_to_message.message_id,
            from: ctx.message.reply_to_message.from
              ? {
                  id: ctx.message.reply_to_message.from.id,
                  isBot: ctx.message.reply_to_message.from.is_bot,
                  firstName: ctx.message.reply_to_message.from.first_name,
                  username: ctx.message.reply_to_message.from.username,
                }
              : undefined,
            text: ctx.message.reply_to_message.text,
            date: new Date(
              ctx.message.reply_to_message.date * 1000
            ).toISOString(),
          }
        : undefined,
      entities: ctx.message.entities?.map((e) => ({
        type: e.type,
        offset: e.offset,
        length: e.length,
        url: "url" in e ? e.url : undefined,
        user: "user" in e ? e.user : undefined,
        language: "language" in e ? e.language : undefined,
      })),
      captionEntities: ctx.message.caption_entities?.map((e) => ({
        type: e.type,
        offset: e.offset,
        length: e.length,
        url: "url" in e ? e.url : undefined,
      })),
      forwardFrom: (
        ctx.message as unknown as {
          forward_from?: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
          };
        }
      ).forward_from
        ? {
            id: (
              ctx.message as unknown as {
                forward_from: {
                  id: number;
                  is_bot: boolean;
                  first_name: string;
                  username?: string;
                };
              }
            ).forward_from.id,
            isBot: (
              ctx.message as unknown as {
                forward_from: {
                  id: number;
                  is_bot: boolean;
                  first_name: string;
                  username?: string;
                };
              }
            ).forward_from.is_bot,
            firstName: (
              ctx.message as unknown as {
                forward_from: {
                  id: number;
                  is_bot: boolean;
                  first_name: string;
                  username?: string;
                };
              }
            ).forward_from.first_name,
            username: (
              ctx.message as unknown as {
                forward_from: {
                  id: number;
                  is_bot: boolean;
                  first_name: string;
                  username?: string;
                };
              }
            ).forward_from.username,
          }
        : undefined,
      forwardFromChat: (
        ctx.message as unknown as {
          forward_from_chat?: {
            id: number;
            type: string;
            title?: string;
            username?: string;
          };
        }
      ).forward_from_chat
        ? {
            id: (
              ctx.message as unknown as {
                forward_from_chat: {
                  id: number;
                  type: string;
                  title?: string;
                  username?: string;
                };
              }
            ).forward_from_chat.id,
            type: (
              ctx.message as unknown as {
                forward_from_chat: {
                  id: number;
                  type: string;
                  title?: string;
                  username?: string;
                };
              }
            ).forward_from_chat.type,
            title: (
              ctx.message as unknown as {
                forward_from_chat: {
                  id: number;
                  type: string;
                  title?: string;
                  username?: string;
                };
              }
            ).forward_from_chat.title,
            username: (
              ctx.message as unknown as {
                forward_from_chat: {
                  id: number;
                  type: string;
                  title?: string;
                  username?: string;
                };
              }
            ).forward_from_chat.username,
          }
        : undefined,
      forwardDate: (ctx.message as unknown as { forward_date?: number })
        .forward_date
        ? new Date(
            (ctx.message as unknown as { forward_date: number }).forward_date *
              1000
          ).toISOString()
        : undefined,
      editDate: ctx.message.edit_date
        ? new Date(ctx.message.edit_date * 1000).toISOString()
        : undefined,
      mediaGroupId: ctx.message.media_group_id,
      authorSignature: ctx.message.author_signature,
      hasProtectedContent: ctx.message.has_protected_content,
      hasMediaSpoiler: ctx.message.has_media_spoiler,
      viaBot: ctx.message.via_bot
        ? {
            id: ctx.message.via_bot.id,
            isBot: ctx.message.via_bot.is_bot,
            firstName: ctx.message.via_bot.first_name,
            username: ctx.message.via_bot.username,
          }
        : undefined,
      newChatMembers: ctx.message.new_chat_members?.map((m) => ({
        id: m.id,
        isBot: m.is_bot,
        firstName: m.first_name,
        lastName: m.last_name,
        username: m.username,
      })),
      leftChatMember: ctx.message.left_chat_member
        ? {
            id: ctx.message.left_chat_member.id,
            isBot: ctx.message.left_chat_member.is_bot,
            firstName: ctx.message.left_chat_member.first_name,
            username: ctx.message.left_chat_member.username,
          }
        : undefined,
      newChatTitle: ctx.message.new_chat_title,
      newChatPhoto: ctx.message.new_chat_photo
        ? ctx.message.new_chat_photo.map((p) => ({
            fileId: p.file_id,
            fileUniqueId: p.file_unique_id,
            width: p.width,
            height: p.height,
            fileSize: p.file_size,
          }))
        : undefined,
      deleteChatPhoto: ctx.message.delete_chat_photo,
      groupChatCreated: ctx.message.group_chat_created,
      supergroupChatCreated: ctx.message.supergroup_chat_created,
      channelChatCreated: ctx.message.channel_chat_created,
      migrateToChatId: ctx.message.migrate_to_chat_id,
      migrateFromChatId: ctx.message.migrate_from_chat_id,
      pinnedMessage: ctx.message.pinned_message
        ? {
            messageId: ctx.message.pinned_message.message_id,
            text: ctx.message.pinned_message.text,
            date: new Date(
              ctx.message.pinned_message.date * 1000
            ).toISOString(),
          }
        : undefined,
      invoice: ctx.message.invoice
        ? {
            title: ctx.message.invoice.title,
            description: ctx.message.invoice.description,
            startParameter: ctx.message.invoice.start_parameter,
            currency: ctx.message.invoice.currency,
            totalAmount: ctx.message.invoice.total_amount,
          }
        : undefined,
      successfulPayment: ctx.message.successful_payment
        ? {
            currency: ctx.message.successful_payment.currency,
            totalAmount: ctx.message.successful_payment.total_amount,
            invoicePayload: ctx.message.successful_payment.invoice_payload,
            telegramPaymentChargeId:
              ctx.message.successful_payment.telegram_payment_charge_id,
            providerPaymentChargeId:
              ctx.message.successful_payment.provider_payment_charge_id,
          }
        : undefined,
      connectedWebsite: ctx.message.connected_website,
      messageAutoDeleteTimerChanged: ctx.message
        .message_auto_delete_timer_changed
        ? {
            messageAutoDeleteTime:
              ctx.message.message_auto_delete_timer_changed
                .message_auto_delete_time,
          }
        : undefined,
      videoChatStarted: ctx.message.video_chat_started,
      videoChatEnded: ctx.message.video_chat_ended
        ? {
            duration: ctx.message.video_chat_ended.duration,
          }
        : undefined,
      videoChatParticipantsInvited: ctx.message.video_chat_participants_invited
        ? {
            users: ctx.message.video_chat_participants_invited.users.map(
              (u) => ({
                id: u.id,
                isBot: u.is_bot,
                firstName: u.first_name,
                username: u.username,
              })
            ),
          }
        : undefined,
      webAppData: ctx.message.web_app_data
        ? {
            data: ctx.message.web_app_data.data,
            buttonText: ctx.message.web_app_data.button_text,
          }
        : undefined,
      replyMarkup: ctx.message.reply_markup
        ? {
            inlineKeyboard:
              "inline_keyboard" in ctx.message.reply_markup
                ? ctx.message.reply_markup.inline_keyboard.map((row) =>
                    row.map((btn) => ({
                      text: btn.text,
                      url: "url" in btn ? btn.url : undefined,
                      callbackData:
                        "callback_data" in btn ? btn.callback_data : undefined,
                      webApp: "web_app" in btn ? btn.web_app : undefined,
                    }))
                  )
                : undefined,
            keyboard: (
              ctx.message.reply_markup as unknown as {
                keyboard?: Array<
                  Array<{
                    text: string;
                    request_contact?: boolean;
                    request_location?: boolean;
                  }>
                >;
              }
            )?.keyboard
              ? (
                  ctx.message.reply_markup as unknown as {
                    keyboard: Array<
                      Array<{
                        text: string;
                        request_contact?: boolean;
                        request_location?: boolean;
                      }>
                    >;
                  }
                ).keyboard.map((row) =>
                  row.map((btn) => ({
                    text: btn.text,
                    requestContact: btn.request_contact,
                    requestLocation: btn.request_location,
                  }))
                )
              : undefined,
          }
        : undefined,
    };

    if (ctx.message.photo) {
      messageData.photo = ctx.message.photo.map((p) => ({
        fileId: p.file_id,
        fileUniqueId: p.file_unique_id,
        width: p.width,
        height: p.height,
        fileSize: p.file_size,
      }));
    }

    if (ctx.message.video) {
      messageData.video = {
        fileId: ctx.message.video.file_id,
        fileUniqueId: ctx.message.video.file_unique_id,
        width: ctx.message.video.width,
        height: ctx.message.video.height,
        duration: ctx.message.video.duration,
        thumbnail: ctx.message.video.thumbnail,
        fileName: ctx.message.video.file_name,
        mimeType: ctx.message.video.mime_type,
        fileSize: ctx.message.video.file_size,
      };
    }

    if (ctx.message.document) {
      messageData.document = {
        fileId: ctx.message.document.file_id,
        fileUniqueId: ctx.message.document.file_unique_id,
        fileName: ctx.message.document.file_name,
        mimeType: ctx.message.document.mime_type,
        fileSize: ctx.message.document.file_size,
        thumbnail: ctx.message.document.thumbnail,
      };
    }

    if (ctx.message.audio) {
      messageData.audio = {
        fileId: ctx.message.audio.file_id,
        fileUniqueId: ctx.message.audio.file_unique_id,
        duration: ctx.message.audio.duration,
        performer: ctx.message.audio.performer,
        title: ctx.message.audio.title,
        fileName: ctx.message.audio.file_name,
        mimeType: ctx.message.audio.mime_type,
        fileSize: ctx.message.audio.file_size,
        thumbnail: ctx.message.audio.thumbnail,
      };
    }

    if (ctx.message.voice) {
      messageData.voice = {
        fileId: ctx.message.voice.file_id,
        fileUniqueId: ctx.message.voice.file_unique_id,
        duration: ctx.message.voice.duration,
        mimeType: ctx.message.voice.mime_type,
        fileSize: ctx.message.voice.file_size,
      };
    }

    if (ctx.message.sticker) {
      messageData.sticker = {
        fileId: ctx.message.sticker.file_id,
        fileUniqueId: ctx.message.sticker.file_unique_id,
        type: ctx.message.sticker.type,
        width: ctx.message.sticker.width,
        height: ctx.message.sticker.height,
        isAnimated: ctx.message.sticker.is_animated,
        isVideo: ctx.message.sticker.is_video,
        thumbnail: ctx.message.sticker.thumbnail,
        emoji: ctx.message.sticker.emoji,
        setName: ctx.message.sticker.set_name,
        premiumAnimation: ctx.message.sticker.premium_animation,
        maskPosition: ctx.message.sticker.mask_position,
        customEmojiId: ctx.message.sticker.custom_emoji_id,
        fileSize: ctx.message.sticker.file_size,
      };
    }

    if (ctx.message.video_note) {
      messageData.videoNote = {
        fileId: ctx.message.video_note.file_id,
        fileUniqueId: ctx.message.video_note.file_unique_id,
        length: ctx.message.video_note.length,
        duration: ctx.message.video_note.duration,
        thumbnail: ctx.message.video_note.thumbnail,
        fileSize: ctx.message.video_note.file_size,
      };
    }

    if (ctx.message.contact) {
      messageData.contact = {
        phoneNumber: ctx.message.contact.phone_number,
        firstName: ctx.message.contact.first_name,
        lastName: ctx.message.contact.last_name,
        userId: ctx.message.contact.user_id,
        vcard: ctx.message.contact.vcard,
      };
    }

    if (ctx.message.location) {
      messageData.location = {
        latitude: ctx.message.location.latitude,
        longitude: ctx.message.location.longitude,
        horizontalAccuracy: ctx.message.location.horizontal_accuracy,
        livePeriod: ctx.message.location.live_period,
        heading: ctx.message.location.heading,
        proximityAlertRadius: ctx.message.location.proximity_alert_radius,
      };
    }

    if (ctx.message.venue) {
      messageData.venue = {
        location: {
          latitude: ctx.message.venue.location.latitude,
          longitude: ctx.message.venue.location.longitude,
        },
        title: ctx.message.venue.title,
        address: ctx.message.venue.address,
        foursquareId: ctx.message.venue.foursquare_id,
        foursquareType: ctx.message.venue.foursquare_type,
        googlePlaceId: ctx.message.venue.google_place_id,
        googlePlaceType: ctx.message.venue.google_place_type,
      };
    }

    if (ctx.message.poll) {
      messageData.poll = {
        id: ctx.message.poll.id,
        question: ctx.message.poll.question,
        options: ctx.message.poll.options.map((o) => ({
          text: o.text,
          voterCount: o.voter_count,
        })),
        totalVoterCount: ctx.message.poll.total_voter_count,
        isClosed: ctx.message.poll.is_closed,
        isAnonymous: ctx.message.poll.is_anonymous,
        type: ctx.message.poll.type,
        allowsMultipleAnswers: ctx.message.poll.allows_multiple_answers,
        correctOptionId: ctx.message.poll.correct_option_id,
        explanation: ctx.message.poll.explanation,
        explanationEntities: ctx.message.poll.explanation_entities,
        openPeriod: ctx.message.poll.open_period,
        closeDate: ctx.message.poll.close_date
          ? new Date(ctx.message.poll.close_date * 1000).toISOString()
          : undefined,
      };
    }

    if (ctx.message.dice) {
      messageData.dice = {
        emoji: ctx.message.dice.emoji,
        value: ctx.message.dice.value,
      };
    }

    log.info(messageData, "Group message received with full metadata");
  }

  await next();
};
