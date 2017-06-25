var moment = require("moment-timezone");
const settingHelper = require('./setting-helper');
const ConfigState = settingHelper.ConfigState;

const DatabaseWrapper = require('./database-wrapper');
const PillNotifier = require('./pill-notifier');
const telegrafWrapper = require('./telegraf-wrapper');
const bot = telegrafWrapper.getBot();
const Extra = telegrafWrapper.getExtra();

const calendar = require('./calendar-telegram-nodejs');

calendar.setDateListener(bot, (context, date) => {
	processMessage(context, date);
});

bot.command("start", context => {
	console.log("Start from: ", JSON.stringify(context.from));

	// todo: localize strings in english
	let text;
	if (context.from.first_name) {
		text = "Ciao " + context.from.first_name + "! Sono Bibot.";
	}
	else {
		text = "Ciao! Sono Bibot.";
	}

	context
		.reply(text)
		.then(() => settingHelper.askStepPillType(context));
});

bot.command("stop", context => {
	console.log("Stopped from: ", JSON.stringify(context.from));
	context.session.isAsking = ConfigState.NONE;

	let id = context.chat.id;
	DatabaseWrapper.remove(id, () => {
		context
			.reply("Hai rimosso correttamente il reminder")
			.then(() => context.reply("Puoi registrarne un altro con il comando /start"))
			.then(() => context.reply("Arrivederci!"));
	});
});

bot.command("check", context => {
	context.session.isAsking = ConfigState.NONE;

	let id = context.chat.id;
	DatabaseWrapper.hasReminder(id, (firstDayOfPill, pillType, time) => {
		let newTime = moment(time, "HH:mm").tz("Europe/Rome").format("HH:mm");
		context.reply("Ciao! Hai impostato un avviso per una pillola da " + pillType + " giorni alle ore " + newTime);
	}, () => {
		context
			.reply("Ciao! Non hai nessun reminder salvato")
			.then(() => context.reply("Puoi registrarne uno con il comando /start!"));
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

		case ConfigState.PILL_TYPE:
			settingHelper.stepPillType(context, text);
			break;

		case ConfigState.ALARM_TIME:
			settingHelper.stepAlarmTime(context, text);
			break;
	}
}

bot.action("pill-taken", context => {
	console.log("pill-taken");
	context.reply("Bravissima!");
	let id = context.chat.id;
	DatabaseWrapper.setAnswered(id);
});

bot.action("pill-remind-later", context => {
	console.log("pill-remind-later");
	context.reply("Tra quanto vuoi che ti avvisi?", Extra.HTML().markup((m) =>
		m.inlineKeyboard([
			[
				m.callbackButton("10 min", "pill-remind-later-10"),
				m.callbackButton("30 min", "pill-remind-later-30")
			],
			[
				m.callbackButton("1 ora", "pill-remind-later-60"),
				m.callbackButton("2 ore", "pill-remind-later-120")
			]
		])
	));
});

bot.action(/pill-remind-later-\d+/g, context => {
	let minutes = context.match[0].replace("pill-remind-later-", "");
	context.reply(minutes);
	let id = context.chat.id;
	DatabaseWrapper.setDelay(id, minutes);
})

PillNotifier.start();

bot.startPolling();