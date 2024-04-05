require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initSensorWebSocketConnection, setIOInstance } = require('./services/websocketService');

const app = express();
app.use(cors({
  origin: '*',  // You can specify your frontend URL instead of '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST"]
});

setIOInstance(io);
connectDB();
initSensorWebSocketConnection();

app.use(express.json());
app.use('/api', require('./routes/sensor'));

io.on('connection', (socket) => {
  console.log('Frontend client connected');

  socket.on('disconnect', () => {
    console.log('Frontend client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Data server running on http://localhost:${PORT}`);
});
