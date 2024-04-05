const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');

// Get latest sensor readings
router.get('/readings/latest', async (req, res) => {
  const { limit = 100 } = req.query;
  try {
    const data = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching latest readings' });
  }
});

// Get historical sensor data by date range
router.get('/readings/range',async (req, res) => {
  const { start, end } = req.query;
  try {
    const data = await SensorData.find({
      timestamp: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
    }).sort({ timestamp: 1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching historical data' });
  }
});

// Get temperature statistics
router.get('/readings/stats',async (req, res) => {
  try {
    const stats = await SensorData.aggregate([
      {
        $group: {
          _id: null,
          avgValue1: { $avg: '$value1' },
          minValue1: { $min: '$value1' },
          maxValue1: { $max: '$value1' },
          avgValue2: { $avg: '$value2' },
          minValue2: { $min: '$value2' },
          maxValue2: { $max: '$value2' },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json({ success: true, data: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching statistics' });
  }
});

// Get hourly aggregated data
router.get('/readings/hourly', async (req, res) => {
  const { hours = 24 } = req.query;
  const start = new Date(Date.now() - hours * 60 * 60 * 1000);
  try {
    const data = await SensorData.aggregate([
      { $match: { timestamp: { $gte: start } } },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          },
          avgValue1: { $avg: '$value1' },
          avgValue2: { $avg: '$value2' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching hourly data' });
  }
});

// Get server status
router.get('/status', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      success: true,
      data: {
        status: 'running',
        db: dbStatus,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error checking server status' });
  }
});

// Receive data from sensors
router.post('/sensor/data', async (req, res) => {
  const { value1, value2 } = req.body;
  try {
    const data = {
      value1,
      value2,
      timestamp: new Date(),
    };
    if (!data.value1 || !data.value2 || !data.timestamp) {
      throw new Error('Invalid sensor data');
    }
    const sensorData = new SensorData(data);
    await sensorData.save();
    console.log(`Saved sensor data: ${JSON.stringify(data)}`);

    // Broadcast to Socket.IO clients
    const io = req.app.get('io');
    io.emit('sensorData', data);

    res.status(201).json({ success: true, message: 'Data received and saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error saving sensor data' });
  }
});

module.exports = router;