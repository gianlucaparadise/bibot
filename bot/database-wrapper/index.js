const moment = require("moment-timezone");
const PillReminder = require("./schemas");
const Logger = require('./../../logger');

module.exports = {

	check: function (onReminder) {
		getAllReminders(onReminder);
	},

	setWaitingForAnswer: function (chatId, lang) {
		return setWaitingForAnswer(chatId, lang);
	},

	setAnswered: function (chatId, lang) {
		return setAnswered(chatId, lang);
	},

	setDelay: function (chatId, minutes, lang) {
		return setDelay(chatId, minutes, lang);
	},

	insert: function (chatId, date, pillType, time, timezone, lang) {
		return insertReminder(chatId, date, pillType, time, timezone, lang);
	},

	hasReminder: function (chatId, lang, onHasReminder, onNoReminder) {
		hasReminderByChatId(chatId, lang, onHasReminder, onNoReminder);
	},

	remove: function (chatId) {
		return removeReminder(chatId);
	},

	getRemindersToDisplay: function () {
		return getRemindersToDisplay();
	}
}

function getAllReminders(onReminder) {
	let time = moment.utc().format("HH:mm");
	Logger.debug('find by time: \'' + time + '\';');
	let condition = {
		$or: [
			{ time: time },
			{ isWaitingForAnswer: true, delayedTo: null },
			{ isWaitingForAnswer: true, delayedTo: time }
		]
	};

	PillReminder
		.find(condition)
		.exec()
		.then(reminders => {
			Logger.debug(JSON.stringify(reminders));
			Logger.debug(reminders.length + ' rows were received');

			reminders.forEach(reminder => {
				onReminder(reminder.chatId, reminder.firstDayOfPill, reminder.pillType, reminder.langCode);
			}, this);
		})
		.catch(ex => Logger.info(ex));
}

function setWaitingForAnswer(chatId, lang) {
	return new Promise((resolve, reject) => {
		Logger.debug("setting isWaitingForAnswer for " + chatId);
		PillReminder
			.update({ chatId: chatId }, { isWaitingForAnswer: true, delayedTo: null, langCode: lang })
			.then((a) => {
				Logger.debug("set isWaitingForAnswer for " + chatId + "\n" + JSON.stringify(a));
				resolve();
			})
			.catch(reject);
	});
}

function setAnswered(chatId, lang) {
	return new Promise((resolve, reject) => {
		Logger.debug("setting answered for " + chatId);
		PillReminder
			.update({ chatId: chatId, isWaitingForAnswer: true }, { isWaitingForAnswer: false, delayedTo: null, langCode: lang })
			.then((result) => {
				Logger.debug("set answered for " + chatId + "\n" + JSON.stringify(result));
				resolve(result.nModified);
			})
			.catch(reject);
	});
}

function setDelay(chatId, minutes, lang) {
	return new Promise((resolve, reject) => {
		let delayedTo = moment.utc().add(minutes, "minute").format("HH:mm");
		Logger.debug("setting delayed to " + delayedTo);
		PillReminder
			.findOneAndUpdate({ chatId: chatId, isWaitingForAnswer: true }, { delayedTo: delayedTo, langCode: lang })
			.then(updatedDoc => {
				Logger.debug("set delay for " + chatId + "\n" + JSON.stringify(updatedDoc));
				if (!resolve) return;
				if (updatedDoc) {
					resolve(true);
				}
				else {
					resolve(false);
				}
			})
			.catch(reject);
	});

}

function insertReminder(chatId, firstDayOfPill, pillType, time, timezone, lang) {
	return new Promise((resolve, reject) => {
		Logger.debug(`inserting ${chatId} ${firstDayOfPill} ${pillType} ${time} ${timezone} ${lang}`);

		// I have to remove all the reminders for this chatId
		removeReminder(chatId)
			.then(hasRemoved => {

				let reminder = new PillReminder({
					chatId: chatId,
					firstDayOfPill: firstDayOfPill,
					pillType: pillType,
					time: time,
					timezone: timezone,
					langCode: lang
				});

				reminder
					.save(saved => {
						Logger.debug("inserted");
						Logger.debug(JSON.stringify(saved));
						if (resolve) {
							resolve(hasRemoved);
						}
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

function removeReminder(chatId) {
	Logger.debug("Deleting: " + chatId);

	return new Promise((resolve, reject) => {
		PillReminder
			.remove({ chatId: chatId })
			.then((res) => {
				let hasRemoved = res.result.n > 0;
				Logger.debug("Deleted: " + chatId + " n: " + res.result.n);
				resolve(hasRemoved);
			})
			.catch(reject);
	});
}

function hasReminderByChatId(chatId, lang, onHasReminder, onNoReminder) {
	Logger.debug('find by chatId: \'' + chatId + '\';');

	PillReminder
		.find({ chatId: chatId })
		.then(reminders => {
			Logger.debug(reminders);
			Logger.debug(reminders.length + ' rows were received');

			let reminder = reminders[0];
			if (reminder) {
				onHasReminder(reminder.firstDayOfPill, reminder.pillType, reminder.time, reminder.timezone);
			}
			else {
				onNoReminder();
			}
		})
		.catch(ex => Logger.info(ex));

	// I update lang code just for data integrity 
	PillReminder
		.findOneAndUpdate({ chatId: chatId }, { langCode: lang })
		.then(updatedDoc => {
			Logger.debug("updated langcode for " + chatId + "\n" + JSON.stringify(updatedDoc));
		})
		.catch(ex => Logger.info(ex));
}

function getRemindersToDisplay() {
	return new Promise((resolve, reject) => {
		PillReminder
			.find({})
			.select('-_id chatId firstDayOfPill pillType time timezone langCode creationDate')
			.lean()
			.then(resolve)
			.catch(reject);
	});
}