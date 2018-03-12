// Bot as a singleton
const path = require('path');
const Telegraf = require('telegraf');
const Calendar = require('telegraf-calendar-telegram');

const TelegrafI18n = require('telegraf-i18n');
const i18n = new TelegrafI18n({
	defaultLanguage: 'en',
	allowMissing: true,
	directory: path.resolve(__dirname, 'locales')
});

var bot = null;
var calendar = null;

class TelegrafWrapper {
	static getBot() {
		if (bot == null) {
			console.log(`google apikey: ${process.env.BIBOT_GOOGLE_API_KEY}`);
			bot = new Telegraf(process.env.TELEGRAM_TOKEN);

			// todo: check if context is unique per user. Set 2 timers at the same time using different users
			//bot.context({ isAsking: ConfigState.NONE });

			bot.use(Telegraf.memorySession());
			bot.use(i18n.middleware());

			console.log("Bot initialized");
		}

		return bot;
	}

	static getI18n() {
		return i18n;
	}

	static getExtra() {
		return Telegraf.Extra;
	}

	static getCalendar() {
		if (!calendar) {
			// todo: localize months and weekdays
			calendar = new Calendar(TelegrafWrapper.getBot(), {
				startWeekDay: 1,
				weekDayNames: ["L", "M", "M", "G", "V", "S", "D"],
				monthNames: [
					"Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
					"Lug", "Ago", "Set", "Ott", "Nov", "Dic"
				]
			});
		}

		const today = new Date();
		const minDate = new Date();
		minDate.setMonth(today.getMonth() - 1);
		minDate.setDate(1);

		const maxDate = new Date();
		// these two lines will set date at last day of next month
		maxDate.setMonth(today.getMonth() + 2);
		maxDate.setDate(0);

		return calendar.setMinDate(minDate).setMaxDate(maxDate);
	}
}

module.exports = TelegrafWrapper;