const BASE_URL = import.meta.env.BACKEND_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = BASE_URL;
  }

  // Generic request handler with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get latest temperature readings
  async getLatestReadings(limit = 100) {
    return this.request(`/readings/latest?limit=${limit}`);
  }

  // Get readings by date range
  async getReadingsByDateRange(startDate, endDate) {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    return this.request(`/readings/range?start=${start}&end=${end}`);
  }

  // Get temperature statistics
  async getTemperatureStats() {
    return this.request('/readings/stats');
  }

  // Get hourly aggregated data
  async getHourlyData(hours = 24) {
    return this.request(`/readings/hourly?hours=${hours}`);
  }

  // Get server status
  async getServerStatus() {
    return this.request('/status');
  }

  // Helper method to format date for API
  formatDateForAPI(date) {
    return date.toISOString();
  }

  // Helper method to get date range for common periods
  getDateRange(period) {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'lastMonth':
        start.setMonth(now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        now.setDate(0); // Last day of previous month
        now.setHours(23, 59, 59, 999);
        break;
      default:
        // Default to today
        start.setHours(0, 0, 0, 0);
    }

    return { start, end: now };
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;