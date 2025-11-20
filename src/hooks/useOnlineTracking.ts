"use client";

import { useEffect, useRef } from "react";

interface OnlineTrackingOptions {
  userId?: string;
  enabled?: boolean;
  updateInterval?: number;
  debounceDelay?: number;
}

export function useOnlineTracking(options: OnlineTrackingOptions = {}) {
  const {
    userId,
    enabled = true,
    updateInterval = 30000,
    debounceDelay = 3000,
  } = options;

  const sessionIdRef = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Generar o recuperar ID de sesión
    sessionIdRef.current =
      sessionStorage.getItem("onlineSessionId") ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    sessionStorage.setItem("onlineSessionId", sessionIdRef.current);

    // Función para actualizar estado en línea
    const updateOnlineStatus = async () => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;

      //Si la última actualización fue hace poco, se ignora (debounce)
      if (elapsed < debounceDelay) return;

      lastUpdateRef.current = now;

      try {
        await fetch("/api/admin/online-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId || "anonymous",
            sessionId: sessionIdRef.current,
            page: window.location.pathname,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    // Debounced update (para visibilidad o eventos rápidos)
    const triggerDebouncedUpdate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => updateOnlineStatus(),
        debounceDelay
      );
    };

    // Registrar al usuario inmediatamente y configurar actualizaciones periódicas
    updateOnlineStatus();
    intervalRef.current = setInterval(updateOnlineStatus, updateInterval);

    // Cleanup al cerrar pestaña o salir
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        navigator.sendBeacon(
          "/api/admin/online-users",
          JSON.stringify({
            sessionId: sessionIdRef.current,
          })
        );
      }
    };

    // Detectar cambios de visibilidad
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerDebouncedUpdate();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (sessionIdRef.current) {
        fetch("/api/admin/online-users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        }).catch(() => {});
      }

      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, userId, updateInterval, debounceDelay]);

  return { sessionId: sessionIdRef.current };
}
