module.exports = {
	debug: function (text) {
		if (!process.env.BOT_ENV || process.env.BOT_ENV !== 'dev') return;

		console.log(text);
	},
	info: function (text) {
		console.log(text);
	}
}