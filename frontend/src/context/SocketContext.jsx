// src/context/SocketContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

// Create the context
const SocketContext = createContext();

// Provider component
function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [realtimeData, setRealtimeData] = useState([]);
  const [lastReading, setLastReading] = useState(null);

  // --- socket connection ---
  useEffect(() => {
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const newSocket = io(BACKEND_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // --- socket events ---
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus("connected");
      toast.success("Connected to server", { toastId: "connected" });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
      toast.error("Disconnected from server", { toastId: "disconnected" });
    };

    const handleConnectionStatus = (status) => {
      setConnectionStatus(
        status.sensorConnected ? "sensor_connected" : "sensor_disconnected"
      );
    };

    const handleRealtimeTemperature = (data) => {
      console.log("Received data from server:", data);
      const newReading = {
        ...data,
        id: data.id || Date.now(),
        timestamp: new Date(data.timestamp),
        receivedAt: new Date(data.receivedAt || Date.now()),
      };

      setLastReading(newReading);
      setRealtimeData((prev) => [newReading, ...prev].slice(0, 50));
    };

    const handleConnectError = () => {
      setConnectionStatus("error");
      toast.error("Connection error occurred", { toastId: "error" });
    };

    const handleReconnect = () => {
      toast.success("Reconnected to server", { toastId: "reconnected" });
    };

    const handleReconnectError = () => {
      toast.error("Failed to reconnect to server", {
        toastId: "reconnect_error",
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connection_status", handleConnectionStatus);
    socket.on("realtime_temperature", handleRealtimeTemperature);
    socket.on("connect_error", handleConnectError);
    socket.on("reconnect", handleReconnect);
    socket.on("reconnect_error", handleReconnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connection_status", handleConnectionStatus);
      socket.off("realtime_temperature", handleRealtimeTemperature);
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect", handleReconnect);
      socket.off("reconnect_error", handleReconnectError);
    };
  }, [socket]);

  const requestLatestReadings = useCallback((limit = 15) => {
    if (socket && isConnected) {
      socket.emit("request_latest", { limit });
      socket.once("latest_readings", (response) => {
        if (response.success && response.data) {
          const formatted = response.data.map((r) => ({
            ...r,
            timestamp: new Date(r.timestamp),
            receivedAt: new Date(r.receivedAt),
          }));
          setRealtimeData(formatted.reverse());
        } else {
          toast.error("Failed to load latest readings");
        }
      });
    }
  }, [socket, isConnected]);

  const getConnectionInfo = () => ({
    isConnected,
    status: connectionStatus,
    statusText: getStatusText(connectionStatus),
    statusColor: getStatusColor(connectionStatus),
  });

  const getStatusText = (status) => {
    switch (status) {
      case "connected":
        return "Connected to Server";
      case "sensor_connected":
        return "Connected & Receiving Data";
      case "sensor_disconnected":
        return "Connected (Sensor Offline)";
      case "disconnected":
        return "Disconnected";
      case "error":
        return "Connection Error";
      default:
        return "Unknown Status";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "warning";
      case "sensor_connected":
        return "success";
      case "sensor_disconnected":
        return "warning";
      case "disconnected":
        return "error";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getLatest10Readings = () => realtimeData.slice(0, 10);
  const getRealtimeChartData = () => realtimeData;

  const contextValue = {
    socket,
    isConnected,
    connectionStatus,
    realtimeData,
    lastReading,
    requestLatestReadings,
    getConnectionInfo,
    getLatest10Readings,
    getRealtimeChartData,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook (move this after provider)
function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

// ✅ Exports must be consistent
export { SocketProvider, useSocket };
