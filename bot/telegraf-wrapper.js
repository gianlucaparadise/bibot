// Bot as a singleton

const Telegraf = require('telegraf');

var bot = null;

module.exports = {
	getBot: function () {
		if (bot == null) {
			bot = new Telegraf(process.env.TELEGRAM_TOKEN);

			// todo: check if context is unique per user. Set 2 timers at the same time using different users
			//bot.context({ isAsking: ConfigState.NONE });

			bot.use(Telegraf.memorySession());

			console.log("Bot initialized");
		}

		return bot;
	},

	getExtra: function () {
		console.log(JSON.stringify(Telegraf));
		return Telegraf.Extra;
	}
}