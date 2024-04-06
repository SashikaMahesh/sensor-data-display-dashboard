import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import {
  ThermostatAuto as TempIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const TemperatureTable = ({
  data = [],
  title = "Temperature Readings",
  maxHeight = 400,
  showPagination = false,
  pageSize = 15,
  animateNewRows = true,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [previousData, setPreviousData] = useState([]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated data
  const paginatedData = showPagination
    ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : data;

  // Track data changes for animation
  useEffect(() => {
    if (data.length > 0) {
      setPreviousData(data);
    }
  }, [data]);

  // Memoize row IDs to detect new entries
  const currentRowIds = useMemo(
    () =>
      paginatedData.map(
        (reading) =>
          reading.id ||
          reading._id ||
          `${reading.timestamp}-${reading.temperature}`
      ),
    [paginatedData]
  );

  const previousRowIds = useMemo(
    () =>
      previousData
        .slice(0, paginatedData.length)
        .map(
          (reading) =>
            reading.id ||
            reading._id ||
            `${reading.timestamp}-${reading.temperature}`
        ),
    [previousData, paginatedData.length]
  );

  // Get temperature color based on value
  const getTemperatureColor = (temp) => {
    if (temp < 18) return "#2196f3"; // Blue for cold
    if (temp < 22) return "#4caf50"; // Green for comfortable
    if (temp < 28) return "#ff9800"; // Orange for warm
    return "#f44336"; // Red for hot
  };

  // Get temperature status
  const getTemperatureStatus = (temp) => {
    if (temp < 18) return { status: "Cold", color: "info" };
    if (temp < 22) return { status: "Cool", color: "success" };
    if (temp < 28) return { status: "Warm", color: "warning" };
    return { status: "Hot", color: "error" };
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
        type: "spring",
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

  const slideDownVariants = {
    initial: { y: 0 },
    animate: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.8,
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
            flexDirection: "column",
          }}
        >
          <TempIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <Chip
            label={`${data.length} readings`}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Box>

        {/* Table Container */}
        <TableContainer
          component={Paper}
          sx={{
            maxHeight,
            "& .MuiTableCell-root": {
              borderBottom: "1px solid rgba(224, 224, 224, 1)",
            },
            overflow: "auto",
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TempIcon fontSize="small" />
                    Temperature
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimeIcon fontSize="small" />
                    Timestamp
                  </Box>
                </TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence initial={false}>
                {paginatedData.map((reading, index) => {
                  const rowId =
                    reading.id ||
                    reading._id ||
                    `${reading.timestamp}-${index}`;
                  const isNewRow =
                    !previousRowIds.includes(rowId) && animateNewRows;

                  return (
                    <TableRow
                      key={rowId}
                      component={motion.tr}
                      layout
                      initial={isNewRow ? rowVariants.hidden : false}
                      animate={isNewRow ? rowVariants.visible : false}
                      exit={rowVariants.exit}
                      whileHover={{
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                        transition: { duration: 0.2 },
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell component="td">
                        <motion.div
                          initial={
                            isNewRow ? { scale: 1.1, opacity: 0 } : false
                          }
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: isNewRow ? 0.3 : 0,
                            duration: 0.3,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              color: getTemperatureColor(reading.temperature),
                              fontWeight: 600,
                              fontSize: "1rem",
                            }}
                          >
                            {reading.temperature}°C
                          </Typography>
                        </motion.div>
                      </TableCell>

                      <TableCell component="td">
                        <motion.div
                          initial={isNewRow ? { x: -10, opacity: 0 } : false}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{
                            delay: isNewRow ? 0.4 : 0,
                            duration: 0.3,
                          }}
                        >
                          <Typography variant="body2">
                            {format(
                              new Date(reading.timestamp),
                              "MMM dd, HH:mm:ss"
                            )}
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
              rowsPerPageOptions={[5, 10, 15, 25, 50]}
              component="div"
              count={data.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ mt: 1 }}
            />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemperatureTable;
