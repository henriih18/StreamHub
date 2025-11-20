import { setupSocket } from "@/lib/socket";
import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const currentPort = 3000;
const hostname = "127.0.0.1";

async function createCustomServer() {
  try {
    const nextApp = next({
      dev,
      dir: process.cwd(),
      conf: dev ? undefined : { distDir: "./.next" },
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server shared by Next.js & Socket.IO
    const server = createServer((req, res) => {
      // Ignorar rutas del transport interno y del path real
      if (
        req.url?.startsWith("/api/socketio") ||
        req.url?.startsWith("/socket.io")
      ) {
        return;
      }

      handle(req, res);
    });

    // Attach Socket.IO to the server
    const io = new Server(server, {
      path: "/api/socketio",
      cors: {
        origin: process.env.NEXT_PUBLIC_WS_URL,
        methods: ["GET", "POST"],
      },
    });
    /* 
     io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  }); */

    setupSocket(io);

    (global as any).io = io;

    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(
        `> WebSocket running at ws://${hostname}:${currentPort}/api/socketio`
      );
    });
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
}

createCustomServer();
