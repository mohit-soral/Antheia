'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var serialport = require('serialport');
var readline = serialport.parsers.Readline;

var port = 9099;
var app = express();

app.use('/images', express.static('views/images'));
app.use('/js', express.static('views/js'));
app.use('/css', express.static('views/css'));
app.use('/fonts', express.static('views/fonts'));

//Body Parser Middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

//View Engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// var serialPortName = '/dev/ttyACM0';

// var myPort = new serialport(serialPortName, { autoOpen: false/*, baudRate: 115200*/ });
// var parser = myPort.pipe(new readline({ delimiter: '\n' }));

// parser.on('data', (data) => {
// 	console.log('Received Data :: ' + data);
// });

// myPort.open((error) => {
// 	if(error){
// 		console.log('Failed while trying to open port : ' + serialPortName + " With error :: " + error);
// 		process.exit(1);
// 	}
// })

// myPort.on('open', () => {
// 	console.log("Serial Communication open");
// })

// myPort.on('error', (err) => {
// 	console.log('Unable to Connect to Serial Port ' + serialPortName + 
// 		'.\nCheck if port is configured correctly, or whether you have connected the device !')
// 	process.exit(1)
// })

app.get("/", (request, response) => {
	response.render('index', {
		title: "Antheia - Plant Watering Management System"
	})
})

app.post("/water", (request, response) => {
	console.log('Received Request : ' + JSON.stringify(request.body));
	// myPort.write()
	response.render('index', {
		title: "Antheia - Plant Watering Management System"
	})
})

module.exports = app.listen(port, () => {
	console.log('Server has started. Listening on port ' + port);
})