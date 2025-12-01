// server.ts - Servidor Next.js Standalone + Socket.IO
import { setupSocket /* , getIO  */ } from "@/lib/socket";
import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const currentPort = 3000;
const hostname = "127.0.0.1"; //Cambia para produccion

// Servidor personalizado con integración Socket.IO
async function createCustomServer() {
  try {
    // Crear aplicación Next.js
    const nextApp = next({
      dev,
      dir: process.cwd(),
      // En producción, usar el directorio actual donde se encuentra .next
      conf: dev ? undefined : { distDir: "./.next" },
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Crear servidor HTTP que manejará tanto Next.js como Socket.IO
    const server = createServer((req, res) => {
      // Omitir solicitudes socket.io del manejador de Next.js
      if (req.url?.startsWith("/api/socketio")) {
        return;
      }
      handle(req, res);
    });

    /* // Setup Socket.IO
    const io = new Server(server, {
      path: "/api/socketio",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    }); */

    // Configurar Socket.IO
    const io = new Server(server, {
      path: "/api/socketio",
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? ["https://tudominio.com"] // Reemplazar dominio
            : ["http://localhost:3000"],
        methods: ["GET", "POST"],
      },
    });

    setupSocket(io);

    // Exportar instancia IO para rutas API
    (global as any).io = io;

    // Iniciar servidor
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(
        `> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`
      );
    });
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
}

// Iniciar servidor
createCustomServer();
