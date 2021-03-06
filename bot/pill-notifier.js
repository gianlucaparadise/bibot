var moment = require("moment-timezone");

const Logger = require('./../logger');
const DatabaseWrapper = require('./database-wrapper');
const telegrafWrapper = require('./telegraf-wrapper');
const bot = telegrafWrapper.getBot();
const Extra = telegrafWrapper.getExtra();
const telegram = bot.telegram;
const i18n = telegrafWrapper.getI18n();

function onReminder(chatId, firstDayOfPill, pillType, lang) {
	let shouldWarn = shouldSendPillWarning(firstDayOfPill, pillType);
	if (!shouldWarn) return;

	DatabaseWrapper.setWaitingForAnswer(chatId, lang)
		.then(() => {
			// todo: insert plenty of strings and pick one randomly.
			return telegram.sendMessage(chatId, i18n.t(lang, "reminder-message"), Extra.HTML().markup((m) =>
				m.inlineKeyboard([
					m.callbackButton(i18n.t(lang, "reminder-delay"), "pill-remind-later"),
					m.callbackButton(i18n.t(lang, "reminder-taken"), "pill-taken")
				])
			));
		})
		.catch(ex => {
			if (ex.code === 403) {
				// The user blocked me 😢
				Logger.debug(`Removing ${chatId} because the user blocked me`);
				DatabaseWrapper.remove(chatId)
					.then(hasRemoved => Logger.debug(`HasRemoved: ${hasRemoved}`))
					.catch(ex => Logger.info(ex));

				return;
			}
			Logger.info(ex);
		});
}

function shouldSendPillWarning(startingDateRaw, pillType) {
	Logger.debug("shouldWarn: " + startingDateRaw + " " + pillType);

	if (pillType == "21") {
		let pillDay = calculatePillDay(startingDateRaw);

		if (pillDay > 21) {
			return false;
		}
	}

	return true;
}

function calculatePillDay(startingDateRaw) {
	let startingDate = moment.utc(startingDateRaw);
	let today = moment.utc(new Date());

	let pastDays = startingDate.diff(today, 'days');
	// fixme: this number will get bigger and bigger
	pastDays = Math.abs(pastDays);

	let pillDay = (pastDays % 28) + 1; // this is a number between 1 and 28

	Logger.debug("calculatePillDay - pastDays: " + pastDays + " pillDay: " + pillDay);

	return pillDay;
}

module.exports = {
	start: function () {
		Logger.debug("notifier started");
		// check for reminders
		setInterval(function () {
			DatabaseWrapper.check(onReminder);
		}, 60000); // every minute

		DatabaseWrapper.check(onReminder); // I check this minute
	},

	setPillTaken: function (context) {
		Logger.debug("setting pill taken");
		let id = context.chat.id;
		let lang = context.from.language_code;
		return DatabaseWrapper
			.setAnswered(id, lang);
	},

	calculatePillDay: function (firstDayOfPill) {
		return calculatePillDay(firstDayOfPill);
	}
}