const mongoose = require('mongoose');

var pillReminderSchema = mongoose.Schema({
	chatId: String,
	firstDayOfPill: String,
	pillType: String,
	time: String,
	timezone: String,
	langCode: String,
	isWaitingForAnswer: { type: Boolean, default: false },
	delayedTo: { type: String, default: null },
	creationDate: { type: Date, default: Date.now }
});

const PillReminder = mongoose.model('PillReminder', pillReminderSchema);
module.exports = PillReminder;