const Extra = require('telegraf').Extra;

module.exports = {
	getCalendar: function () {
		return Extra.HTML().markup((m) =>
			m.inlineKeyboard([
				[m.callbackButton("1", "calendar-1"), m.callbackButton("2", "calendar-2")],
				[m.callbackButton("3", "calendar-3"), m.callbackButton("4", "calendar-4")]
			])
		);
	},

	setDateListener: function (bot, onDateSelected) {
		bot.action(/calendar-\d+/g, context => {
			if (onDateSelected) {
				let date = context.match[0];
				onDateSelected(context, date);
			}
		});
	}
}