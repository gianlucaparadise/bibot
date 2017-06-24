const moment = require("moment");
const PillReminder = require("./schemas");

module.exports = {

	check: function (onReminder) {
		getAllReminders(onReminder);
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

	PillReminder
		.find({ time: time })
		.exec()
		.then(reminders => {
			console.info(JSON.stringify(reminders));
			console.info(reminders.length + ' rows were received');

			reminders.forEach(reminder => {
				onReminder(reminder.chatId, reminder.firstDayOfPill, reminder.pillType);
			}, this);
		})
		.catch(ex => console.log(ex));
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
		.then(() => {
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