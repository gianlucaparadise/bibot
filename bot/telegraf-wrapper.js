// Bot as a singleton

const Telegraf = require('telegraf');
const Calendar = require('telegraf-calendar-telegram');

var bot = null;
var calendar = null;

class TelegrafWrapper {
	static getBot() {
		if (bot == null) {
			bot = new Telegraf(process.env.TELEGRAM_TOKEN);

			// todo: check if context is unique per user. Set 2 timers at the same time using different users
			//bot.context({ isAsking: ConfigState.NONE });

			bot.use(Telegraf.memorySession());

			console.log("Bot initialized");
		}

		return bot;
	}

	static getExtra() {
		return Telegraf.Extra;
	}

	static getCalendar() {
		if (!calendar) {
			calendar = new Calendar(TelegrafWrapper.getBot(), {
				startWeekDay: 1,
				weekDayNames: ["L", "M", "M", "G", "V", "S", "D"],
				monthNames: [
					"Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
					"Lug", "Ago", "Set", "Ott", "Nov", "Dic"
				]
			});
		}

		return calendar;
	}
}

module.exports = TelegrafWrapper;