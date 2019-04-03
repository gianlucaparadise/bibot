var express = require('express');
var router = express.Router();

const DatabaseWrapper = require('../bot/database-wrapper');
const Logger = require('./../logger');

/* GET home page. */
router.get('/', function (req, res, next) {
	DatabaseWrapper.getRemindersToDisplay()
		.then(reminders => {
			res.render('index', { title: 'Bibot', reminders: reminders });
		})
		.catch(ex => Logger.info(ex));
});

module.exports = router;
