var moment = require("moment");
var momentTimezone = require("moment-timezone");

const DatabaseWrapper = require('./database-wrapper');
const Extra = require('./telegraf-wrapper').getExtra();

const calendar = require('./calendar-telegram-nodejs');

const ConfigState = {
	NONE: 0,
	DATE: 1,
	DATE_CONFIRMATION: 2, // deprecated
	PILL_TYPE: 3,
	ALARM_TIME: 4,
	COMPLETED: 5
};

function askStepDate(context) {
	context.session.isAsking = ConfigState.DATE;
	context.reply("In che giorno hai iniziato a prendere la pillola?", calendar.getCalendar());
}

function askStepPillType(context) {
	context.session.isAsking = ConfigState.PILL_TYPE;
	context.session.stepDateConfirmation = true;
	context.reply("Prendi una pillola da 21 o da 28 giorni?", Extra.HTML().markup((m) =>
		m.inlineKeyboard([
			m.callbackButton("21", "twentyone"),
			m.callbackButton("28", "twentyeight")
		])));
}

function askStepAlarmTime(context) {
	context.session.isAsking = ConfigState.ALARM_TIME;
	context.reply("A che ora vuoi che ti avvisi? Ad esempio: 20:00");
}

function setScheduling(context) {
	let startingDateMoment = context.session.stepDate;
	// todo: if date is older than now, add 3 weeks
	let startingDate = startingDateMoment.utc().format("YYYY-MM-DD");

	let timeMoment = context.session.stepAlarmTime;
	let time = timeMoment.utc().format("HH:mm");

	let pillType = context.session.stepPillType;

	let id = context.chat.id;
	DatabaseWrapper.insert(id, startingDate, pillType, time);

	context.reply("Promemoria settato!");
}

module.exports = {

	ConfigState: ConfigState,

	askStepDate: function (context) {
		askStepDate(context);
	},

	stepDate: function (context, text) {
		let dateRaw = text;
		let date = moment(dateRaw, "YYYY-MM-DD");

		if (!date.isValid()) {
			context.reply("La data è errata. Puoi reinserirla?");
			askStepDate(context);
			return;
		}

		context.session.stepDate = date;
		askStepPillType(context);
	},

	stepPillType: function (context, text) {
		let pillType = text;

		if (pillType != "21" && pillType != "28") {
			context.reply("Scusa, non ho capito.");
			askStepPillType(context);
			return;
		}

		context.session.stepPillType = pillType;

		askStepAlarmTime(context);
	},

	stepAlarmTime: function (context, text) {
		let timeRaw = text;
		// use moment.unix(context.message.date) for getting timezone
		let time = momentTimezone.tz(timeRaw, ['h:m a', 'H:m'], "Europe/Rome");

		if (!time.isValid()) {
			context.reply("Non riesco a capire l'orario. Puoi scriverlo di nuovo?");
			return;
		}

		context.session.isAsking = ConfigState.COMPLETED;
		context.session.stepAlarmTime = time;

		setScheduling(context);
	}
};