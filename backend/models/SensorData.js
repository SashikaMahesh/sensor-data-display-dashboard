const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    temperature: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index:true
    },
});

//Add validation for sensor values
sensorDataSchema.pre('save', function (next) {
    if (this.temperature < 0 ) {
        return next(new Error('Sensor value must be between 0 and 100'));
    }
    next();
});
module.exports = mongoose.model('SensorData', sensorDataSchema);