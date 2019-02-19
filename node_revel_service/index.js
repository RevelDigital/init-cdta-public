const fs = require('fs');
const unzip = require('node-unzip-2');
const https = require('https');


function update(location, metaName, tempZipName, unzipLocation) {
    return new Promise( function (resolve, reject) {

        cb = (text) => {console.log(text)};
        let etag = '';
        try {
            let temp = JSON.parse(fs.readFileSync('extras/'+metaName).toString()).etag;
            if(temp){
                etag = temp;
            }
        } catch (e){}
        const file = fs.createWriteStream("extras/"+tempZipName);
        const options = {
            host: 's3.amazonaws.com',
            port:443,
            path: '/reveldigital-webplayer-package/'+location,
            headers: {
                'If-None-Match': etag
            }
        };

        https.get(options, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                console.log('Downloading finished');
                if (response.statusCode !== 304) {
                    fs.writeFile('extras/'+metaName, JSON.stringify({etag: response.headers.etag}), function (err) {
                        console.log('wrote '+metaName, response.headers.etag);
                    });
                    console.log('unzipping...');
                    try {
                        fs.createReadStream('extras/'+tempZipName).pipe(unzip.Extract({path: unzipLocation}).on('close', function () {
                            console.log('Unzipped!');
                            resolve();
                            fs.unlinkSync('extras/'+tempZipName);
                        }));
                    } catch (e) {
                        console.log(e, 'error testing')
                    }

                } else {
                    fs.unlinkSync('extras/'+tempZipName);

                    console.log('App Is Current');
                    resolve()
                }

                file.close(cb);  // close() is async, call cb after close completes.

            });
        }).on('error', (err)=> { // Handle errors
            console.log(err, 'testing');
            fs.unlinkSync('extras/'+tempZipName); // Delete the file async. (But we don't check the result)
            resolve();
            if (cb) cb(err.message);

        });
    });
}




function main(){
    try {
        update('server.zip', 'serverMeta.json', 'serverTemp.zip', './').then(() => {
            update('dist.zip', 'appMeta.json', 'appTemp.zip', 'public/').then(() => {
                require('./server/server').start()
            })
        });
    } catch(e){
        require('./server/server').start()
    }

}

main();
