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
    console.log("Start from: ", msg.from.id);
    reply.text("Ciao! Sono Bibot.");
  });

  res.render('register', { title: 'Bibot', body: 'Registration completed' });
});

module.exports = router;
