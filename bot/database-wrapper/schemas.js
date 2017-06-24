const mongoose = require('mongoose');

var pillReminderSchema = mongoose.Schema({
	chatId: String,
	firstDayOfPill: String,
	pillType: String,
	time: String,
	isWaitingForAnswer: { type: Boolean, default: false },
	creationDate: { type: Date, default: Date.now }
});

// pillReminderSchema.methods.speak = function () {
// 	var greeting = this.name
// 		? "Meow name is " + this.name
// 		: "I don't have a name";
// 	console.log(greeting);
// }

const PillReminder = mongoose.model('PillReminder', pillReminderSchema);
module.exports = PillReminder;