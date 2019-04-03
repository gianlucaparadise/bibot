var moment = require("moment-timezone");
const settingHelper = require("./setting-helper");
const ConfigState = settingHelper.ConfigState;

const DatabaseWrapper = require("./database-wrapper");
const PillNotifier = require("./pill-notifier");
const TelegrafWrapper = require("./telegraf-wrapper");
const Logger = require('./../logger');

const bot = TelegrafWrapper.getBot();
const Extra = TelegrafWrapper.getExtra();
const calendar = TelegrafWrapper.getCalendar();

calendar.setDateListener((context, date) => {
  settingHelper.processMessage(context, date);
});

bot.command("start", context => {
  Logger.info("Start from: ", JSON.stringify(context.from));

  let text = context.i18n.t("greeting");

  return context
    .reply(text)
    .then(() => settingHelper.startSettingFlow(context));
});

bot.command("stop", context => {
  Logger.info("Stopped from: ", JSON.stringify(context.from));
  context.session.isAsking = ConfigState.NONE;

  let id = context.chat.id;
  DatabaseWrapper.remove(id)
    .then(hasRemoved => {
      if (hasRemoved) {
        context
          .reply(context.i18n.t("reminder-removed"))
          .then(() => context.reply(context.i18n.t("reminder-register-another")))
          .then(() => context.reply(context.i18n.t("goodbye")));
      } else {
        context
          .reply(context.i18n.t("reminder-none"))
          .then(() => context.reply(context.i18n.t("reminder-register-another")));
      }
    })
    .catch(ex => Logger.info(ex));
});

bot.command("check", context => {
  context.session.isAsking = ConfigState.NONE;

  let id = context.chat.id;
  let lang = context.from.language_code;
  DatabaseWrapper.hasReminder(
    id,
    lang,
    (firstDayOfPill, pillType, time, timezone) => {
      let newTime = moment.utc(time, "HH:mm")
        .tz(timezone)
        .format("HH:mm");
      context.reply(
        context.i18n.t("reminder-recap", {
          pillType: pillType,
          newTime: newTime
        })
      ).then(() => {
        if (pillType != "21") return;

        let pillDay = PillNotifier.calculatePillDay(firstDayOfPill);
        context.reply(
          context.i18n.t("reminder-recap-pill-day", {
            dayNumber: pillDay
          })
        );
      });
    },
    () => {
      context
        .reply(context.i18n.t("greeting-reminder-none"))
        .then(() => context.reply(context.i18n.t("reminder-register-another")));
    }
  );
});

bot.on("text", context => {
  Logger.info("Received a text message:", JSON.stringify(context.message));

  if (context.message.text.startsWith("👍")) {
    Logger.info("thumbs-up, pill-taken");
    return PillNotifier
      .setPillTaken(context)
      .then((count) => {
        if (count > 0) {
          return context.reply(context.i18n.t("pill-taken"));
        }
      });
  }

  return settingHelper.processMessage(context, context.message.text);
});

bot.on("location", context => {
  Logger.info("Received a location:", JSON.stringify(context.message));
  let lat = context.message.location.latitude;
  let lon = context.message.location.longitude;
  let locationText = `${lat},${lon}`;
  return settingHelper.processMessage(context, locationText);
});

bot.action("twentyone", context => {
  Logger.info("Action twentyone");
  return context.answerCbQuery()
    .then(() => settingHelper.processMessage(context, "21"));
});

bot.action("twentyeight", context => {
  Logger.info("Action twentyeight");
  return context.answerCbQuery()
    .then(() => settingHelper.processMessage(context, "28"));
});

bot.action("pill-taken", context => {
  Logger.info("pill-taken");
  return PillNotifier
    .setPillTaken(context)
    .then((count) => {
      return context.answerCbQuery()
        .then(() => {
          if (count > 0) {
            return context.reply(context.i18n.t("pill-taken"));
          }
        });
    });
});

bot.action("pill-remind-later", context => {
  Logger.info("pill-remind-later");
  return context.answerCbQuery()
    .then(() => context.reply(
      context.i18n.t("pill-remind-later"),
      Extra.HTML().markup(m =>
        m.inlineKeyboard([
          [
            m.callbackButton(
              context.i18n.t("pill-remind-later-10"),
              "pill-remind-later-10"
            ),
            m.callbackButton(
              context.i18n.t("pill-remind-later-30"),
              "pill-remind-later-30"
            )
          ],
          [
            m.callbackButton(
              context.i18n.t("pill-remind-later-60"),
              "pill-remind-later-60"
            ),
            m.callbackButton(
              context.i18n.t("pill-remind-later-120"),
              "pill-remind-later-120"
            )
          ]
        ])
      )
    ));
});

bot.action(/pill-remind-later-\d+/g, context => {
  let minutes = context.match[0].replace("pill-remind-later-", "");
  let id = context.chat.id;
  let lang = context.from.language_code;
  return DatabaseWrapper
    .setDelay(id, minutes, lang)
    .then(hasUpdated => {
      if (!hasUpdated) return;

      let delayText;
      if (minutes < 60) {
        delayText = context.i18n.t("pill-remind-later-confirmation-minutes", {
          minutes: minutes
        });
      } else {
        let hours = minutes / 60;
        delayText = context.i18n.t("pill-remind-later-confirmation-hours", {
          hours: hours
        });
      }

      return context.answerCbQuery()
        .then(() => context.reply(
          context.i18n.t("pill-remind-later-confirmation", { delayText: delayText })
        ));
    })
    .catch(ex => Logger.info(ex));
});

bot.catch((err) => {
  Logger.info("Error in bot:", err);
});

PillNotifier.start();

bot.startPolling();
