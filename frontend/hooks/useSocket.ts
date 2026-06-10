import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';

export function useSocket(eventId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [crowdUpdate, setCrowdUpdate] = useState<any>(null);
  const [latestAlert, setLatestAlert] = useState<any>(null);
  const [sosEvent, setSosEvent] = useState<any>(null);
  const [volunteerUpdate, setVolunteerUpdate] = useState<any>(null);

  useEffect(() => {
    // Connect to WebSocket gateway
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WS server.');
      
      // If eventId is provided, join that specific event room
      if (eventId) {
        socket.emit('subscribe_event', { eventId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WS server.');
    });

    // Listeners
    socket.on('crowd_update', (data) => {
      setCrowdUpdate(data);
    });

    socket.on('alert_received', (data) => {
      setLatestAlert(data);
    });

    socket.on('sos_received', (data) => {
      setSosEvent(data);
    });

    socket.on('volunteer_updated', (data) => {
      setVolunteerUpdate(data);
    });

    socket.on('global_crowd_update', (data) => {
      if (!eventId) {
        setCrowdUpdate(data);
      }
    });

    socket.on('global_alert_received', (data) => {
      if (!eventId) {
        setLatestAlert(data);
      }
    });

    return () => {
      if (eventId && socket.connected) {
        socket.emit('unsubscribe_event', { eventId });
      }
      socket.disconnect();
    };
  }, [eventId]);

  const emit = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    isConnected,
    crowdUpdate,
    latestAlert,
    sosEvent,
    volunteerUpdate,
    emit,
  };
}
