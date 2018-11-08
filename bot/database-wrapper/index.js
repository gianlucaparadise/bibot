const moment = require("moment-timezone");
const PillReminder = require("./schemas");

module.exports = {

	check: function (onReminder) {
		getAllReminders(onReminder);
	},

	setAnswered: function (chatId, lang) {
		setAnswered(chatId, lang);
	},

	setDelay: function (chatId, minutes, lang) {
		return setDelay(chatId, minutes, lang);
	},

	insert: function (chatId, date, pillType, time, timezone, lang, onInserted) {
		insertReminder(chatId, date, pillType, time, timezone, lang, onInserted);
	},

	hasReminder: function (chatId, lang, onHasReminder, onNoReminder) {
		hasReminderByChatId(chatId, lang, onHasReminder, onNoReminder);
	},

	remove: function (chatId, onRemoved) {
		removeReminder(chatId, onRemoved);
	},

	getRemindersToDisplay: function (onResult) {
		getRemindersToDisplay(onResult);
	}
}

function getAllReminders(onReminder) {
	let time = moment.utc().format("HH:mm");
	console.log('find by time: \'' + time + '\';');
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
			console.log(JSON.stringify(reminders));
			console.log(reminders.length + ' rows were received');

			reminders.forEach(reminder => {

				reminder.isWaitingForAnswer = true;
				reminder.delayedTo = null;

				reminder
					.save()
					.then((a) => {
						console.log("isWaitingForAnswer saved " + JSON.stringify(a));
						onReminder(reminder.chatId, reminder.firstDayOfPill, reminder.pillType, reminder.langCode);
					});
			}, this);
		})
		.catch(ex => console.log(ex));
}

function setAnswered(chatId, lang) {
	console.log("setting aswered for " + chatId);
	PillReminder
		.update({ chatId: chatId }, { isWaitingForAnswer: false, delayedTo: null, langCode: lang })
		.then((a) => {
			console.log("set aswered for " + chatId + " " + JSON.stringify(a));
		})
		.catch((ex) => console.log(ex));
}

function setDelay(chatId, minutes, lang) {
	return new Promise((resolve, reject) => {
		let delayedTo = moment.utc().add(minutes, "minute").format("HH:mm");
		console.log("setting delayed to " + delayedTo);
		PillReminder
			.findOneAndUpdate({ chatId: chatId, isWaitingForAnswer: true }, { delayedTo: delayedTo, langCode: lang })
			.then(updatedDoc => {
				console.log("set delay for " + chatId + " " + JSON.stringify(updatedDoc));
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

function insertReminder(chatId, firstDayOfPill, pillType, time, timezone, lang, onInserted) {
	console.log(`inserting ${chatId} ${firstDayOfPill} ${pillType} ${time} ${timezone} ${lang}`);

	// I have to remove all the reminders for this chatId
	removeReminder(chatId, hasRemoved => {

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
				console.log("inserted");
				console.log(JSON.stringify(saved));
				if (onInserted) {
					onInserted(hasRemoved);
				}
			})
			.catch(ex => console.log(ex));
	});
}

function removeReminder(chatId, onRemoved) {
	console.log("Deleting: " + chatId);

	PillReminder
		.remove({ chatId: chatId })
		.then((res) => {
			let hasRemoved = res.result.n > 0;
			console.log("Deleted: " + chatId + " n: " + res.result.n);
			onRemoved(hasRemoved);
		})
		.catch(ex => console.log(ex));
}

function hasReminderByChatId(chatId, lang, onHasReminder, onNoReminder) {
	console.log('find by chatId: \'' + chatId + '\';');

	PillReminder
		.find({ chatId: chatId })
		.then(reminders => {
			console.log(reminders);
			console.log(reminders.length + ' rows were received');

			let reminder = reminders[0];
			if (reminder) {
				onHasReminder(reminder.firstDayOfPill, reminder.pillType, reminder.time, reminder.timezone);
			}
			else {
				onNoReminder();
			}
		})
		.catch(ex => console.log(ex));

	// I update lang code just for data integrity 
	PillReminder
		.findOneAndUpdate({ chatId: chatId }, { langCode: lang })
		.then(updatedDoc => {
			console.log("updated langcode for " + chatId + " " + JSON.stringify(updatedDoc));
		})
		.catch(ex => console.log(ex));
}

function getRemindersToDisplay(onResult) {
	PillReminder
		.find({})
		.select('-_id firstDayOfPill pillType time timezone langCode creationDate')
		.lean()
		.then(onResult)
		.catch(ex => console.log(ex));
}