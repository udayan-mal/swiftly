const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 3003 });

wss.on('connection', function connection(ws) {
    console.log('Relay client connected');
    ws.on('error', console.error);

    ws.on('message', function message(data) {
        // Echo or relay logic
    });
});

console.log('Relay service running on port 3003');
