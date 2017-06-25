//var moment = require("moment");
var moment = require("moment-timezone");

const DatabaseWrapper = require('./database-wrapper');
const Extra = require('./telegraf-wrapper').getExtra();

const calendar = require('telegraf-calendar-telegram');

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
	context.reply("Prendi una pillola da 21 o da 28 giorni?", Extra.HTML().markup((m) =>
		m.inlineKeyboard([
			m.callbackButton("21", "twentyone"),
			m.callbackButton("28", "twentyeight")
		])));
}

function stepPillType(context, text) {
	let pillType = text;

	if (pillType != "21" && pillType != "28") {
		context
			.reply("Scusa, non ho capito.")
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
	context.reply("In che giorno hai iniziato a prendere la pillola?", calendar.getCalendar());
}

function stepDate(context, text) {
	let dateRaw = text;
	let date = moment(dateRaw, "YYYY-MM-DD");

	if (!date.isValid()) {
		context
			.reply("La data è errata. Puoi reinserirla?")
			.then(() => askStepDate(context));
		return;
	}

	context.session.stepDate = date;
	askStepAlarmTime(context);
}

function askStepAlarmTime(context) {
	context.session.isAsking = ConfigState.ALARM_TIME;
	context.reply("A che ora vuoi che ti avvisi? Ad esempio: 20:00");
}

function stepAlarmTime(context, text) {
	let timeRaw = text;
	// use moment.unix(context.message.date) for getting timezone
	let time = moment.tz(timeRaw, ['h:m a', 'H:m'], "Europe/Rome");

	if (!time.isValid()) {
		context.reply("Non riesco a capire l'orario. Puoi scriverlo di nuovo?");
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
			.reply("Promemoria settato!")
			.then(() => {
				if (hasRemoved)
					context.reply("Hai sovrascritto il tuo precedente promemoria");
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