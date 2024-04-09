import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  TablePagination,
} from '@mui/material';
import { ThermostatAuto as TempIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const TemperatureTable = ({
  data = [],
  title = 'Temperature Readings',
  maxHeight = 400,
  showPagination = false,
  pageSize = 15,
  page = 0,
  onPageChange = () => {},
  totalRows = 0,
  animateNewRows = true,
}) => {
  // Get temperature color based on value
  const getTemperatureColor = (temp) => {
    if (temp < 18) return '#2196f3'; // Blue for cold
    if (temp < 22) return '#4caf50'; // Green for comfortable
    if (temp < 28) return '#ff9800'; // Orange for warm
    return '#f44336'; // Red for hot
  };

  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const rowVariants = {
    hidden: {
      opacity: 0,
      y: -30,
      scale: 1.05,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        duration: 0.6,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Memoize row IDs to detect new entries
  const currentRowIds = useMemo(
    () =>
      data.map(
        (reading) =>
          reading.id || reading._id || `${reading.timestamp}-${reading.temperature}`
      ),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            flexDirection: 'column',
          }}
        >
          <TempIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant='h6' color='text.secondary' gutterBottom>
            {title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            No temperature readings available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant='h6' component='h2'>
            {title}
          </Typography>
          <Chip
            label={`${totalRows} readings`}
            size='small'
            variant='outlined'
            color='primary'
          />
        </Box>

        {/* Table Container */}
        <TableContainer
          component={Paper}
          sx={{
            maxHeight,
            '& .MuiTableCell-root': {
              borderBottom: '1px solid rgba(224, 224, 224, 1)',
            },
            overflow: 'auto',
          }}
        >
          <Table stickyHeader size='small'>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TempIcon fontSize='small' />
                    Temperature
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon fontSize='small' />
                    Timestamp
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence initial={false}>
                {data.map((reading, index) => {
                  const rowId =
                    reading.id || reading._id || `${reading.timestamp}-${index}`;
                  return (
                    <TableRow
                      key={rowId}
                      component={motion.tr}
                      layout
                      initial={animateNewRows ? rowVariants.hidden : false}
                      animate={animateNewRows ? rowVariants.visible : false}
                      exit={rowVariants.exit}
                      whileHover={{
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        transition: { duration: 0.2 },
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell component='td'>
                        <motion.div
                          initial={animateNewRows ? { scale: 1.1, opacity: 0 } : false}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: animateNewRows ? 0.3 : 0,
                            duration: 0.3,
                          }}
                        >
                          <Typography
                            variant='h6'
                            sx={{
                              color: getTemperatureColor(reading.temperature),
                              fontWeight: 600,
                              fontSize: '1rem',
                            }}
                          >
                            {reading.temperature}°C
                          </Typography>
                        </motion.div>
                      </TableCell>
                      <TableCell component='td'>
                        <motion.div
                          initial={animateNewRows ? { x: -10, opacity: 0 } : false}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{
                            delay: animateNewRows ? 0.4 : 0,
                            duration: 0.3,
                          }}
                        >
                          <Typography variant='body2'>
                            {format(new Date(reading.timestamp), 'MMM dd, HH:mm:ss')}
                          </Typography>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {showPagination && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <TablePagination
              rowsPerPageOptions={[15]} // Fixed to 15
              component='div'
              count={totalRows}
              rowsPerPage={pageSize}
              page={page}
              onPageChange={(e, newPage) => {
                console.log(`TemperatureTable: Changing to page ${newPage}`);
                onPageChange(newPage);
              }}
              sx={{ mt: 1 }}
            />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemperatureTable;