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
}

export function useRealTimeUpdates({
  userId,
  isAdmin = false,
  onUserUpdate,
  onStockUpdate,
  onAccountUpdate,
  onOrderUpdate,
  onMessageUpdate,
}: UseRealTimeUpdatesProps) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    try {
      const socket = io("/api/socketio", {
        transports: ["websocket", "polling"],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      useEffect(() => {
        if (!socket || !userId) return;

        socket.on("cartItemExpired", (_data) => {
          // Disparar evento para actualizar el carrito
          window.dispatchEvent(new CustomEvent("cartUpdated"));
        });

        return () => {
          socket.off("cartItemExpired");
        };
      }, [socket, userId]);

      useEffect(() => {
        if (!socket || !userId) return;

        socket.on("cartItemExpired", (_data) => {
          // Disparar evento para actualizar el carrito
          window.dispatchEvent(new CustomEvent("cartUpdated"));
        });

        return () => {
          socket.off("cartItemExpired");
        };
      }, [socket, userId]);

      socket.on("connect", () => {
        console.log("WebSocket connected");
        reconnectAttempts.current = 0;

        // Register for updates
        if (userId) {
          console.log("👤 Registrando usuario:", userId);
          socket.emit("registerUser", userId);
        }
        if (isAdmin) {
          console.log("👑 Registrando admin");
          socket.emit("registerAdmin");
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason);

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            // console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`)
            connect();
          }, 1000 * reconnectAttempts.current);
        }
      });

      socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
      });

      // Listen for real-time updates
      socket.on("userUpdated", (userData: any) => {
        // console.log('User updated:', userData)
        onUserUpdate?.(userData);
      });

      socket.on("stockUpdated", (stockData: any) => {
        console.log("Stock updated:", stockData);
        onStockUpdate?.(stockData);
        window.dispatchEvent(new CustomEvent('stockUpdated', { detail: stockData }));
      });

      socket.on("accountUpdated", (accountData: any) => {
        // console.log('Account updated:', accountData)
        onAccountUpdate?.(accountData);
      });

      socket.on("orderUpdated", (orderData: any) => {
        // console.log('Order updated:', orderData)
        onOrderUpdate?.(orderData);
      });

      socket.on("stockCleaned", (data: any) => {
        console.log("🧹 Stock limpiado:", data);
        // Forzar refresh de cuentas cuando se limpia una reserva
        window.dispatchEvent(new CustomEvent("stockCleaned", { detail: data }));
      });

      socket.on("messageUpdate", (messageData: { unreadCount: number }) => {
        // console.log('Message count updated:', messageData)
        onMessageUpdate?.(messageData);
      });
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [
    userId,
    isAdmin,
    onUserUpdate,
    onStockUpdate,
    onAccountUpdate,
    onOrderUpdate,
    onMessageUpdate,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("stockCleaned");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect, userId, isAdmin]);

  // Reconnect when userId or isAdmin changes
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
