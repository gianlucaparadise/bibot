var express = require('express');
var router = express.Router();

var botgram = require("botgram");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bibot' });
});

router.get('/register', function(req, res, next) {
  var bot = botgram(process.env.TELEGRAM_TOKEN);

  bot.command("start", function (msg, reply, next) {
    console.log("Ciao!", msg.from.id);
  });

  res.send("Register completed");
});

module.exports = router;
