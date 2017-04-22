const http = require("http");
setInterval(function () {
	http.get("http://bibot-telegram.herokuapp.com");
	console.log("Wake up, Bibot!");
}, 300000); // every 5 minutes (300000)