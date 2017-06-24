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
	DatabaseWrapper.remove(id, () => {
		context.reply("Hai rimosso correttamente il reminder");
		context.reply("Puoi registrarne un altro con il comando /start");
		context.reply("Arrivederci!");
	});
});

bot.command("check", context => {
	context.session.isAsking = ConfigState.NONE;

	let id = context.chat.id;
	DatabaseWrapper.hasReminder(id, (firstDayOfPill, pillType, time) => {
		// todo: change 'time' timezone
		context.reply("Ciao! Hai impostato un avviso per una pillola da " + pillType + " giorni alle ore " + time);
	}, () => {
		context.reply("Ciao! Non hai nessun reminder salvato");
		context.reply("Puoi registrarne uno con il comando /start!");
	});
});

bot.on("text", context => {
	processMessage(context);
});

bot.action("twentyone", context => {
	console.log("Action twentyone");
	context["message"] = { text: "21" };
	processMessage(context);
});

bot.action("twentyeight", context => {
	console.log("Action twentyeight");
	context["message"] = { text: "28" };
	processMessage(context);
});

function processMessage(context) {
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
}

PillNotifier.start();

bot.startPolling();