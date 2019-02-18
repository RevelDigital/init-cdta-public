var net = require('net');
var client = new net.Socket();
client.connect(5556, '10.0.0.122', function() {
    console.log('Connected');
});

client.on('data', function(data) {
    console.log('Received: ' + data);
    //client.destroy(); // kill client after server's response
});

client.on('close', function() {
    console.log('Connection closed');
});