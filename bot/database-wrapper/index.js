const moment = require("moment-timezone");
const PillReminder = require("./schemas");

module.exports = {

	check: function (onReminder) {
		getAllReminders(onReminder);
	},

	setAnswered: function (chatId) {
		setAnswered(chatId);
	},

	setDelay: function (chatId, minutes, onUpdated) {
		setDelay(chatId, minutes, onUpdated);
	},

	insert: function (chatId, date, pillType, time, onInserted) {
		insertReminder(chatId, date, pillType, time, onInserted);
	},

	hasReminder: function (chatId, onHasReminder, onNoReminder) {
		hasReminderByChatId(chatId, onHasReminder, onNoReminder);
	},

	remove: function (chatId, onRemoved) {
		removeReminder(chatId, onRemoved);
	}
}

function getAllReminders(onReminder) {
	let time = moment().format("HH:mm");
	console.info('find by time: \'' + time + '\';');
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
			console.info(JSON.stringify(reminders));
			console.info(reminders.length + ' rows were received');

			reminders.forEach(reminder => {

				reminder.isWaitingForAnswer = true;
				reminder.delayedTo = null;

				reminder
					.save()
					.then((a) => {
						console.log("isWaitingForAnswer saved " + JSON.stringify(a));
						onReminder(reminder.chatId, reminder.firstDayOfPill, reminder.pillType);
					});
			}, this);
		})
		.catch(ex => console.log(ex));
}

function setAnswered(chatId) {
	console.log("setting aswered for " + chatId);
	PillReminder
		.update({ chatId: chatId }, { isWaitingForAnswer: false, delayedTo: null })
		.then((a) => {
			console.log("set aswered for " + chatId + " " + JSON.stringify(a));
		})
		.catch((ex) => console.log(ex));
}

function setDelay(chatId, minutes, onUpdated) {
	let delayedTo = moment().add(minutes, "minute").format("HH:mm");
	console.log("setting delayed to " + delayedTo);
	PillReminder
		.findOneAndUpdate({ chatId: chatId, isWaitingForAnswer: true }, { delayedTo: delayedTo })
		.then(updatedDoc => {
			console.log("set delay for " + chatId + " " + JSON.stringify(updatedDoc));
			if (!onUpdated) return;
			if (updatedDoc) {
				onUpdated(true);
			}
			else {
				onUpdated(false);
			}
		})
		.catch((ex) => console.log(ex));

}

function insertReminder(chatId, firstDayOfPill, pillType, time, onInserted) {
	console.log("inserting " + chatId + " " + firstDayOfPill + " " + pillType + " " + time);

	// I have to remove all the reminders for this chatId
	removeReminder(chatId, hasRemoved => {

		let reminder = new PillReminder({
			chatId: chatId,
			firstDayOfPill: firstDayOfPill,
			pillType: pillType,
			time: time
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
			console.log(JSON.stringify(res) + " " + res.result.n);
			let hasRemoved = res.result.n > 0;
			console.log("Deleted: " + chatId + " n: " + res.result.n);
			onRemoved(hasRemoved);
		})
		.catch(ex => console.log(ex));
}

function hasReminderByChatId(chatId, onHasReminder, onNoReminder) {
	console.info('find by chatId: \'' + chatId + '\';');

	PillReminder
		.find({ chatId: chatId })
		.then(reminders => {
			console.log(reminders);
			console.log(reminders.length + ' rows were received');

			let reminder = reminders[0];
			if (reminder) {
				onHasReminder(reminder.firstDayOfPill, reminder.pillType, reminder.time);
			}
			else {
				onNoReminder();
			}
		})
		.catch(ex => console.log(ex));
}