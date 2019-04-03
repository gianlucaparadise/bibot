//var moment = require("moment");
var moment = require("moment-timezone");

const Logger = require('./../logger');
const DatabaseWrapper = require("./database-wrapper");
const TelegrafWrapper = require("./telegraf-wrapper");
const Extra = TelegrafWrapper.getExtra();
const googleMapsClient = require("@google/maps").createClient({
  key: process.env.BIBOT_GOOGLE_API_KEY,
  Promise: Promise
});

const ConfigState = {
  NONE: 0,
  DATE: 1,
  DATE_CONFIRMATION: 2, // deprecated
  PILL_TYPE: 3,
  ALARM_TIME: 4,
  COMPLETED: 5,
  TIMEZONE: 6
};

function askStepPillType(context) {
  context.session.isAsking = ConfigState.PILL_TYPE;
  return context.reply(
    context.i18n.t("setting-pill-type"),
    Extra.HTML().markup(m =>
      m.inlineKeyboard([
        m.callbackButton(context.i18n.t("setting-pill-type-21"), "twentyone"),
        m.callbackButton(context.i18n.t("setting-pill-type-28"), "twentyeight")
      ])
    )
  );
}

function stepPillType(context, text) {
  let pillType = text;

  if (pillType != "21" && pillType != "28") {
    return context
      .reply(context.i18n.t("setting-dont-understand"))
      .then(() => askStepPillType(context));
  }

  context.session.stepPillType = pillType;

  if (pillType == "21") {
    return askStepDate(context);
  } else {
    return askStepTimezoneLocation(context);
  }
}

function askStepDate(context) {
  context.session.isAsking = ConfigState.DATE;
  return context.reply(
    context.i18n.t("setting-start-date"),
    TelegrafWrapper.getCalendar(context.i18n).getCalendar()
  );
}

function stepDate(context, text) {
  let dateRaw = text;
  let date = moment.utc(dateRaw, "YYYY-MM-DD");

  if (!date.isValid()) {
    return context
      .reply(context.i18n.t("setting-wrong-date"))
      .then(() => askStepDate(context));
  }

  context.session.stepDate = date;
  return askStepTimezoneLocation(context);
}

function askStepTimezoneLocation(context) {
  context.session.isAsking = ConfigState.TIMEZONE;
  return context.reply(
    context.i18n.t("setting-timezone-location"),
    Extra.markup(m =>
      m
        .resize()
        .oneTime()
        .keyboard([
          m.locationRequestButton(
            context.i18n.t("setting-timezone-location-button")
          ),
          context.i18n.t("setting-timezone-location-button-skip")
        ])
    )
  );
}

function stepTimezoneLocation(context, text) {
  let latlon = text;
  let isValid = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(
    latlon
  );

  if (!isValid) {
    // context
    // 	.reply(context.i18n.t("setting-timezone-location-wrong"))
    // 	.then(() => askStepTimezoneLocation(context));
    context.session.stepTimezoneLocation = "Europe/London";
    return askStepAlarmTime(context);
  }

  return googleMapsClient
    .timezone({
      location: latlon.split(",")
    })
    .asPromise()
    .then(response => {
      Logger.debug(
        `Timezone api response: ${JSON.stringify(response)}\n timeZoneId: ${
        response.json.timeZoneId
        }`
      );
      let timezone = response.json.timeZoneId;

      context.session.stepTimezoneLocation = timezone;
      return askStepAlarmTime(context);
    })
    .catch(err => {
      Logger.info(`Error while calling timezone api: ${JSON.stringify(err)}`);
      // context
      // 	.reply(context.i18n.t("setting-timezone-location-error"))
      // 	.then(() => askStepTimezoneLocation(context));

      context.session.stepTimezoneLocation = "Europe/London";
      return context
        .reply(context.i18n.t("setting-timezone-location-error"))
        .then(() => askStepAlarmTime(context));
    });
}

function askStepAlarmTime(context) {
  context.session.isAsking = ConfigState.ALARM_TIME;
  return context.reply(
    context.i18n.t("setting-alarm-time"),
    Extra.markup(m => m.removeKeyboard())
  );
}

function stepAlarmTime(context, text) {
  let timeRaw = text;
  let timezone = context.session.stepTimezoneLocation;
  // use moment.unix(context.message.date) for getting timezone
  let time = moment.tz(timeRaw, ["h:m a", "H:m"], timezone);

  if (!time.isValid()) {
    return context.reply(context.i18n.t("setting-dont-understand-time"));
  }

  context.session.isAsking = ConfigState.COMPLETED;
  context.session.stepAlarmTime = time;

  return setScheduling(context)
    .then(hasRemoved => {
      return context.reply(context.i18n.t("setting-completed")).then(() => {
        if (hasRemoved) context.reply(context.i18n.t("setting-overwritten"));
      });
    })
    .catch(ex => Logger.info(ex));
}

function setScheduling(context) {
  let startingDateMoment = context.session.stepDate;
  // todo: if date is older than now, add 3 weeks
  let startingDate = startingDateMoment
    ? startingDateMoment.utc().format("YYYY-MM-DD")
    : "";

  let timeMoment = context.session.stepAlarmTime;
  let time = timeMoment.utc().format("HH:mm");

  let pillType = context.session.stepPillType;

  let timezone = context.session.stepTimezoneLocation;
  let id = context.chat.id;
  let lang = context.from.language_code;
  return DatabaseWrapper.insert(
    id,
    startingDate,
    pillType,
    time,
    timezone,
    lang
  );
}

function processMessage(context, text) {
  let isAsking = context.session.isAsking || ConfigState.NONE;
  Logger.debug("isAsking: " + isAsking);

  switch (isAsking) {
    case ConfigState.DATE:
      return stepDate(context, text);

    case ConfigState.PILL_TYPE:
      return stepPillType(context, text);

    case ConfigState.ALARM_TIME:
      return stepAlarmTime(context, text);

    case ConfigState.TIMEZONE:
      return stepTimezoneLocation(context, text);
  }
}

const settingHelper = {
  ConfigState: ConfigState,

  startSettingFlow: function (context) {
    return askStepPillType(context);
  },

  processMessage: function (context, text) {
    return processMessage(context, text);
  }
};

module.exports = settingHelper;
