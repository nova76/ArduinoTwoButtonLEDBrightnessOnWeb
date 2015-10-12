// server.js
var express        = require('express');
var app            = express();
var httpServer = require("http").createServer(app);
var five = require("johnny-five");
var io=require('socket.io')(httpServer);

var port = 3000; 

// server root
app.use(express.static(__dirname + '/public'));

// default index
app.get('/', function(req, res) {
        res.sendFile(__dirname + '/public/index.html');
});

httpServer.listen(port);  

console.log('Server available at http://localhost:' + port);  

var led, brightness = 0;

function ledDown(step){
	step = typeof step !== 'undefined' && step!=null ? step : 1;
	brightness = parseInt(brightness)-parseInt(step)
	if (brightness<0) brightness = 0;
	led.brightness(brightness);
	io.sockets.emit('led:value', brightness);
	console.log('LED value:'+brightness);
}
function ledUp(step){
	step = typeof step !== 'undefined' && step!=null ? step : 1;
	brightness = parseInt(brightness)+parseInt(step)
	if (brightness>255) brightness = 255;
	led.brightness(brightness);
	io.sockets.emit('led:value', brightness);
	console.log('LED value:'+brightness);
}

//Arduino board connection

var board = new five.Board();
board.on("ready", function() {
	console.log('Arduino connected');
	led = new five.Led(11);

	button1 = new five.Button({
		board: board,
		pin: 2,
		holdtime: 50,
		invert: false // Default: "false".  Set to "true" if button is Active-Low
	});	

	button2 = new five.Button({
		board: board,
		pin: 3,
		holdtime: 50,
		invert: false // Default: "false".  Set to "true" if button is Active-Low
	});
	button1.on("hold", ledDown);
	button2.on("hold", ledUp);
});

//Socket connection handler
io.on('connection', function (socket) {
  console.log(socket.id);
  io.sockets.emit('led:value', brightness);
  socket.on('led:up', function(){ledUp(10)});
  socket.on('led:down', function(){ledDown(10)});
  socket.on('led:value.from.client', function (data) {
	  brightness = data;
	  if (brightness>255) brightness = 255;
	  if (brightness<0) brightness = 0;
	  led.brightness(brightness);
	  console.log('LED value:'+brightness); 
  });		
});

console.log('Waiting for connection');