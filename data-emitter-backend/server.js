const WebSocket = require('ws');
const server=new WebSocket.Server({ port: 4000});
console.log("Mock sensor server is running on port 4000");

server.on('connection', (ws) => {
    console.log('Main server connected to the mock sensor server');
    const sendTemperatureData = () => {
        const data={
            temperature:(20 + Math.random() * 10).toFixed(2), // Random temperature between 20 and 30
            timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(data));
    };
    const interval= setInterval(sendTemperatureData, 1000); // Send data every 0.5 seconds
    ws.on('close', () => {
        clearInterval(interval);
        console.log('Main server disconnected from the mock sensor server');
    });
});