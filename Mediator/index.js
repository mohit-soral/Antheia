'use strict';

var serialport = require('serialport');
var readline = serialport.parsers.Readline;
var elasticsearch = require('elasticsearch');
var nodemailer = require('nodemailer');
var fs = require('fs');
var csv = require('fast-csv');

var es_client = new elasticsearch.Client({
	host : config.get(elasticsearch_endpoint)
})

const PUSH_TO_ES = true;
var errorOccurred = false;
var csvStream;
var writableStream;

if(PUSH_TO_ES){
	console.log('Checking connection to ElasticSearch...')

	es_client.ping({
		requestTimeout : 30000
	}, (error) => {
		if(error){
			console.error('Unable to reach es cluster');
			process.exit(1);
		} else{
			console.log('Communication with ES Cluster successful !');
		}
	})
} else {
	console.log('Not requied to check connection to ElasticSearch');
}

console.log('Establishing connection with serial port...')

var portName = '/dev/ttyACM0';
 
var myPort = new serialport(portName, { autoOpen: false/*, baudRate: 115200*/ });
var parser = myPort.pipe(new readline({ delimiter: '\n' }));

parser.on('data', (data) => {
	pushToES(data.toString(), new Date().toISOString());
});

myPort.open((error) => {
	if(error){
		console.log('Failed while trying to open port : ' + portName + " With error :: " + error);
		process.exit(1);
	}
})

myPort.on('open', () => {
	console.log("Serial Communication open");
	/*myPort.on('data', (data) => {
		console.log('Incomming Data : ' + data.toString());
		pushToES(data.toString(), new Date().toISOString());
	})*/
})

myPort.on('error', (err) => {
	console.log('Unable to Connect to Serial Port ' + portName + 
		'.\nCheck if port is configured correctly, or whether you have connected the device !')
	process.exit(1)
})

function pushToES(value, time){
	if(PUSH_TO_ES){
		if(isNaN(value)){
			return;
		}
		console.log('pushing to index : ' + value)

		es_client.index({
			index: 'test-index',
			type: 'Data',
			body: {
				reading: parseInt(value), 
				device: 'device1',
				timestamp: time,
			}/*,
			pipeline: 'my-pipeline-id',*/
		}, function(error, response){
			if(error){
				if(!errorOccurred){
					errorOccurred = true;
					console.log('Error while trying to push Data to ES. Starting backup to file');
					csvStream = csv.createWriteStream({headers: true});
					writableStream = fs.createWriteStream("failure-backup-"+time+".csv");

					writableStream.on("finish", function(){
					  console.log("DONE!");
					});

					csvStream.pipe(writableStream);
				}
				console.error('failed to index record :: ' + error);
				// sendAlertMail(time + " :: " + value);
				csvStream.write({timestamp: time, reading: value});
			}else{
				// console.log('Data indexed')
				if(errorOccurred){
					console.log('Error with connection to ES, seems to have resolved now');
					csvStream.end();
					errorOccurred = false;
				}
			}
		})
	} else {
		console.log('Reading :: ' + value);
	}
}

function saveToFile(time, value, fileName){
	
	csvStream.write({a: "a3", b: "b4"});
	
}

function sendAlertMail(dataRecord){
	var transporter = nodemailer.createTransport({
	  service: config.get('mail_service'),
	  auth: {
	    user: config.get('mail_id'),
	    pass: config.get('mail_password')
	  }
	});

	var mailOptions = {
	  from: config.get('mail_id'),
	  to: config.get('mail_to_id'),
	  subject: 'Data Collection failure',
	  text: 'Unable to push record to ES : ' + dataRecord
	};

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	});
}