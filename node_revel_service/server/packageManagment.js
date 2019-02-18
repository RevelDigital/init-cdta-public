const fs = require('fs');
const unzipper = require('node-unzip-2');
const xpath = require('xpath'), dom = require('xmldom').DOMParser;
const BigInteger = require('node-biginteger');
cryptolib = require('crypto');
const fetch = require('node-fetch');


function readSettingsFile() {
    try{
        return fs.readFileSync('settings/app.settings').toString();
    } catch (e) {
       return null;
    }
}

function writeSettingsFile(settings) {
    return new Promise(function(resolve, reject) {
        fs.writeFile('settings/app.settings', settings, function(err){
            if(err){
                reject(err);
            }else{
                resolve(true);
            }
        });
    })
}

function getRegKey() {
    try{
        return fs.readFileSync('extras/device.key').toString();
    } catch (e) {
        return null;
    }

}

function reset() {
    try{
        fs.unlinkSync('extras/device.key');
    } catch (e) {
        
    }
}

function writeRegKey(regKey) {
    return new Promise(function(resolve, reject) {
        fs.writeFile('extras/device.key', regKey, function(err){
            if(err){
                reject(err);
            }else{
                resolve(true);
            }
        });
    })
}


function verifyPackage(){
    const fileA = fs.readFileSync('public/package/reveldigital.xml');
    const fileB = fs.readFileSync('public/package/reveldigital.json');

    const a = BigInteger.fromBuffer(1, cryptolib.createHash('md5').update(fileA,'utf-8').digest());
    const b = BigInteger.fromBuffer(1, cryptolib.createHash('md5').update(fileB,'utf-8').digest());
    const verifier = cryptolib.createVerify('sha1WithRSAEncryption');
    verifier.update(new Buffer(strToByteArray(a.add(b).toString())));
    return verifier.verify(fs.readFileSync('cert').toString(), fs.readFileSync('public/package/signature').toString(),'base64');
}

function strToByteArray(string) {
    let result = [];
    for (let i = 0; i < string.length; i ++) {
        let chr = string.charCodeAt(i);
        let byteArray = [];
        while (chr > 0) {
            byteArray.push(chr & 0xFF);
            chr >>= 8;
        }
        // all utf-16 characters are two bytes
        if (byteArray.length == 1) {
            byteArray.push(0);
        }
        result = result.concat(byteArray);
    }
    return result;
}

function downloadAssets (url, callback) {
    'use strict';
    console.log('started');
    callback('undefined');
    let timestamp = '';
    try {
        timestamp = fs.readFileSync('public/package/timestamp', 'utf8');
    } catch (e) {
    }
    let files = [];

    try {
        fs.readdirSync('public/package/media').forEach(file => {
            let stats = fs.statSync('public/package/media/' + file);
            files.push({
                ImageFile: decodeURIComponent(file),
                Timestamp: stats.mtime
            });
        });
    } catch (e) {

    }
    let postData = {Files: files};

    fetch(url, {
        body: postData, // must match 'Content-Type' header
        headers: {
            'If-None-Match': timestamp,
            'Content-Type': 'application/json'
        },
        method: 'POST', // *GET, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *same-origin
        redirect: 'follow', // *manual, error
        referrer: 'no-referrer' // *client
    }).then(res => {
        if(res.status!==304) {
            return new Promise((resolve, reject) => {
                const dest = fs.createWriteStream('extras/scheduleAssets.zip');
                res.body.pipe(dest);
                res.body.on('error', err => {
                    console.log(error);
                    reject(err);
                });
                dest.on('finish', () => {
                    console.log('unzipping');
                    fs.createReadStream('extras/scheduleAssets.zip').pipe(unzipper.Extract({path: 'public/package'}).on('close', function () {
                        console.log('done');
                        callback('done');
                        fs.unlinkSync('extras/scheduleAssets.zip');
                        try {
                            let files = [];
                            let doc = new dom().parseFromString(fs.readFileSync('public/package/reveldigital.xml', 'utf8'));
                            let nodes = xpath.evaluate("//source/value", doc, null, xpath.XPathResult.ANY_TYPE, null);
                            let node = nodes.iterateNext();
                            while (node) {
                                files.push(node.firstChild.data);
                                node = nodes.iterateNext();
                            }
                            nodes = xpath.select("//module/option[@name = 'File']/@value", doc);
                            for (const val of nodes) {
                                files.push(val.value);
                            }
                            fs.readdirSync('public/package/media').forEach(file => {
                                if (files.indexOf(file) < 0) {
                                    console.log('deleted: ' + file);
                                    fs.unlinkSync('public/package/media/' + file);
                                }
                            });
                        } catch (e) {

                        }
                    }).on('error', function(error) {
                      console.log('error', error)
                    }));
                    resolve();
                });
                dest.on('error', err => {
                    reject(err);
                });
            });
        }else{
            callback('done');
            console.log('done');
            console.log('package up to date');
        }

    });
}


module.exports = {
    downloadPackage: downloadAssets,
    verifyPackage: verifyPackage,
    readKey: getRegKey,
    writeKey: writeRegKey,
    resetKey: reset,
    writeSettings: writeSettingsFile,
    readSettings: readSettingsFile
};

