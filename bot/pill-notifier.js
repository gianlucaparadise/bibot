var moment = require("moment");

const DatabaseWrapper = require('./database-wrapper');
const bot = require('./telegraf-wrapper').getBot();
const telegram = bot.telegram;

function onReminder(reminder) {
	let shouldWarn = shouldSendPillWarning(reminder.firstDayOfPill, reminder.pillType);
	if (shouldWarn) {
		// todo: insert plenty of strings and pick one randomly.
		telegram.sendMessage(reminder.chatId, "Ehi, prendi la pillola!");

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
		// check for reminders
		setInterval(function () {
			DatabaseWrapper.check(onReminder);
		}, 60000); // every minute
	}
}