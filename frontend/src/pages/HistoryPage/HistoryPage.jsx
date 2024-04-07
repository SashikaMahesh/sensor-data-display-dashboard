import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Chip,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  DateRange as DateIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

import TemperatureChart from '../../components/Charts/TemperatureChart';
import TemperatureTable from '../../components/Tables/TemperatureTable';
import apiService from '../../services/api';

const HistoryPage = () => {
  const [dateRange, setDateRange] = useState({
    start: startOfDay(subDays(new Date(), 1)), // Yesterday
    end: endOfDay(new Date()) // Today
  });
  const [quickSelect, setQuickSelect] = useState('today');
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Query for historical data
  const {
    data: historyData,
    isLoading,
    isError,
    error,
    isFetching
  } = useQuery({
    queryKey: ['temperatureHistory', dateRange.start, dateRange.end, searchTrigger],
    queryFn: () => apiService.getReadingsByDateRange(dateRange.start, dateRange.end),
    enabled: !!dateRange.start && !!dateRange.end,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Query for statistics
  const { data: statsData } = useQuery({
    queryKey: ['temperatureStats'],
    queryFn: () => apiService.getTemperatureStats(),
    staleTime: 300000, // 5 minutes
  });

  // Handle quick date selection
  const handleQuickSelect = (period) => {
    setQuickSelect(period);
    const ranges = apiService.getDateRange(period);
    setDateRange(ranges);
    setSearchTrigger(prev => prev + 1);
  };

  // Handle manual search
  const handleSearch = () => {
    if (dateRange.start && dateRange.end) {
      setQuickSelect('custom');
      setSearchTrigger(prev => prev + 1);
    }
  };

  // Handle date range changes
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Export data to CSV
  const handleExportData = () => {
    if (!historyData?.data?.length) return;

    const csvContent = [
      ['Timestamp', 'Temperature (°C)', 'Sensor ID', 'Location', 'Status'].join(','),
      ...historyData.data.map(row => [
        format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        row.temperature,
        row.sensorId || '',
        row.location || '',
        row.status || 'active'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `temperature-data-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate period statistics
  const periodStats = React.useMemo(() => {
    if (!historyData?.data?.length) return null;

    const temperatures = historyData.data.map(d => d.temperature);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    
    return {
      min: min.toFixed(1),
      max: max.toFixed(1),
      avg: avg.toFixed(1),
      count: temperatures.length,
      range: `${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd')}`
    };
  }, [historyData, dateRange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <HistoryIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                  Temperature History
                </Typography>
              </Box>
              
              {/* Date Range Selection */}
              <Grid container spacing={2} alignItems="center">
                {/* Quick Select */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Quick Select</InputLabel>
                    <Select
                      value={quickSelect}
                      label="Quick Select"
                      onChange={(e) => handleQuickSelect(e.target.value)}
                    >
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="yesterday">Yesterday</MenuItem>
                      <MenuItem value="last7days">Last 7 Days</MenuItem>
                      <MenuItem value="last30days">Last 30 Days</MenuItem>
                      <MenuItem value="thisMonth">This Month</MenuItem>
                      <MenuItem value="lastMonth">Last Month</MenuItem>
                      <MenuItem value="custom">Custom Range</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Start Date */}
                <Grid item xs={12} sm={6} md={3}>
                  <DateTimePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(value) => handleDateRangeChange('start', value)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    maxDate={new Date()}
                  />
                </Grid>

                {/* End Date */}
                <Grid item xs={12} sm={6} md={3}>
                  <DateTimePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(value) => handleDateRangeChange('end', value)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    maxDate={new Date()}
                    minDate={dateRange.start}
                  />
                </Grid>

                {/* Search Button */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      disabled={!dateRange.start || !dateRange.end || isFetching}
                      startIcon={isFetching ? <CircularProgress size={16} /> : <SearchIcon />}
                      fullWidth
                    >
                      {isFetching ? 'Searching...' : 'Search'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Error Alert */}
          {isError && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Error loading historical data: {error?.message || 'Unknown error'}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Period Statistics */}
          {periodStats && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Period Statistics - {periodStats.range}
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportData}
                      disabled={!historyData?.data?.length}
                    >
                      Export CSV
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${periodStats.count} Readings`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`Min: ${periodStats.min}°C`}
                      color="info"
                      variant="outlined"
                    />
                    <Chip
                      label={`Avg: ${periodStats.avg}°C`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      label={`Max: ${periodStats.max}°C`}
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Loading State */}
          {isLoading && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={40} />
              </Box>
            </Grid>
          )}

          {/* Chart */}
          {historyData?.data && (
            <Grid item xs={12} lg={8}>
              <TemperatureChart
                data={historyData.data}
                title="Historical Temperature Data"
                height={450}
                showStats={true}
                timeFormat={
                  historyData.data.length > 100 ? 'MM/dd HH:mm' : 
                  historyData.data.length > 50 ? 'HH:mm' : 
                  'HH:mm:ss'
                }
              />
            </Grid>
          )}

          {/* Data Table */}
          {historyData?.data && (
            <Grid item xs={12} lg={4}>
              <TemperatureTable
                data={historyData.data.slice().reverse()} // Most recent first
                title="Historical Readings"
                maxHeight={450}
                showPagination={true}
                pageSize={15}
                animateNewRows={false}
              />
            </Grid>
          )}

          {/* No Data Message */}
          {!isLoading && !isError && historyData?.data?.length === 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  py: 6
                }}>
                  <DateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Data Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No temperature readings found for the selected date range.
                    <br />
                    Try selecting a different date range or check if the sensor was active during this period.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => handleQuickSelect('today')}
                    sx={{ mt: 2 }}
                  >
                    View Today's Data
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Overall Statistics */}
          {statsData?.data && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Overall System Statistics
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                          {statsData.data.totalReadings?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Readings
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                          {statsData.data.minTemperature?.toFixed(1) || '--'}°C
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          All-time Min
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {statsData.data.avgTemperature?.toFixed(1) || '--'}°C
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Overall Average
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                          {statsData.data.maxTemperature?.toFixed(1) || '--'}°C
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          All-time Max
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'bold' }}>
                          {statsData.data.latestReading 
                            ? format(new Date(statsData.data.latestReading), 'MMM dd, yyyy')
                            : '--'
                          }
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Latest Reading
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default HistoryPage;