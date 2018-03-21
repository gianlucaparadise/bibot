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
			bot = new Telegraf(process.env.TELEGRAM_TOKEN);

			// todo: check if context is unique per user. Set 2 timers at the same time using different users
			//bot.context({ isAsking: ConfigState.NONE });

			bot.use(Telegraf.session());
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

	static getCalendar(i18n) {
		if (!calendar) {
			calendar = new Calendar(TelegrafWrapper.getBot(), {
				startWeekDay: 1
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

		calendar
			.setMinDate(minDate)
			.setMaxDate(maxDate);

		if (i18n) {
			let weekDayNames = [
				i18n.t("weekday-name-monday"),
				i18n.t("weekday-name-tuesday"),
				i18n.t("weekday-name-wednesday"),
				i18n.t("weekday-name-thursday"),
				i18n.t("weekday-name-friday"),
				i18n.t("weekday-name-saturday"),
				i18n.t("weekday-name-sunday")
			];

			let monthNames = [
				i18n.t("month-name-january"),
				i18n.t("month-name-february"),
				i18n.t("month-name-march"),
				i18n.t("month-name-april"),
				i18n.t("month-name-may"),
				i18n.t("month-name-june"),
				i18n.t("month-name-july"),
				i18n.t("month-name-august"),
				i18n.t("month-name-september"),
				i18n.t("month-name-october"),
				i18n.t("month-name-november"),
				i18n.t("month-name-december")
			];

			calendar
				.setWeekDayNames(weekDayNames)
				.setMonthNames(monthNames);
		}

		return calendar;
	}
}

module.exports = TelegrafWrapper;