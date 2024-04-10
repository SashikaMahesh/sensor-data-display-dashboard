import React, { useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  Skeleton,
  Paper,
} from "@mui/material";
import {
  ThermostatAuto as TempIcon,
  Schedule as TimeIcon,
  ShowChart as ChartIcon,
  Sensors as SensorIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useSocket } from "../../context/SocketContext";
import TemperatureChart from "../../components/Charts/TemperatureChart";
import TemperatureTable from "../../components/Tables/TemperatureTable";

const HomePage = () => {
  const {
    isConnected,
    lastReading,
    getLatest10Readings,
    getRealtimeChartData,
    getConnectionInfo,
    requestLatestReadings,
  } = useSocket();

  const connectionInfo = getConnectionInfo();
  const latest10Readings = getLatest10Readings();
  const chartData = getRealtimeChartData();

  // Request initial data when component mounts
  useEffect(() => {
    if (isConnected) {
      requestLatestReadings(15);
    }
  }, [isConnected, requestLatestReadings]);

  // Current temperature display component
  const CurrentTemperatureCard = () => {
    if (!lastReading) {
      return (
        <Card sx={{ height: "100%", display: "flex", alignItems: "center" }}>
          <CardContent sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width="60%" height={24} />
            </Box>
            <Skeleton variant="text" width="50%" height={56} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="70%" height={20} />
          </CardContent>
        </Card>
      );
    }

    const getTemperatureColor = (temp) => {
      if (temp < 18) return "#2196f3";
      if (temp < 22) return "#4caf50";
      if (temp < 28) return "#ff9800";
      return "#f44336";
    };

    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: `linear-gradient(135deg, ${getTemperatureColor(
            lastReading.temperature
          )}15, ${getTemperatureColor(lastReading.temperature)}05)`,
        }}
      >
        <CardContent sx={{ width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TempIcon
              sx={{
                mr: 1,
                color: getTemperatureColor(lastReading.temperature),
              }}
            />
            <Typography variant="h7">Current Value</Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              color: getTemperatureColor(lastReading.temperature),
              fontWeight: "bold",
              mb: 1,
            }}
          >
            {lastReading.temperature}°C
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {format(new Date(lastReading.timestamp), "MMM dd, HH:mm:ss")}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Stats cards component
  const StatsCards = () => {
    if (!chartData.length) {
      return (
        <>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                    <Skeleton variant="text" width="60%" height={20} />
                  </Box>
                  <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={16} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </>
      );
    }

    const temperatures = chartData.map((d) => d.temperature);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg =
      temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;

    const stats = [
      {
        label: "Minimum",
        value: `${min.toFixed(1)}°C`,
        color: "#2196f3",
        icon: <TempIcon />,
      },
      {
        label: "Average",
        value: `${avg.toFixed(1)}°C`,
        color: "#4caf50",
        icon: <TempIcon />,
      },
      {
        label: "Maximum",
        value: `${max.toFixed(1)}°C`,
        color: "#f44336",
        icon: <TempIcon />,
      },
    ];

    return (
      <>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ color: stat.color, mr: 1 }}>{stat.icon}</Box>
                  <Typography variant="h7" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: stat.color, fontWeight: "bold" }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last {chartData.length} readings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </>
    );
  };

  // System Status Skeleton
  const SystemStatusSkeleton = () => (
    <Paper sx={{ p: 2, backgroundColor: "background.default" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Skeleton variant="text" width="30%" height={24} />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Skeleton variant="rounded" width={120} height={24} />
          <Skeleton variant="rounded" width={100} height={24} />
          <Skeleton variant="rounded" width={140} height={24} />
        </Box>
      </Box>
    </Paper>
  );

  // System Status Component
  const SystemStatus = () => {
    // Show skeleton if not connected or no connection info
    if (!isConnected || !connectionInfo) {
      return <SystemStatusSkeleton />;
    }

    return (
      <Paper sx={{ p: 2, backgroundColor: "background.default" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            System Status
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`Connection: ${connectionInfo.statusText}`}
              color={connectionInfo.statusColor}
              variant="outlined"
              size="small"
            />

            <Chip
              label={`Data Points: ${chartData.length}`}
              color="primary"
              variant="outlined"
              size="small"
            />

            {lastReading && (
              <Chip
                label={`Last Update: ${format(
                  new Date(lastReading.timestamp),
                  "HH:mm:ss"
                )}`}
                color="success"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  // Chart Skeleton
  const ChartSkeleton = () => (
    <Card sx={{ height: 400 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
          <Skeleton variant="text" width="40%" height={24} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={320} />
      </CardContent>
    </Card>
  );

  // Table Skeleton
  const TableSkeleton = () => (
    <Card sx={{ height: 400 }}>
      <CardContent>
        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
        {[...Array(8)].map((_, index) => (
          <Box key={index} sx={{ display: "flex", gap: 2, mb: 1 }}>
            <Skeleton variant="text" width="30%" height={20} />
            <Skeleton variant="text" width="25%" height={20} />
            <Skeleton variant="text" width="45%" height={20} />
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1">
            Disconnected from server. Attempting to reconnect...
          </Typography>
        </Alert>
      )}

      {isConnected && connectionInfo?.status === "sensor_disconnected" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1">
            Connected to server but sensor is offline. No new data is being
            received.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Status - Mobile/Tablet */}
        <Grid size={{ md: 12, lg: 4 }} sx={{display:{md:"block",lg:"none"}}}>
          <SystemStatus />
        </Grid>

        {/* Current Temperature Card */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <CurrentTemperatureCard />
        </Grid>

        {/* Stats Cards */}
        <Grid size={{sm: 8, lg: 4}}>
          <Grid container spacing={2}>
            <StatsCards />
          </Grid>
        </Grid>

        {/* System Status - Desktop */}
        <Grid size={{ md: 12, lg: 4 }} sx={{display:{xs:"none",lg:"block"}}}>
          <SystemStatus />
        </Grid>

        {/* Real-time Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {chartData.length > 0 ? (
            <TemperatureChart
              data={chartData}
              title="Live Temperature Data"
              height={400}
              showStats={false}
              timeFormat="HH:mm:ss"
            />
          ) : (
            <ChartSkeleton />
          )}
        </Grid>

        {/* Recent Readings Table */}
        <Grid item size={{ xs: 12, lg: 4 }}>
          {latest10Readings.length > 0 ? (
            <TemperatureTable
              data={latest10Readings}
              title="Latest 10 Readings"
              Height={400}
              showPagination={false}
              animateNewRows={true}
            />
          ) : (
            <TableSkeleton />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;