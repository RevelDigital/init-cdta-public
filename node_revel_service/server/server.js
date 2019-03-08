const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
require('express-ws')(app);
const net = require('net');
const client = new net.Socket();
var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var copilotHelper = require('./copilotHelper');

const packageManager = require('./packageManagment');
let PORT = process.env.PORT || 5000;

let status = 'undefined';
let events = [];
let eventPolling = false;
let websocket;
let cameraSocketIP = "localhost";
let cameraSocketPort = 5556;

try{
    PORT = JSON.parse(fs.readFileSync('settings/server.settings').toString())['port'];

} catch (e) {
    console.log(e)
}
try{
    cameraSocketIP = JSON.parse(fs.readFileSync('settings/server.settings').toString())['camera_ip'];

} catch (e) {
    console.log(e)
}
try{
    cameraSocketPort = JSON.parse(fs.readFileSync('settings/server.settings').toString())['camera_port'];

} catch (e) {
    console.log(e)
}

copilotHelper.startCopilotSocket();
copilotHelper.eventCallback.addListener('new model', newEventModel=>{

    addEvent({name:'copilotInformation', arg: JSON.stringify(newEventModel)})
});

function start() {

    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
    app.use(express.static(path.join(__dirname, '../public'), {
        setHeaders: function (res, path) {
            res.setHeader('Access-Control-Allow-Headers', 'Etag')
        }
    }))
        .set('views', path.join(__dirname, 'views'))
        .set('view engine', 'ejs')
        .get('/', (req, res) => {
            res.setHeader("Cache-Control", "public, max-age=2592000");
            res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
            res.render('pages/webplayer')
        })
        .get('/debug', (req, res) => {
            res.setHeader("Cache-Control", "public, max-age=2592000");
            res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
            res.render('pages/testwebplayer')
        })
        .get('/getPackage', (req, res) => {
            status = 'undefined';
            res.send('received');
            packageManager.downloadPackage(req.query.url, setStatus);
        })
        .get('/getEvents', (req, res) => {
            eventPolling = true;
            res.send(JSON.stringify(events));
            events = [];
        })
        .get('/packageStatus', (req, res) => {
            res.send(status)
        })
        .get('/verifyPackage', (req, res) => {
            res.send(packageManager.verifyPackage())
        })
        .get('/regKey', (req, res) => {
            res.send(packageManager.readKey())
        })
        .post('/regKey', function (req, res) {
            const key = req.body.key;
            packageManager.writeKey(key);
            res.send(key);
        })
        .get('/settings', (req, res) => {
            res.send(packageManager.readSettings())
        })
        .post('/settings', function (req, res) {
            console.log(req.body.settings);
            packageManager.writeSettings(req.body.settings);
            res.send('{}');
        })
        .post('/reset', function (req, res) {
            packageManager.resetKey();
            res.send(null);
        });


    app.ws('/', function (ws, req) {
        ws.on('message', function (msg) {
            console.log(msg);
        });
        websocket = ws;
    });

    app.listen(PORT, () => console.log(`Listening on ${ PORT }`));


    server.on('error', (err) => {
        console.log(`server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', (msg, rinfo) => {
        console.log('received msg');
        addEvent([{name:'synchronize', arg:msg}]); //todo maybe needs true
        //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`server listening ${address.address}:${address.port}`);
    });

    server.bind(53836, () => {
        server.addMembership('239.0.1.222');
    });
}







var faceConnected = false;

function startFaceSocket() {
    console.log(cameraSocketPort, cameraSocketIP);
    client.setEncoding('utf8');
    client.connect(cameraSocketPort, cameraSocketIP, function () {
        faceConnected = true;
        console.log('Connected');
    });


    client.on('error', function (data) {
        client.destroy(); // kill client after server's response
    });

    client.on('data', function(data) {
        try{
            console.log(data);
            addEvent({name:'faceImpression', arg: JSON.stringify(JSON.parse(data))});
            //addEvent(JSON.stringify());
        } catch (e) {

        }
        //client.destroy(); // kill client after server's response
    });

    client.on('close', function () {
        faceConnected = false;
        console.log('Connection closed');
        client.destroy();
    });
}

setInterval(function () {
    if(!faceConnected){
        //startFaceSocket();
    }
}, 10000);



function sendUDPMessage(message) {
    server.send(message, 0, message.length, PORT, MULTICAST_ADDR, function() {
        console.info(`Sending message "${message}"`);
    });
}

function setStatus(st){
    status = st;
}

function addEvent(event){

    if(eventPolling){
        events.push(event);
    } else {
        if (websocket) {
            console.log('event', event);
            websocket.send(JSON.stringify(event));
            if(events.length>0){
                for(const item of events){
                    websocket.send(JSON.stringify(item));
                }
                events = [];
            }
        } else {
            events.push(event);
        }
    }
}

module.exports = {
    start: start
};

