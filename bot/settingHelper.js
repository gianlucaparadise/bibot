module.exports = {

	ConfigState: {
		NONE: 0,
		DATE: 1,
		DATE_CONFIRMATION: 2,
		PILL_TYPE: 3,
		ALARM_TIME: 4,
		COMPLETED: 5
	},

	askStepDate: function (context) {
		let today = moment().format("YYYY-MM-DD");
		context.session.isAsking = ConfigState.DATE;
		context.reply("In che giorno hai iniziato a prendere la pillola? Ad esempio: " + today);
	},

	stepDate: function (context) {
		let dateRaw = context.message.text;
		let date = moment(dateRaw, "YYYY-MM-DD");

		if (!date.isValid()) {
			context.reply("La data è errata. Puoi reinserirla?");
			return;
		}

		context.session.isAsking = ConfigState.DATE_CONFIRMATION;
		context.session.stepDate = date;
		let formatted = date.locale("IT").format("dddd, D MMMM YYYY");
		// todo: give options to be selected, instead of this
		context.reply("Confermi questa data? (S/N) \n" + formatted);
	},

	stepDateConfirmation: function (context) {
		let answerText = context.message.text.toLowerCase();

		if (answerText == "n" || answerText == "no") {
			context.reply("Va bene, ricominciamo.");
			askStepDate(context);
			return;
		}

		if (answerText != "s" && answerText != "si") {
			context.reply("Lo prendo come un no.");
			askStepDate(context);
			return;
		}

		askStepPillType(context);
	},

	askStepPillType: function (context) {
		context.session.isAsking = ConfigState.PILL_TYPE;
		context.session.stepDateConfirmation = true;
		context.reply("Prendi una pillola da 21 o da 28 giorni? (21/28)");
	},

	stepPillType: function (context) {
		let pillType = context.message.text;

		if (pillType != "21" && pillType != "28") {
			context.reply("Scusa, non ho capito.");
			askStepPillType(context);
			return;
		}

		context.session.stepPillType = pillType;

		askStepAlarmTime(context);
	},

	askStepAlarmTime: function (context) {
		context.session.isAsking = ConfigState.ALARM_TIME;
		context.reply("A che ora vuoi che ti avvisi? Ad esempio: 20:00");
	},

	stepAlarmTime: function (context) {
		let timeRaw = context.message.text;
		let time = moment(timeRaw, ['h:m a', 'H:m']);

		if (!time.isValid()) {
			context.reply("Non riesco a capire l'orario. Puoi scriverlo di nuovo?");
			return;
		}

		context.session.isAsking = ConfigState.COMPLETED;
		context.session.stepAlarmTime = time;

		setScheduling(context);
	},

	setScheduling: function (context) {
		let startingDateMoment = context.session.stepDate;
		// todo: if date is older than now, add 3 weeks
		let startingDate = startingDateMoment.utc();
		let startingDayOfYear = startingDate.format("DDD");

		let timeMoment = context.session.stepAlarmTime;
		let time = timeMoment.utc().format("HH:mm");

		let pillType = context.session.stepPillType;

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
		// 	context.reply("Ho avuto dei problemi mentre impostavo il timer. Puoi ripetere ripartendo da /start?");
		// 	return;
		// }

		// // todo: 100 is too much...
		// var occurrences = later.schedule(sched).next(100);
		// var schedText = "";
		// for (var i = 0; i < 100; i++) {
		// 	schedText += occurrences[i] + '\n';
		// }

		// context.reply("Ti avviserò questi giorni: \n" + schedText);

		// // todo: ask for confirmation

		let sched = later.parse.recur().after(startingDayOfYear).dayOfYear().on(time).time();

		let timer = later.setInterval(function () {
			pillWarning(context, startingDate, pillType);
		}, sched);

		let id = context.chat.id;

		let oldTimer = timers[id];
		if (oldTimer) oldTimer.clear();

		timers[id] = timer;

		context.reply("Promemoria settato!");
	},

	pillWarning: function (context, startingDate, pillType) {
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
		context.reply("Ehi, prendi la pillola!");

		// todo: ask this again untill it gets an answer
	}
};