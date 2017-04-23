const moment = require("moment");

const pg = require('pg');
pg.defaults.ssl = true;

module.exports = {

	check: function () {
		connect(getAllReminders);
	},

	insert: function (chatId, date, pillType, time) {
		connect(client => {
			insertReminder(client, chatId, date, pillType, time);
		});
	},

	hasReminder: function (chatId) {
		connect(client => {
			hasReminderByChatId(client, chatId);
		});
	},

	remove: function (chatId) {
		connect(client => {
			removeReminder(client, chatId);
		})
	}
}

function connect(next) {
	pg.connect(process.env.DATABASE_URL, function (err, client) {
		if (err) throw err;
		console.log("Connected to the database");

		next(client);
	});
}

function getAllReminders(client) {
	let time = moment().format("HH:mm");
	console.log('SELECT * FROM pillReminders WHERE time = \'' + time + '\';');

	client
		.query('SELECT * FROM pillReminders WHERE time = \'' + time + '\';')
		.on('row', function (row, result) {
			console.log(JSON.stringify(row));
			result.addRow(row);
		})
		.on('end', function (result) {
			console.log(result.rows.length + ' rows were received');

			/*var hasUrl = _.some(result.rows, function (row) {
				return compareUrls(row.url, url);
			});*/
		});
}

function insertReminder(client, chatId, firstDayOfPill, pillType, time) {
	var queryText = 'INSERT INTO pillReminders(chatId, firstDayOfPill, pillType, time, creationDate)' +
		'VALUES($1, $2, $3, $4, $5) RETURNING id';
	client.query(queryText, [chatId, firstDayOfPill, pillType, time, new Date()], function (err, result) {
		if (err) throw err;

		var newlyCreatedUserId = result.rows[0].id;
		console.log("Id inserted row: " + newlyCreatedUserId);
	});
}

function removeReminder(client, chatId) {
	var queryText = 'DELETE FROM pillReminders WHERE chatId = $1';
	client.query(queryText, [chatId], function (err, result) {
		if (err) throw err;

		console.log("Removed: " + chatId);
	});
}

function hasReminderByChatId(client, chatId) {
	console.log('SELECT * FROM pillReminders WHERE chatId = \'' + chatId + '\';');

	client
		.query('SELECT * FROM pillReminders WHERE chatId = \'' + chatId + '\';')
		.on('row', function (row, result) {
			console.log(JSON.stringify(row));
			result.addRow(row);
		})
		.on('end', function (result) {
			console.log(result.rows.length + ' rows were received');

			/*var hasUrl = _.some(result.rows, function (row) {
				return compareUrls(row.url, url);
			});*/
		});
}