"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { StreamingCard } from "@/components/streaming-card";
import { CartSidebar } from "@/components/cart-sidebar";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast-custom";
import { useOnlineTracking } from "@/hooks/useOnlineTracking";
import {
  Play,
  Shield,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  Monitor,
  Lock,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";

interface StreamingAccount {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  duration: string;
  quality: string;
  screens: number;
  image?: string;
  saleType: "FULL" | "PROFILES";
  maxProfiles?: number;
  pricePerProfile?: number;
  streamingType?: {
    icon?: string;
    color?: string;
  };
  accountStocks?: Array<{
    id: string;
    email: string;
    password: string;
    isAvailable: boolean;
  }>;
  profileStocks?: Array<{
    id: string;
    email: string;
    password: string;
    profileName: string;
    profilePin?: string;
    isAvailable: boolean;
  }>;
  specialOffer?: any;
  originalPrice?: number;
}

interface CartItem {
  id: string;
  streamingAccount: StreamingAccount;
  quantity: number;
  saleType: "FULL" | "PROFILES";
  priceAtTime: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [streamingAccounts, setStreamingAccounts] = useState<
    StreamingAccount[]
  >([]);
  const [filteredAccounts, setFilteredAccounts] = useState<StreamingAccount[]>(
    []
  );
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 9;
  const [isError, setIsError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useOnlineTracking({
    userId: user?.id,
    enabled: !!user?.id,
    updateInterval: 30000, // 30 segundos
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/");
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser || !parsedUser.id) {
          localStorage.removeItem("user");
          router.push("/");
          return;
        }
        setUser(parsedUser);
        setIsLoading(false);
      } catch (error) {
        localStorage.removeItem("user");
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch streaming accounts from API
  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      try {
        const userId = user?.id || null;
        //console.log('Fetching accounts for userId:', userId) // Debug log
        const url = userId
          ? `/api/streaming-accounts?userId=${userId}`
          : "/api/streaming-accounts";
        //console.log('API URL:', url) // Debug log
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          //console.log('API Response:', data) // Debug log

          let allAccounts = [
            ...(data.exclusiveAccounts || []),
            ...(data.regularAccounts || []),
          ];

          //console.log('Special offers for user:', data.specialOffers) // Debug log

          if (data.specialOffers) {
            data.specialOffers.forEach((offer: any) => {
              if (offer.streamingAccount) {
                // Find if the account already exists in our array
                const existingAccountIndex = allAccounts.findIndex(
                  (account) => account.id === offer.streamingAccount.id
                );

                if (existingAccountIndex !== -1) {
                  allAccounts[existingAccountIndex] = {
                    ...allAccounts[existingAccountIndex],
                    specialOffer: offer,
                    originalPrice: offer.streamingAccount.price,
                    price: offer.discountPercentage
                      ? offer.streamingAccount.price *
                        (1 - offer.discountPercentage / 100)
                      : offer.specialPrice || offer.streamingAccount.price,
                  };
                } else {
                  allAccounts.push({
                    ...offer.streamingAccount,
                    specialOffer: offer,
                    originalPrice: offer.streamingAccount.price,
                    price: offer.discountPercentage
                      ? offer.streamingAccount.price *
                        (1 - offer.discountPercentage / 100)
                      : offer.specialPrice || offer.streamingAccount.price,
                  });
                }
              }
            });
          }

          // Sort accounts: exclusive accounts first, then regular accounts
          allAccounts = allAccounts.sort((a: any, b: any) => {
            const aIsExclusive =
              !a.streamingType && !a.accountStocks && !a.profileStocks;
            const bIsExclusive =
              !b.streamingType && !b.accountStocks && !b.profileStocks;

            if (aIsExclusive && !bIsExclusive) return -1;
            if (!aIsExclusive && bIsExclusive) return 1;

            return 0; // Keep original order within each category
          });
          setStreamingAccounts(allAccounts);
          setFilteredAccounts(allAccounts);
        }
      } catch (error) {
        //console.error('Error fetching accounts:', error)
        //console.error('Error fetching accounts:', error)
        toast.error(
          "Error al recuperar las cuentas. Por favor, intenta de nuevo."
        );
        setStreamingAccounts([]);
        setFilteredAccounts([]);
        setIsError(true);
      }
    };

    fetchAccounts();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAccounts(streamingAccounts);
    } else {
      const filtered = streamingAccounts.filter(
        (account) =>
          account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, [searchQuery, streamingAccounts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil((filteredAccounts || []).length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccounts = (filteredAccounts || []).slice(startIndex, endIndex);

  const handleRetry = async () => {
    setIsRetrying(true);
    setIsError(false);
  };

  const getAvailableStock = (account: StreamingAccount): number => {
    const isExclusiveAccount =
      !account.streamingType &&
      !account.accountStocks &&
      !account.profileStocks;
    if (isExclusiveAccount) {
      return 999;
    }

    // For regular accounts
    if (account.saleType === "PROFILES") {
      return (
        account.profileStocks?.filter((stock) => stock.isAvailable).length || 0
      );
    } else {
      return (
        account.accountStocks?.filter((stock) => stock.isAvailable).length || 0
      );
    }
  };

  const addToCart = async (account: StreamingAccount, quantity: number = 1) => {
    if (!user) {
      toast.error("Por favor inicia sesión para agregar productos al carrito");
      return;
    }

    // Check stock availability
    const availableStock = getAvailableStock(account);
    if (availableStock < quantity) {
      toast.error(
        `Stock insuficiente. Solo hay ${availableStock} unidad${
          availableStock !== 1 ? "es" : ""
        } disponible${availableStock !== 1 ? "s" : ""}.`
      );
      return;
    }

    try {
      // Check if it's an exclusive account
      const isExclusiveAccount =
        !account.streamingType &&
        !account.accountStocks &&
        !account.profileStocks;

      let response;
      if (isExclusiveAccount) {
        // Use exclusive cart API for exclusive accounts
        response = await fetch("/api/exclusive-cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            exclusiveAccountId: account.id,
            quantity: quantity,
          }),
        });
      } else {
        // Use regular cart API for streaming accounts
        response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            streamingAccountId: account.id,
            quantity: quantity,
            saleType: account.saleType,
          }),
        });
      }

      if (response.ok) {
        // Refresh cart items
        await fetchCartItems();

        // Show success notification
        const accountType =
          account.saleType === "PROFILES" ? "Perfil" : "Cuenta Completa";
        const quantityText = quantity > 1 ? `${quantity} unidades` : "1 unidad";

        toast.success(`${accountType} "${account.name}" agregado al carrito`, {
          description: `${quantityText} • $${account.price.toLocaleString(
            "es-CO"
          )} c/u`,
          duration: 3000,
        });

        // Trigger cart update event for navigation badge
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      } else {
        const data = await response.json();
        toast.error(data.error || "Error al agregar al carrito");
      }
    } catch (error) {
      toast.error("Error de conexión. Intenta de nuevo.");
    }
  };

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/cart?userId=${user.id}`);
      if (response.ok) {
        const cartData = await response.json();
        const formattedItems = cartData.items.map((item: any) => {
          let availableStock = 99;

          if (item.streamingAccount) {
            if (item.saleType === "PROFILES") {
              availableStock =
                item.streamingAccount.profileStocks?.filter(
                  (stock: any) => stock.isAvailable
                ).length || 0;
            } else {
              availableStock =
                item.streamingAccount.accountStocks?.filter(
                  (stock: any) => stock.isAvailable
                ).length || 0;
            }
          }

          return {
            id: item.id,
            streamingAccount: {
              ...item.streamingAccount,
              streamingType: item.streamingAccount.streamingType,
            },
            quantity: item.quantity,
            saleType: item.saleType,
            priceAtTime: item.priceAtTime,
            availableStock,
          };
        });
        setCartItems(formattedItems);
      }
    } catch (error) {
      //console.error('Error fetching cart:', error)
    }
  };

  // Fetch cart items when user changes
  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    // Find the cart item to get account info
    const cartItem = cartItems.find((item) => item.id === itemId);
    if (!cartItem) {
      toast.error("Artículo no encontrado en el carrito");
      return;
    }

    // Check stock availability
    const availableStock = getAvailableStock(cartItem.streamingAccount);
    if (availableStock < quantity) {
      toast.error(
        `Stock insuficiente. Solo hay ${availableStock} unidad${
          availableStock !== 1 ? "es" : ""
        } disponible${availableStock !== 1 ? "s" : ""}.`
      );
      return;
    }

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        setCartItems(
          cartItems.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          )
        );

        // Trigger cart update event for navigation badge
        window.dispatchEvent(new CustomEvent("cartUpdated"));

        toast.success("Cantidad actualizada", {
          duration: 2000,
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error al actualizar cantidad");
      }
    } catch (error) {
      //console.error('Error updating quantity:', error)
      toast.error("Error de conexión");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const removedItem = cartItems.find((item) => item.id === itemId);
        setCartItems(cartItems.filter((item) => item.id !== itemId));

        // Trigger cart update event for navigation badge
        window.dispatchEvent(new CustomEvent("cartUpdated"));

        if (removedItem) {
          toast.success(
            `${removedItem.streamingAccount.name} eliminado del carrito`,
            {
              duration: 3000,
            }
          );
        }
      } else {
        toast.error("Error al eliminar del carrito");
      }
    } catch (error) {
      //console.error('Error removing item:', error)
      toast.error("Error de conexión");
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Por favor inicia sesión para continuar con la compra");
      return;
    }

    if ((cartItems || []).length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          items: cartItems,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const totalItems = (cartItems || []).reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        toast.success(`¡Pedido creado con éxito!`, {
          description: `Puedes ver los detalles de tu compra en el panel "Mi Cuenta"`,
          duration: 5000,
        });

        setCartItems([]);
        setIsCartOpen(false);

        // Trigger cart update event for navigation badge
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error al procesar el pedido");
      }
    } catch (error) {
      toast.error("Error de conexión. Intenta de nuevo.");
    }
  };

  const handleLogin = (userData: any) => {
    // Format createdAt to memberSince if it exists
    if (userData.createdAt) {
      userData.memberSince = new Date(userData.createdAt).toLocaleDateString(
        "es-CO",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );
    }

    setUser(userData);
    // Store in localStorage for persistence
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Fetch fresh user data from server
  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/auth/user?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();

        if (data.user) {
          // Format createdAt to memberSince if it exists
          if (data.user.createdAt) {
            data.user.memberSince = new Date(
              data.user.createdAt
            ).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          }

          setUser(data.user);
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      }
    } catch (error) {
      //console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleCartOpen = () => {
    setIsCartOpen(true);
  };

  // Check for existing user session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Fetch fresh user data from server to get updated credits
        fetchUserData(parsedUser.id);
      } catch (error) {
        localStorage.removeItem("user");
      }
    }

    // Listen for cart open event from navigation
    const handleOpenCart = () => {
      setIsCartOpen(true);

      // If user exists but might have stale data, refresh user data
      if (user && user.id) {
        fetchUserData(user.id);
      }
    };

    window.addEventListener("openCart", handleOpenCart);

    return () => {
      window.removeEventListener("openCart", handleOpenCart);
    };
  }, []);

  // Set up periodic user data refresh every 2 minutes
  useEffect(() => {
    if (!user || !user.id) return;

    const interval = setInterval(() => {
      fetchUserData(user.id);
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [user?.id]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p className="text-white text-lg">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  const cartItemsCount = (cartItems || []).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Check if user is admin (check role field first, then fallback to email)
  const isAdmin = user && user.role === "ADMIN";

  const userProps = {
    id: user?.id,
    email: user?.email,
    name: user?.name,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950">
      {/*  <Navigation />
       */}

      <Navigation
        user={user}
        cartItemsCount={cartItems.length}
        onCartOpen={handleCartOpen}
        onLogin={() => router.push("/login")}
        onLogout={handleLogout}
      />

      <main>
        {/* Hero Section - Panel Style */}
        <section
          className="relative flex items-center justify-center overflow-hidden"
          style={{ minHeight: "70vh" }}
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-transparent to-teal-900/30"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
            <div className="text-center">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2 mb-6">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-300 text-sm font-medium">
                  StreamHub Activo
                </span>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                StreamHub
                <span className="block text-emerald-400">
                  Todo el Entretenimiento que Buscas
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
                Las mejores cuentas de streaming al mejor precio
              </p>
            </div>
          </div>
        </section>

        {/* Accounts Section - Manteniendo las Cards Exactamente Igual */}
        <section
          id="accounts"
          className="py-20 bg-gradient-to-b from-transparent to-slate-900"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-4">
                📋 Catálogo de Cuentas
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Cuentas Disponibles
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                Selecciona la cuenta que prefieras y disfruta del mejor
                contenido
              </p>

              {/* Search Bar */}
              <div className="max-w-md mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar cuentas de streaming..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                {searchQuery && (
                  <div className="mt-2 text-center">
                    <span className="text-sm text-slate-400">
                      {(filteredAccounts || []).length}{" "}
                      {(filteredAccounts || []).length === 1
                        ? "cuenta encontrada"
                        : "cuentas encontradas"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentAccounts.map((account) => (
                <StreamingCard
                  key={account.id}
                  account={account}
                  onAddToCart={addToCart}
                  isMostPopular={["1", "2", "3"].includes(account.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}

            {(filteredAccounts || []).length === 0 && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No se encontraron cuentas
                  </h3>
                  <p className="text-slate-400">
                    Intenta con otros términos de búsqueda.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer - Panel Style */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-white font-semibold mb-4">StreamHub</h3>
              <p className="text-slate-400 text-sm">
                Tu plataforma de confianza para cuentas de streaming premium
              </p>
            </div>

            <div className="text-center">
              <h4 className="text-white font-medium mb-3">Contacto</h4>
              <p className="text-slate-400 text-sm">
                Los números de contacto están disponibles en el panel "Mi
                Cuenta"
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm mb-4 md:mb-0">
                © 2025 StreamHub. Todos los derechos reservados.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 text-sm font-medium">
                  Sistema Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
        userCredits={user?.credits || 0}
      />
    </div>
  );
}
