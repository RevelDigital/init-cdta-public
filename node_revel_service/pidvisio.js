const http = require('http');
const port = 3000;
let exec = require('child_process').exec;
const command = 'gst-launch-1.0 rtspsrc location="rtsp://192.168.243.50:8554/test"  ! rtph264depay ! h264parse ! imxvpudec ! imxg2dvideosink show-preroll-frame=false output-rotation=2'


const requestHandler = (request, response) => {
    response.end('Pidviso Is rebooting');
    exec("reboot", (error, stdout, stderr) => {})
};

const server = http.createServer(requestHandler);

function startStreaming(){
    exec("echo 0 > /sys/devices/virtual/graphics/fbcon/cursor_blink", (error, stdout, stderr) => {});
    exec(command, (error, stdout, stderr) => {
        console.log('ran command');
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        setTimeout(()=>{startStreaming()},15*1000)
    })
}

startStreaming();

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
});