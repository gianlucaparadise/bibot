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

bot.context({ isAsking: ConfigState.NONE });

bot.command("start", function (msg, reply, next) {
	console.log("Start from: ", msg.from.id);
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
	let startingDate = startingDateMoment.utc().format("DDD");

	let timeMoment = msg.context.stepAlarmTime;
	let time = timeMoment.utc().format("HH:mm");

	let pillType = msg.context.stepPillType;

	let sched;
	if (pillType == "28") {
		sched = later.parse.recur().after(startingDate).dayOfYear().on(time).time();
	}
	else if (pillType == "21") {
		sched = later.parse.recur().after(startingDate).dayOfYear().on(time).time().except().every(4).weekOfYear();
	}
	else {
		reply.text("Ho avuto dei problemi mentre impostavo il timer. Puoi ripetere ripartendo da /start?");
		return;
	}

	var occurrences = later.schedule(sched).next(100);
	var schedText = "";
	for (var i = 0; i < 100; i++) {
		schedText += occurrences[i] + '\n';
	}

	reply.text("Ti avviserò questi giorni: \n" + schedText);

	let timer = later.setInterval(function () {
		reply.text("Ehi, prendi la pillola!");
	}, sched);

	let id = msg.chat.id;

	let oldTimer = timers[id];
	if (oldPinger) oldTimer.clear();

	timers[id] = timer;
}

bot.command("stop", function (msg, reply, next) {
	console.log("Stopped from: ", msg.from.id);
	msg.context.isAsking = ConfigState.NONE;

	let id = msg.chat.id;

	let oldTimer = timers[id];
	if (!oldPinger) {
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
