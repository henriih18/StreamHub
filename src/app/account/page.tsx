"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  ShoppingBag,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle,
  Phone,
  Globe,
  TrendingUp,
  Headphones,
  MessageSquare,
  Send,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { CartSidebar } from "@/components/cart-sidebar";

interface Order {
  id: string;
  userId: string;
  streamingAccountId?: string;
  exclusiveAccountId?: string;
  accountStockId?: string;
  accountProfileId?: string;
  accountEmail?: string;
  accountPassword?: string;
  profileName?: string;
  profilePin?: string;
  saleType: "FULL" | "PROFILES";
  quantity: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  totalPrice: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    name: string | null;
  };
  streamingAccount?: {
    id: string;
    name: string;
    description: string;
    price: number;
    type: string;
    duration: string;
    quality: string;
    screens: number;
    streamingType?: {
      name: string;
      description?: string;
    };
  };
}

interface SupportContact {
  id: string;
  name: string;
  number: string;
  type: string;
  description?: string;
  isActive: boolean;
  order: number;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          localStorage.removeItem("user");
        }
      } else {
        setUser(null);
      }
    };

    // Check initial auth state
    checkAuth();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        checkAuth();
      }
    };

    // Listen for custom logout event
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userLogout", handleLogout);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogout", handleLogout);
    };
  }, []);

  // Fetch fresh user data from server
  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/auth/user?userId=${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        if (userData.user) {
          // Format createdAt to memberSince if it exists
          if (userData.user.createdAt) {
            userData.user.memberSince = new Date(
              userData.user.createdAt
            ).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          }

          setUser(userData.user);
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(userData.user));
        }
      }
    } catch (error) {
      //console.error('Error fetching user data:', error)
    }
  };

  // Fetch support contacts
  const fetchSupportContacts = async () => {
    try {
      const response = await fetch("/api/support-contacts");
      if (response.ok) {
        const data = await response.json();
        setSupportContacts(data.contacts || []);
      }
    } catch (error) {
      //console.error('Error fetching support contacts:', error)
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    if (!user) return;

    setLoadingOrders(true);
    try {
      const response = await fetch(`/api/orders?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats - direct array or wrapped in orders property
        const ordersData = Array.isArray(data) ? data : data.orders || [];
        setOrders(ordersData);
      } else {
        console.error("Failed to fetch orders:", response.status);
      }
    } catch (error) {
      //console.error('Error fetching orders:', error)
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch orders and support contacts when user changes
  useEffect(() => {
    if (user) {
      fetchUserOrders();
      fetchSupportContacts();
      loadCartItems();
    } else {
      setOrders([]);
      setSupportContacts([]);
      setCartItems([]);
    }
  }, [user]);

  // Load cart items
  const loadCartItems = async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      }
    } catch (error) {
      //console.error('Error loading cart items:', error)
    }
  };

  // Listen for cart open events
  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
      loadCartItems();
    };

    window.addEventListener("openCart", handleOpenCart);
    return () => {
      window.removeEventListener("openCart", handleOpenCart);
    };
  }, []);

  // Refresh user data when page gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchUserData();
      }
    };

    const handleFocus = () => {
      if (user) {
        fetchUserData();
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Initial fetch after component mounts
    if (user) {
      fetchUserData();
    }

    // Set up periodic refresh every 5 minutes
    const interval = setInterval(() => {
      if (user) {
        fetchUserData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [user?.id]);

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Cart functions
  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        await loadCartItems();
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      }
    } catch (error) {
      //console.error('Error updating quantity:', error)
      toast.error("Error al actualizar cantidad");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadCartItems();
        window.dispatchEvent(new CustomEvent("cartUpdated"));
        toast.success("Producto eliminado del carrito");
      }
    } catch (error) {
      //console.error('Error removing from cart:', error)
      toast.error("Error al eliminar producto");
    }
  };

  const getTotal = () => {
    return (cartItems || []).reduce(
      (total, item) => total + item.streamingAccount.price * item.quantity,
      0
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            No has iniciado sesión
          </h2>
          <p className="text-slate-400 mb-6">
            Por favor inicia sesión para ver tu cuenta
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation
        user={user}
        cartItemsCount={(cartItems || []).length}
        onCartOpen={() => setIsCartOpen(true)}
        onLogin={() => {
          router.push("/login");
        }}
        onLogout={() => {
          setUser(null);
          localStorage.removeItem("user");
          router.push("/");
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Mi Cuenta</h1>
            <p className="text-slate-400">
              Gestiona tu perfil y tus cuentas de streaming
            </p>
          </div>

          {/* User Profile Card */}
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user.fullName?.charAt(0).toUpperCase() ||
                      user.username?.charAt(0).toUpperCase() ||
                      user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-white">
                      {user.fullName || user.username || "Usuario"}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {/* Nombre Completo */}
                    {user.fullName && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <User className="w-4 h-4" />
                        <span className="text-sm">Nombre: {user.fullName}</span>
                      </div>
                    )}
                    {/* Nombre de Usuario */}
                    {user.username && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <User className="w-4 h-4" />
                        <span className="text-sm">
                          Usuario: {user.username}
                        </span>
                      </div>
                    )}
                    {/* Email */}
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {/* Teléfono */}
                    {user.phone && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                    {/* País */}
                    {user.country && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">{user.country}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex gap-2 justify-end mb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        fetchUserData();
                        toast.success("Datos actualizados");
                      }}
                      className="border-slate-600 text-slate-300 hover:bg-slate-600"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Actualizar
                    </Button>
                  </div>
                  <Badge
                    className={`${
                      user.role === "ADMIN" ? "bg-purple-600" : "bg-emerald-600"
                    } text-white mb-2`}
                  >
                    {user.role === "ADMIN" ? "Administrador" : "Usuario"}
                  </Badge>
                  <div className="text-sm text-slate-400">
                    Miembro desde{" "}
                    {new Date(user.createdAt).toLocaleDateString("es-CO")}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  ${user.credits?.toLocaleString("es-CO") || "0"}
                </div>
                <div className="text-slate-400 text-sm">Créditos</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {(orders || []).length}
                </div>
                <div className="text-slate-400 text-sm">Pedidos</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {
                    (orders || []).filter((o) => o.status === "COMPLETED")
                      .length
                  }
                </div>
                <div className="text-slate-400 text-sm">Activos</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  <span className="text-emerald-400">Activo</span>
                </div>
                <div className="text-slate-400 text-sm">Estado</div>
              </CardContent>
            </Card>
          </div>

          {/* Support Contacts */}
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <Headphones className="w-5 h-5 text-emerald-400" />
                Soporte Técnico
              </CardTitle>
              <CardDescription className="text-slate-400">
                Contacta con nuestro equipo de soporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(supportContacts || []).filter((contact) => contact.isActive)
                .length === 0 ? (
                <div className="text-center py-8">
                  <Headphones className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Soporte no disponible
                  </h3>
                  <p className="text-slate-400">
                    No hay contactos de soporte configurados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportContacts
                    .filter((contact) => contact.isActive)
                    .sort((a, b) => a.order - b.order)
                    .map((contact) => (
                      <div
                        key={contact.id}
                        className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">
                              {contact.type === "whatsapp"
                                ? "💬"
                                : contact.type === "phone"
                                ? "📞"
                                : contact.type === "telegram"
                                ? "✈️"
                                : "💬"}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">
                              {contact.name}
                            </h4>
                            <Badge className="bg-emerald-600/20 text-emerald-300 text-xs">
                              {contact.type === "whatsapp"
                                ? "WhatsApp"
                                : contact.type === "phone"
                                ? "Teléfono"
                                : contact.type === "telegram"
                                ? "Telegram"
                                : "SMS"}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-emerald-400 font-medium mb-2">
                          {contact.number}
                        </p>
                        {contact.description && (
                          <p className="text-slate-400 text-sm mb-3">
                            {contact.description}
                          </p>
                        )}
                        <Button
                          size="sm"
                          className={`w-full ${
                            contact.type === "whatsapp"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                          onClick={() => {
                            let url = "";
                            if (contact.type === "whatsapp") {
                              const cleanNumber = contact.number.replace(
                                /[^\d+]/g,
                                ""
                              );
                              url = `https://wa.me/${cleanNumber}`;
                            } else if (contact.type === "telegram") {
                              url = `https://t.me/${contact.number.replace(
                                "@",
                                ""
                              )}`;
                            } else {
                              url = `tel:${contact.number}`;
                            }
                            window.open(url, "_blank");
                          }}
                        >
                          {contact.type === "whatsapp" ? (
                            <>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              WhatsApp
                            </>
                          ) : contact.type === "telegram" ? (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Telegram
                            </>
                          ) : (
                            <>
                              <Phone className="w-4 h-4 mr-2" />
                              Llamar
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Section */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-white">
                    Mis Pedidos
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Historial de compras
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">
                    {
                      (orders || []).filter((o) => o.status === "COMPLETED")
                        .length
                    }{" "}
                    activos
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loadingOrders ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-slate-400">Cargando pedidos...</div>
                </div>
              ) : (orders || []).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No tienes pedidos
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Explora nuestro catálogo y adquiere tu primera cuenta
                  </p>
                  <Button
                    onClick={() => router.push("/#accounts")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Explorar Cuentas
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-700 rounded-lg p-6 border border-slate-600"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-white text-lg">
                              {order.streamingAccount?.name ||
                                "Cuenta Exclusiva"}
                            </h3>
                            <Badge
                              className={`${
                                order.status === "COMPLETED"
                                  ? "bg-green-600"
                                  : order.status === "PENDING"
                                  ? "bg-yellow-600"
                                  : "bg-slate-600"
                              } text-white`}
                            >
                              {order.status === "COMPLETED"
                                ? "Activo"
                                : order.status === "PENDING"
                                ? "Pendiente"
                                : order.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xl font-bold text-emerald-400 mb-1">
                                ${order.totalPrice.toLocaleString("es-CO")}
                              </p>
                              <p className="text-slate-400">
                                {order.saleType === "FULL"
                                  ? "Cuenta Completa"
                                  : "Perfil"}{" "}
                                • {order.streamingAccount?.duration}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="text-slate-400 text-sm mb-2">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "es-CO"
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-white hover:bg-slate-600"
                                onClick={() => toggleOrderExpansion(order.id)}
                              >
                                {expandedOrders.has(order.id) ? (
                                  <>
                                    <ChevronUp className="w-4 h-4 mr-1" />
                                    Menos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                    Más
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Credentials - Always Visible */}
                      {(order.accountEmail ||
                        order.accountPassword ||
                        order.profileName ||
                        order.profilePin) && (
                        <div className="mb-4 p-5 bg-gradient-to-r from-emerald-600/5 to-emerald-500/5 border border-emerald-500/20 rounded-xl backdrop-blur-sm">
                          <p className="text-emerald-400 mb-4 font-semibold flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Credenciales de Acceso:
                          </p>
                          <div className="space-y-3">
                            {order.accountEmail && (
                              <div className="group relative overflow-hidden rounded-lg border border-emerald-500/20 bg-slate-800/50 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:bg-slate-800/70">
                                <div className="flex items-center justify-between p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    <span className="text-slate-300 font-medium">
                                      Email
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-emerald-300 font-mono font-semibold">
                                      {order.accountEmail}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          order.accountEmail!
                                        );
                                        toast.success(
                                          "Email copiado al portapapeles"
                                        );
                                      }}
                                    >
                                      <CreditCard className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {order.accountPassword && (
                              <div className="group relative overflow-hidden rounded-lg border border-emerald-500/20 bg-slate-800/50 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:bg-slate-800/70">
                                <div className="flex items-center justify-between p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    <span className="text-slate-300 font-medium">
                                      Contraseña
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-emerald-300 font-mono font-semibold">
                                      {order.accountPassword}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          order.accountPassword!
                                        );
                                        toast.success(
                                          "Contraseña copiada al portapapeles"
                                        );
                                      }}
                                    >
                                      <CreditCard className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {order.profileName && (
                              <div className="group relative overflow-hidden rounded-lg border border-emerald-500/20 bg-slate-800/50 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:bg-slate-800/70">
                                <div className="flex items-center justify-between p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    <span className="text-slate-300 font-medium">
                                      Perfil
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-emerald-300 font-semibold">
                                      {order.profileName}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          order.profileName!
                                        );
                                        toast.success(
                                          "Nombre de perfil copiado"
                                        );
                                      }}
                                    >
                                      <CreditCard className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {order.profilePin && (
                              <div className="group relative overflow-hidden rounded-lg border border-emerald-500/20 bg-slate-800/50 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:bg-slate-800/70">
                                <div className="flex items-center justify-between p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    <span className="text-slate-300 font-medium">
                                      PIN
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-emerald-300 font-mono font-semibold">
                                      {order.profilePin}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          order.profilePin!
                                        );
                                        toast.success(
                                          "PIN copiado al portapapeles"
                                        );
                                      }}
                                    >
                                      <CreditCard className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-3 mt-6 pt-4 border-t border-emerald-500/20">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all hover:shadow-emerald-600/40"
                              onClick={() => {
                                const credentials: string[] = [];
                                if (order.accountEmail)
                                  credentials.push(
                                    `Email: ${order.accountEmail}`
                                  );
                                if (order.accountPassword)
                                  credentials.push(
                                    `Contraseña: ${order.accountPassword}`
                                  );
                                if (order.profileName)
                                  credentials.push(
                                    `Perfil: ${order.profileName}`
                                  );
                                if (order.profilePin)
                                  credentials.push(`PIN: ${order.profilePin}`);

                                navigator.clipboard.writeText(
                                  credentials.join("\n")
                                );
                                toast.success(
                                  "Todas las credenciales copiadas"
                                );
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Copiar Todo
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Expanded Order Details */}
                      {expandedOrders.has(order.id) && (
                        <div className="pt-4 border-t border-slate-600">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Order Information */}
                            <div>
                              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-blue-400" />
                                Información del Pedido
                              </h4>

                              <div className="space-y-3">
                                <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                  <label className="text-slate-400 text-sm">
                                    ID del Pedido
                                  </label>
                                  <div className="text-white font-mono text-sm">
                                    {order.id}
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                  <label className="text-slate-400 text-sm">
                                    Tipo de Venta
                                  </label>
                                  <div className="text-white">
                                    {order.saleType === "FULL"
                                      ? "Cuenta Completa"
                                      : "Perfil Individual"}
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                  <label className="text-slate-400 text-sm">
                                    Cantidad
                                  </label>
                                  <div className="text-white">
                                    {order.quantity}{" "}
                                    {order.quantity === 1
                                      ? "unidad"
                                      : "unidades"}
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                  <label className="text-slate-400 text-sm">
                                    Precio Unitario
                                  </label>
                                  <div className="text-white">
                                    $
                                    {(
                                      order.totalPrice / order.quantity
                                    ).toLocaleString("es-CO")}
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                  <label className="text-slate-400 text-sm">
                                    Fecha de Compra
                                  </label>
                                  <div className="text-white text-sm">
                                    {new Date(
                                      order.createdAt
                                    ).toLocaleDateString("es-CO")}
                                  </div>
                                </div>

                                {order.expiresAt && (
                                  <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                    <label className="text-slate-400 text-sm">
                                      Fecha de Expiración
                                    </label>
                                    <div className="text-white text-sm">
                                      {new Date(
                                        order.expiresAt
                                      ).toLocaleDateString("es-CO")}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Streaming Account Details */}
                            {order.streamingAccount && (
                              <div>
                                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                                  <Monitor className="w-4 h-4 text-purple-400" />
                                  Detalles del Servicio
                                </h4>

                                <div className="space-y-3">
                                  <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                    <label className="text-slate-400 text-sm">
                                      Calidad
                                    </label>
                                    <div className="text-white font-semibold">
                                      {order.streamingAccount.quality || "N/A"}
                                    </div>
                                  </div>

                                  <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                    <label className="text-slate-400 text-sm">
                                      Pantallas
                                    </label>
                                    <div className="text-white font-semibold">
                                      {order.streamingAccount.screens || "N/A"}
                                    </div>
                                  </div>

                                  <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                    <label className="text-slate-400 text-sm">
                                      Duración
                                    </label>
                                    <div className="text-white font-semibold">
                                      {order.streamingAccount.duration || "N/A"}
                                    </div>
                                  </div>

                                  {order.streamingAccount.description && (
                                    <div className="p-3 bg-slate-800 rounded border border-slate-600">
                                      <label className="text-slate-400 text-sm">
                                        Descripción
                                      </label>
                                      <div className="text-white text-sm">
                                        {order.streamingAccount.description}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={() => router.push("/checkout")}
        userCredits={user?.credits || 0}
      />
    </div>
  );
}
