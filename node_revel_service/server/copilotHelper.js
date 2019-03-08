const net = require('net');
const client = new net.Socket();
const xml = require("xml-parse");
const events = require('events');
const appInfoRequest = `<IsiGet><Items>AppName</Items></IsiGet>`;
const appInfoResponse = `<IsiPut><AppName>INFOTAINMENT</AppName></IsiPut>`;
const requestDeviceInfo = `<IsiGet><Items>DeviceState</Items><OnChange>DeviceState</OnChange><Cyclic>60</Cyclic></IsiGet>`;
const deviceInfoResponse = `<IsiPut><DeviceState>9,1,100</DeviceState></IsiPut>`;
const softwareVersionRequest = `<IsiGet><Items>CurrentSoftwareVersion CurrentParameterVersion</Items></IsiGet>`;
const softwareVersionResponse = `<IsiPut><CurrentParameterVersion>ABCDEF</CurrentParameterVersion><CurrentSoftwareVersion>V53.12</CurrentSoftwareVersion></IsiPut>`;
const vehicleNumberRequest = `<IsiGet><Items>VehicleNo</Items></IsiGet>`;
const shutdownRequest = `<IsiGet><Items>ShutdownState</Items><OnChange>*</OnChange></IsiGet>`;
const destinationRequest = `<IsiGet><Items>Destination LineName</Items><OnChange>*</OnChange></IsiGet>`;
const interiorTextRequest = `<IsiGet><Items>IntDispFreeTextInfo</Items><OnChange>*</OnChange></IsiGet>`;
const gpggaRequest = `<IsiGet><Items>GPGGA</Items><OnChange>*</OnChange></IsiGet>`;
const gprmcRequest = `<IsiGet><Items>GPRMC</Items><OnChange>*</OnChange></IsiGet>`;
const stopsRequest = `<IsiGet><Items>CurrentStop Stop2 Stop3 Stop4 Stop5</Items><OnChange>*</OnChange></IsiGet>`;
const stopsTimeRequest = `<IsiGet><Items>ArrivalTimeDeltaCurrentStop ArrivalTimeDeltaLastStop ArrivalTimeDeltaStop2 ArrivalTimeDeltaStop3 ArrivalTimeDeltaStop4 ArrivalTimeDeltaStop5</Items><OnChange>*</OnChange> </IsiGet>`

const eventEmitter = new events.EventEmitter();

let timer;

let model = {
    "shutdown state" : null,
    "route" : {
        "destination" : null,
        "line name" : null,
        "stops" : {
            "current stop" : null,
            "stop 2" : null,
            "stop 3" : null,
            "stop 4" : null,
            "stop 5" : null,
        },
        "times":{
            "current stop" : null,
            "last stop" : null,
            "stop 2" : null,
            "stop 3" : null,
            "stop 4" : null,
            "stop 5" : null,
        }
    },
    "vehicle" : {
        "number" : null,
        "internal display text" : null
    },
    "location" : {
        "latitude" : null,
        "longitude" : null
    },
};


//todo reconnection on failure or disconnect
function startCopilotSocket() {
    client.setEncoding('utf8');
    client.connect(51001, '192.168.243.1', function () {
        console.log('Connected To Copilot');
    });


    client.on('error', function (data) {
        client.destroy(); // kill client after server's response
    });

    client.on('data', function(data) {
        try{
            switch (data) {
                case appInfoRequest:
                    client.write(appInfoResponse);
                    // start request for continuous information from copilot
                    client.write(vehicleNumberRequest);
                    client.write(shutdownRequest);
                    client.write(destinationRequest);
                    client.write(interiorTextRequest);
                    client.write(gpggaRequest);
                    client.write(gprmcRequest);
                    client.write(stopsRequest);
                    client.write(stopsTimeRequest);
                    break;
                case requestDeviceInfo:
                    client.write(deviceInfoResponse);
                    if(timer){
                        clearInterval(timer);
                    }
                    setInterval(()=>{
                        client.write(deviceInfoResponse);
                    }, 59*1000);
                    break;
                case softwareVersionRequest:
                    client.write(softwareVersionResponse);
                default:
                    try {
                        for (const val of xml.parse(data)) {
                            parseIntoJSON(val);
                        }
                    } catch(e){}
            }

        } catch (e) {

        }
    });

    client.on('close', function () {
        console.log('Connection closed');
        client.destroy();
    });
}


