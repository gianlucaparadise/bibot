'use strict';

var express = require('express');
var router = express.Router();

var moment = require("moment");
var later = require("later");
var botgram = require("botgram");

var bot = botgram(process.env.TELEGRAM_TOKEN);

const ConfigState = {
	NONE: 0,
	DATE: 1,
	DATE_CONFIRMATION: 2,
	PILL_TYPE: 3,
	ALARM_TIME: 4,
	COMPLETED: 5
};

var timers = {};

// todo: check if context is unique per user. Set 2 timers at the same time using different users
bot.context({ isAsking: ConfigState.NONE });

bot.command("start", function (msg, reply, next) {
	console.log("Start from: ", msg.from.id);

	// todo: localize strings in english
	reply.text("Ciao! Sono Bibot.");

	askStepDate(msg, reply);
});

bot.text(function (msg, reply, next) {
	console.log("Received a text message:", msg.text);

	switch (msg.context.isAsking) {
		case ConfigState.DATE:
			stepDate(msg, reply);
			break;

		case ConfigState.DATE_CONFIRMATION:
			stepDateConfirmation(msg, reply);
			break;

		case ConfigState.PILL_TYPE:
			stepPillType(msg, reply);
			break;

		case ConfigState.ALARM_TIME:
			stepAlarmTime(msg, reply);
			break;
	}
});

function askStepDate(msg, reply) {
	let today = moment().format("YYYY-MM-DD");
	msg.context.isAsking = ConfigState.DATE;
	reply.text("In che giorno hai iniziato a prendere la pillola? Ad esempio: " + today);
}

function stepDate(msg, reply) {
	let dateRaw = msg.text;
	let date = moment(dateRaw, "YYYY-MM-DD");

	if (!date.isValid()) {
		reply.text("La data è errata. Puoi reinserirla?");
		return;
	}

	msg.context.isAsking = ConfigState.DATE_CONFIRMATION;
	msg.context.stepDate = date;
	let formatted = date.locale("IT").format("dddd, D MMMM YYYY");
	// todo: give options to be selected, instead of this
	reply.text("Confermi questa data? (S/N) \n" + formatted);
}

function stepDateConfirmation(msg, reply) {
	let answerText = msg.text.toLowerCase();

	if (answerText == "n" || answerText == "no") {
		reply.text("Va bene, ricominciamo.");
		askStepDate(msg, reply);
		return;
	}

	if (answerText != "s" && answerText != "si") {
		reply.text("Lo prendo come un no.");
		askStepDate(msg, reply);
		return;
	}

	askStepPillType(msg, reply);
}

function askStepPillType(msg, reply) {
	msg.context.isAsking = ConfigState.PILL_TYPE;
	msg.context.stepDateConfirmation = true;
	reply.text("Prendi una pillola da 21 o da 28 giorni? (21/28)");
}

function stepPillType(msg, reply) {
	let pillType = msg.text;

	if (pillType != "21" && pillType != "28") {
		reply.text("Scusa, non ho capito.");
		askStepPillType(msg, reply);
		return;
	}

	msg.context.stepPillType = pillType;

	askStepAlarmTime(msg, reply);
}

function askStepAlarmTime(msg, reply) {
	msg.context.isAsking = ConfigState.ALARM_TIME;
	reply.text("A che ora vuoi che ti avvisi? Ad esempio: 20:00");
}

function stepAlarmTime(msg, reply) {
	let timeRaw = msg.text;
	let time = moment(timeRaw, ['h:m a', 'H:m']);

	if (!time.isValid()) {
		reply.text("Non riesco a capire l'orario. Puoi scriverlo di nuovo?");
		return;
	}

	msg.context.isAsking = ConfigState.COMPLETED;
	msg.context.stepAlarmTime = time;

	setScheduling(msg, reply);
}

function setScheduling(msg, reply) {
	let startingDateMoment = msg.context.stepDate;
	// todo: if date is older than now, add 3 weeks
	let startingDate = startingDateMoment.utc();
	let startingDayOfYear = startingDate.format("DDD");

	let timeMoment = msg.context.stepAlarmTime;
	let time = timeMoment.utc().format("HH:mm");

	let pillType = msg.context.stepPillType;

	// let sched;
	// if (pillType == "28") {
	// 	sched = later.parse.recur().after(startingDayOfYear).dayOfYear().on(time).time();
	// }
	// else if (pillType == "21") {
	// 	// todo: this works only when starting date is after today
	// 	// check better if this really works
	// 	sched = later.parse.recur().after(startingDayOfYear).dayOfYear().on(time).time().except().every(4).weekOfYear();
	// }
	// else {
	// 	reply.text("Ho avuto dei problemi mentre impostavo il timer. Puoi ripetere ripartendo da /start?");
	// 	return;
	// }

	// // todo: 100 is too much...
	// var occurrences = later.schedule(sched).next(100);
	// var schedText = "";
	// for (var i = 0; i < 100; i++) {
	// 	schedText += occurrences[i] + '\n';
	// }

	// reply.text("Ti avviserò questi giorni: \n" + schedText);

	// // todo: ask for confirmation

	let sched = later.parse.recur().after(startingDayOfYear).dayOfYear().on(time).time();

	let timer = later.setInterval(function () {
		pillWarning(reply, startingDate, pillType);
	}, sched);

	let id = msg.chat.id;

	let oldTimer = timers[id];
	if (oldTimer) oldTimer.clear();

	timers[id] = timer;

	reply.text("Promemoria settato!");
}

function pillWarning(reply, startingDate, pillType) {
	if (pillType == "21") {
		let today = moment(new Date()).utc();

		let pastDays = startingDate.diff(today, 'days');
		// fixme: this number will get bigger and bigger
		pastDays = Math.abs(pastDays);

		let pillDay = (pastDays % 28) + 1; // this is a number between 1 and 28

		if (pillDay > 21) {
			return;
		}
	}

	// todo: insert plenty of strings and pick one randomly.
	reply.text("Ehi, prendi la pillola!");

	// todo: ask this again untill it gets an answer
}

bot.command("stop", function (msg, reply, next) {
	console.log("Stopped from: ", msg.from.id);
	msg.context.isAsking = ConfigState.NONE;

	let id = msg.chat.id;

	let oldTimer = timers[id];
	if (!oldTimer) {
		reply.text("Non hai nessun allarme da fermare!");
		return;
	}

	oldTimer.clear();
	reply.text("Ho fermato l'allarme. Puoi ripetere la configurazione con /start.");
	reply.text("Ciao, a presto!");
});

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Bibot' });
});

module.exports = router;
