"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { StreamingCard } from "@/components/streaming-card";
import { CartSidebar } from "@/components/cart-sidebar";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast-custom";
import { useOnlineTracking } from "@/hooks/useOnlineTracking";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { Search } from "lucide-react";

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
    isAvailable: boolean;
  }>;
  profileStocks?: Array<{
    id: string;
    isAvailable: boolean;
  }>;

  exclusiveStocks?: Array<{
    id: string;
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

  availableStock?: number;
}

export default function Home() {
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
  const [userCredits, setUserCredits] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 9;

  // Track online users
  useOnlineTracking({
    userId: user?.id,
    enabled: true,
    updateInterval: 30000, // 30 segundos
  });

  // Real-time updates for messages

  useRealTimeUpdates({
    userId: user?.id,
    onMessageUpdate: (messageData) => {
      // Trigger navigation update when message count changes
      window.dispatchEvent(new CustomEvent("messagesUpdated"));
    },
    onStockUpdate: (stockData) => {
      setStreamingAccounts((prev) =>
        prev.map((account) => {
          if (account.id === stockData.accountId) {
            const updatedAccount = { ...account };

            if (stockData.accountType === "exclusive") {
              // Update exclusive stock
              updatedAccount.exclusiveStocks =
                account.exclusiveStocks?.map((stock, index) =>
                  index < stockData.newStock
                    ? { ...stock, isAvailable: true }
                    : { ...stock, isAvailable: false }
                ) || [];
            } else if (stockData.type === "PROFILES") {
              // Update regular profile stock
              updatedAccount.profileStocks =
                account.profileStocks?.map((stock, index) =>
                  index < stockData.newStock
                    ? { ...stock, isAvailable: true }
                    : { ...stock, isAvailable: false }
                ) || [];
            } else {
              // Update regular account stock
              updatedAccount.accountStocks =
                account.accountStocks?.map((stock, index) =>
                  index < stockData.newStock
                    ? { ...stock, isAvailable: true }
                    : { ...stock, isAvailable: false }
                ) || [];
            }

            return updatedAccount;
          }
          return account;
        })
      );
    },
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id) {
          setUser(parsedUser);
        }
      } catch (error) {
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  const fetchAccounts = async () => {
    try {
      const userId = user?.id || null;
      const url = userId
        ? `/api/streaming-accounts?userId=${userId}`
        : "/api/streaming-accounts";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();

        // Iniciar con todas las cuentas (ya vienen con precios ajustados por rol)
        let allAccounts = [
          ...(data.exclusiveAccounts || []),
          ...(data.regularAccounts || []),
        ];

        // Aplicar ofertas especiales (el backend ya aplicó precios de vendedor si corresponde)
        if (data.specialOffers) {
          data.specialOffers.forEach((offer: any) => {
            if (offer.streamingAccount) {
              // Find if account already exists in our array
              const existingAccountIndex = allAccounts.findIndex(
                (account) => account.id === offer.streamingAccount.id
              );

              if (existingAccountIndex !== -1) {
                // Update existing account with special offer
                allAccounts[existingAccountIndex] = {
                  ...allAccounts[existingAccountIndex],
                  specialOffer: offer,
                  originalPrice:
                    offer.streamingAccount.originalPrice ||
                    allAccounts[existingAccountIndex].price,
                  price: offer.discountPercentage
                    ? offer.streamingAccount.price *
                      (1 - offer.discountPercentage / 100)
                    : offer.specialPrice || offer.streamingAccount.price,
                };
              } else {
                // If account doesn't exist (shouldn't happen), add it
                allAccounts.push({
                  ...offer.streamingAccount,
                  specialOffer: offer,
                  originalPrice:
                    offer.streamingAccount.originalPrice ||
                    offer.streamingAccount.price,
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
          // Only priority: exclusive accounts first, regular accounts after
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
      setStreamingAccounts([]);
      setFilteredAccounts([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAccounts();
    //console.log("user en page.tsx:", user);
  }, [user]);

  // Fetch cart items if user is logged in
  useEffect(() => {
    if (user) {
      fetchCartItems();
      fetchUserCredits();
    }
  }, [user]);

  const fetchUserCredits = async () => {
    try {
      const response = await fetch(`/api/user/credits?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits || 0);
      }
    } catch (error) {
      //console.error('Error fetching user credits:', error)
    }
  };

  const fetchCartItems = async () => {
    try {
      const response = await fetch(`/api/cart?userId=${user.id}`);
      if (response.ok) {
        const cartData = await response.json();
        const formattedItems = cartData.items.map((item: any) => {
          // Calculate available stock for this item
          let availableStock = 99; // Default high value

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
          } else if (item.exclusiveAccount) {
            // For exclusive accounts, use exclusiveStocks
            availableStock =
              item.exclusiveAccount.exclusiveStocks?.filter(
                (stock: any) => stock.isAvailable
              ).length || 0;
          }

          return {
            ...item,
            availableStock,
          };
        });
        setCartItems(formattedItems);
      }
    } catch (error) {
      //console.error('Error fetching cart items:', error)
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    // Find the cart item to get account info
    const cartItem = cartItems.find((item) => item.id === itemId);
    if (!cartItem) {
      return;
    }

    // Check stock availability
    if (
      cartItem.availableStock !== undefined &&
      cartItem.availableStock < quantity
    ) {
      // You could show a toast here if needed
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
        await fetchCartItems();
      }
    } catch (error) {
      //console.error('Error updating quantity:', error)
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCartItems();
      }
    } catch (error) {
      //console.error('Error removing item:', error)
    }
  };

  const handleCheckout = () => {
    // Cart will be cleared by the payment processing
    setCartItems([]);
  };

  const handlePaymentSuccess = (newCredits: number) => {
    setUserCredits(newCredits);
    toast.success(
      '¡Pago procesado con éxito! Revisa tus pedidos en el panel "Mi Cuenta"'
    );
    //actualiza las cuentas despues de checkout
    fetchAccounts();
  };

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

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil((filteredAccounts || []).length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccounts = (filteredAccounts || []).slice(startIndex, endIndex);

  const getAvailableStock = (account: StreamingAccount): number => {
    // For exclusive accounts, check if they have any exclusiveStocks
    const isExclusiveAccount =
      !account.streamingType &&
      !account.accountStocks &&
      !account.profileStocks;
    if (isExclusiveAccount) {
      // Use actual exclusive stock count
      return (
        account.exclusiveStocks?.filter((stock) => stock.isAvailable).length ||
        0
      );
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
      router.push("/login");
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

        const displayPrice =
      account.saleType === "PROFILES"
        ? account.pricePerProfile || account.price
        : account.price;

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
            priceAtTime: displayPrice,
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
            priceAtTime: displayPrice,
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

        toast.success(
          `${accountType} "${
            account.name
          }" agregado al carrito - ${quantityText} • $${account.price.toLocaleString(
            "es-CO"
          )}`
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error al agregar al carrito");
      }
    } catch (error) {
      //console.error('Error adding to cart:', error)
      toast.error("Error de conexión. Intenta nuevamente.");
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleRegister = (userData: any) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setUserCredits(0);
    setCartItems([]);
    localStorage.removeItem("user");

    // Emit custom event to notify other components
    window.dispatchEvent(new CustomEvent("userLogout"));

    toast.success("Sesión cerrada correctamente");
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex items-center justify-center">
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
          <p className="text-white text-lg">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950">
      <Navigation
        user={user}
        cartItemsCount={(cartItems || []).length}
        onCartOpen={() => setIsCartOpen(true)}
        onLogin={() => {
          router.push("/login");
        }}
        onLogout={handleLogout}
      />

      <AnnouncementBanner />

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
                  account={account} // IMPORTANT: No corregir
                  onAddToCart={addToCart}
                  isMostPopular={["1", "2", "3"].includes(account.id)}
                  userRole={user?.role}
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
              <h4 className="text-white font-medium mb-3">Soporte</h4>
              <p className="text-slate-400 text-sm mb-2">
                ¿Necesitas contactarnos?
              </p>
              <p className="text-slate-400 text-sm">
                Encuentra nuestros números de contacto en el panel{" "}
                <span className="text-white font-medium">"Mi Cuenta"</span>
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

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
        userCredits={userCredits}
        userId={user?.id}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
