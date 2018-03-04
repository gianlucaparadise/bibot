var moment = require("moment-timezone");
const settingHelper = require('./setting-helper');
const ConfigState = settingHelper.ConfigState;

const DatabaseWrapper = require('./database-wrapper');
const PillNotifier = require('./pill-notifier');
const TelegrafWrapper = require('./telegraf-wrapper');

const bot = TelegrafWrapper.getBot();
const Extra = TelegrafWrapper.getExtra();
const calendar = TelegrafWrapper.getCalendar();

calendar.setDateListener((context, date) => {
	settingHelper.processMessage(context, date);
});

bot.command("start", context => {
	console.log("Start from: ", JSON.stringify(context.from));

	// todo: localize strings in english
	let text = context.i18n.t("greeting");

	context
		.reply(text)
		.then(() => settingHelper.startSettingFlow(context));
});

bot.command("stop", context => {
	console.log("Stopped from: ", JSON.stringify(context.from));
	context.session.isAsking = ConfigState.NONE;

	let id = context.chat.id;
	DatabaseWrapper.remove(id, hasRemoved => {
		if (hasRemoved) {
			context
				.reply(context.i18n.t("remider-removed"))
				.then(() => context.reply(context.i18n.t("reminder-register-another")))
				.then(() => context.reply(context.i18n.t("goodbye")));
		}
		else {
			context
				.reply(context.i18n.t("reminder-none"))
				.then(() => context.reply(context.i18n.t("reminder-register-another")));
		}
	});
});

bot.command("check", context => {
	context.session.isAsking = ConfigState.NONE;

	let id = context.chat.id;
	DatabaseWrapper.hasReminder(id, (firstDayOfPill, pillType, time) => {
		let newTime = moment(time, "HH:mm").tz("Europe/Rome").format("HH:mm");
		context.reply(context.i18n.t("reminder-recap", { pillType: pillType, newTime: newTime }));
	}, () => {
		context
			.reply(context.i18n.t("greeting-reminder-none"))
			.then(() => context.reply(context.i18n.t("reminder-register-another")));
	});
});

bot.on("text", context => {
	console.log("Received a text message:", JSON.stringify(context.message));
	settingHelper.processMessage(context, context.message.text);
});

bot.action("twentyone", context => {
	console.log("Action twentyone");
	settingHelper.processMessage(context, "21");
});

bot.action("twentyeight", context => {
	console.log("Action twentyeight");
	settingHelper.processMessage(context, "28");
});

bot.action("pill-taken", context => {
	console.log("pill-taken");
	context.reply(context.i18n.t("pill-taken"));
	let id = context.chat.id;
	DatabaseWrapper.setAnswered(id);
});

bot.action("pill-remind-later", context => {
	console.log("pill-remind-later");
	context.reply(context.i18n.t("pill-remind-later"), Extra.HTML().markup((m) =>
		m.inlineKeyboard([
			[
				m.callbackButton(context.i18n.t("pill-remind-later-10"), "pill-remind-later-10"),
				m.callbackButton(context.i18n.t("pill-remind-later-30"), "pill-remind-later-30")
			],
			[
				m.callbackButton(context.i18n.t("pill-remind-later-60"), "pill-remind-later-60"),
				m.callbackButton(context.i18n.t("pill-remind-later-120"), "pill-remind-later-120")
			]
		])
	));
});

bot.action(/pill-remind-later-\d+/g, context => {
	let minutes = context.match[0].replace("pill-remind-later-", "");
	let id = context.chat.id;
	DatabaseWrapper.setDelay(id, minutes, hasUpdated => {
		if (!hasUpdated) return;

		let delayText;
		if (minutes < 60) {
			delayText = context.i18n.t("pill-remind-later-confirmation-minutes", { minutes: minutes });
		}
		else {
			let hours = minutes / 60;
			delayText = context.i18n.t("pill-remind-later-confirmation-hours", { hours: hours });
		}

		context.reply(context.i18n.t("pill-remind-later-confirmation", { delayText: delayText }));
	});
})

PillNotifier.start();

bot.startPolling();