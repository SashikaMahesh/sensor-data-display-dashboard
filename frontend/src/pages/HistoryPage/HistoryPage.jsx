import React, { useState, useMemo, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  Chip,
  Paper,
  CircularProgress,
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
    end: endOfDay(new Date()), // Today
  });
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [page, setPage] = useState(0); // Current page
  const pageSize = 15; // Items per page

  // Query for historical data
  const {
    data: historyData,
    isLoading,
    isError,
    error,
    isFetching,
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

  // Handle manual search
  const handleSearch = () => {
    if (dateRange.start && dateRange.end) {
      setPage(0); // Reset to first page
      setSearchTrigger((prev) => prev + 1);
    }
  };

  // Handle date range changes
  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    console.log(`HistoryPage: Changing to page ${newPage}`);
    setPage(newPage);
  };

  // Export data to CSV
  const handleExportData = () => {
    if (!historyData?.data?.length) return;

    const csvContent = [
      ['Timestamp', 'Temperature (°C)'].join(','),
      ...historyData.data.map((row) => [
        format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        row.temperature,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `temperature-data-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Memoize reversed data
  const reversedData = useMemo(() => {
    const data = historyData?.data?.slice().reverse() || [];
    console.log('Reversed Data Length:', data.length);
    return data;
  }, [historyData]);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const data = reversedData.slice(startIndex, endIndex);
    console.log(`Paginated Data (Page ${page}):`, data);
    return data;
  }, [reversedData, page, pageSize]);

  // Debug paginatedData changes
  useEffect(() => {
    console.log('paginatedData updated:', paginatedData);
  }, [paginatedData]);

  // Calculate period statistics
  const periodStats = useMemo(() => {
    if (!historyData?.data?.length || !Array.isArray(historyData.data)) {
      return null;
    }

    const temperatures = historyData.data
      .map((d) => d.temperature)
      .filter((temp) => typeof temp === 'number' && !isNaN(temp));

    if (!temperatures.length) {
      return null;
    }

    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      count: temperatures.length,
      range: `${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd')}`,
    };
  }, [historyData, dateRange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <HistoryIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                <Typography variant="h5" component="h2" sx={{ fontWeight: 400 }}>
                  Temperature History
                </Typography>
              </Box>

              {/* Date Range Selection */}
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 5, md: 4 }}>
                  <DateTimePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(value) => handleDateRangeChange('start', value)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    maxDate={new Date()}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5, md: 4 }}>
                  <DateTimePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(value) => handleDateRangeChange('end', value)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    maxDate={new Date()}
                    minDate={dateRange.start}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2, md: 4 }}>
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
            <Grid size={{ xs: 12 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Error loading historical data: {error?.message || 'Unknown error'}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Period Statistics */}
          {periodStats && (
            <Grid size={{ xs: 12, lg: 5 }}>
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

          {/* Chart */}
          {historyData?.data && (
            <Grid size={{ xs: 12, lg: 7 }}>
              <TemperatureChart
                data={paginatedData}
                title="Historical Temperature Data"
                height={450}
                showStats={true}
                timeFormat={
                  paginatedData.length > 100 ? 'MM/dd HH:mm' :
                  paginatedData.length > 50 ? 'HH:mm' :
                  'HH:mm:ss'
                }
              />
            </Grid>
          )}

          {/* Data Table */}
          {historyData?.data && (
            <Grid size={{ xs: 12, lg: 5 }}>
              <TemperatureTable
                data={paginatedData} // Use paginated data
                title="Historical Readings"
                maxHeight={450}
                showPagination={true}
                pageSize={pageSize}
                page={page}
                onPageChange={handlePageChange}
                totalRows={reversedData.length}
                animateNewRows={false}
              />
            </Grid>
          )}

          {/* No Data Message */}
          {!isLoading && !isError && historyData?.data?.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                  <DateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Data Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No temperature readings found for the selected date range.
                    <br />
                    Try selecting a different date range or check if the sensor was active during this period.
                  </Typography>
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