function parseIntoJSON(json){
    if(json.innerXML.indexOf('VehicleNo')>-1){
        model.vehicle.number = json.childNodes[0].innerXML;
    } else if(json.innerXML.indexOf('ShutdownState')>-1){
        model["shutdown state"] = json.childNodes[0].innerXML;
    } else if(json.innerXML.indexOf('IntDispFreeTextInfo')>-1){
       model.vehicle["internal display text"] = json.childNodes[0].innerXML;
    } else if(json.innerXML.indexOf('GPGGA')>-1){
        const patternMatch = new RegExp("^\\$GPGGA,([\\d\\.]*),([\\d\\.]+),([NS]),([\\d\\.]+),([EW]),.*");
        const groups = patternMatch.exec(json.childNodes[0].innerXML);
        let lat = parseFloat(groups[2].substring(2)/60);
        lat += parseInt(groups[2].substring(0,2), 10);
        if(groups[3] === "S") lat *= -1;
        let long = parseFloat(groups[4].substring(3)/60);
        long += parseInt(groups[4].substring(0,3), 10);
        if(groups[5] === "W") long *= -1;
        model.location.latitude = lat;
        model.location.longitude = long
    } else if(json.innerXML.indexOf('GPRMC')>-1){
        try {
            const patternMatch = new RegExp("\\$GPPRMC,([a-z0-9\\.]*,)+([a-z0-9]{1,2}\\*[a-z0-9]{1,2})");
            patternMatch.compile();
            const groups = patternMatch.exec(json.childNodes[0].innerXML);
            console.log(groups, json.childNodes[0].innerXML, json);
        } catch (e) {
            console.log(e)
        }

        // model.location.latitude = lat;
        // model.location.longitude = long
    }
    else if(json.innerXML.indexOf('Destination')>-1){
        for(const val of json.childNodes){
            if(val.tagName === 'Destination') model.route.destination = val.innerXML;
            else model.route["line name"] = val.innerXML
        }
    } else if(json.innerXML.indexOf('<CurrentStop>')>-1){
        for(const val of json.childNodes){
            if(val.tagName === 'CurrentStop') model.route.stops["current stop"] = val.innerXML;
            else if(val.tagName === 'Stop2') model.route.stops["stop 2"] = val.innerXML;
            else if(val.tagName === 'Stop3') model.route.stops["stop 3"] = val.innerXML;
            else if(val.tagName === 'Stop4') model.route.stops["stop 4"] = val.innerXML;
            else if(val.tagName === 'Stop5') model.route.stops["stop 5"] = val.innerXML;
        }
    } else if(json.innerXML.indexOf('<ArrivalTimeDeltaCurrentStop>')>-1){
        for(const val of json.childNodes){
            if(val.tagName === 'ArrivalTimeDeltaCurrentStop') model.route.times["current stop"] = val.innerXML;
            else if(val.tagName === 'ArrivalTimeDeltaLastStop') model.route.times["last stop"] = val.innerXML;
            else if(val.tagName === 'ArrivalTimeDeltaStop2') model.route.times["stop 2"] = val.innerXML;
            else if(val.tagName === 'ArrivalTimeDeltaStop3') model.route.times["stop 3"] = val.innerXML;
            else if(val.tagName === 'ArrivalTimeDeltaStop4') model.route.times["stop 4"] = val.innerXML;
            else if(val.tagName === 'ArrivalTimeDeltaStop5') model.route.times["stop 5"] = val.innerXML;
        }
    }  else {
        return;
    }
    //emit event
    eventEmitter.emit('new model',model);


}



module.exports = {
    startCopilotSocket: startCopilotSocket,
    eventCallback: eventEmitter
};