//var moment = require("moment");
var moment = require("moment-timezone");

const DatabaseWrapper = require('./database-wrapper');
const TelegrafWrapper = require('./telegraf-wrapper');
const Extra = TelegrafWrapper.getExtra();
const calendar = TelegrafWrapper.getCalendar();

const ConfigState = {
	NONE: 0,
	DATE: 1,
	DATE_CONFIRMATION: 2, // deprecated
	PILL_TYPE: 3,
	ALARM_TIME: 4,
	COMPLETED: 5
};

function askStepPillType(context) {
	context.session.isAsking = ConfigState.PILL_TYPE;
	context.reply(context.i18n.t("setting-pill-type"), Extra.HTML().markup((m) =>
		m.inlineKeyboard([
			m.callbackButton(context.i18n.t("setting-pill-type-21"), "twentyone"),
			m.callbackButton(context.i18n.t("setting-pill-type-28"), "twentyeight")
		])));
}

function stepPillType(context, text) {
	let pillType = text;

	if (pillType != "21" && pillType != "28") {
		context
			.reply(context.i18n.t("setting-dont-understand"))
			.then(() => askStepPillType(context));
		return;
	}

	context.session.stepPillType = pillType;

	if (pillType == "21") {
		askStepDate(context);
	}
	else {
		askStepAlarmTime(context);
	}
}

function askStepDate(context) {
	context.session.isAsking = ConfigState.DATE;
	context.reply(context.i18n.t("setting-start-date"), calendar.getCalendar());
}

function stepDate(context, text) {
	let dateRaw = text;
	let date = moment(dateRaw, "YYYY-MM-DD");

	if (!date.isValid()) {
		context
			.reply(context.i18n.t("setting-wrong-date"))
			.then(() => askStepDate(context));
		return;
	}

	context.session.stepDate = date;
	askStepAlarmTime(context);
}

function askStepAlarmTime(context) {
	context.session.isAsking = ConfigState.ALARM_TIME;
	context.reply(context.i18n.t("setting-alarm-time"));
}

function stepAlarmTime(context, text) {
	let timeRaw = text;
	// use moment.unix(context.message.date) for getting timezone
	let time = moment.tz(timeRaw, ['h:m a', 'H:m'], "Europe/Rome");

	if (!time.isValid()) {
		context.reply(context.i18n.t("setting-dont-understand-time"));
		return;
	}

	context.session.isAsking = ConfigState.COMPLETED;
	context.session.stepAlarmTime = time;

	setScheduling(context);
}

function setScheduling(context) {
	let startingDateMoment = context.session.stepDate;
	// todo: if date is older than now, add 3 weeks
	let startingDate = startingDateMoment ? startingDateMoment.utc().format("YYYY-MM-DD") : "";

	let timeMoment = context.session.stepAlarmTime;
	let time = timeMoment.utc().format("HH:mm");

	let pillType = context.session.stepPillType;

	let id = context.chat.id;
	DatabaseWrapper.insert(id, startingDate, pillType, time, hasRemoved => {
		context
			.reply(context.i18n.t("setting-completed"))
			.then(() => {
				if (hasRemoved)
					context.reply(context.i18n.t("setting-overwritten"));
			});
	});
}

function processMessage(context, text) {
	let isAsking = context.session.isAsking || ConfigState.NONE;
	console.log("isAsking: " + isAsking)

	switch (isAsking) {
		case ConfigState.DATE:
			stepDate(context, text);
			break;

		case ConfigState.PILL_TYPE:
			stepPillType(context, text);
			break;

		case ConfigState.ALARM_TIME:
			stepAlarmTime(context, text);
			break;
	}
}

const settingHelper = {

	ConfigState: ConfigState,

	startSettingFlow: function (context) {
		askStepPillType(context);
	},

	processMessage: function (context, text) {
		processMessage(context, text);
	}
};

module.exports = settingHelper;