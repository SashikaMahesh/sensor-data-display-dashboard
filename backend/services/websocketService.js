const WebSocket = require("ws");
const sensorData = require("../models/SensorData");

let ioInstance;

const initSensorWebSocketConnection = () => {
  const sensorSocket = new WebSocket(process.env.SENSOR_WS_URL);
  sensorSocket.on("open", () => {
    console.log("Connected to mock sensor WebSocket");
  });
  sensorSocket.on("message", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      const sensorDataEntry = new sensorData({
        temperature: parsedData.temperature,
        timestamp: parsedData.timestamp,
      });
      await sensorDataEntry.save();

      //Broadcast to Socket.IO clients
      if (ioInstance) {
        ioInstance.emit("realtime_temperature", sensorDataEntry);
      }
    } catch (error) {
      console.error("Error processing sensor data:", error);
    }
  });
  sensorSocket.on("close", () => {
    console.log("Sensor WebSocket connection closed");
  });
  sensorSocket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
};
const setIOInstance = (io) => {
  ioInstance = io;
};
module.exports={initSensorWebSocketConnection, setIOInstance};