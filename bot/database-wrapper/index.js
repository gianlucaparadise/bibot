const moment = require("moment");
const PillReminder = require("./schemas");

module.exports = {

	check: function (onReminder) {
		getAllReminders(onReminder);
	},

	setAnswered: function (chatId) {
		setAnswered(chatId);
	},

	setDelay: function (chatId, minutes) {
		setDelay(chatId, minutes);
	},

	insert: function (chatId, date, pillType, time) {
		insertReminder(chatId, date, pillType, time);
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

function setDelay(chatId, minutes) {
	let delayedTo = moment().add(minutes, "minute").format("HH:mm");
	console.log("setting delayed to " + delayedTo);
	PillReminder
		.update({ chatId: chatId }, { isWaitingForAnswer: true, delayedTo: delayedTo })
		.then((a) => {
			console.log("set delay for " + chatId + " " + JSON.stringify(a));
		})
		.catch((ex) => console.log(ex));

}

function insertReminder(chatId, firstDayOfPill, pillType, time) {
	console.log("inserting " + chatId + " " + firstDayOfPill + " " + pillType + " " + time);

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
			//let newlyCreatedId = saved.chatId;
			//console.log("Id inserted row: " + newlyCreatedId);
		})
		.catch(ex => console.log(ex));
}

function removeReminder(chatId, onRemoved) {
	console.log("Deleting: " + chatId);

	PillReminder
		.remove({ chatId: chatId })
		.then((result) => {
			console.log(JSON.stringify(result));
			console.log("Deleted: " + chatId);
			onRemoved();
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