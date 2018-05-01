var express = require('express');
var router = express.Router();

const DatabaseWrapper = require('../bot/database-wrapper');

/* GET home page. */
router.get('/', function (req, res, next) {
	DatabaseWrapper.getRemindersToDisplay(reminders => {
		res.render('index', { title: 'Bibot', reminders: reminders });
	});
});

module.exports = router;
