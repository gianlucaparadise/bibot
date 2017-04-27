const settingHelper = require('./setting-helper');
const ConfigState = settingHelper.ConfigState;

const DatabaseWrapper = require('./database-wrapper');
const PillNotifier = require('./pill-notifier');
const bot = require('./telegraf-wrapper').getBot();

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
	DatabaseWrapper.hasReminder(id, (firstDayOfPill, pillType, time) => {
		context.reply("Ciao! Hai impostato un avviso per una pillola da " + pillType + " giorni alle ore " + time);
	});
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

PillNotifier.start();

bot.startPolling();