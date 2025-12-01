import { Server } from "socket.io";
import { db } from "@/lib/db";

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    // console.log('Cliente conectado:', socket.id);

    // Gestionar el registro de usuarios para actualizaciones de mensajes
    socket.on("registerUser", (userId: string) => {
      socket.join(`user:${userId}`);
      // console.log(`El usuario ${userId} se registró para recibir actualizaciones de mensajes`);
    });

    // Gestionar el registro de administrador para actualizaciones en tiempo real
    socket.on("registerAdmin", () => {
      socket.join("admins");
      console.log("👑 Admin registered for real-time updates");
    });

    // Manejar mensajes
    socket.on("message", (msg: { text: string; senderId: string }) => {
      socket.emit("message", {
        text: `Echo: ${msg.text}`,
        senderId: "system",
        timestamp: new Date().toISOString(),
      });
    });

    // Gestionar solicitudes de estadísticas de administración
    socket.on("request-stats", async () => {
      try {
        const stats = await getRealTimeStats();
        socket.emit("stats-update", stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    });

    // Manejar desconexión
    socket.on("disconnect", () => {
      // console.log('Cliente desconectado:', socket.id);
    });

    // Enviar mensaje de bienvenida
    socket.emit("message", {
      text: "Welcome to WebSocket Echo Server!",
      senderId: "system",
      timestamp: new Date().toISOString(),
    });
  });

  // Emitir actualizaciones de estadísticas cada 5 segundos
  setInterval(async () => {
    try {
      const stats = await getRealTimeStats();
      io.emit("stats-update", stats);
    } catch (error) {
      console.error("Error emitting stats update:", error);
    }
  }, 5000);
};

// Función para transmitir actualizaciones de stock a todos los clientes conectados
export const broadcastStockUpdate = (io: Server, stockData: any) => {
  io.emit("stockUpdated", stockData);
  console.log("📦 Broadcasting stock update:", stockData);
};

// Función para transmitir actualizaciones de cuenta a todos los clientes conectados
export const broadcastAccountUpdate = (io: Server, accountData: any) => {
  io.emit("accountUpdated", accountData);
  console.log("🔄 Broadcasting account update:", accountData);
};

// Función para transmitir actualizaciones de pedidos a todos los clientes conectados
export const broadcastOrderUpdate = (io: Server, orderData: any) => {
  io.emit("orderUpdated", orderData);
  console.log("🛒 Broadcasting order update:", orderData);
};
// Función para transmitir actualizaciones de mensajes a usuarios específicos
export const broadcastMessageUpdate = (
  io: Server,
  userId: string,
  unreadCount: number
) => {
  io.to(`user:${userId}`).emit("messageUpdate", { unreadCount });
};

// Función para obtener la instancia de IO
export const getIO = (): Server | null => {
  return (global as any).io || null;
};

// Función para obtener estadísticas en tiempo real
async function getRealTimeStats() {
  try {
    // Obtener el total de usuarios
    const totalUsers = await db.user.count();

    // obtener el total de ordenes
    const totalOrders = await db.order.count();

    // Obtenga ingresos totales
    const orders = await db.order.findMany({
      select: { totalPrice: true },
    });
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    // Obtener usuarios activos (usuarios con pedidos)
    const activeUsers = await db.user.count({
      where: {
        orders: {
          some: {},
        },
      },
    });

    // Obtener créditos totales
    const users = await db.user.findMany({
      select: { credits: true },
    });
    const totalCredits = users.reduce((sum, user) => sum + user.credits, 0);

    // Obtener tasa de conversión
    const conversionRate =
      totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // Obtenga usuarios en línea a partir de un sistema de seguimiento real
    let onlineUsers = {
      current: 0,
      peakToday: 0,
      averageToday: 0,
    };

    try {
      const onlineUsersResponse = await fetch(
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/api/admin/online-users`,
        {
          signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
        }
      );

      if (onlineUsersResponse.ok) {
        const onlineData = await onlineUsersResponse.json();
        onlineUsers = {
          current: onlineData.current || 0,
          peakToday: onlineData.peakToday || 0,
          averageToday: onlineData.averageToday || 0,
        };
      }
    } catch (error) {
      console.warn("Error fetching online users:", error);
      // Usar valores por defecto si hay error
    }

    const pagePerformance = {
      loadTime: 0,
      responseTime: 0,
      uptime: 100,
      performanceScore: 100,
    };

    // Get inventory stats
    const [regularAccounts, exclusiveAccounts] = await Promise.all([
      db.streamingAccount.findMany({
        include: {
          accountStocks: true,
          profileStocks: true,
          orders: true,
        },
      }),
      db.exclusiveAccount.findMany({
        include: {
          exclusiveStocks: true,
          orders: true,
        },
      }),
    ]);

    // Calcular totales de existencias
    const totalRegularStock = regularAccounts.reduce(
      (sum, account) =>
        sum +
        (account.accountStocks?.length || 0) +
        (account.profileStocks?.length || 0),
      0
    );

    const totalExclusiveStock = exclusiveAccounts.reduce(
      (sum, account) =>
        sum +
        (account.exclusiveStocks?.filter((stock) => stock.isAvailable).length ||
          0),
      0
    );

    const totalStock = totalRegularStock + totalExclusiveStock;

    // Obtenga pedidos recientes de actividad
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        streamingAccount: {
          select: { name: true, type: true },
        },
      },
    });

    const recentActivity = recentOrders.map((order) => ({
      type: "order",
      description: `Nuevo pedido: ${
        order.streamingAccount?.name || "Producto"
      }`,
      time: getRelativeTime(order.createdAt.toISOString()),
      icon: "ShoppingCart",
    }));

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      activeUsers,
      totalCredits,
      conversionRate,
      onlineUsers,
      pagePerformance,
      totalStock,
      recentActivity,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting real-time stats:", error);
    throw error;
  }
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}
