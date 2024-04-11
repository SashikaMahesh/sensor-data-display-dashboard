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
  Skeleton,
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
    start: startOfDay(subDays(new Date(), 1)),
    end: endOfDay(new Date()),
  });
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Query for historical paginated data
  const {
    data: historyData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: [
      'temperatureHistory',
      dateRange.start,
      dateRange.end,
      searchTrigger,
      page,
      pageSize,
    ],
    queryFn: () =>
      apiService.getReadingsByDateRange(
        dateRange.start,
        dateRange.end,
        page,
        pageSize
      ),
    enabled: !!dateRange.start && !!dateRange.end,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  // Query for statistics
  const { data: statsData } = useQuery({
    queryKey: ['temperatureStats'],
    queryFn: () => apiService.getTemperatureStats(),
    staleTime: 300000,
  });

  const handleSearch = () => {
    if (dateRange.start && dateRange.end) {
      setPage(1);
      setSearchTrigger((prev) => prev + 1);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleExportData = () => {
    if (!historyData?.data?.length) return;

    const csvContent = [
      ['Timestamp', 'Temperature (°C)'].join(','),
      ...historyData.data.map((row) =>
        [
          format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          row.temperature,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `temperature-data-${format(
      dateRange.start,
      'yyyy-MM-dd'
    )}-to-${format(dateRange.end, 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

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
    const avg =
      temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      count: temperatures.length,
      range: `${format(dateRange.start, 'MMM dd')} - ${format(
        dateRange.end,
        'MMM dd'
      )}`,
    };
  }, [historyData?.data, dateRange.start, dateRange.end]);

  // Skeleton Components
  const StatisticsSkeleton = () => (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
            <Skeleton variant="text" width="60%" height={24} />
          </Box>
          <Skeleton variant="rounded" width={120} height={32} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[...Array(4)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              width={100}
              height={32}
              sx={{ borderRadius: '16px' }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const ChartSkeleton = () => (
    <Card sx={{ height: 450 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
          <Skeleton variant="text" width="50%" height={24} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={380} sx={{ borderRadius: 1 }} />
      </CardContent>
    </Card>
  );

  const TableSkeleton = () => (
    <Card sx={{ height: 450 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width="40%" height={24} />
        </Box>
        
        {/* Table header skeleton */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="25%" height={20} />
          <Skeleton variant="text" width="45%" height={20} />
        </Box>
        
        {/* Table rows skeleton */}
        {[...Array(12)].map((_, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
            <Skeleton variant="text" width="30%" height={20} />
            <Skeleton variant="text" width="25%" height={20} />
            <Skeleton variant="text" width="45%" height={20} />
          </Box>
        ))}
        
        {/* Pagination skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Skeleton variant="text" width="30%" height={20} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={32} height={32} />
            <Skeleton variant="rounded" width={32} height={32} />
            <Skeleton variant="rounded" width={32} height={32} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const LoadingOverlay = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading data...
        </Typography>
      </Box>
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid size={{xs:12, lg:7}}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <HistoryIcon
                  sx={{ mr: 2, color: 'primary.main', fontSize: 32 }}
                />
                <Typography variant="h5" component="h2" sx={{ fontWeight: 400 }}>
                  Temperature History
                </Typography>
              </Box>

              {/* Date Range */}
              <Grid container spacing={2} alignItems="center">
                <Grid size={{xs:12, sm:5,md:4}}>
                  <DateTimePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(value) =>
                      handleDateRangeChange('start', value)
                    }
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                    maxDate={new Date()}
                  />
                </Grid>
                <Grid size={{xs:12, sm:5,md:4}}>
                  <DateTimePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(value) => handleDateRangeChange('end', value)}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                    maxDate={new Date()}
                    minDate={dateRange.start}
                  />
                </Grid>
                <Grid size={{xs:12, sm:2,md:4}}>
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={
                      !dateRange.start || !dateRange.end || isFetching
                    }
                    startIcon={
                      isFetching ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SearchIcon />
                      )
                    }
                    fullWidth
                  >
                    {isFetching ? 'Searching...' : 'Search'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Error */}
          {isError && (
            <Grid size={{xs:12}}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Error loading historical data:{' '}
                  {error?.message || 'Unknown error'}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Period Statistics */}
          <Grid size={{xs:12,lg:5}}>
            {isLoading || isFetching ? (
              <StatisticsSkeleton />
            ) : periodStats ? (
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
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
                      label={`${historyData.totalCount} Readings`}
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
            ) : (
              <StatisticsSkeleton />
            )}
          </Grid>

          {/* Chart */}
          <Grid size={{xs:12, lg:7}}>
            {isLoading || isFetching ? (
              <ChartSkeleton />
            ) : historyData?.data?.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                <TemperatureChart
                  data={historyData.data}
                  title="Historical Temperature Data"
                  height={450}
                  showStats={true}
                  timeFormat={
                    historyData.data.length > 100
                      ? 'MM/dd HH:mm'
                      : historyData.data.length > 50
                      ? 'HH:mm'
                      : 'HH:mm:ss'
                  }
                />
                {isFetching && <LoadingOverlay />}
              </Box>
            ) : !isError && searchTrigger > 0 ? (
              <Card sx={{ height: 450 }}>
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <DateIcon
                    sx={{
                      fontSize: 64,
                      color: 'text.secondary',
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Chart Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No temperature readings found for the selected date range.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <ChartSkeleton />
            )}
          </Grid>

          {/* Table */}
          <Grid size={{xs:12, lg:5}}>
            {isLoading || isFetching ? (
              <TableSkeleton />
            ) : historyData?.data?.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                <TemperatureTable
                  data={historyData.data}
                  title="Historical Readings"
                  maxHeight={450}
                  showPagination={true}
                  pageSize={pageSize}
                  page={page}
                  onPageChange={handlePageChange}
                  totalRows={historyData.totalCount || 0}
                  animateNewRows={false}
                />
                {isFetching && <LoadingOverlay />}
              </Box>
            ) : !isError && searchTrigger > 0 ? (
              <Card sx={{ height: 450 }}>
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <DateIcon
                    sx={{
                      fontSize: 64,
                      color: 'text.secondary',
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Table Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No temperature readings found for the selected date range.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <TableSkeleton />
            )}
          </Grid>

          {/* No Data - Full Width Message */}
          {!isLoading &&
            !isError &&
            !isFetching &&
            historyData?.data?.length === 0 &&
            searchTrigger > 0 && (
              <Grid size={{xs:12}}>
                <Card>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      py: 6,
                    }}
                  >
                    <DateIcon
                      sx={{
                        fontSize: 64,
                        color: 'text.secondary',
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No Data Found
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      No temperature readings found for the selected date
                      range.
                      <br />
                      Try selecting a different date range or check if the
                      sensor was active during this period.
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