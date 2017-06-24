const Extra = require('telegraf').Extra;

const weekDayNames = ["S", "M", "T", "W", "T", "F", "S"];
// const monthNames = ["January", "February", "March", "April", "May", "June",
// 	"July", "August", "September", "October", "November", "December"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

module.exports = {
	getCalendar: function () {
		return getCalendarMarkup(new Date());
	},

	setDateListener: function (bot, onDateSelected) {
		bot.action(/calendar-telegram-\d+/g, context => {
			if (onDateSelected) {
				let date = context.match[0].replace("calendar-telegram-", "");
				onDateSelected(context, date);
			}
		});

		bot.action("calendar-telegram-prev", context => {
			context.editMessageReplyMarkup(getCalendarMarkup(new Date(2017, 2, 1)));
		});

		bot.action("calendar-telegram-next", context => {
			context.reply("next");
		});

		bot.action("calendar-telegram-ignore", context => { });
	}
};

function getCalendarMarkup(date) {
	return Extra.HTML().markup((m) => {
		return m.inlineKeyboard(getPage(m, date));
	});
}

function addHeader(page, m, date) {
	let monthName = monthNames[date.getMonth()];
	let year = date.getFullYear();

	//page.push([m.callbackButton(monthName + " " + year, "calendar-telegram-ignore")]);
	page.push([
		m.callbackButton("<", "calendar-telegram-prev"),
		m.callbackButton(monthName + " " + year, "calendar-telegram-ignore"),
		m.callbackButton(">", "calendar-telegram-next")
	]);

	page.push(weekDayNames.map(e => m.callbackButton(e, "calendar-telegram-ignore")));
}

function addDays(page, m, date) {
	//let date = new Date();
	let maxDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

	let currentRow = new Array(7).fill(m.callbackButton(" ", "calendar-telegram-ignore"));
	for (var d = 1; d <= maxDays; d++) {
		date.setDate(d);

		let weekDay = date.getDay();
		//currentRow[weekDay] = toYyyymmdd(date);
		currentRow[weekDay] = m.callbackButton(d.toString(), "calendar-telegram-" + toYyyymmdd(date));

		if (weekDay == 6 || d == maxDays) {
			page.push(currentRow);
			currentRow = new Array(7).fill(m.callbackButton(" ", "calendar-telegram-ignore"));
		}
	}
}

function getPage(m, date) {
	let page = [];
	addHeader(page, m, date);
	addDays(page, m, date);
	return page;
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