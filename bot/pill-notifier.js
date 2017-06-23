var moment = require("moment");

const DatabaseWrapper = require('./database-wrapper');
const bot = require('./telegraf-wrapper').getBot();
const telegram = bot.telegram;

function onReminder(chatId, firstDayOfPill, pillType) {
	let shouldWarn = shouldSendPillWarning(firstDayOfPill, pillType);
	if (shouldWarn) {
		// todo: insert plenty of strings and pick one randomly.
		telegram.sendMessage(chatId, "Ehi, prendi la pillola!");

		// todo: ask this again untill it gets an answer
	}
}

function shouldSendPillWarning(startingDateRaw, pillType) {
	console.log("shouldWarn: " + startingDateRaw + " " + pillType);
	let startingDate = moment(startingDateRaw);

	if (pillType == "21") {
		let today = moment(new Date()).utc();

		let pastDays = startingDate.diff(today, 'days');
		// fixme: this number will get bigger and bigger
		pastDays = Math.abs(pastDays);

		let pillDay = (pastDays % 28) + 1; // this is a number between 1 and 28

		console.log("shouldWarn: " + pastDays + " " + pillDay);

		if (pillDay > 21) {
			return false;
		}
	}

	return true;
}


module.exports = {
	start: function () {
		console.log("notifier started");
		// check for reminders
		setInterval(function () {
			DatabaseWrapper.check(onReminder);
		}, 60000); // every minute

		//DatabaseWrapper.check(onReminder); // I check this minute
	}
}