const settingHelper = require('./settingHelper');
const ConfigState = settingHelper.ConfigState;

const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

var timers = {};

// todo: check if context is unique per user. Set 2 timers at the same time using different users
//bot.context({ isAsking: ConfigState.NONE });

bot.use(Telegraf.memorySession());

bot.command('start', context => {
	console.log("Start from: ", JSON.stringify(context.from));

	// todo: localize strings in english
	context.reply("Ciao! Sono Bibot.");

	settingHelper.askStepDate(context);
});

bot.command("stop", context => {
	console.log("Stopped from: ", JSON.stringify(context.from));
	context.session.isAsking = ConfigState.NONE;

	let id = context.chat.id;

	let oldTimer = timers[id];
	if (!oldTimer) {
		context.reply("Non hai nessun allarme da fermare!");
		return;
	}

	oldTimer.clear();
	context.reply("Ho fermato l'allarme. Puoi ripetere la configurazione con /start.");
	context.reply("Ciao, a presto!");
});

bot.on('text', context => {
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
			settingHelper.stepAlarmTime(context, timers);
			break;
	}
});

bot.startPolling();