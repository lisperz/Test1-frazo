import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface JobUpdate {
  job_id: string;
  type: 'job_update' | 'job_completed' | 'job_failed' | 'system_message';
  data: {
    progress?: number;
    message?: string;
    status?: string;
    download_url?: string;
    error?: string;
  };
  timestamp: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  jobUpdates: JobUpdate[];
  subscribeToJob: (jobId: string) => void;
  unsubscribeFromJob: (jobId: string) => void;
  clearUpdates: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [jobUpdates, setJobUpdates] = useState<JobUpdate[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      // Connect to WebSocket
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const socket = io('ws://localhost:8000', {
        path: '/ws',
        query: {
          token: token,
        },
        transports: ['websocket'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      socket.on('job_update', (update: JobUpdate) => {
        console.log('Job update received:', update);
        setJobUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
      });

      socket.on('system_message', (message: any) => {
        console.log('System message:', message);
        // Handle system messages (maintenance, errors, etc.)
        if (message.message_type === 'error') {
          // Show error notification
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      });

      // Cleanup on unmount
      return () => {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      };
    }

    // Disconnect if user logs out
    if (!user && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setJobUpdates([]);
    }
  }, [user]);

  const subscribeToJob = (jobId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe_job', { job_id: jobId });
    }
  };

  const unsubscribeFromJob = (jobId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('unsubscribe_job', { job_id: jobId });
    }
  };

  const clearUpdates = () => {
    setJobUpdates([]);
  };

  const value: WebSocketContextType = {
    isConnected,
    jobUpdates,
    subscribeToJob,
    unsubscribeFromJob,
    clearUpdates,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};