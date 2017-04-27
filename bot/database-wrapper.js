const moment = require("moment");

const pg = require('pg');
pg.defaults.ssl = true;

module.exports = {

	check: function (onReminder) {
		connect(client => {
			getAllReminders(client, onReminder);
		});
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
	console.log("connecting");
	pg.connect(process.env.DATABASE_URL, function (err, client) {
		if (err) {
			console.log(err);
			return;
			//throw err;
		}
		console.log("Connected to the database");

		next(client);
	});
}

function getAllReminders(client, onReminder) {
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

			result.rows.forEach(row => {
				onReminder(row.chatid, row.firstdayofoill, row.pilltype);
			});

			client.end(function (err) {
				if (err) console.log(err);
			});
		});
}

function insertReminder(client, chatId, firstDayOfPill, pillType, time) {
	var queryText = 'INSERT INTO pillReminders(chatId, firstDayOfPill, pillType, time, creationDate)' +
		'VALUES($1, $2, $3, $4, $5) RETURNING id';
	console.log("inserting " + chatId + " " + firstDayOfPill + " " + pillType + " " + time);
	client.query(queryText, [chatId, firstDayOfPill, pillType, time, new Date()], function (err, result) {
		if (err) {
			console.log(err);
			return;
			//throw err;
		}

		var newlyCreatedUserId = result.rows[0].id;
		console.log("Id inserted row: " + newlyCreatedUserId);

		client.end(function (err) {
			if (err) console.log(err);
		});
	});
}

function removeReminder(client, chatId) {
	var queryText = 'DELETE FROM pillReminders WHERE chatId = $1';
	client.query(queryText, [chatId], function (err, result) {
		if (err) {
			console.log(err);
			return;
			//throw err;
		}

		console.log("Removed: " + chatId);
		console.log(result);

		client.end(function (err) {
			if (err) console.log(err);
		});
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

			client.end(function (err) {
				if (err) console.log(err);
			});
		});
}