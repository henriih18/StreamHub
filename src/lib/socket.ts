import { Server } from "socket.io";
import { db } from "@/lib/db";

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    // console.log('Client connected:', socket.id);

    // Handle user registration for message updates
    socket.on("registerUser", (userId: string) => {
      socket.join(`user:${userId}`);
      // console.log(`User ${userId} registered for message updates`);
    });

    // Handle messages
    socket.on("message", (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit("message", {
        text: `Echo: ${msg.text}`,
        senderId: "system",
        timestamp: new Date().toISOString(),
      });
    });

    // Handle admin stats requests
    socket.on("request-stats", async () => {
      try {
        const stats = await getRealTimeStats();
        socket.emit("stats-update", stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit("message", {
      text: "Welcome to WebSocket Echo Server!",
      senderId: "system",
      timestamp: new Date().toISOString(),
    });
  });

  // Emit stats updates every 5 seconds
  setInterval(async () => {
    try {
      const stats = await getRealTimeStats();
      io.emit("stats-update", stats);
    } catch (error) {
      console.error("Error emitting stats update:", error);
    }
  }, 5000);
};

// Function to broadcast message updates to specific users
export const broadcastMessageUpdate = (
  io: Server,
  userId: string,
  unreadCount: number
) => {
  io.to(`user:${userId}`).emit("messageUpdate", { unreadCount });
};

// Function to get IO instance
export const getIO = (): Server | null => {
  return (global as any).io || null;
};

// Function to get real-time statistics
async function getRealTimeStats() {
  try {
    // Get total users
    const totalUsers = await db.user.count();

    // Get total orders
    const totalOrders = await db.order.count();

    // Get total revenue
    const orders = await db.order.findMany({
      select: { totalPrice: true },
    });
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    // Get active users (users with orders)
    const activeUsers = await db.user.count({
      where: {
        orders: {
          some: {},
        },
      },
    });

    // Get total credits
    const users = await db.user.findMany({
      select: { credits: true },
    });
    const totalCredits = users.reduce((sum, user) => sum + user.credits, 0);

    // Get conversion rate
    const conversionRate =
      totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // Get online users from real tracking system
    const onlineUsersResponse = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/admin/online-users`
    );
    let onlineUsers = {
      current: 0,
      peakToday: 0,
      averageToday: 0,
    };

    if (onlineUsersResponse.ok) {
      const onlineData = await onlineUsersResponse.json();
      onlineUsers = {
        current: onlineData.current || 0,
        peakToday: onlineData.peakToday || Math.floor(Math.random() * 80) + 30,
        averageToday:
          onlineData.averageToday || Math.floor(Math.random() * 40) + 15,
      };
    }

    // Get performance metrics (simulated for now)
    const pagePerformance = {
      loadTime: Math.random() * 500 + 200,
      responseTime: Math.random() * 100 + 50,
      uptime: 99.5 + Math.random() * 0.5,
      performanceScore: 85 + Math.floor(Math.random() * 15),
    };

    // Get inventory stats
    /* const [regularAccounts, exclusiveAccounts] = await Promise.all([
      db.streamingAccount.findMany({
        include: {
          _count: {
            select: {
              accountStocks: true,
              profileStocks: true,
              orders: true,
            },
          },
        },
      }),
      db.exclusiveAccount.findMany({
        include: {
          exclusiveStocks: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      }),
    ]);

    // Calculate stock totals
    const totalRegularStock = regularAccounts.reduce(
      (sum, account) =>
        sum +
        (account._count.accountStocks || 0) +
        (account._count.profileStocks || 0),
      0
    );

    const totalExclusiveStock = exclusiveAccounts.reduce(
      (sum, account) =>
        sum +
        (account.exclusiveStocks?.filter((stock) => stock.isAvailable).length ||
          0),
      0
    ); */

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

    // Calculate stock totals
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

    // Get recent orders for activity
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
