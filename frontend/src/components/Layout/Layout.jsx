import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tab,
  Tabs,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Home as HomeIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getConnectionInfo, requestLatestReadings } = useSocket();

  const connectionInfo = getConnectionInfo();

  const handleTabChange = (event, newValue) => {
    navigate(newValue);
  };

  const handleRefresh = () => {
    requestLatestReadings(15);
  };

  const getCurrentTab = () => {
    switch (location.pathname) {
      case '/':
        return '/';
      case '/history':
        return '/history';
      default:
        return '/';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {/* App Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              🌡️ Temperature Monitor
            </Typography>
            
            {/* Connection Status */}
            <Box sx={{ ml: 3, display: 'flex', alignItems: 'center' }}>
              <CircleIcon
                sx={{
                  fontSize: 12,
                  color: 
                    connectionInfo.statusColor === 'success' ? '#4caf50' :
                    connectionInfo.statusColor === 'warning' ? '#ff9800' :
                    connectionInfo.statusColor === 'error' ? '#f44336' : '#9e9e9e',
                  mr: 1,
                }}
              />
              <Chip
                size="small"
                label={connectionInfo.statusText}
                color={connectionInfo.statusColor}
                variant="outlined"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          </Box>

          {/* Refresh Button */}
          <Tooltip title="Refresh Data">
            <IconButton
              color="inherit"
              onClick={handleRefresh}
              sx={{ ml: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Tabs
            value={getCurrentTab()}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'white',
                height: 3,
              },
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                '&.Mui-selected': {
                  color: 'white',
                },
              },
            }}
          >
            <Tab
              label="Live Data"
              value="/"
              icon={<HomeIcon />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab
              label="History"
              value="/history"
              icon={<HistoryIcon />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Box>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;