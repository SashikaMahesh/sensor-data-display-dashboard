import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { format } from "date-fns";

const TemperatureChart = ({
  data,
  title = "Temperature Chart",
  height = 400,
  showStats = true,
  timeFormat = "HH:mm:ss",
}) => {
  // Process and format data for the chart
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // Reverse the data array to have the latest data on the right
    return data
      .slice()
      .reverse()
      .map((reading, index) => ({
        ...reading,
        index: data.length - 1 - index, // Adjust index to reflect reversed order
        temperature: Number(reading.temperature),
        formattedTime: format(new Date(reading.timestamp), timeFormat),
        tooltipTime: format(new Date(reading.timestamp), "MMM dd, HH:mm:ss"),
      }));
  }, [data, timeFormat]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData.length) return null;

    const temperatures = chartData.map((d) => d.temperature);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg =
      temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;

    return {
      min: min.toFixed(1),
      max: max.toFixed(1),
      avg: avg.toFixed(1),
      count: temperatures.length,
    };
  }, [chartData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card sx={{ minWidth: 200, boxShadow: 3 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="body2" color="text.secondary">
              {data.tooltipTime}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              {data.temperature}°C
            </Typography>
            {data.sensorName && (
              <Typography variant="caption" color="text.secondary">
                {data.sensorName}
              </Typography>
            )}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  // Get average line value for reference
  const avgTemp = stats ? parseFloat(stats.avg) : 0;

  if (!chartData.length) {
    return (
      <Card sx={{ height }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // const yMin = Math.min(...chartData.map((d) => d.temperature)) - 1; // a little padding
  // const yMax = Math.max(...chartData.map((d) => d.temperature)) + 1;
  const rawMin = Math.min(...chartData.map((d) => d.temperature));
  const rawMax = Math.max(...chartData.map((d) => d.temperature));
  const yMin = rawMin - 1;
  const yMax = rawMax + 1;
  // Helper to clamp ranges
  const clamp = (val) => Math.max(yMin, Math.min(yMax, val));
  return (
    <Card sx={{ height: "auto" }}>
      <CardContent>
        {/* Header with title and stats */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="h6" component="h2">
            {title}
          </Typography>

          {showStats && stats && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={`Min: ${stats.min}°C`}
                size="small"
                color="info"
                variant="outlined"
              />
              <Chip
                label={`Avg: ${stats.avg}°C`}
                size="small"
                color="success"
                variant="outlined"
              />
              <Chip
                label={`Max: ${stats.max}°C`}
                size="small"
                color="warning"
                variant="outlined"
              />
              <Chip
                label={`${stats.count} readings`}
                size="small"
                variant="outlined"
              />
            </Box>
          )}
        </Box>

        {/* Chart Container */}
        <Box sx={{ width: "100%", height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e0e0"
                opacity={0.7}
              />

              <XAxis
                dataKey="formattedTime"
                stroke="#666"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={Math.max(0, Math.floor(chartData.length / 10))}
              />

              <YAxis
                stroke="#666"
                fontSize={12}
                label={{
                  value: "Temperature (°C)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
                domain={["dataMin - 1", "dataMax + 1"]}
              />

              <Tooltip content={<CustomTooltip />} />
              {/* Background color zones */}
              <ReferenceArea y1={clamp(yMin)} y2={clamp(18)} fill="#90caf9" fillOpacity={0.3} /> // Blue
<ReferenceArea y1={clamp(18)} y2={clamp(22)} fill="#c3f8d3" fillOpacity={0.3} /> // Green
<ReferenceArea y1={clamp(22)} y2={clamp(26)} fill="#fcd4a5" fillOpacity={0.3} /> // Amber
<ReferenceArea y1={clamp(26)} y2={clamp(yMax)} fill="#f5b7a8" fillOpacity={0.3} /> // Red

              {/* Average temperature reference line */}
              {stats && (
                <ReferenceLine
                  y={avgTemp}
                  stroke="#ff9800"
                  strokeDasharray="5 5"
                  opacity={0.7}
                  label={{
                    value: `Avg: ${stats.avg}°C`,
                    position: "top",
                    fontSize: 12,
                    fill: "#ff9800",
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#359ace"
                strokeWidth={1}
                dot={{
                  fill: "#3368a9",
                  strokeWidth: 1,
                  r: 2,
                }}
                activeDot={{
                  r: 3,
                  fill: "##3368a9",
                  strokeWidth: 2,
                }}
                connectNulls={false}
                isAnimationActive={false} // Disable animation for existing data
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TemperatureChart;
