const moment = require("moment");
const PillReminder = require("./schemas");

module.exports = {

	check: function (onReminder) {
		getAllReminders(onReminder);
	},

	insert: function (chatId, date, pillType, time) {
		insertReminder(chatId, date, pillType, time);
	},

	hasReminder: function (chatId, onHasReminder) {
		hasReminderByChatId(chatId, onHasReminder);
	},

	remove: function (chatId) {
		removeReminder(chatId);
	}
}

function connect(next) {
	console.log("connecting");
}

function getAllReminders(onReminder) {
	let time = moment().format("HH:mm");
	console.log('SELECT * FROM pillReminders WHERE time = \'' + time + '\';');

	PillReminder
		.find({ time: time })
		.exec()
		.then(reminders => {
			console.log(JSON.stringify(reminders));
			console.log(reminders.length + ' rows were received');

			reminders.forEach(reminder => {
				onReminder(reminder.chatId, reminder.firstDayOfPill, reminder.pillType);
			}, this);
		})
		.catch(ex => console.log(ex));
}

function insertReminder(chatId, firstDayOfPill, pillType, time) {
	var queryText = 'INSERT INTO pillReminders(chatId, firstDayOfPill, pillType, time, creationDate)' +
		'VALUES($1, $2, $3, $4, $5) RETURNING id';
	console.log("inserting " + chatId + " " + firstDayOfPill + " " + pillType + " " + time);

	let reminder = new PillReminder({
		chatId: chatId,
		firstDayOfPill: firstDayOfPill,
		pillType: pillType,
		time: time
	});

	reminder
		.save(saved => {
			let newlyCreatedId = saved.chatId;
			console.log("Id inserted row: " + newlyCreatedId);
		})
		.catch(ex => console.log(ex));
}

function removeReminder(chatId) {
	//var queryText = 'DELETE FROM pillReminders WHERE chatId = $1';

	console.log("Deleting: " + chatId);
	PillReminder
		.remove({ chatId: chatId })
		.then(() => console.log("Deleted: " + chatId))
		.catch(ex => console.log(ex));
}

function hasReminderByChatId(chatId, onHasReminder) {
	console.log('SELECT * FROM pillReminders WHERE chatId = \'' + chatId + '\';');

	PillReminder
		.find({ chatId: chatId })
		.then(reminders => {
			console.log(reminders);
			console.log(reminders.length + ' rows were received');

			let reminder = reminders[0];
			if (reminder) {
				onHasReminder(reminder.firstDayOfPill, reminder.pillType, reminder.time);
			}
		})
		.catch(ex => console.log(ex));
}