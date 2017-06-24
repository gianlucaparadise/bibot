const settingHelper = require('./setting-helper');
const ConfigState = settingHelper.ConfigState;

const DatabaseWrapper = require('./database-wrapper');
const PillNotifier = require('./pill-notifier');
const bot = require('./telegraf-wrapper').getBot();

const Markup = require('telegraf').Markup;

bot.command("calendar", context => {
	console.log("calendar: " + JSON.stringify(context));
	context.reply("Yo", Markup
		.keyboard([
			['🔍 Search', '😎 Popular'],         // Row1 with 2 buttons
			['☸ Setting', '📞 Feedback'],       // Row2 with 2 buttons
			['📢 Ads', '⭐️ Rate us', '👥 Share'] // Row3 with 3 buttons
		])
	);
});

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
	console.log("Received a text message:", JSON.stringify(context.message));
	processMessage(context, context.message.text);
});

bot.action("twentyone", context => {
	console.log("Action twentyone");
	processMessage(context, "21");
});

bot.action("twentyeight", context => {
	console.log("Action twentyeight");
	processMessage(context, "28");
});

function processMessage(context, text) {
	let isAsking = context.session.isAsking || ConfigState.NONE;
	console.log("isAsking: " + isAsking)

	switch (isAsking) {
		case ConfigState.DATE:
			settingHelper.stepDate(context, text);
			break;

		case ConfigState.DATE_CONFIRMATION:
			settingHelper.stepDateConfirmation(context, text);
			break;

		case ConfigState.PILL_TYPE:
			settingHelper.stepPillType(context, text);
			break;

		case ConfigState.ALARM_TIME:
			settingHelper.stepAlarmTime(context, text);
			break;
	}
}

PillNotifier.start();

bot.startPolling();