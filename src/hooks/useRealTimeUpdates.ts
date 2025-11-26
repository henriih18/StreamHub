"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseRealTimeUpdatesProps {
  userId?: string;
  isAdmin?: boolean;
  onUserUpdate?: (userData: any) => void;
  onStockUpdate?: (stockData: any) => void;
  onAccountUpdate?: (accountData: any) => void;
  onOrderUpdate?: (orderData: any) => void;
  onMessageUpdate?: (messageData: { unreadCount: number }) => void;
  onReservationExpired?: (data: any) => void;
  onConnect?: (isConnected: boolean) => void;
}

export function useRealTimeUpdates({
  userId,
  isAdmin = false,
  onUserUpdate,
  onStockUpdate,
  onAccountUpdate,
  onOrderUpdate,
  onMessageUpdate,
  onReservationExpired,
  onConnect,
}: UseRealTimeUpdatesProps) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    /* console.log("Intentando conectar socket..."); */

    const socket = io("/", {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 800,
      forceNew: true,
    });

    socketRef.current = socket;

    // -----------------------------
    // EVENTO: Conexión establecida
    // -----------------------------
    socket.on("connect", () => {
      /* console.log("WebSocket connected"); */

      reconnectAttempts.current = 0;
      onConnect?.(true);

      if (userId) {
        console.log("Registrando usuario:", userId);
        socket.emit("registerUser", userId);
      }

      if (isAdmin) {
        /* console.log("Registrando admin"); */
        socket.emit("registerAdmin");
      }
    });

    // -----------------------------
    // EVENTO: Desconexión
    // -----------------------------
    socket.on("disconnect", (reason) => {
      /* console.log("WebSocket disconnected:", reason); */
      onConnect?.(false);

      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(connect, 1000 * reconnectAttempts.current);
      }
    });

    // -----------------------------
    // ERROR DE CONEXIÓN
    // -----------------------------
    socket.on("connect_error", (error) => {
      /* console.error("Error conectando WebSocket:", error); */
    });

    // -----------------------------
    // EVENTOS DE ACTUALIZACIONES
    // -----------------------------
    socket.on("userUpdated", (data) => {
      onUserUpdate?.(data);
    });

    socket.on("stockUpdated", (data) => {
      /* console.log("Stock updated:", data); */
      onStockUpdate?.(data);
      window.dispatchEvent(new CustomEvent("stockUpdated", { detail: data }));
    });

    socket.on("accountUpdated", (data) => {
      onAccountUpdate?.(data);
    });

    socket.on("orderUpdated", (data) => {
      onOrderUpdate?.(data);
    });

    socket.on("stockCleaned", (data) => {
      /* console.log("Stock limpiado:", data); */
      window.dispatchEvent(new CustomEvent("stockCleaned", { detail: data }));
    });

    socket.on("reservationExpired", (data) => {
  console.log("Reserva expirada:", data);
  
  // Eliminar item del carrito localmente
  if (onReservationExpired) {
    onReservationExpired(data);
  }
  
  // Disparar evento para actualizar carrito
  window.dispatchEvent(new CustomEvent("reservationExpired", {
    detail: data
  }));
});

    

    socket.on("messageUpdate", (data) => {
      onMessageUpdate?.(data);
    });
  }, [
    userId,
    isAdmin,
    onUserUpdate,
    onStockUpdate,
    onAccountUpdate,
    onOrderUpdate,
    onMessageUpdate,
    onReservationExpired,
    onConnect,
  ]);

  // -----------------------------
  // DESCONECTAR
  // -----------------------------
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      /* console.log("Socket desconectado manualmente"); */
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // -----------------------------
  // Conectar al montar
  // -----------------------------
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // -----------------------------
  // Reconectar si userId o admin cambian
  // -----------------------------
  useEffect(() => {
    if (socketRef.current?.connected) {
      disconnect();
      setTimeout(connect, 10);
    }
  }, [userId, isAdmin, connect, disconnect]);

  return {
    isConnected: socketRef.current?.connected || false,
    reconnect: connect,
    disconnect,
  };
}
