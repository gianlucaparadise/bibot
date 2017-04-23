const settingHelper = require('./settingHelper');
const ConfigState = settingHelper.ConfigState;

const DatabaseWrapper = require('./database-wrapper');

const Telegraf = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// todo: check if context is unique per user. Set 2 timers at the same time using different users
//bot.context({ isAsking: ConfigState.NONE });

bot.use(Telegraf.memorySession());

bot.command("start", context => {
	console.log("Start from: ", JSON.stringify(context.from));

	// todo: localize strings in english
	if (context.from.first_name) {
		context.reply("Ciao " + context.from.first_name + "! Sono Bibot.");
	}
	else {
		context.reply("Ciao! Sono Bibot.");
	}

	settingHelper.askStepDate(context);
});

bot.command("stop", context => {
	console.log("Stopped from: ", JSON.stringify(context.from));
	context.session.isAsking = ConfigState.NONE;

	let id = context.chat.id;
	DatabaseWrapper.remove(id);
});

bot.command("check", context => {
	context.session.isAsking = ConfigState.NONE;

	let id = context.chat.id;
	DatabaseWrapper.hasReminder(id);
});

bot.on("text", context => {
	console.log("Received a text message:", JSON.stringify(context.message));
	let isAsking = context.session.isAsking || ConfigState.NONE;
	console.log("isAsking: " + isAsking)

	switch (isAsking) {
		case ConfigState.DATE:
			settingHelper.stepDate(context);
			break;

		case ConfigState.DATE_CONFIRMATION:
			settingHelper.stepDateConfirmation(context);
			break;

		case ConfigState.PILL_TYPE:
			settingHelper.stepPillType(context);
			break;

		case ConfigState.ALARM_TIME:
			settingHelper.stepAlarmTime(context);
			break;
	}
});

// check for reminders
setInterval(function () {
	DatabaseWrapper.check();
}, 30000); // every 30 seconds

bot.startPolling();