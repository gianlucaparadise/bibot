const Extra = require('telegraf').Extra;

module.exports = {
	getCalendar: function () {
		return Extra.HTML().markup((m) => {
			let page = [];
			addDays(page, m);
			console.log(page);
			// m.inlineKeyboard([
			// 	[m.callbackButton("1", "calendar-telegram-1"), m.callbackButton("2", "calendar-telegram-2")],
			// 	[m.callbackButton("3", "calendar-telegram-3"), m.callbackButton("4", "calendar-telegram-4")]
			// ]);
			return m.inlineKeyboard(page);
		});
	},

	setDateListener: function (bot, onDateSelected) {
		bot.action(/calendar-telegram-\d+/g, context => {
			if (onDateSelected) {
				let date = context.match[0].replace("calendar-telegram-", "");
				onDateSelected(context, date);
			}
		});
	}
}

function addDays(page, m) {
	let date = new Date();
	let maxDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

	let currentRow = new Array(7).fill(m.callbackButton("", "calendar-telegram-ignore"));
	for (var d = 1; d <= maxDays; d++) {
		date.setDate(d);

		let weekDay = date.getDay();
		//currentRow[weekDay] = toYyyymmdd(date);
		currentRow[weekDay] = m.callbackButton(d.toString(), "calendar-telegram-" + toYyyymmdd(date));

		if (weekDay == 6 || d == maxDays) {
			page.push(currentRow);
			currentRow = new Array(7).fill(m.callbackButton("", "calendar-telegram-ignore"));
		}
	}
}

function toYyyymmdd(date) {
	let mm = date.getMonth() + 1; // getMonth() is zero-based
	let dd = date.getDate();

	return [
		date.getFullYear(),
		(mm > 9 ? '' : '0') + mm,
		(dd > 9 ? '' : '0') + dd
	].join('');
}